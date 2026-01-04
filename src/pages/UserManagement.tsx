import React, { useState, useEffect } from 'react';
import { useAuth, Permission } from '@/contexts/AuthContext';
import type { AppRole, Profile, ApprovalStatus, Department } from '@/lib/database.types';
import * as db from '@/services/supabaseService';
import { supabase } from '@/integrations/supabase/client';
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { Shield, UserCog, Loader2, RefreshCw, Building2, Check, X, Crown } from 'lucide-react';
import { logger } from '@/lib/logger';

interface UserWithRole {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  departmentId: string | null;
  approvalStatus: ApprovalStatus;
  assignedDepartments: string[];
  ledDepartments: string[]; // Departments this user leads
}

interface UserDepartment {
  id: string;
  user_id: string;
  department_id: string;
}

interface DepartmentLeader {
  id: string;
  user_id: string;
  department_id: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>('member');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedLedDepartments, setSelectedLedDepartments] = useState<string[]>([]);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);
  const [isLeadershipDialogOpen, setIsLeadershipDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { checkPermission, promoteUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const isAdmin = checkPermission(Permission.MANAGE_USER_ROLES);
  
  // Check if user has permission to manage user roles
  useEffect(() => {
    if (!checkPermission(Permission.MANAGE_USER_ROLES) && !checkPermission(Permission.MANAGE_DEPARTMENT_SCHEDULES)) {
      navigate('/acesso-negado');
    }
  }, [checkPermission, navigate]);
  
  // Load users and departments
  const loadData = async () => {
    try {
      // Load departments
      const allDepartments = await db.getDepartments();
      setDepartments(allDepartments);
      
      // Load all user roles first
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (rolesError) throw rolesError;
      if (!userRoles || userRoles.length === 0) {
        setUsers([]);
        return;
      }
      
      // Load all profiles
      const userIds = userRoles.map(ur => ur.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;
      
      // Load user departments
      const { data: userDepts, error: deptsError } = await supabase
        .from('user_departments')
        .select('*');
      
      if (deptsError) throw deptsError;

      // Load department leaders
      const { data: deptLeaders, error: leadersError } = await supabase
        .from('department_leaders')
        .select('*');
      
      if (leadersError) throw leadersError;
      
      // Combine the data
      const mappedUsers: UserWithRole[] = userRoles.map((ur) => {
        const profile = profiles?.find(p => p.id === ur.user_id);
        const deptIds = (userDepts as UserDepartment[] || [])
          .filter(ud => ud.user_id === ur.user_id)
          .map(ud => ud.department_id);
        const ledDeptIds = (deptLeaders as DepartmentLeader[] || [])
          .filter(dl => dl.user_id === ur.user_id)
          .map(dl => dl.department_id);
        
        return {
          id: ur.user_id,
          email: profile?.email || '',
          fullName: profile?.full_name || 'Sem nome',
          role: ur.role as AppRole,
          departmentId: ur.department_id,
          approvalStatus: ur.approval_status as ApprovalStatus,
          assignedDepartments: deptIds,
          ledDepartments: ledDeptIds
        };
      });
      
      setUsers(mappedUsers);
    } catch (error) {
      logger.error('Error loading data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados dos usuários.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [toast]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
  };
  
  const openPromoteDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setSelectedDepartment(user.departmentId || '');
    setIsPromoteDialogOpen(true);
  };

  const openDepartmentDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setSelectedDepartments(user.assignedDepartments || []);
    setIsDepartmentDialogOpen(true);
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

  const handleSaveDepartments = async () => {
    if (!selectedUser) return;
    
    setIsSaving(true);
    try {
      // Delete existing department assignments for this user
      const { error: deleteError } = await supabase
        .from('user_departments')
        .delete()
        .eq('user_id', selectedUser.id);
      
      if (deleteError) throw deleteError;
      
      // Insert new department assignments
      if (selectedDepartments.length > 0) {
        const inserts = selectedDepartments.map(deptId => ({
          user_id: selectedUser.id,
          department_id: deptId
        }));
        
        const { error: insertError } = await supabase
          .from('user_departments')
          .insert(inserts);
        
        if (insertError) throw insertError;
      }

      // Also link to member record if profile has member_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('member_id')
        .eq('id', selectedUser.id)
        .single();
      
      // Update the user in the list
      setUsers(current => 
        current.map(user => 
          user.id === selectedUser.id 
            ? { ...user, assignedDepartments: selectedDepartments } 
            : user
        )
      );
      
      toast({
        title: "Departamentos atualizados",
        description: `${selectedUser.fullName} foi atribuído a ${selectedDepartments.length} departamento(s).`,
      });
      
      setIsDepartmentDialogOpen(false);
    } catch (error) {
      logger.error('Error saving departments:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar os departamentos.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDepartment = (deptId: string) => {
    setSelectedDepartments(prev => 
      prev.includes(deptId) 
        ? prev.filter(id => id !== deptId)
        : [...prev, deptId]
    );
  };

  const openLeadershipDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setSelectedLedDepartments(user.ledDepartments || []);
    setIsLeadershipDialogOpen(true);
  };

  const toggleLedDepartment = (deptId: string) => {
    setSelectedLedDepartments(prev => 
      prev.includes(deptId) 
        ? prev.filter(id => id !== deptId)
        : [...prev, deptId]
    );
  };

  const handleSaveLeadership = async () => {
    if (!selectedUser) return;
    
    setIsSaving(true);
    try {
      await db.setDepartmentLeaders(selectedUser.id, selectedLedDepartments);

      // If they now lead departments, ensure their role is department_leader
      if (selectedLedDepartments.length > 0 && selectedUser.role === 'member') {
        await db.updateUserRole(selectedUser.id, 'department_leader', selectedLedDepartments[0]);
      }
      
      // Update the user in the list
      setUsers(current => 
        current.map(user => 
          user.id === selectedUser.id 
            ? { 
                ...user, 
                ledDepartments: selectedLedDepartments,
                role: selectedLedDepartments.length > 0 && user.role === 'member' ? 'department_leader' : user.role
              } 
            : user
        )
      );
      
      toast({
        title: "Liderança atualizada",
        description: `${selectedUser.fullName} agora lidera ${selectedLedDepartments.length} departamento(s).`,
      });
      
      setIsLeadershipDialogOpen(false);
    } catch (error) {
      logger.error('Error saving leadership:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar a liderança.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const getRoleBadge = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Administrador</Badge>;
      case 'department_leader':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Líder</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Membro</Badge>;
    }
  };

  const getApprovalBadge = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><Check className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pendente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><X className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      default:
        return null;
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
    return department ? department.name : 'Não encontrado';
  };

  // Get departments that the current user can assign
  const getAssignableDepartments = () => {
    // For now, return all departments - RLS will handle permissions
    return departments;
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Shield className="h-6 w-6 mr-2 text-primary" />
          <h1 className="text-2xl font-bold text-primary-deep">Gerenciamento de Usuários</h1>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
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
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <CardTitle className="text-lg">{user.fullName}</CardTitle>
                  <div className="flex gap-2">
                    {getApprovalBadge(user.approvalStatus)}
                    {getRoleBadge(user.role)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p className="text-gray-500">E-mail:</p>
                    <p className="truncate">{user.email}</p>
                    
                    <p className="text-gray-500">Função:</p>
                    <p>{getRoleLabel(user.role)}</p>
                    
                    {user.role === 'department_leader' && user.ledDepartments.length === 0 && (
                      <>
                        <p className="text-gray-500">Lidera:</p>
                        <p>{getDepartmentName(user.departmentId)}</p>
                      </>
                    )}
                  </div>
                  
                  {/* Led departments */}
                  {user.ledDepartments.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2 flex items-center">
                        <Crown className="h-3 w-3 mr-1 text-amber-500" />
                        Departamentos que lidera:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {user.ledDepartments.map(deptId => {
                          const dept = departments.find(d => d.id === deptId);
                          return dept ? (
                            <Badge 
                              key={deptId} 
                              className="bg-amber-100 text-amber-800 border-amber-200"
                            >
                              <Crown className="h-3 w-3 mr-1" />
                              {dept.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Assigned departments */}
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Departamentos atribuídos:</p>
                    {user.assignedDepartments.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.assignedDepartments.map(deptId => {
                          const dept = departments.find(d => d.id === deptId);
                          return dept ? (
                            <Badge 
                              key={deptId} 
                              variant="outline"
                              style={{ 
                                backgroundColor: dept.color ? `${dept.color}20` : undefined,
                                borderColor: dept.color || undefined
                              }}
                            >
                              {dept.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Nenhum departamento atribuído</p>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button 
                      onClick={() => openDepartmentDialog(user)}
                      variant="outline"
                      size="sm"
                      disabled={user.approvalStatus !== 'approved'}
                    >
                      <Building2 className="h-4 w-4 mr-2" /> Departamentos
                    </Button>
                    {isAdmin && (
                      <>
                        <Button 
                          onClick={() => openLeadershipDialog(user)}
                          variant="outline"
                          size="sm"
                          disabled={user.approvalStatus !== 'approved'}
                        >
                          <Crown className="h-4 w-4 mr-2" /> Liderança
                        </Button>
                        <Button 
                          onClick={() => openPromoteDialog(user)}
                          variant="outline"
                          size="sm"
                        >
                          <UserCog className="h-4 w-4 mr-2" /> Função
                        </Button>
                      </>
                    )}
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

      {/* Department Assignment Dialog */}
      <Dialog open={isDepartmentDialogOpen} onOpenChange={setIsDepartmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Departamentos</DialogTitle>
            <DialogDescription>
              Selecione os departamentos para {selectedUser?.fullName}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4 max-h-[300px] overflow-y-auto">
            {getAssignableDepartments().map(dept => (
              <div 
                key={dept.id} 
                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                onClick={() => toggleDepartment(dept.id)}
              >
                <Checkbox 
                  checked={selectedDepartments.includes(dept.id)}
                  onCheckedChange={() => toggleDepartment(dept.id)}
                />
                <div className="flex-1">
                  <p className="font-medium">{dept.name}</p>
                  {dept.description && (
                    <p className="text-sm text-muted-foreground">{dept.description}</p>
                  )}
                </div>
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: dept.color || 'hsl(var(--primary))' }}
                />
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDepartmentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveDepartments} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leadership Assignment Dialog */}
      <Dialog open={isLeadershipDialogOpen} onOpenChange={setIsLeadershipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Crown className="h-5 w-5 mr-2 text-amber-500" />
              Atribuir Liderança
            </DialogTitle>
            <DialogDescription>
              Selecione os departamentos que {selectedUser?.fullName} irá liderar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4 max-h-[300px] overflow-y-auto">
            {departments.map(dept => (
              <div 
                key={dept.id} 
                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                onClick={() => toggleLedDepartment(dept.id)}
              >
                <Checkbox 
                  checked={selectedLedDepartments.includes(dept.id)}
                  onCheckedChange={() => toggleLedDepartment(dept.id)}
                />
                <div className="flex-1">
                  <p className="font-medium">{dept.name}</p>
                  {dept.description && (
                    <p className="text-sm text-muted-foreground">{dept.description}</p>
                  )}
                </div>
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: dept.color || 'hsl(var(--primary))' }}
                />
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLeadershipDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveLeadership} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
