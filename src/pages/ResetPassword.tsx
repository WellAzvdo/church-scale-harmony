import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

const ResetPassword: React.FC = () => {
  // Note: With Supabase Auth, password reset is handled via email
  // This page now shows a message directing users to the proper flow
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-primary-light to-white">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary-deep">Recuperar Senha</h1>
        </div>
        
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Recuperação de senha</AlertTitle>
          <AlertDescription>
            Para recuperar sua senha, entre em contato com um administrador do sistema.
            Eles poderão redefinir sua senha através do painel de administração.
          </AlertDescription>
        </Alert>
        
        <div className="text-center">
          <Link to="/login">
            <Button variant="outline" className="w-full">
              Voltar para Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
