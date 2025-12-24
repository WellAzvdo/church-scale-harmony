import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  Calendar,
  Users
} from 'lucide-react';
import { Schedule, CheckInStatus, Member, Department, CheckIn } from '@/lib/models';
import { useAuth, Permission } from '@/contexts/AuthContext';
import * as storage from '@/lib/storage';
import { 
  getTodayDate, 
  getStatusLabel,
  getStatusColor
} from '@/lib/checkinUtils';
import { logger } from '@/lib/logger';

interface ReportEntry {
  schedule: Schedule;
  member: Member | null;
  department: Department | null;
  checkIn: CheckIn | null;
  status: CheckInStatus;
}

const CheckInReport: React.FC = () => {
  const [reportData, setReportData] = useState<ReportEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user, checkPermission } = useAuth();

  const canViewAll = checkPermission(Permission.VIEW_ALL);

  useEffect(() => {
    loadReport();
  }, [selectedDate, user]);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const allSchedules = await storage.getSchedules();
      const members = await storage.getMembers();
      const departments = await storage.getDepartments();
      const checkIns = await storage.getCheckInsByDate(selectedDate);

      // Filter schedules for selected date
      let dateSchedules = allSchedules.filter(s => s.date === selectedDate);
      
      // If department leader, filter by department
      if (!canViewAll && user?.departmentId) {
        dateSchedules = dateSchedules.filter(s => s.departmentId === user.departmentId);
      }

      const entries: ReportEntry[] = dateSchedules.map(schedule => {
        const checkIn = checkIns.find(c => c.scheduleId === schedule.id) || null;
        const member = members.find(m => m.id === schedule.memberId) || null;
        const department = departments.find(d => d.id === schedule.departmentId) || null;
        
        // Determine status
        let status = CheckInStatus.PENDING;
        if (checkIn) {
          status = checkIn.status;
        } else {
          // If no check-in and past service end time, mark as absent
          const now = new Date();
          const today = getTodayDate();
          if (selectedDate < today || (selectedDate === today && now.getHours() >= 21)) {
            status = CheckInStatus.ABSENT;
          }
        }

        return { schedule, member, department, checkIn, status };
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

  const getEntriesByStatus = (status: CheckInStatus) => {
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

  const formatCheckInTime = (isoString?: string) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatDateDisplay = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const onTimeCount = getEntriesByStatus(CheckInStatus.ON_TIME).length;
  const lateCount = getEntriesByStatus(CheckInStatus.LATE).length;
  const absentCount = getEntriesByStatus(CheckInStatus.ABSENT).length;
  const pendingCount = getEntriesByStatus(CheckInStatus.PENDING).length;

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-deep">Relatório de Check-in</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDateDisplay(selectedDate)}
          </p>
        </div>
      </div>

      {/* Date selector */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Data:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            />
          </div>
        </CardContent>
      </Card>

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
              {reportData.map(({ schedule, member, department, checkIn, status }) => (
                <Card key={schedule.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{member?.name || 'Membro'}</p>
                        <p className="text-sm text-muted-foreground">{department?.name}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={`${getStatusColor(status)} text-white`}>
                          {getStatusLabel(status)}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {checkIn ? formatCheckInTime(checkIn.checkInTime) : '-'}
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
                    {getEntriesByStatus(CheckInStatus.ON_TIME).map(({ schedule, member, department, checkIn }) => (
                      <Card key={schedule.id} className="bg-green-50 border-green-200">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <span>{member?.name}</span>
                            <span className="text-sm text-green-600">
                              {formatCheckInTime(checkIn?.checkInTime)}
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
                    {getEntriesByStatus(CheckInStatus.LATE).map(({ schedule, member, department, checkIn }) => (
                      <Card key={schedule.id} className="bg-yellow-50 border-yellow-200">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <span>{member?.name}</span>
                            <span className="text-sm text-yellow-600">
                              {formatCheckInTime(checkIn?.checkInTime)}
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
                    {getEntriesByStatus(CheckInStatus.ABSENT).map(({ schedule, member }) => (
                      <Card key={schedule.id} className="bg-red-50 border-red-200">
                        <CardContent className="p-3">
                          <span>{member?.name}</span>
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
                    {entries.map(({ schedule, member, checkIn, status }) => (
                      <Card key={schedule.id}>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <span>{member?.name}</span>
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
