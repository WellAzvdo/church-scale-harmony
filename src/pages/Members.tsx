import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Mail, Phone, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import * as db from '@/services/supabaseService';
import { logger } from '@/lib/logger';
import type { Profile, Department } from '@/lib/database.types';

interface MemberWithDepartments {
  profile: Profile;
  departments: Department[];
  approvalStatus: string;
}

const Members: React.FC = () => {
  const [members, setMembers] = useState<MemberWithDepartments[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const loadMembers = async () => {
    try {
      // Get all profiles (these are the registered users)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      
      if (profilesError) throw profilesError;
      
      // Get all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (rolesError) throw rolesError;
      
      // Get all user departments
      const { data: userDepts, error: deptsError } = await supabase
        .from('user_departments')
        .select('*');
      
      if (deptsError) throw deptsError;
      
      // Get all departments
      const departments = await db.getDepartments();
      
      // Build member list with their departments
      const membersWithDepts: MemberWithDepartments[] = (profiles || []).map(profile => {
        const userRole = userRoles?.find(r => r.user_id === profile.id);
        const userDepartmentIds = userDepts
          ?.filter(ud => ud.user_id === profile.id)
          .map(ud => ud.department_id) || [];
        const memberDepartments = departments.filter(d => userDepartmentIds.includes(d.id));
        
        return {
          profile,
          departments: memberDepartments,
          approvalStatus: userRole?.approval_status || 'pending'
        };
      });
      
      // Only show approved members
      const approvedMembers = membersWithDepts.filter(m => m.approvalStatus === 'approved');
      
      setMembers(approvedMembers);
    } catch (error) {
      logger.error('Error loading members:', error);
      toast({
        title: "Erro ao carregar membros",
        description: "Não foi possível carregar a lista de membros.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadMembers();
  };

  const filteredMembers = members.filter(member => 
    member.profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.profile.email && member.profile.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (member.profile.phone && member.profile.phone.includes(searchQuery))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-primary-deep">Membros</h1>
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

      <Card className="mb-4 bg-muted/50">
        <CardContent className="p-3">
          <p className="text-sm text-muted-foreground">
            Esta lista mostra todos os usuários cadastrados e aprovados no sistema.
            Para atribuir departamentos, acesse a página de <strong>Usuários</strong>.
          </p>
        </CardContent>
      </Card>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar membros..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchQuery 
                ? "Nenhum membro encontrado com esse termo."
                : "Nenhum membro cadastrado ainda."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMembers.map((member) => (
            <Card key={member.profile.id}>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold">
                    {member.profile.full_name}
                  </CardTitle>
                  {getStatusBadge(member.approvalStatus)}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {member.profile.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Mail className="h-4 w-4" />
                    <span>{member.profile.email}</span>
                  </div>
                )}
                {member.profile.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Phone className="h-4 w-4" />
                    <span>{member.profile.phone}</span>
                  </div>
                )}
                
                {member.departments.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Departamentos:</p>
                    <div className="flex flex-wrap gap-1">
                      {member.departments.map((dept) => (
                        <Badge 
                          key={dept.id} 
                          variant="secondary"
                          style={{ 
                            backgroundColor: dept.color ? `${dept.color}20` : undefined,
                            borderColor: dept.color || undefined,
                            color: dept.color || undefined
                          }}
                          className="text-xs border"
                        >
                          {dept.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Sem departamento atribuído
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <div className="mt-6 text-center text-sm text-muted-foreground">
        Total: {filteredMembers.length} membro(s)
      </div>
    </div>
  );
};

export default Members;
