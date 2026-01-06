import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, LogOut, Mail, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PendingApproval: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Determine what the user is waiting for
  const emailNotConfirmed = user && !user.emailConfirmed;
  const pendingApproval = user && user.approvalStatus === 'pending';

  // Message based on status
  let title = "Aguardando Aprovação";
  let message = "Seu cadastro foi recebido e está aguardando aprovação da liderança.";
  let subMessage = "Você receberá acesso ao sistema assim que sua conta for aprovada por um administrador ou pastor.";

  if (emailNotConfirmed && pendingApproval) {
    title = "Confirmação Pendente";
    message = "Sua conta está aguardando confirmação de e-mail e aprovação administrativa.";
    subMessage = "1. Verifique sua caixa de entrada e confirme seu e-mail. 2. Após confirmação, aguarde a aprovação de um administrador.";
  } else if (emailNotConfirmed) {
    title = "Confirme seu E-mail";
    message = "Você precisa confirmar seu e-mail para acessar o sistema.";
    subMessage = "Verifique sua caixa de entrada (incluindo spam) e clique no link de confirmação enviado.";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-light to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            {emailNotConfirmed ? (
              <Mail className="h-8 w-8 text-amber-600" />
            ) : (
              <Clock className="h-8 w-8 text-amber-600" />
            )}
          </div>
          <CardTitle className="text-2xl text-primary-deep">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground">
            {message}
          </p>
          
          {/* Status indicators */}
          <div className="space-y-3 text-left bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              {user?.emailConfirmed ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Mail className="h-5 w-5 text-amber-600" />
              )}
              <span className={user?.emailConfirmed ? "text-green-700" : "text-muted-foreground"}>
                E-mail {user?.emailConfirmed ? "confirmado" : "não confirmado"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {user?.approvalStatus === 'approved' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-amber-600" />
              )}
              <span className={user?.approvalStatus === 'approved' ? "text-green-700" : "text-muted-foreground"}>
                {user?.approvalStatus === 'approved' ? "Conta aprovada" : "Aguardando aprovação administrativa"}
              </span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {subMessage}
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
