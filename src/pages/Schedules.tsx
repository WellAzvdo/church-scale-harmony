
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { Schedule, Member, Department } from '@/lib/models';
import * as storage from '@/lib/storage';
import ScheduleForm from '@/components/schedules/ScheduleForm';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const Schedules: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      const [loadedMembers, loadedDepartments] = await Promise.all([
        storage.getMembers(),
        storage.getDepartments()
      ]);
      setMembers(loadedMembers);
      setDepartments(loadedDepartments);
      loadSchedules();
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados necessários.",
        variant: "destructive",
      });
    }
  };

  const loadSchedules = async () => {
    try {
      const allSchedules = await storage.getSchedules();
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const filteredSchedules = allSchedules.filter(
        schedule => schedule.date === formattedDate
      );
      setSchedules(filteredSchedules);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast({
        title: "Erro ao carregar escalas",
        description: "Não foi possível carregar as escalas.",
        variant: "destructive",
      });
    }
  };

  const handleAddSchedule = () => {
    setEditingSchedule(null);
    setIsFormOpen(true);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setIsFormOpen(true);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await storage.deleteSchedule(scheduleId);
      toast({
        title: "Escala removida",
        description: "A escala foi removida com sucesso.",
      });
      loadSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: "Erro ao remover escala",
        description: "Não foi possível remover a escala.",
        variant: "destructive",
      });
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member ? member.name : 'Membro não encontrado';
  };

  const getDepartment = (departmentId: string) => {
    return departments.find(d => d.id === departmentId);
  };

  const getPositionName = (departmentId: string, positionId: string) => {
    const department = departments.find(d => d.id === departmentId);
    if (!department) return 'Posição não encontrada';
    
    const position = department.positions.find(p => p.id === positionId);
    return position ? position.name : 'Posição não encontrada';
  };

  const groupSchedulesByDepartment = () => {
    const grouped: Record<string, Schedule[]> = {};
    
    schedules.forEach(schedule => {
      const deptId = schedule.departmentId;
      if (!grouped[deptId]) {
        grouped[deptId] = [];
      }
      grouped[deptId].push(schedule);
    });
    
    return grouped;
  };

  const groupedSchedules = groupSchedulesByDepartment();
  const formattedSelectedDate = format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary-deep">Escalas</h1>
        <Button 
          onClick={handleAddSchedule} 
          className="bg-primary hover:bg-primary-medium"
        >
          <Plus className="h-4 w-4 mr-2" /> Adicionar
        </Button>
      </div>

      <div className="mb-6">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="capitalize">{formattedSelectedDate}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              className="p-3"
            />
          </PopoverContent>
        </Popover>
      </div>

      {Object.keys(groupedSchedules).length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhuma escala para este dia.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSchedules).map(([departmentId, departmentSchedules]) => {
            const department = getDepartment(departmentId);
            
            return (
              <Card key={departmentId} className="overflow-hidden border-l-4" style={{ borderLeftColor: department?.color || '#3a7ca5' }}>
                <div className="bg-secondary/30 px-4 py-2 border-b">
                  <h3 className="font-medium">{department?.name || 'Departamento desconhecido'}</h3>
                </div>
                <CardContent className="p-0">
                  <ul className="divide-y">
                    {departmentSchedules.map(schedule => (
                      <li key={schedule.id} className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{getMemberName(schedule.memberId)}</h4>
                            <p className="text-sm text-muted-foreground">
                              {getPositionName(schedule.departmentId, schedule.positionId)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {schedule.startTime} - {schedule.endTime}
                            </p>
                            {schedule.notes && (
                              <p className="text-xs italic mt-1">{schedule.notes}</p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditSchedule(schedule)}
                            >
                              Editar
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteSchedule(schedule.id)}
                            >
                              Remover
                            </Button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {isFormOpen && (
        <ScheduleForm
          schedule={editingSchedule}
          selectedDate={selectedDate}
          onSave={loadSchedules}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
};

export default Schedules;
