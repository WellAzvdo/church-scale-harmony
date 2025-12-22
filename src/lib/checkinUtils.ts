import { CheckIn, CheckInStatus, Schedule, CHECKIN_DEADLINE } from './models';
import * as storage from './storage';
import { generateId } from './scheduleUtils';

// Parse time string to minutes since midnight
function parseTimeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

// Get current time as HH:MM string
export function getCurrentTime(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

// Get today's date as yyyy-MM-dd
export function getTodayDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
}

// Determine check-in status based on current time
export function calculateCheckInStatus(checkInTime: string): CheckInStatus {
  const deadlineMinutes = parseTimeToMinutes(CHECKIN_DEADLINE);
  const checkInMinutes = parseTimeToMinutes(checkInTime);
  
  if (checkInMinutes <= deadlineMinutes) {
    return CheckInStatus.ON_TIME; // Adimplente
  } else {
    return CheckInStatus.LATE; // Atraso
  }
}

// Perform check-in for a schedule
export async function performCheckIn(schedule: Schedule): Promise<CheckIn> {
  const now = new Date();
  const currentTime = getCurrentTime();
  const status = calculateCheckInStatus(currentTime);
  
  // Check if check-in already exists
  const existingCheckIn = await storage.getCheckInByScheduleId(schedule.id);
  
  if (existingCheckIn) {
    // Update existing check-in
    const updatedCheckIn: CheckIn = {
      ...existingCheckIn,
      checkInTime: now.toISOString(),
      status,
      updatedAt: Date.now()
    };
    await storage.saveCheckIn(updatedCheckIn);
    return updatedCheckIn;
  }
  
  // Create new check-in
  const checkIn: CheckIn = {
    id: generateId(),
    scheduleId: schedule.id,
    memberId: schedule.memberId,
    departmentId: schedule.departmentId,
    date: schedule.date,
    checkInTime: now.toISOString(),
    status,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    syncStatus: 'not-synced'
  };
  
  await storage.saveCheckIn(checkIn);
  return checkIn;
}

// Get check-in status for a schedule
export async function getScheduleCheckInStatus(scheduleId: string): Promise<CheckInStatus> {
  const checkIn = await storage.getCheckInByScheduleId(scheduleId);
  
  if (!checkIn) {
    return CheckInStatus.PENDING;
  }
  
  return checkIn.status;
}

// Get all check-ins for today with their status
export async function getTodayCheckInsReport(): Promise<{
  schedule: Schedule;
  checkIn: CheckIn | null;
  status: CheckInStatus;
}[]> {
  const today = getTodayDate();
  const schedules = await storage.getSchedules();
  const todaySchedules = schedules.filter(s => s.date === today);
  const checkIns = await storage.getCheckInsByDate(today);
  
  return todaySchedules.map(schedule => {
    const checkIn = checkIns.find(c => c.scheduleId === schedule.id) || null;
    return {
      schedule,
      checkIn,
      status: checkIn?.status || CheckInStatus.PENDING
    };
  });
}

// Check for missing check-ins and create alerts
export async function checkMissingCheckIns(): Promise<void> {
  const today = getTodayDate();
  const currentTime = getCurrentTime();
  const deadlineMinutes = parseTimeToMinutes(CHECKIN_DEADLINE);
  const currentMinutes = parseTimeToMinutes(currentTime);
  
  // Only run check after deadline
  if (currentMinutes < deadlineMinutes) {
    return;
  }
  
  const schedules = await storage.getSchedules();
  const todaySchedules = schedules.filter(s => s.date === today);
  const checkIns = await storage.getCheckInsByDate(today);
  const members = await storage.getMembers();
  const departments = await storage.getDepartments();
  const users = await storage.getUsers();
  
  for (const schedule of todaySchedules) {
    const checkIn = checkIns.find(c => c.scheduleId === schedule.id);
    
    // If no check-in found, create alert for department leaders
    if (!checkIn) {
      const member = members.find(m => m.id === schedule.memberId);
      const department = departments.find(d => d.id === schedule.departmentId);
      
      if (member && department) {
        // Find department leader(s)
        const departmentLeaders = users.filter(
          u => u.departmentId === department.id || u.role === 'admin'
        );
        
        for (const leader of departmentLeaders) {
          // Check if alert already exists for this schedule today
          const existingAlerts = await storage.getInternalAlerts();
          const alertExists = existingAlerts.some(
            a => a.type === 'missing_checkin' && 
                 a.memberId === member.id && 
                 a.date === today
          );
          
          if (!alertExists) {
            await storage.saveInternalAlert({
              id: generateId(),
              type: 'missing_checkin',
              title: 'Check-in não realizado',
              message: `${member.name} não realizou check-in para o serviço no departamento ${department.name}.`,
              targetUserId: leader.id,
              departmentId: department.id,
              memberId: member.id,
              date: today,
              read: false,
              createdAt: Date.now()
            });
          }
        }
      }
    }
  }
}

// Get status label in Portuguese
export function getStatusLabel(status: CheckInStatus): string {
  switch (status) {
    case CheckInStatus.ON_TIME:
      return 'Adimplente';
    case CheckInStatus.LATE:
      return 'Atraso';
    case CheckInStatus.ABSENT:
      return 'Faltoso';
    case CheckInStatus.PENDING:
    default:
      return 'Aguardando';
  }
}

// Get status color class
export function getStatusColor(status: CheckInStatus): string {
  switch (status) {
    case CheckInStatus.ON_TIME:
      return 'bg-green-500';
    case CheckInStatus.LATE:
      return 'bg-yellow-500';
    case CheckInStatus.ABSENT:
      return 'bg-red-500';
    case CheckInStatus.PENDING:
    default:
      return 'bg-gray-400';
  }
}
