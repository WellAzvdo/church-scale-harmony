
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login page
    navigate('/login');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-light to-white p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary-deep mb-2">Igreja App</h1>
        <p className="text-xl text-primary-deep/70 mb-8">Gerenciamento de Escalas</p>
        
        <div className="space-y-4">
          <Button 
            className="w-full bg-primary hover:bg-primary-medium text-lg py-6"
            onClick={() => navigate('/login')}
          >
            Entrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
