
import React, { useState, useEffect } from 'react';
import { useAuth, Permission } from '@/contexts/AuthContext';
import { User, ApprovalStatus, UserRole } from '@/lib/models';
import * as storage from '@/lib/storage';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, UserCheck } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';

const UserApproval: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { checkPermission, approveUser, rejectUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Check if user has permission to approve users
  useEffect(() => {
    if (!checkPermission(Permission.APPROVE_USERS)) {
      navigate('/acesso-negado');
    }
  }, [checkPermission, navigate]);
  
  // Load pending users
  useEffect(() => {
    const loadPendingUsers = async () => {
      try {
        const users = await storage.getPendingUsers();
        setPendingUsers(users);
      } catch (error) {
        console.error('Error loading pending users:', error);
        toast({
          title: "Erro ao carregar usuários",
          description: "Não foi possível carregar os usuários pendentes.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPendingUsers();
  }, [toast]);
  
  const handleApprove = async (userId: string) => {
    try {
      await approveUser(userId);
      // Remove the approved user from the list
      setPendingUsers(current => current.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };
  
  const handleReject = async (userId: string) => {
    try {
      await rejectUser(userId);
      // Remove the rejected user from the list
      setPendingUsers(current => current.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error rejecting user:', error);
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-4 flex justify-center items-center min-h-screen">
        <p>Carregando...</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 pb-20">
      <div className="flex items-center mb-6">
        <UserCheck className="h-6 w-6 mr-2 text-primary" />
        <h1 className="text-2xl font-bold text-primary-deep">Aprovação de Usuários</h1>
      </div>
      
      {pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Não há usuários pendentes de aprovação.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map(user => (
            <Card key={user.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{user.username}</CardTitle>
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                    Pendente
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p className="text-gray-500">Criado em:</p>
                    <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                    
                    <p className="text-gray-500">Função:</p>
                    <p>{user.role === UserRole.MEMBER ? 'Membro' : 
                        user.role === UserRole.DEPARTMENT_LEADER ? 'Líder de Departamento' : 
                        'Administrador'}</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => handleApprove(user.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" /> Aprovar
                    </Button>
                    <Button 
                      onClick={() => handleReject(user.id)}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" /> Rejeitar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserApproval;
