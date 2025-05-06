
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/contexts/AuthContext';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import * as storage from '@/lib/storage';

const resetSchema = z.object({
  username: z.string().min(3, {
    message: "Nome de usuário deve ter pelo menos 3 caracteres.",
  }),
  securityAnswer: z.string().min(2, {
    message: "Resposta deve ter pelo menos 2 caracteres.",
  }),
  newPassword: z.string().min(6, {
    message: "Nova senha deve ter pelo menos 6 caracteres.",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const ResetPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState<string | null>(null);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  
  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      username: "",
      securityAnswer: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Fetch security question when username changes
  const onUsernameBlur = async () => {
    const username = form.getValues("username");
    if (username.length >= 3) {
      const user = await storage.getUserByUsername(username);
      if (user?.securityQuestion?.question) {
        setSecurityQuestion(user.securityQuestion.question);
      } else {
        setSecurityQuestion(null);
      }
    }
  };

  async function onSubmit(values: z.infer<typeof resetSchema>) {
    setIsLoading(true);
    
    try {
      const success = await resetPassword(
        values.username,
        values.securityAnswer,
        values.newPassword
      );
      
      if (success) {
        // Redirect to login page after successful reset
        navigate('/login', { 
          state: { 
            message: "Senha redefinida com sucesso. Você já pode fazer login com sua nova senha." 
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-primary-light to-white">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary-deep">Recuperar Senha</h1>
          <p className="text-gray-600 mt-2">Redefina sua senha usando sua pergunta de segurança</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome de Usuário</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Digite seu nome de usuário" 
                      {...field} 
                      disabled={isLoading}
                      onBlur={onUsernameBlur}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {securityQuestion && (
              <>
                <div className="p-3 bg-blue-50 rounded-md text-blue-700 text-sm mb-2">
                  <p className="font-medium">Pergunta de segurança:</p>
                  <p>{securityQuestion}</p>
                </div>
                
                <FormField
                  control={form.control}
                  name="securityAnswer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resposta</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite sua resposta" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Digite sua nova senha" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Nova Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirme sua nova senha" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            <Button 
              type="submit" 
              className="w-full mt-2 bg-primary hover:bg-primary-medium"
              disabled={isLoading || !securityQuestion}
            >
              {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
            </Button>
          </form>
        </Form>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Lembrou sua senha?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Voltar para login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
