
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '@/lib/models';
import * as storage from '@/lib/storage';
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkPermission: (permission: Permission) => boolean;
}

export enum Permission {
  VIEW_OWN_SCHEDULES = 'view_own_schedules',
  VIEW_PERSONAL_SETTINGS = 'view_personal_settings',
  VIEW_DEPARTMENT_SCHEDULES = 'view_department_schedules',
  MANAGE_DEPARTMENT_SCHEDULES = 'manage_department_schedules',
  MANAGE_DEPARTMENT_MEMBERS = 'manage_department_members',
  VIEW_ALL = 'view_all',
  MANAGE_ALL = 'manage_all'
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
    Permission.MANAGE_DEPARTMENT_MEMBERS
  ],
  [UserRole.ADMIN]: [
    Permission.VIEW_OWN_SCHEDULES,
    Permission.VIEW_PERSONAL_SETTINGS,
    Permission.VIEW_DEPARTMENT_SCHEDULES,
    Permission.MANAGE_DEPARTMENT_SCHEDULES,
    Permission.MANAGE_DEPARTMENT_MEMBERS,
    Permission.VIEW_ALL,
    Permission.MANAGE_ALL
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
      const foundUser = users.find(u => u.username === username);
      
      if (foundUser) {
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

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading,
      login,
      logout,
      checkPermission 
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
