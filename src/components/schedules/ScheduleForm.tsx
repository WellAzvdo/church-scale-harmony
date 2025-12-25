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
import { AlertTriangle } from 'lucide-react';
import type { Schedule, Member, Department, Position } from '@/lib/database.types';
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
  const [members, setMembers] = useState<Member[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [memberId, setMemberId] = useState(schedule?.member_id || '');
  const [departmentId, setDepartmentId] = useState(schedule?.department_id || '');
  const [positionId, setPositionId] = useState(schedule?.position_id || '');
  const [notes, setNotes] = useState(schedule?.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const { toast } = useToast();

  const isAdmin = checkPermission(Permission.MANAGE_ALL);
  const isLeader = user?.role === 'department_leader';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (departmentId) {
      loadPositions(departmentId);
      loadMembersForDepartment(departmentId);
    } else {
      setPositions([]);
      setPositionId('');
      setMembers([]);
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
      
      // For leaders, only show their department
      if (isLeader && user?.departmentId) {
        loadedDepartments = loadedDepartments.filter(d => d.id === user.departmentId);
        // Auto-select the leader's department
        if (loadedDepartments.length === 1 && !departmentId) {
          setDepartmentId(loadedDepartments[0].id);
        }
      }
      
      setDepartments(loadedDepartments);
      
      // If editing, load the initial data
      if (schedule?.department_id) {
        await loadPositions(schedule.department_id);
        await loadMembersForDepartment(schedule.department_id);
      } else if (isLeader && user?.departmentId) {
        await loadPositions(user.departmentId);
        await loadMembersForDepartment(user.departmentId);
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

  const loadMembersForDepartment = async (deptId: string) => {
    setIsLoadingMembers(true);
    try {
      // For admins, show all members. For leaders, show members from their department.
      let loadedMembers: Member[];
      if (isAdmin) {
        // Admins can see all members, but we still filter by department for better UX
        loadedMembers = await db.getMembersByDepartment(deptId);
        // If no members found for department, show all members as fallback
        if (loadedMembers.length === 0) {
          loadedMembers = await db.getMembers();
        }
      } else {
        loadedMembers = await db.getMembersByDepartment(deptId);
      }
      setMembers(loadedMembers);
    } catch (error) {
      logger.error('Error loading members:', error);
      // Fallback to all members
      const allMembers = await db.getMembers();
      setMembers(allMembers);
    } finally {
      setIsLoadingMembers(false);
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
        const member = members.find(m => m.id === memberId);
        setConflictWarning(
          `⚠️ Atenção: ${member?.name || 'Este membro'} já está escalado no departamento ${conflictDepartment.name} no dia ${new Date(formattedDate).toLocaleDateString('pt-BR')}.`
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
            <Label htmlFor="member">Membro</Label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger id="member">
                <SelectValue placeholder="Selecione um membro" />
              </SelectTrigger>
              <SelectContent>
                {members.length === 0 ? (
                  <SelectItem value="none" disabled>Nenhum membro cadastrado</SelectItem>
                ) : (
                  members.map(member => (
                    <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="department">Departamento</Label>
            <Select value={departmentId} onValueChange={setDepartmentId} disabled={isLeader}>
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
