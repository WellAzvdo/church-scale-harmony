import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Schedule, Department, Position, Profile } from '@/lib/database.types';
import { parseLocalDate } from '@/lib/dateUtils';

interface SchedulesListProps {
  schedules: Schedule[];
  profiles: Profile[];
  departments: Department[];
  positions: Position[];
  onEditSchedule?: (schedule: Schedule) => void;
  onDeleteSchedule?: (scheduleId: string) => void;
}

const SchedulesList: React.FC<SchedulesListProps> = ({
  schedules,
  profiles,
  departments,
  positions,
  onEditSchedule,
  onDeleteSchedule,
}) => {
  const getMemberName = (memberId: string) => {
    // member_id now references profiles.id
    const profile = profiles.find(p => p.id === memberId);
    return profile ? profile.full_name : 'Membro não encontrado';
  };

  const getDepartment = (departmentId: string) => {
    return departments.find(d => d.id === departmentId);
  };

  const getPosition = (positionId: string) => {
    return positions.find(p => p.id === positionId);
  };

  const groupSchedulesByDepartment = () => {
    const grouped: Record<string, Schedule[]> = {};
    
    schedules.forEach(schedule => {
      const deptId = schedule.department_id;
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

  const canEdit = !!onEditSchedule;
  const canDelete = !!onDeleteSchedule;

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
                {departmentSchedules.map(schedule => {
                  const position = getPosition(schedule.position_id);
                  
                  return (
                    <li key={schedule.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{getMemberName(schedule.member_id)}</h4>
                          {position && (
                            <p className="text-sm text-primary font-medium">{position.name}</p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {parseLocalDate(schedule.date).toLocaleDateString('pt-BR')}
                          </p>
                          {schedule.notes && (
                            <p className="text-xs italic mt-1">{schedule.notes}</p>
                          )}
                        </div>
                        {(canEdit || canDelete) && (
                          <div className="flex space-x-2">
                            {canEdit && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => onEditSchedule(schedule)}
                              >
                                Editar
                              </Button>
                            )}
                            {canDelete && (
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => onDeleteSchedule(schedule.id)}
                              >
                                Remover
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SchedulesList;
