import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { Schedule, Profile, Department, Position } from '@/lib/database.types';
import * as db from '@/services/supabaseService';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';
import { useAuth, Permission } from '@/contexts/AuthContext';

interface ScheduleFormProps {
  schedule: Schedule | null;
  selectedDate: Date;
  onSave: () => void;
  onCancel: () => void;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({ 
  schedule, 
  selectedDate, 
  onSave, 
  onCancel 
}) => {
  const { user, checkPermission } = useAuth();
  const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [memberId, setMemberId] = useState(schedule?.member_id || '');
  const [departmentId, setDepartmentId] = useState(schedule?.department_id || '');
  const [positionId, setPositionId] = useState(schedule?.position_id || '');
  const [notes, setNotes] = useState(schedule?.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const { toast } = useToast();

  const isAdmin = checkPermission(Permission.MANAGE_ALL);
  const isLeader = user?.role === 'department_leader';
  const [leaderDepartmentCount, setLeaderDepartmentCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (departmentId) {
      loadPositions(departmentId);
      loadUsersForDepartment(departmentId);
    } else {
      setPositions([]);
      setPositionId('');
      setAvailableUsers([]);
    }
  }, [departmentId]);

  // Check for conflicts when member or date changes
  useEffect(() => {
    checkConflict();
  }, [memberId, selectedDate]);

  const loadData = async () => {
    try {
      // Load departments
      let loadedDepartments = await db.getDepartments();
      
      // For leaders, filter to departments they lead using ledDepartmentIds from context
      if (isLeader && user?.id) {
        const ledDeptIds = user.ledDepartmentIds || [];
        if (ledDeptIds.length > 0) {
          loadedDepartments = loadedDepartments.filter(d => ledDeptIds.includes(d.id));
        } else {
          // Fallback: also check leader_id for backwards compatibility
          loadedDepartments = loadedDepartments.filter(d => d.leader_id === user.id);
        }
        setLeaderDepartmentCount(loadedDepartments.length);
        
        // Auto-select if leader has only one department
        if (loadedDepartments.length === 1 && !departmentId) {
          setDepartmentId(loadedDepartments[0].id);
        }
      }
      
      setDepartments(loadedDepartments);
      
      // If editing, load the initial data
      if (schedule?.department_id) {
        await loadPositions(schedule.department_id);
        await loadUsersForDepartment(schedule.department_id);
      } else if (isLeader && loadedDepartments.length === 1) {
        // Auto-load for leader's single department
        await loadPositions(loadedDepartments[0].id);
        await loadUsersForDepartment(loadedDepartments[0].id);
      }
    } catch (error) {
      logger.error('Error loading data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados necessários.",
        variant: "destructive",
      });
    }
  };

  const loadUsersForDepartment = async (deptId: string) => {
    setIsLoadingUsers(true);
    try {
      // Get approved users assigned to this department
      let users = await db.getApprovedUsersForDepartment(deptId);
      
      // If admin and no users found, fallback to all approved users
      if (isAdmin && users.length === 0) {
        users = await db.getAllApprovedUsers();
      }
      
      setAvailableUsers(users);
    } catch (error) {
      logger.error('Error loading users:', error);
      // Fallback to all approved users
      try {
        const allUsers = await db.getAllApprovedUsers();
        setAvailableUsers(allUsers);
      } catch (fallbackError) {
        logger.error('Fallback also failed:', fallbackError);
        setAvailableUsers([]);
      }
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadPositions = async (deptId: string) => {
    try {
      const loadedPositions = await db.getPositions(deptId);
      setPositions(loadedPositions);
      if (!loadedPositions.some(p => p.id === positionId)) {
        setPositionId('');
      }
    } catch (error) {
      logger.error('Error loading positions:', error);
    }
  };

  const checkConflict = async () => {
    if (!memberId) {
      setConflictWarning(null);
      return;
    }

    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const { hasConflict, conflictDepartment } = await db.checkScheduleConflict(
        memberId, 
        formattedDate,
        schedule?.id
      );

      if (hasConflict && conflictDepartment) {
        const selectedUser = availableUsers.find(u => u.id === memberId);
        setConflictWarning(
          `⚠️ Atenção: ${selectedUser?.full_name || 'Este membro'} já está escalado no departamento ${conflictDepartment.name} no dia ${new Date(formattedDate).toLocaleDateString('pt-BR')}.`
        );
      } else {
        setConflictWarning(null);
      }
    } catch (error) {
      logger.error('Error checking conflict:', error);
    }
  };

  const handleSave = async () => {
    if (!memberId || !departmentId || !positionId) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Block save if there's a conflict
    if (conflictWarning) {
      toast({
        title: "Conflito de escala",
        description: "Resolva o conflito antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      if (schedule) {
        await db.updateSchedule(schedule.id, {
          member_id: memberId,
          department_id: departmentId,
          position_id: positionId,
          date: formattedDate,
          notes: notes || null
        });
        toast({
          title: "Escala atualizada",
          description: "A escala foi atualizada com sucesso.",
        });
      } else {
        await db.createSchedule({
          member_id: memberId,
          department_id: departmentId,
          position_id: positionId,
          date: formattedDate,
          notes: notes || null
        });
        toast({
          title: "Escala criada",
          description: "Nova escala criada com sucesso.",
        });
      }
      
      onSave();
      onCancel();
    } catch (error) {
      logger.error('Error saving schedule:', error);
      toast({
        title: "Erro ao salvar escala",
        description: "Não foi possível salvar a escala.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {schedule ? 'Editar Escala' : 'Adicionar Escala'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {conflictWarning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{conflictWarning}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="department">Departamento</Label>
            <Select value={departmentId} onValueChange={setDepartmentId} disabled={isLeader && leaderDepartmentCount === 1}>
              <SelectTrigger id="department">
                <SelectValue placeholder="Selecione um departamento" />
              </SelectTrigger>
              <SelectContent>
                {departments.length === 0 ? (
                  <SelectItem value="none" disabled>Nenhum departamento cadastrado</SelectItem>
                ) : (
                  departments.map(department => (
                    <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="member">Membro</Label>
            <Select value={memberId} onValueChange={setMemberId} disabled={!departmentId || isLoadingUsers}>
              <SelectTrigger id="member">
                <SelectValue placeholder={
                  !departmentId 
                    ? "Selecione um departamento primeiro" 
                    : isLoadingUsers 
                      ? "Carregando..." 
                      : "Selecione um membro"
                } />
              </SelectTrigger>
              <SelectContent>
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : availableUsers.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nenhum membro atribuído a este departamento
                  </SelectItem>
                ) : (
                  availableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.full_name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {departmentId && !isLoadingUsers && availableUsers.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhum membro foi atribuído a este departamento ainda.
                Atribua membros na tela de Usuários.
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="position">Função</Label>
            <Select value={positionId} onValueChange={setPositionId} disabled={!departmentId}>
              <SelectTrigger id="position">
                <SelectValue placeholder={!departmentId ? "Selecione um departamento primeiro" : "Selecione uma função"} />
              </SelectTrigger>
              <SelectContent>
                {positions.length === 0 ? (
                  <SelectItem value="none" disabled>Nenhuma função disponível</SelectItem>
                ) : (
                  positions.map(position => (
                    <SelectItem key={position.id} value={position.id}>{position.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais..."
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
          <Button 
            onClick={handleSave}
            disabled={!memberId || !departmentId || !positionId || isLoading || !!conflictWarning}
            className="bg-primary hover:bg-primary-medium"
          >
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleForm;