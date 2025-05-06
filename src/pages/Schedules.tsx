
import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { Schedule } from '@/lib/models';
import ScheduleForm from '@/components/schedules/ScheduleForm';
import DateSelector from '@/components/schedules/DateSelector';
import SchedulesList from '@/components/schedules/SchedulesList';
import { useSchedulesData } from '@/hooks/useSchedulesData';

const Schedules: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const { toast } = useToast();
  
  const { 
    schedules, 
    members, 
    departments, 
    loadSchedules, 
    handleDeleteSchedule 
  } = useSchedulesData(selectedDate);

  const handleAddSchedule = () => {
    setEditingSchedule(null);
    setIsFormOpen(true);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setIsFormOpen(true);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

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

      <DateSelector 
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
      />

      <SchedulesList 
        schedules={schedules}
        members={members}
        departments={departments}
        onEditSchedule={handleEditSchedule}
        onDeleteSchedule={handleDeleteSchedule}
      />

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
