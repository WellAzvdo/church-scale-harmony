import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import type { UserRole, Profile, AppRole, ApprovalStatus } from '@/lib/database.types';
import * as db from '@/services/supabaseService';

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  departmentId: string | null;
  approvalStatus: ApprovalStatus;
  memberId: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<boolean>;
  checkPermission: (permission: Permission) => boolean;
  approveUser: (userId: string) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;
  promoteUser: (userId: string, newRole: AppRole, departmentId?: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

export enum Permission {
  VIEW_OWN_SCHEDULES = 'view_own_schedules',
  VIEW_PERSONAL_SETTINGS = 'view_personal_settings',
  VIEW_DEPARTMENT_SCHEDULES = 'view_department_schedules',
  MANAGE_DEPARTMENT_SCHEDULES = 'manage_department_schedules',
  MANAGE_DEPARTMENT_MEMBERS = 'manage_department_members',
  VIEW_ALL = 'view_all',
  MANAGE_ALL = 'manage_all',
  APPROVE_USERS = 'approve_users',
  MANAGE_USER_ROLES = 'manage_user_roles'
}

// Role-based permission mapping
const rolePermissions: Record<AppRole, Permission[]> = {
  member: [
    Permission.VIEW_OWN_SCHEDULES,
    Permission.VIEW_PERSONAL_SETTINGS
  ],
  department_leader: [
    Permission.VIEW_OWN_SCHEDULES,
    Permission.VIEW_PERSONAL_SETTINGS,
    Permission.VIEW_DEPARTMENT_SCHEDULES,
    Permission.MANAGE_DEPARTMENT_SCHEDULES,
    Permission.MANAGE_DEPARTMENT_MEMBERS,
    Permission.APPROVE_USERS
  ],
  admin: [
    Permission.VIEW_OWN_SCHEDULES,
    Permission.VIEW_PERSONAL_SETTINGS,
    Permission.VIEW_DEPARTMENT_SCHEDULES,
    Permission.MANAGE_DEPARTMENT_SCHEDULES,
    Permission.MANAGE_DEPARTMENT_MEMBERS,
    Permission.VIEW_ALL,
    Permission.MANAGE_ALL,
    Permission.APPROVE_USERS,
    Permission.MANAGE_USER_ROLES
  ]
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load user data from profile and role
  const loadUserData = async (supabaseUser: User): Promise<AuthUser | null> => {
    try {
      const [profile, userRole] = await Promise.all([
        db.getProfile(supabaseUser.id),
        db.getUserRole(supabaseUser.id)
      ]);

      if (!profile || !userRole) {
        console.log('Profile or role not found');
        return null;
      }

      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        fullName: profile.full_name,
        role: userRole.role,
        departmentId: userRole.department_id,
        approvalStatus: userRole.approval_status,
        memberId: profile.member_id
      };
    } catch (error) {
      console.error('Error loading user data:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      const userData = await loadUserData(currentSession.user);
      setUser(userData);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state changed:', event);
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Defer data loading to avoid deadlock
          setTimeout(async () => {
            const userData = await loadUserData(currentSession.user);
            setUser(userData);
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      setSession(existingSession);
      if (existingSession?.user) {
        const userData = await loadUserData(existingSession.user);
        setUser(userData);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error);
        toast({
          title: "Erro ao fazer login",
          description: error.message === 'Invalid login credentials' 
            ? "E-mail ou senha inválidos." 
            : error.message,
          variant: "destructive",
        });
        return false;
      }

      if (data.user) {
        const userData = await loadUserData(data.user);
        
        if (!userData) {
          toast({
            title: "Erro ao carregar dados",
            description: "Não foi possível carregar seus dados de usuário.",
            variant: "destructive",
          });
          return false;
        }

        if (userData.approvalStatus !== 'approved') {
          await supabase.auth.signOut();
          toast({
            title: "Acesso negado",
            description: userData.approvalStatus === 'pending' 
              ? "Sua conta ainda não foi aprovada por um administrador."
              : "Sua conta foi rejeitada.",
            variant: "destructive",
          });
          return false;
        }

        setUser(userData);
        toast({
          title: "Login bem-sucedido",
          description: `Bem-vindo(a), ${userData.fullName}!`,
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro ao fazer login",
        description: "Ocorreu um erro ao tentar fazer login.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        console.error('Registration error:', error);
        let message = error.message;
        if (error.message.includes('already registered')) {
          message = 'Este e-mail já está cadastrado.';
        }
        toast({
          title: "Erro no cadastro",
          description: message,
          variant: "destructive",
        });
        return false;
      }

      if (data.user) {
        // Sign out immediately - user needs approval
        await supabase.auth.signOut();
        
        toast({
          title: "Cadastro realizado",
          description: "Sua conta foi criada e está aguardando aprovação de um administrador.",
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro ao tentar criar sua conta.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      navigate('/login');
      toast({
        title: "Logout realizado",
        description: "Você saiu com sucesso.",
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const checkPermission = (permission: Permission): boolean => {
    if (!user) return false;
    const userPermissions = rolePermissions[user.role];
    return userPermissions.includes(permission);
  };

  const approveUser = async (userId: string): Promise<void> => {
    if (!user || !checkPermission(Permission.APPROVE_USERS)) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para aprovar usuários.",
        variant: "destructive",
      });
      return;
    }

    try {
      await db.approveUser(userId);
      toast({
        title: "Usuário aprovado",
        description: "O usuário foi aprovado com sucesso.",
      });
    } catch (error) {
      console.error('Approve user error:', error);
      toast({
        title: "Erro na aprovação",
        description: "Ocorreu um erro ao tentar aprovar o usuário.",
        variant: "destructive",
      });
    }
  };

  const rejectUser = async (userId: string): Promise<void> => {
    if (!user || !checkPermission(Permission.APPROVE_USERS)) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para rejeitar usuários.",
        variant: "destructive",
      });
      return;
    }

    try {
      await db.rejectUser(userId);
      toast({
        title: "Usuário rejeitado",
        description: "O usuário foi rejeitado com sucesso.",
      });
    } catch (error) {
      console.error('Reject user error:', error);
      toast({
        title: "Erro na rejeição",
        description: "Ocorreu um erro ao tentar rejeitar o usuário.",
        variant: "destructive",
      });
    }
  };

  const promoteUser = async (userId: string, newRole: AppRole, departmentId?: string): Promise<boolean> => {
    if (!user || !checkPermission(Permission.MANAGE_USER_ROLES)) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para alterar funções de usuário.",
        variant: "destructive",
      });
      return false;
    }

    try {
      await db.updateUserRole(userId, newRole, departmentId);
      toast({
        title: "Função atualizada",
        description: "A função do usuário foi atualizada com sucesso.",
      });
      return true;
    } catch (error) {
      console.error('Promote user error:', error);
      toast({
        title: "Erro na promoção",
        description: "Ocorreu um erro ao tentar alterar a função do usuário.",
        variant: "destructive",
      });
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isAuthenticated: !!user && user.approvalStatus === 'approved',
      isLoading,
      login,
      logout,
      register,
      checkPermission,
      approveUser,
      rejectUser,
      promoteUser,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
