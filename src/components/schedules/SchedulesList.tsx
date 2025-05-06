
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Schedule, Member, Department } from '@/lib/models';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface SchedulesListProps {
  schedules: Schedule[];
  members: Member[];
  departments: Department[];
  onEditSchedule: (schedule: Schedule) => void;
  onDeleteSchedule: (scheduleId: string) => void;
}

const SchedulesList: React.FC<SchedulesListProps> = ({
  schedules,
  members,
  departments,
  onEditSchedule,
  onDeleteSchedule,
}) => {
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

  if (Object.keys(groupedSchedules).length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhuma escala para este dia.</p>
      </div>
    );
  }

  return (
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
                          onClick={() => onEditSchedule(schedule)}
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => onDeleteSchedule(schedule.id)}
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
  );
};

export default SchedulesList;
