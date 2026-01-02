"use client";

import { Header } from "@/components/Header";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CalendarJobModal } from "@/components/CalendarJobModal";

import { getMonthlySchedule } from "@/lib/supabaseQueries";
import { useEffect } from "react";

export default function TakvimPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calendarData, setCalendarData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);

  // Fetch data when month changes
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await getMonthlySchedule(currentDate.getFullYear(), currentDate.getMonth());
        setCalendarData(data);
      } catch (error) {
        console.error("Takvim verisi hatası:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentDate]);

  // Helper to get days in month
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Helper to get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInCurrentMonth = getDaysInMonth(currentDate);
  const startDayOffset = getFirstDayOfMonth(currentDate);

  // Arrays for rendering
  const emptySlots = Array.from({ length: startDayOffset });
  const daySlots = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getFormattedDateKey = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  };

  const handleDayClick = (day: number) => {
    const fullDateKey = getFormattedDateKey(day);
    const jobs = calendarData[fullDateKey];

    if (jobs && jobs.length > 0) {
      const longDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
        .toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
      setSelectedDate(longDate);
      setSelectedJobs(jobs);
      setIsModalOpen(true);
    }
  };

  // Calculate unique personnel count for a day
  const getUnknownPersonnelCount = (day: number) => {
    const key = getFormattedDateKey(day);
    const jobs = calendarData[key] || [];
    if (jobs.length === 0) return 0;

    const uniquePeople = new Set();
    jobs.forEach(job => {
      job.assignedStaff?.forEach((s: any) => uniquePeople.add(s.name));
    });
    return uniquePeople.size;
  };

  return (
    <>
      <Header title="Takvim" />
      <div className="p-8 space-y-6">

        <h2 className="text-2xl font-bold text-foreground">Personel Takvimi</h2>

        {/* Calendar Container */}
        <div className="rounded-xl border border-border bg-card shadow-sm p-6">

          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <h3 className="text-lg font-bold text-foreground capitalize">{formatMonthYear(currentDate)}</h3>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 mb-4">
            {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">

            {/* Empty Slots for Start Offset */}
            {emptySlots.map((_, index) => (
              <div key={`empty-${index}`} className="min-h-[120px]" />
            ))}

            {/* Actual Days */}
            {daySlots.map((day) => {
              const pCount = getUnknownPersonnelCount(day);
              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "min-h-[100px] rounded-xl border p-2 transition-all cursor-pointer relative",
                    pCount > 0
                      ? "bg-card border-border hover:border-primary/50 hover:shadow-md dark:shadow-none"
                      : "bg-muted/30 border-border text-muted-foreground"
                  )}
                >
                  <span className={cn(
                    "text-sm font-semibold block mb-2",
                    pCount > 0 ? "text-foreground" : "text-muted-foreground"
                  )}>{day}</span>

                  {pCount > 0 && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 flex items-center gap-2">
                      <div className="bg-primary/20 p-1.5 rounded-md">
                        <Users className="h-3 w-3 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground leading-none">{pCount}</span>
                        <span className="text-[10px] font-medium text-primary leading-none mt-0.5">Personel</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {selectedDate && (
        <CalendarJobModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          date={selectedDate}
          jobs={selectedJobs}
        />
      )}
    </>
  );
}
