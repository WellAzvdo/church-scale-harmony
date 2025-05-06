
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Schedule, Member, Department } from '@/lib/models';
import * as storage from '@/lib/storage';

export const useSchedulesData = (selectedDate: Date) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [loadedMembers, loadedDepartments] = await Promise.all([
        storage.getMembers(),
        storage.getDepartments()
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
      const allSchedules = await storage.getSchedules();
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const filteredSchedules = allSchedules.filter(
        schedule => schedule.date === formattedDate
      );
      setSchedules(filteredSchedules);
      return filteredSchedules;
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
      await storage.deleteSchedule(scheduleId);
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
  }, [selectedDate]);

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
  
  // For other format strings, we'll need to implement them
  // or use a different library
  return `${year}-${month}-${day}`;
};
