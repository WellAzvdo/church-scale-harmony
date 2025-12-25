import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Display notification if redirected with a message
  useEffect(() => {
    if (location.state?.message) {
      setNotification(location.state.message);
    }
  }, [location]);
  
  // Redirect based on user status
  useEffect(() => {
    if (user) {
      if (user.approvalStatus === 'pending') {
        navigate('/aguardando-aprovacao');
      } else if (isAuthenticated) {
        navigate('/schedules');
      }
    }
  }, [user, isAuthenticated, navigate]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      
      if (success) {
        // Navigation is handled by the useEffect above
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Ocorreu um erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
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
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              E-mail
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              placeholder="Digite seu e-mail"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Senha
            </label>
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
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Entrando...
              </>
            ) : 'Entrar'}
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
