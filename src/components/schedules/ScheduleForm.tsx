
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Schedule, Member, Department, Position } from '@/lib/models';
import * as storage from '@/lib/storage';
import { generateId } from '@/lib/scheduleUtils';
import { hasScheduleConflict } from '@/lib/scheduleUtils';
import { format } from 'date-fns';

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
  const [members, setMembers] = useState<Member[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [memberId, setMemberId] = useState(schedule?.memberId || '');
  const [departmentId, setDepartmentId] = useState(schedule?.departmentId || '');
  const [positionId, setPositionId] = useState(schedule?.positionId || '');
  const [startTime, setStartTime] = useState(schedule?.startTime || '09:00');
  const [endTime, setEndTime] = useState(schedule?.endTime || '11:00');
  const [notes, setNotes] = useState(schedule?.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (departmentId) {
      const department = departments.find(d => d.id === departmentId);
      if (department) {
        setPositions(department.positions);
        if (!department.positions.some(p => p.id === positionId)) {
          setPositionId('');
        }
      }
    } else {
      setPositions([]);
      setPositionId('');
    }
  }, [departmentId, departments]);

  const loadData = async () => {
    try {
      const [loadedMembers, loadedDepartments] = await Promise.all([
        storage.getMembers(),
        storage.getDepartments()
      ]);
      
      setMembers(loadedMembers);
      setDepartments(loadedDepartments);
      
      if (departmentId) {
        const department = loadedDepartments.find(d => d.id === departmentId);
        if (department) {
          setPositions(department.positions);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados necessários.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!memberId || !departmentId || !positionId || !startTime || !endTime) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (startTime >= endTime) {
      toast({
        title: "Horário inválido",
        description: "O horário de início deve ser anterior ao horário de fim.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const now = Date.now();
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      let newSchedule: Schedule;
      
      if (schedule) {
        newSchedule = {
          ...schedule,
          memberId,
          departmentId,
          positionId,
          date: formattedDate,
          startTime,
          endTime,
          notes,
          updatedAt: now,
          syncStatus: 'pending'
        };
      } else {
        newSchedule = {
          id: generateId(),
          memberId,
          departmentId,
          positionId,
          date: formattedDate,
          startTime,
          endTime,
          notes,
          createdAt: now,
          updatedAt: now,
          syncStatus: 'pending'
        };
      }
      
      // Check for conflicts
      const hasConflict = await hasScheduleConflict(newSchedule);
      
      if (hasConflict) {
        toast({
          title: "Conflito de escala",
          description: "Este membro já está escalado para outro departamento no mesmo horário.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      await storage.saveSchedule(newSchedule);
      toast({
        title: schedule ? "Escala atualizada" : "Escala criada",
        description: schedule 
          ? "A escala foi atualizada com sucesso." 
          : "Nova escala criada com sucesso.",
      });
      onSave();
      onCancel();
    } catch (error) {
      console.error('Error saving schedule:', error);
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
          <div className="space-y-2">
            <Label htmlFor="member">Membro</Label>
            <Select 
              value={memberId} 
              onValueChange={setMemberId}
            >
              <SelectTrigger id="member">
                <SelectValue placeholder="Selecione um membro" />
              </SelectTrigger>
              <SelectContent>
                {members.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nenhum membro cadastrado
                  </SelectItem>
                ) : (
                  members.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="department">Departamento</Label>
            <Select 
              value={departmentId} 
              onValueChange={setDepartmentId}
            >
              <SelectTrigger id="department">
                <SelectValue placeholder="Selecione um departamento" />
              </SelectTrigger>
              <SelectContent>
                {departments.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nenhum departamento cadastrado
                  </SelectItem>
                ) : (
                  departments.map(department => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="position">Função</Label>
            <Select 
              value={positionId} 
              onValueChange={setPositionId}
              disabled={!departmentId}
            >
              <SelectTrigger id="position">
                <SelectValue placeholder={
                  !departmentId 
                    ? "Selecione um departamento primeiro" 
                    : "Selecione uma função"
                } />
              </SelectTrigger>
              <SelectContent>
                {!departmentId ? (
                  <SelectItem value="none" disabled>
                    Selecione um departamento primeiro
                  </SelectItem>
                ) : positions.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nenhuma função disponível
                  </SelectItem>
                ) : (
                  positions.map(position => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Horário de início</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endTime">Horário de fim</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
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
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!memberId || !departmentId || !positionId || !startTime || !endTime || isLoading}
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
