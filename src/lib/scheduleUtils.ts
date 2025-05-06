
import { Schedule } from './models';
import * as storage from './storage';

// Check if there's a scheduling conflict for a member
export async function hasScheduleConflict(newSchedule: Schedule): Promise<boolean> {
  // Get all existing schedules
  const schedules = await storage.getSchedules();
  
  // Filter schedules for the same member on the same date
  const memberSchedules = schedules.filter(
    s => s.memberId === newSchedule.memberId && 
         s.date === newSchedule.date &&
         s.id !== newSchedule.id // Exclude the current schedule when checking for conflicts
  );
  
  // If no schedules found for that member and date, no conflict
  if (memberSchedules.length === 0) {
    return false;
  }
  
  // Parse times for the new schedule
  const newStart = parseTimeString(newSchedule.startTime);
  const newEnd = parseTimeString(newSchedule.endTime);
  
  // Check for time overlaps
  for (const schedule of memberSchedules) {
    const existingStart = parseTimeString(schedule.startTime);
    const existingEnd = parseTimeString(schedule.endTime);
    
    // Check if time ranges overlap
    if (
      (newStart >= existingStart && newStart < existingEnd) || // New start time is within existing time range
      (newEnd > existingStart && newEnd <= existingEnd) ||     // New end time is within existing time range
      (newStart <= existingStart && newEnd >= existingEnd)     // New time range completely contains the existing one
    ) {
      return true; // Conflict found
    }
  }
  
  // No conflict found
  return false;
}

// Helper to parse time string ("HH:MM") to minutes since midnight for easier comparison
function parseTimeString(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

// Generate a unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
