import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, MapPin } from 'lucide-react';
import { Schedule, CheckInStatus, Member, Department, Position } from '@/lib/models';
import { useAuth, Permission } from '@/contexts/AuthContext';
import * as storage from '@/lib/storage';
import { 
  performCheckIn, 
  getScheduleCheckInStatus, 
  getTodayDate, 
  getCurrentTime,
  getStatusLabel,
  getStatusColor,
  checkMissingCheckIns
} from '@/lib/checkinUtils';

interface ScheduleWithStatus {
  schedule: Schedule;
  member: Member | null;
  department: Department | null;
  position: Position | null;
  status: CheckInStatus;
  checkInTime?: string;
}

const CheckIn: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduleWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const { toast } = useToast();
  const { user, checkPermission } = useAuth();

  const canViewAll = checkPermission(Permission.VIEW_ALL) || 
                     checkPermission(Permission.MANAGE_DEPARTMENT_SCHEDULES);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
      // Check for missing check-ins periodically
      checkMissingCheckIns();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadTodaySchedules();
  }, [user]);

  const loadTodaySchedules = async () => {
    setIsLoading(true);
    try {
      const today = getTodayDate();
      const allSchedules = await storage.getSchedules();
      const members = await storage.getMembers();
      const departments = await storage.getDepartments();
      
      // Filter schedules for today
      let todaySchedules = allSchedules.filter(s => s.date === today);
      
      // If not admin/leader, only show user's own schedules
      if (!canViewAll && user?.memberId) {
        todaySchedules = todaySchedules.filter(s => s.memberId === user.memberId);
      }

      // Get check-in status for each schedule
      const schedulesWithStatus: ScheduleWithStatus[] = await Promise.all(
        todaySchedules.map(async (schedule) => {
          const checkIn = await storage.getCheckInByScheduleId(schedule.id);
          const member = members.find(m => m.id === schedule.memberId) || null;
          const department = departments.find(d => d.id === schedule.departmentId) || null;
          const position = department?.positions.find(p => p.id === schedule.positionId) || null;
          
          return {
            schedule,
            member,
            department,
            position,
            status: checkIn?.status || CheckInStatus.PENDING,
            checkInTime: checkIn?.checkInTime
          };
        })
      );

      setSchedules(schedulesWithStatus);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as escalas.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async (schedule: Schedule) => {
    try {
      const checkIn = await performCheckIn(schedule);
      
      const statusMessage = checkIn.status === CheckInStatus.ON_TIME 
        ? 'Check-in realizado com sucesso! (Adimplente)'
        : 'Check-in realizado com atraso.';
      
      toast({
        title: checkIn.status === CheckInStatus.ON_TIME ? "✓ Adimplente" : "⚠ Atraso",
        description: statusMessage,
        variant: checkIn.status === CheckInStatus.ON_TIME ? "default" : "destructive"
      });

      // Reload schedules to update UI
      loadTodaySchedules();
    } catch (error) {
      console.error('Error performing check-in:', error);
      toast({
        title: "Erro",
        description: "Não foi possível realizar o check-in.",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: CheckInStatus) => {
    switch (status) {
      case CheckInStatus.ON_TIME:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case CheckInStatus.LATE:
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case CheckInStatus.ABSENT:
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <MapPin className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const formatCheckInTime = (isoString?: string) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-deep">Check-in</h1>
          <p className="text-sm text-muted-foreground">
            Hoje, {new Date().toLocaleDateString('pt-BR')} • {currentTime}
          </p>
        </div>
      </div>

      <Card className="mb-4 bg-primary-pale/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span>Limite para check-in adimplente: <strong>17:30</strong></span>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <p>Carregando escalas de hoje...</p>
        </div>
      ) : schedules.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {canViewAll 
                ? "Nenhuma escala encontrada para hoje."
                : "Você não está escalado para hoje."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {schedules.map(({ schedule, member, department, position, status, checkInTime }) => (
            <Card key={schedule.id} className="overflow-hidden">
              <CardHeader className="pb-2" style={{ 
                borderLeft: `4px solid ${department?.color || 'hsl(var(--primary))'}`
              }}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{member?.name || 'Membro'}</CardTitle>
                  <Badge className={`${getStatusColor(status)} text-white`}>
                    {getStatusLabel(status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium">{department?.name}</span>
                    {position && <span>• {position.name}</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Horário: {schedule.startTime} - {schedule.endTime}
                  </div>
                  
                  {checkInTime && (
                    <div className="flex items-center gap-2 text-sm">
                      {getStatusIcon(status)}
                      <span>Check-in às {formatCheckInTime(checkInTime)}</span>
                    </div>
                  )}

                  {/* Show check-in button only for own schedules or pending status */}
                  {(user?.memberId === schedule.memberId && status === CheckInStatus.PENDING) && (
                    <Button 
                      onClick={() => handleCheckIn(schedule)}
                      className="w-full mt-3 bg-primary hover:bg-primary-medium"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Fazer Check-in
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CheckIn;
