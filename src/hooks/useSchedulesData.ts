import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { Schedule, Member, Department, AppRole } from '@/lib/database.types';
import * as db from '@/services/supabaseService';

interface AuthUser {
  id: string;
  role: AppRole;
  departmentId: string | null;
  memberId: string | null;
}

export const useSchedulesData = (selectedDate: Date, currentUser: AuthUser | null = null) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [loadedMembers, loadedDepartments] = await Promise.all([
        db.getMembers(),
        db.getDepartments()
      ]);
      setMembers(loadedMembers);
      setDepartments(loadedDepartments);
      await loadSchedules();
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados necessários.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSchedules = async () => {
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      // Get schedules for the date
      let allSchedules = await db.getSchedules(formattedDate);
      
      // Apply user role-based filtering
      if (currentUser) {
        if (currentUser.role === 'member' && currentUser.memberId) {
          // Members can only see their own schedules
          allSchedules = allSchedules.filter(
            schedule => schedule.member_id === currentUser.memberId
          );
        } else if (currentUser.role === 'department_leader' && currentUser.departmentId) {
          // Department leaders can only see schedules for their department
          allSchedules = allSchedules.filter(
            schedule => schedule.department_id === currentUser.departmentId
          );
        }
        // Admins can see all schedules, so no filtering needed
      }
      
      setSchedules(allSchedules);
      return allSchedules;
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast({
        title: "Erro ao carregar escalas",
        description: "Não foi possível carregar as escalas.",
        variant: "destructive",
      });
      return [];
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await db.deleteSchedule(scheduleId);
      toast({
        title: "Escala removida",
        description: "A escala foi removida com sucesso.",
      });
      await loadSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: "Erro ao remover escala",
        description: "Não foi possível remover a escala.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [selectedDate, currentUser?.id]);

  return {
    schedules,
    members,
    departments,
    isLoading,
    loadSchedules,
    handleDeleteSchedule
  };
};

// Helper function
const format = (date: Date, formatStr: string) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  if (formatStr === 'yyyy-MM-dd') {
    return `${year}-${month}-${day}`;
  }
  
  return `${year}-${month}-${day}`;
};
