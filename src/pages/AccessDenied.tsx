
import React from 'react';
import { Shield } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AccessDenied: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6 flex justify-center">
          <Shield className="h-16 w-16 text-destructive" />
        </div>
        
        <h1 className="text-2xl font-bold text-primary-deep mb-4">
          Acesso Negado
        </h1>
        
        <p className="text-gray-600 mb-6">
          Você não tem permissão para acessar esta página.
          Entre em contato com um administrador para obter acesso.
        </p>
        
        <div className="flex flex-col space-y-4">
          <Button onClick={() => navigate('/')} className="bg-primary hover:bg-primary-medium w-full">
            Ir para a página inicial
          </Button>
          
          <Button onClick={logout} variant="outline" className="w-full">
            Sair da conta
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
