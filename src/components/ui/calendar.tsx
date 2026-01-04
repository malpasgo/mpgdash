import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarProps {
  mode?: 'single';
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  initialFocus?: boolean;
  className?: string;
}

const Calendar: React.FC<CalendarProps> = ({ 
  mode = 'single',
  selected,
  onSelect,
  initialFocus,
  className
}) => {
  const [currentDate, setCurrentDate] = React.useState(selected || new Date());
  const [viewDate, setViewDate] = React.useState(selected || new Date());

  const today = new Date();
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const days = [];
  
  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const handleDayClick = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setCurrentDate(newDate);
    onSelect?.(newDate);
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  return (
    <div 
      className={cn("p-4 sm:p-6 bg-white border border-gray-200 rounded-lg shadow-md min-w-[280px] w-[280px] sm:min-w-[320px] sm:w-[320px]", className)}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-blue-100 hover:text-blue-700 hover:shadow-md rounded-lg text-gray-600 transition-all duration-200 hover:scale-105"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <div className="font-semibold text-base sm:text-lg text-gray-900">
          {monthNames[currentMonth]} {currentYear}
        </div>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-blue-100 hover:text-blue-700 hover:shadow-md rounded-lg text-gray-600 transition-all duration-200 hover:scale-105"
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-3">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs sm:text-sm font-semibold text-gray-600 p-2 sm:p-3">
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={index} className="p-2 sm:p-3" />;
          }

          const date = new Date(currentYear, currentMonth, day);
          const isSelected = selected && 
            date.getDate() === selected.getDate() &&
            date.getMonth() === selected.getMonth() &&
            date.getFullYear() === selected.getFullYear();
          const isToday = 
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();

          return (
            <button
              key={day}
              onClick={(e) => {
                e.stopPropagation();
                handleDayClick(day);
              }}
              className={cn(
                "p-2 sm:p-3 text-sm sm:text-base rounded-lg hover:bg-blue-100 hover:text-blue-900 hover:shadow-md text-gray-900 transition-all duration-200 min-h-[40px] sm:min-h-[44px] flex items-center justify-center font-medium hover:scale-105 cursor-pointer",
                isSelected && "bg-blue-600 text-white font-semibold hover:bg-blue-700 hover:shadow-lg",
                isToday && !isSelected && "bg-blue-50 text-blue-900 font-semibold hover:bg-blue-200 border-2 border-blue-300"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export { Calendar };