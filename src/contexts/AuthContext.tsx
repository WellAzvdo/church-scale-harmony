
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole, SecurityQuestion, ApprovalStatus } from '@/lib/models';
import * as storage from '@/lib/storage';
import { useToast } from "@/hooks/use-toast";
import { generateId } from '@/lib/scheduleUtils';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, password: string, fullName: string, securityQuestion: SecurityQuestion) => Promise<boolean>;
  resetPassword: (username: string, securityAnswer: string, newPassword: string) => Promise<boolean>;
  adminResetPassword: (userId: string, newPassword: string) => Promise<boolean>;
  checkPermission: (permission: Permission) => boolean;
  approveUser: (userId: string) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;
  promoteUser: (userId: string, newRole: UserRole, departmentId?: string) => Promise<boolean>;
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
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.MEMBER]: [
    Permission.VIEW_OWN_SCHEDULES,
    Permission.VIEW_PERSONAL_SETTINGS
  ],
  [UserRole.DEPARTMENT_LEADER]: [
    Permission.VIEW_OWN_SCHEDULES,
    Permission.VIEW_PERSONAL_SETTINGS,
    Permission.VIEW_DEPARTMENT_SCHEDULES,
    Permission.MANAGE_DEPARTMENT_SCHEDULES,
    Permission.MANAGE_DEPARTMENT_MEMBERS,
    Permission.APPROVE_USERS
  ],
  [UserRole.ADMIN]: [
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await storage.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // For demo purposes, simulate a login API call
      // In a real app, you'd validate credentials against a backend
      const users = await storage.getUsers();
      
      // Simple username check for demo
      const foundUser = users.find(u => u.username === username && u.password === password);
      
      if (foundUser) {
        if (foundUser.approvalStatus !== ApprovalStatus.APPROVED) {
          toast({
            title: "Acesso negado",
            description: "Sua conta ainda não foi aprovada por um administrador.",
            variant: "destructive",
          });
          return false;
        }
        
        // Store the current user
        await storage.setCurrentUser(foundUser);
        setUser(foundUser);
        
        toast({
          title: "Login bem-sucedido",
          description: `Bem-vindo(a), ${username}!`,
        });
        
        return true;
      } else {
        toast({
          title: "Erro ao fazer login",
          description: "Usuário ou senha inválidos.",
          variant: "destructive",
        });
        return false;
      }
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

  const register = async (
    username: string, 
    password: string, 
    fullName: string, 
    securityQuestion: SecurityQuestion
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Check if username already exists
      const usernameExists = await storage.checkUsernameExists(username);
      if (usernameExists) {
        toast({
          title: "Erro no cadastro",
          description: "Este nome de usuário já está em uso.",
          variant: "destructive",
        });
        return false;
      }
      
      // Create a new user
      const newUser: User = {
        id: generateId(),
        username,
        password, // In a real app, this would be hashed
        role: UserRole.MEMBER,
        approvalStatus: ApprovalStatus.PENDING,
        securityQuestion,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncStatus: 'not-synced'
      };
      
      await storage.saveUser(newUser);
      
      toast({
        title: "Cadastro realizado",
        description: "Sua conta foi criada e está aguardando aprovação.",
      });
      
      return true;
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

  const resetPassword = async (
    username: string, 
    securityAnswer: string, 
    newPassword: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Get the user
      const user = await storage.getUserByUsername(username);
      
      if (!user || !user.securityQuestion) {
        toast({
          title: "Erro na recuperação",
          description: "Usuário não encontrado ou sem pergunta de segurança.",
          variant: "destructive",
        });
        return false;
      }
      
      // Check security answer (case insensitive)
      if (user.securityQuestion.answer.toLowerCase() !== securityAnswer.toLowerCase()) {
        toast({
          title: "Resposta incorreta",
          description: "A resposta à pergunta de segurança está incorreta.",
          variant: "destructive",
        });
        return false;
      }
      
      // Reset the password
      await storage.resetUserPassword(user.id, newPassword);
      
      toast({
        title: "Senha redefinida",
        description: "Sua senha foi alterada com sucesso.",
      });
      
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "Erro na recuperação",
        description: "Ocorreu um erro ao tentar redefinir sua senha.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const adminResetPassword = async (userId: string, newPassword: string): Promise<boolean> => {
    try {
      if (!user || !checkPermission(Permission.MANAGE_USER_ROLES)) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para redefinir senhas.",
          variant: "destructive",
        });
        return false;
      }
      
      await storage.resetUserPassword(userId, newPassword);
      
      toast({
        title: "Senha redefinida",
        description: "A senha do usuário foi alterada com sucesso.",
      });
      
      return true;
    } catch (error) {
      console.error('Admin password reset error:', error);
      toast({
        title: "Erro na redefinição",
        description: "Ocorreu um erro ao tentar redefinir a senha.",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      await storage.clearCurrentUser();
      setUser(null);
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
      await storage.approveUser(userId);
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
      await storage.rejectUser(userId);
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

  const promoteUser = async (
    userId: string, 
    newRole: UserRole, 
    departmentId?: string
  ): Promise<boolean> => {
    if (!user || !checkPermission(Permission.MANAGE_USER_ROLES)) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para alterar funções de usuário.",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      const users = await storage.getUsers();
      const userToPromoteIndex = users.findIndex(u => u.id === userId);
      
      if (userToPromoteIndex < 0) {
        toast({
          title: "Usuário não encontrado",
          description: "O usuário selecionado não foi encontrado.",
          variant: "destructive",
        });
        return false;
      }
      
      users[userToPromoteIndex] = {
        ...users[userToPromoteIndex],
        role: newRole,
        departmentId: newRole === UserRole.DEPARTMENT_LEADER ? departmentId : undefined,
        updatedAt: Date.now()
      };
      
      await storage.setData(storage.STORAGE_KEYS.USERS, users);
      
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
      isAuthenticated: !!user, 
      isLoading,
      login,
      logout,
      register,
      resetPassword,
      adminResetPassword,
      checkPermission,
      approveUser,
      rejectUser,
      promoteUser
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
