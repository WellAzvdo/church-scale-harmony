
import React from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from 'lucide-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface DateSelectorProps {
  selectedDate: Date;
  onDateSelect: (date: Date | undefined) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  onDateSelect,
}) => {
  const formattedSelectedDate = format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
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
            onSelect={onDateSelect}
            initialFocus
            className="p-3"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateSelector;
