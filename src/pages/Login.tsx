
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/contexts/AuthContext';
import { generateId } from '@/lib/scheduleUtils';
import { User, UserRole, ApprovalStatus } from '@/lib/models';
import * as storage from '@/lib/storage';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  
  // Display notification if redirected with a message
  useEffect(() => {
    if (location.state?.message) {
      setNotification(location.state.message);
    }
  }, [location]);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/schedules');
    }
  }, [isAuthenticated, navigate]);
  
  // Create initial admin user if no users exist
  useEffect(() => {
    const createInitialUsers = async () => {
      try {
        const users = await storage.getUsers();
        if (users.length === 0) {
          // Create a default admin user if none exists
          const adminUser: User = {
            id: generateId(),
            username: 'admin',
            password: 'admin', // In a real app, this would be hashed
            role: UserRole.ADMIN,
            approvalStatus: ApprovalStatus.APPROVED,
            securityQuestion: {
              question: 'Qual é o nome do sistema?',
              answer: 'igreja app'
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
            syncStatus: 'synced'
          };
          
          await storage.saveUser(adminUser);
        }
      } catch (error) {
        console.error('Error checking/creating initial users:', error);
      }
    };
    
    createInitialUsers();
  }, []);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!username || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await login(username, password);
      
      if (success) {
        navigate('/schedules');
      } else {
        setError('Usuário ou senha inválidos');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Ocorreu um erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-primary-light to-white">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-deep">Igreja App</h1>
          <p className="text-gray-600 mt-2">Gerenciamento de Escalas</p>
        </div>
        
        {notification && (
          <Alert className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{notification}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-100 p-3 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-gray-700">
              Usuário
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full"
              placeholder="Digite seu usuário"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Senha
              </label>
              <Link to="/reset-password" className="text-xs text-primary hover:underline">
                Esqueceu sua senha?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
              placeholder="Digite sua senha"
              disabled={isLoading}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary-medium"
            disabled={isLoading}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Ainda não tem uma conta?{" "}
              <Link to="/register" className="text-primary hover:underline">
                Registre-se
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
