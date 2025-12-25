import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const PendingApproval: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-light to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl text-primary-deep">Aguardando Aprovação</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground">
            Seu cadastro foi recebido e está aguardando aprovação da liderança.
          </p>
          <p className="text-sm text-muted-foreground">
            Você receberá acesso ao sistema assim que sua conta for aprovada por um administrador ou pastor.
          </p>
          <div className="pt-4">
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApproval;
