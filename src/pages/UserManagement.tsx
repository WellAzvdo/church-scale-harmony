
import React, { useState, useEffect } from 'react';
import { useAuth, Permission } from '@/contexts/AuthContext';
import { User, UserRole, ApprovalStatus, Department } from '@/lib/models';
import * as storage from '@/lib/storage';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { Shield, Key, UserCog } from 'lucide-react';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.MEMBER);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  const { checkPermission, promoteUser, adminResetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Check if user has permission to manage user roles
  useEffect(() => {
    if (!checkPermission(Permission.MANAGE_USER_ROLES)) {
      navigate('/acesso-negado');
    }
  }, [checkPermission, navigate]);
  
  // Load users and departments
  useEffect(() => {
    const loadData = async () => {
      try {
        const allUsers = await storage.getUsers();
        const approvedUsers = allUsers.filter(u => u.approvalStatus === ApprovalStatus.APPROVED);
        setUsers(approvedUsers);
        
        const allDepartments = await storage.getDepartments();
        setDepartments(allDepartments);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados dos usuários.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [toast]);
  
  const openPromoteDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setSelectedDepartment(user.departmentId || '');
    setIsPromoteDialogOpen(true);
  };
  
  const openResetPasswordDialog = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setIsResetPasswordDialogOpen(true);
  };
  
  const handlePromote = async () => {
    if (!selectedUser) return;
    
    const success = await promoteUser(
      selectedUser.id, 
      selectedRole,
      selectedRole === UserRole.DEPARTMENT_LEADER ? selectedDepartment : undefined
    );
    
    if (success) {
      // Update the user in the list
      setUsers(current => 
        current.map(user => 
          user.id === selectedUser.id 
            ? { 
                ...user, 
                role: selectedRole,
                departmentId: selectedRole === UserRole.DEPARTMENT_LEADER ? selectedDepartment : undefined
              } 
            : user
        )
      );
      
      setIsPromoteDialogOpen(false);
    }
  };
  
  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;
    
    const success = await adminResetPassword(selectedUser.id, newPassword);
    
    if (success) {
      setIsResetPasswordDialogOpen(false);
    }
  };
  
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <Badge className="bg-red-100 text-red-800 border-red-200">Administrador</Badge>;
      case UserRole.DEPARTMENT_LEADER:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Líder de Departamento</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Membro</Badge>;
    }
  };
  
  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return 'Sem departamento';
    const department = departments.find(d => d.id === departmentId);
    return department ? department.name : 'Departamento não encontrado';
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
        <Shield className="h-6 w-6 mr-2 text-primary" />
        <h1 className="text-2xl font-bold text-primary-deep">Gerenciamento de Usuários</h1>
      </div>
      
      {users.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Nenhum usuário encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {users.map(user => (
            <Card key={user.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{user.username}</CardTitle>
                  {getRoleBadge(user.role)}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p className="text-gray-500">Função:</p>
                    <p>{user.role === UserRole.MEMBER ? 'Membro' : 
                        user.role === UserRole.DEPARTMENT_LEADER ? 'Líder de Departamento' : 
                        'Administrador'}</p>
                    
                    {user.role === UserRole.DEPARTMENT_LEADER && (
                      <>
                        <p className="text-gray-500">Departamento:</p>
                        <p>{getDepartmentName(user.departmentId)}</p>
                      </>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      onClick={() => openPromoteDialog(user)}
                      variant="outline"
                      className="flex-1"
                    >
                      <UserCog className="h-4 w-4 mr-2" /> Alterar Função
                    </Button>
                    <Button 
                      onClick={() => openResetPasswordDialog(user)}
                      variant="outline"
                      className="flex-1"
                    >
                      <Key className="h-4 w-4 mr-2" /> Redefinir Senha
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Promote User Dialog */}
      <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Função do Usuário</DialogTitle>
            <DialogDescription>
              Altere a função e permissões do usuário {selectedUser?.username}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nova Função</label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.MEMBER}>Membro</SelectItem>
                  <SelectItem value={UserRole.DEPARTMENT_LEADER}>Líder de Departamento</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedRole === UserRole.DEPARTMENT_LEADER && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Departamento</label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPromoteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePromote}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para o usuário {selectedUser?.username}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nova Senha</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleResetPassword} disabled={!newPassword}>
              Redefinir Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
