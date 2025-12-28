import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  Users
} from 'lucide-react';
import { useAuth, Permission } from '@/contexts/AuthContext';
import * as db from '@/services/supabaseService';
import DateSelector from '@/components/schedules/DateSelector';
import { logger } from '@/lib/logger';
import type { Schedule, Department, Position, Profile, Checkin, CheckinStatus } from '@/lib/database.types';

interface ReportEntry {
  schedule: Schedule;
  profile: Profile | null;
  department: Department | null;
  position: Position | null;
  checkIn: Checkin | null;
  status: CheckinStatus;
}

const CheckInReport: React.FC = () => {
  const [reportData, setReportData] = useState<ReportEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user, checkPermission } = useAuth();

  const canViewAll = checkPermission(Permission.VIEW_ALL);

  useEffect(() => {
    loadReport();
  }, [selectedDate, user]);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const formattedDate = formatDate(selectedDate);
      
      // Fetch all required data from Supabase
      const [allSchedules, profiles, departments, positions, checkIns] = await Promise.all([
        db.getSchedules(formattedDate),
        db.getAllApprovedUsers(),
        db.getDepartments(),
        db.getPositions(),
        db.getCheckins(formattedDate)
      ]);

      // Filter schedules based on user permissions
      let dateSchedules = allSchedules;
      if (!canViewAll && user?.departmentId) {
        dateSchedules = dateSchedules.filter(s => s.department_id === user.departmentId);
      }

      const entries: ReportEntry[] = dateSchedules.map(schedule => {
        const checkIn = checkIns.find(c => c.schedule_id === schedule.id) || null;
        const profile = profiles.find(p => p.id === schedule.member_id) || null;
        const department = departments.find(d => d.id === schedule.department_id) || null;
        const position = positions.find(p => p.id === schedule.position_id) || null;
        
        // Determine status
        let status: CheckinStatus = 'pending';
        if (checkIn) {
          status = checkIn.status;
        } else {
          // If no check-in and past service end time, mark as absent
          const now = new Date();
          const today = formatDate(now);
          if (formattedDate < today || (formattedDate === today && now.getHours() >= 21)) {
            status = 'absent';
          }
        }

        return { schedule, profile, department, position, checkIn, status };
      });

      setReportData(entries);
    } catch (error) {
      logger.error('Error loading report:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o relatório.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getEntriesByStatus = (status: CheckinStatus) => {
    return reportData.filter(e => e.status === status);
  };

  const getEntriesByDepartment = () => {
    const grouped: Record<string, ReportEntry[]> = {};
    reportData.forEach(entry => {
      const deptName = entry.department?.name || 'Sem departamento';
      if (!grouped[deptName]) {
        grouped[deptName] = [];
      }
      grouped[deptName].push(entry);
    });
    return grouped;
  };

  const formatCheckInTime = (isoString?: string | null) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getStatusLabel = (status: CheckinStatus): string => {
    const labels: Record<CheckinStatus, string> = {
      'pending': 'Aguardando',
      'on_time': 'Adimplente',
      'late': 'Atrasado',
      'absent': 'Faltoso'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: CheckinStatus): string => {
    const colors: Record<CheckinStatus, string> = {
      'pending': 'bg-gray-500',
      'on_time': 'bg-green-500',
      'late': 'bg-yellow-500',
      'absent': 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const onTimeCount = getEntriesByStatus('on_time').length;
  const lateCount = getEntriesByStatus('late').length;
  const absentCount = getEntriesByStatus('absent').length;
  const pendingCount = getEntriesByStatus('pending').length;

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary-deep">Relatório de Check-in</h1>
      </div>

      {/* Date selector - same component as Schedules screen */}
      <DateSelector 
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-green-700">{onTimeCount}</p>
              <p className="text-xs text-green-600">Adimplentes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold text-yellow-700">{lateCount}</p>
              <p className="text-xs text-yellow-600">Atrasados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-red-700">{absentCount}</p>
              <p className="text-xs text-red-600">Faltosos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-gray-500" />
            <div>
              <p className="text-2xl font-bold text-gray-700">{pendingCount}</p>
              <p className="text-xs text-gray-600">Aguardando</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <p>Carregando relatório...</p>
        </div>
      ) : reportData.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhuma escala encontrada para esta data.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="by-status">Por Status</TabsTrigger>
            <TabsTrigger value="by-dept">Por Depto</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="space-y-3">
              {reportData.map(({ schedule, profile, department, position, checkIn, status }) => (
                <Card key={schedule.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{profile?.full_name || 'Membro'}</p>
                        {position && (
                          <p className="text-sm text-primary font-medium">{position.name}</p>
                        )}
                        <p className="text-sm text-muted-foreground">{department?.name}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={`${getStatusColor(status)} text-white`}>
                          {getStatusLabel(status)}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {checkIn ? formatCheckInTime(checkIn.checkin_time) : '-'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="by-status">
            <div className="space-y-6">
              {/* On Time */}
              {onTimeCount > 0 && (
                <div>
                  <h3 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> Adimplentes ({onTimeCount})
                  </h3>
                  <div className="space-y-2">
                    {getEntriesByStatus('on_time').map(({ schedule, profile, position, checkIn }) => (
                      <Card key={schedule.id} className="bg-green-50 border-green-200">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">{profile?.full_name}</span>
                              {position && (
                                <span className="text-sm text-green-600 ml-2">• {position.name}</span>
                              )}
                            </div>
                            <span className="text-sm text-green-600">
                              {formatCheckInTime(checkIn?.checkin_time)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Late */}
              {lateCount > 0 && (
                <div>
                  <h3 className="font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Atrasados ({lateCount})
                  </h3>
                  <div className="space-y-2">
                    {getEntriesByStatus('late').map(({ schedule, profile, position, checkIn }) => (
                      <Card key={schedule.id} className="bg-yellow-50 border-yellow-200">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">{profile?.full_name}</span>
                              {position && (
                                <span className="text-sm text-yellow-600 ml-2">• {position.name}</span>
                              )}
                            </div>
                            <span className="text-sm text-yellow-600">
                              {formatCheckInTime(checkIn?.checkin_time)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Absent */}
              {absentCount > 0 && (
                <div>
                  <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Faltosos ({absentCount})
                  </h3>
                  <div className="space-y-2">
                    {getEntriesByStatus('absent').map(({ schedule, profile, position }) => (
                      <Card key={schedule.id} className="bg-red-50 border-red-200">
                        <CardContent className="p-3">
                          <div>
                            <span className="font-medium">{profile?.full_name}</span>
                            {position && (
                              <span className="text-sm text-red-600 ml-2">• {position.name}</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="by-dept">
            <div className="space-y-6">
              {Object.entries(getEntriesByDepartment()).map(([deptName, entries]) => (
                <div key={deptName}>
                  <h3 className="font-semibold text-primary-deep mb-2">{deptName}</h3>
                  <div className="space-y-2">
                    {entries.map(({ schedule, profile, position, checkIn, status }) => (
                      <Card key={schedule.id}>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">{profile?.full_name}</span>
                              {position && (
                                <span className="text-sm text-muted-foreground ml-2">• {position.name}</span>
                              )}
                            </div>
                            <Badge className={`${getStatusColor(status)} text-white text-xs`}>
                              {getStatusLabel(status)}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default CheckInReport;
