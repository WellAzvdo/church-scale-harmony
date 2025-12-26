import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, MapPin, Loader2, Navigation } from 'lucide-react';
import { useAuth, Permission } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import * as db from '@/services/supabaseService';
import { 
  getCurrentPosition, 
  isWithinChurchRadius, 
  calculateDistance,
  formatDistance,
  type Coordinates,
  type ChurchLocation
} from '@/lib/geolocation';
import { logger } from '@/lib/logger';
import type { Schedule, Member, Department, Position, CheckinStatus } from '@/lib/database.types';

// Extended checkin type with location fields
interface CheckinWithLocation {
  id: string;
  schedule_id: string;
  member_id: string;
  department_id: string;
  date: string;
  checkin_time: string | null;
  status: CheckinStatus;
  latitude?: number | null;
  longitude?: number | null;
  location_validated?: boolean | null;
  created_at: string;
  updated_at: string;
}

interface ScheduleWithDetails {
  schedule: Schedule;
  member: Member | null;
  department: Department | null;
  position: Position | null;
  checkin: CheckinWithLocation | null;
}

const CheckIn: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduleWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(db.getCurrentTime());
  const [churchLocation, setChurchLocation] = useState<ChurchLocation | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();
  const { user, checkPermission } = useAuth();

  const canViewAll = checkPermission(Permission.VIEW_ALL) || 
                     checkPermission(Permission.MANAGE_DEPARTMENT_SCHEDULES);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(db.getCurrentTime());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load church settings
  useEffect(() => {
    const loadChurchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('church_settings')
          .select('*')
          .limit(1)
          .maybeSingle();
        
        if (error) throw error;
        if (data) {
          setChurchLocation({
            latitude: data.latitude,
            longitude: data.longitude,
            radiusMeters: data.radius_meters
          });
        }
      } catch (error) {
        logger.error('Error loading church settings:', error);
      }
    };
    loadChurchSettings();
  }, []);

  // Load today's schedules from Supabase
  const loadTodaySchedules = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = db.getTodayDate();
      
      // Get schedules, members, departments, positions, and checkins from Supabase
      const [allSchedules, members, departments, positions, checkins] = await Promise.all([
        db.getSchedules(today),
        db.getMembers(),
        db.getDepartments(),
        db.getPositions(),
        db.getCheckins(today)
      ]);
      
      // Filter schedules based on user role
      let todaySchedules = allSchedules;
      
      if (!canViewAll && user?.memberId) {
        todaySchedules = todaySchedules.filter(s => s.member_id === user.memberId);
      }

      // Build schedule details
      const schedulesWithDetails: ScheduleWithDetails[] = todaySchedules.map(schedule => {
        const member = members.find(m => m.id === schedule.member_id) || null;
        const department = departments.find(d => d.id === schedule.department_id) || null;
        const position = positions.find(p => p.id === schedule.position_id) || null;
        const checkin = checkins?.find(c => c.schedule_id === schedule.id) || null;
        
        return { schedule, member, department, position, checkin };
      });

      setSchedules(schedulesWithDetails);
    } catch (error) {
      logger.error('Error loading schedules:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as escalas.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [canViewAll, user?.memberId, toast]);

  useEffect(() => {
    loadTodaySchedules();
  }, [loadTodaySchedules]);

  // Get user location
  const getUserLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(null);
    try {
      const coords = await getCurrentPosition();
      setUserLocation(coords);
      return coords;
    } catch (error: any) {
      setLocationError(error.message);
      toast({
        title: "Erro de Localização",
        description: error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Handle check-in with geolocation validation
  const handleCheckIn = async (schedule: Schedule) => {
    setCheckingInId(schedule.id);
    
    try {
      // First, check time limit
      if (!db.isCheckinAllowed()) {
        toast({
          title: "Check-in não permitido",
          description: "O horário limite para check-in (17:20) já foi ultrapassado.",
          variant: "destructive"
        });
        return;
      }

      // Get user location
      const coords = await getUserLocation();
      if (!coords) {
        return;
      }

      // Validate location against church
      if (!churchLocation) {
        toast({
          title: "Erro",
          description: "Configurações da igreja não encontradas. Entre em contato com o administrador.",
          variant: "destructive"
        });
        return;
      }

      const isAtChurch = isWithinChurchRadius(coords, churchLocation);
      const distance = calculateDistance(coords, {
        latitude: churchLocation.latitude,
        longitude: churchLocation.longitude
      });

      if (!isAtChurch) {
        toast({
          title: "Você não está na igreja",
          description: `Você precisa estar na igreja para realizar o check-in. Distância atual: ${formatDistance(distance)}`,
          variant: "destructive"
        });
        return;
      }

      // Perform check-in with location data
      const now = new Date().toISOString();
      const status: CheckinStatus = db.calculateCheckinStatus(now);
      
      // Check if checkin already exists
      const existing = await db.getCheckinBySchedule(schedule.id);
      
      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('checkins')
          .update({ 
            checkin_time: now, 
            status,
            latitude: coords.latitude,
            longitude: coords.longitude,
            location_validated: true
          })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Create new checkin
        const { error } = await supabase
          .from('checkins')
          .insert({
            schedule_id: schedule.id,
            member_id: schedule.member_id,
            department_id: schedule.department_id,
            date: schedule.date,
            checkin_time: now,
            status,
            latitude: coords.latitude,
            longitude: coords.longitude,
            location_validated: true
          });
        
        if (error) throw error;
      }
      
      toast({
        title: status === 'on_time' ? "✓ Adimplente" : "⚠ Atraso",
        description: status === 'on_time' 
          ? 'Check-in realizado com sucesso!' 
          : 'Check-in realizado com atraso.',
        variant: status === 'on_time' ? "default" : "destructive"
      });

      // Reload schedules to update UI
      loadTodaySchedules();
    } catch (error) {
      logger.error('Error performing check-in:', error);
      toast({
        title: "Erro",
        description: "Não foi possível realizar o check-in.",
        variant: "destructive"
      });
    } finally {
      setCheckingInId(null);
    }
  };

  const getStatusIcon = (status?: CheckinStatus) => {
    switch (status) {
      case 'on_time':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'late':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'absent':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <MapPin className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status?: CheckinStatus): string => {
    switch (status) {
      case 'on_time': return 'Adimplente';
      case 'late': return 'Atraso';
      case 'absent': return 'Faltoso';
      default: return 'Aguardando';
    }
  };

  const getStatusColor = (status?: CheckinStatus): string => {
    switch (status) {
      case 'on_time': return 'bg-green-500';
      case 'late': return 'bg-yellow-500';
      case 'absent': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const formatCheckInTime = (isoString?: string | null) => {
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
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              <span>Limite para check-in adimplente: <strong>17:20</strong></span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Navigation className="h-4 w-4 text-primary" />
              <span>Check-in requer validação de <strong>localização</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {locationError && (
        <Card className="mb-4 border-destructive bg-destructive/10">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{locationError}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={getUserLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4 mr-2" />
              )}
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
          {schedules.map(({ schedule, member, department, position, checkin }) => (
            <Card key={schedule.id} className="overflow-hidden">
              <CardHeader className="pb-2" style={{ 
                borderLeft: `4px solid ${department?.color || 'hsl(var(--primary))'}`
              }}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{member?.name || 'Membro'}</CardTitle>
                  <Badge className={`${getStatusColor(checkin?.status)} text-white`}>
                    {getStatusLabel(checkin?.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium">{department?.name}</span>
                    {position && <span>• {position.name}</span>}
                  </div>
                  
                  {checkin?.checkin_time && (
                    <div className="flex items-center gap-2 text-sm">
                      {getStatusIcon(checkin.status)}
                      <span>Check-in às {formatCheckInTime(checkin.checkin_time)}</span>
                      {checkin.location_validated && (
                        <Badge variant="outline" className="text-xs">
                          <Navigation className="h-3 w-3 mr-1" />
                          Localização verificada
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Show check-in button only for own schedules without checkin */}
                  {(user?.memberId === schedule.member_id && !checkin) && (
                    <Button 
                      onClick={() => handleCheckIn(schedule)}
                      className="w-full mt-3 bg-primary hover:bg-primary-medium"
                      disabled={checkingInId === schedule.id || !db.isCheckinAllowed()}
                    >
                      {checkingInId === schedule.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <MapPin className="h-4 w-4 mr-2" />
                      )}
                      {checkingInId === schedule.id ? 'Verificando localização...' : 'Fazer Check-in'}
                    </Button>
                  )}
                  
                  {!db.isCheckinAllowed() && !checkin && (
                    <p className="text-sm text-destructive text-center mt-2">
                      Horário limite para check-in ultrapassado
                    </p>
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
