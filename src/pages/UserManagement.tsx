import React, { useState, useEffect } from 'react';
import { useAuth, Permission } from '@/contexts/AuthContext';
import type { AppRole, Profile, UserRole as UserRoleType } from '@/lib/database.types';
import * as db from '@/services/supabaseService';
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { Shield, UserCog, Loader2 } from 'lucide-react';
import type { Department } from '@/lib/database.types';

interface UserWithRole {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  departmentId: string | null;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>('member');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  
  const { checkPermission, promoteUser } = useAuth();
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
        // Load departments
        const allDepartments = await db.getDepartments();
        setDepartments(allDepartments);
        
        // Load users with their roles from Supabase
        // Note: We need to query profiles and user_roles tables
        const { data: rolesData, error: rolesError } = await (await import('@/integrations/supabase/client')).supabase
          .from('user_roles')
          .select(`
            user_id,
            role,
            department_id,
            profiles!user_roles_user_id_fkey (
              full_name,
              email
            )
          `)
          .eq('approval_status', 'approved');
        
        if (rolesError) throw rolesError;
        
        const mappedUsers: UserWithRole[] = (rolesData || []).map((ur: any) => ({
          id: ur.user_id,
          email: ur.profiles?.email || '',
          fullName: ur.profiles?.full_name || 'Sem nome',
          role: ur.role as AppRole,
          departmentId: ur.department_id
        }));
        
        setUsers(mappedUsers);
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
  
  const openPromoteDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setSelectedDepartment(user.departmentId || '');
    setIsPromoteDialogOpen(true);
  };
  
  const handlePromote = async () => {
    if (!selectedUser) return;
    
    const success = await promoteUser(
      selectedUser.id, 
      selectedRole,
      selectedRole === 'department_leader' ? selectedDepartment : undefined
    );
    
    if (success) {
      // Update the user in the list
      setUsers(current => 
        current.map(user => 
          user.id === selectedUser.id 
            ? { 
                ...user, 
                role: selectedRole,
                departmentId: selectedRole === 'department_leader' ? selectedDepartment : null
              } 
            : user
        )
      );
      
      setIsPromoteDialogOpen(false);
    }
  };
  
  const getRoleBadge = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Administrador</Badge>;
      case 'department_leader':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Líder de Departamento</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Membro</Badge>;
    }
  };
  
  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'department_leader': return 'Líder de Departamento';
      default: return 'Membro';
    }
  };
  
  const getDepartmentName = (departmentId?: string | null) => {
    if (!departmentId) return 'Sem departamento';
    const department = departments.find(d => d.id === departmentId);
    return department ? department.name : 'Departamento não encontrado';
  };
  
  if (isLoading) {
    return (
      <div className="p-4 flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                  <CardTitle className="text-lg">{user.fullName}</CardTitle>
                  {getRoleBadge(user.role)}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p className="text-gray-500">E-mail:</p>
                    <p className="truncate">{user.email}</p>
                    
                    <p className="text-gray-500">Função:</p>
                    <p>{getRoleLabel(user.role)}</p>
                    
                    {user.role === 'department_leader' && (
                      <>
                        <p className="text-gray-500">Departamento:</p>
                        <p>{getDepartmentName(user.departmentId)}</p>
                      </>
                    )}
                  </div>
                  
                  <Button 
                    onClick={() => openPromoteDialog(user)}
                    variant="outline"
                    className="w-full"
                  >
                    <UserCog className="h-4 w-4 mr-2" /> Alterar Função
                  </Button>
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
              Altere a função e permissões do usuário {selectedUser?.fullName}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nova Função</label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="department_leader">Líder de Departamento</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedRole === 'department_leader' && (
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
    </div>
  );
};

export default UserManagement;
