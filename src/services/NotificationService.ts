
import { LocalNotifications } from '@capacitor/local-notifications';
import { Schedule, Member, Department, Position } from '@/lib/models';
import * as storage from '@/lib/storage';

// Initialize notifications permission
export async function initializeNotifications() {
  try {
    const { display } = await LocalNotifications.checkPermissions();
    
    if (display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }
    
    return display === 'granted';
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return false;
  }
}

export async function scheduleNotification(
  schedule: Schedule, 
  member: Member, 
  department: Department, 
  position: Position
) {
  try {
    // Parse the schedule date and time
    const scheduleDate = new Date(`${schedule.date}T${schedule.startTime}`);
    
    // Set notification time to 3 hours before the schedule
    const notificationDate = new Date(scheduleDate);
    notificationDate.setHours(notificationDate.getHours() - 3);
    
    // Skip if the notification time is in the past
    if (notificationDate <= new Date()) {
      console.log('Notification time is in the past, skipping');
      return null;
    }
    
    // Create notification ID based on schedule ID
    const notificationId = parseInt(schedule.id.replace(/\D/g, '').slice(0, 9), 10);
    
    // Build notification title and body
    const title = `Escala: ${department.name}`;
    const body = `Você servirá hoje às ${schedule.startTime} como ${position.name} no departamento ${department.name}. Lembre-se de estar presente!`;
    
    // Schedule the notification
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notificationId,
          title,
          body,
          schedule: { at: notificationDate },
          sound: 'default',
          actionTypeId: 'OPEN_APP',
        }
      ]
    });
    
    // Save notification ID to storage
    await storage.saveScheduledNotification(notificationId.toString());
    
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

export async function cancelNotification(notificationId: number | string) {
  try {
    const id = typeof notificationId === 'string' ? parseInt(notificationId, 10) : notificationId;
    
    await LocalNotifications.cancel({
      notifications: [{ id }]
    });
    
    await storage.removeScheduledNotification(id.toString());
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}

export async function processSchedulesForNotifications() {
  try {
    const [schedules, members, departments, positions] = await Promise.all([
      storage.getSchedules(),
      storage.getMembers(),
      storage.getDepartments(),
      storage.getPositions()
    ]);
    
    const currentUser = await storage.getCurrentUser();
    if (!currentUser || !currentUser.memberId) return;
    
    // Filter schedules for the current user
    const userSchedules = schedules.filter(s => s.memberId === currentUser.memberId);
    
    for (const schedule of userSchedules) {
      const member = members.find(m => m.id === schedule.memberId);
      const department = departments.find(d => d.id === schedule.departmentId);
      const position = positions.find(p => p.id === schedule.positionId);
      
      if (member && department && position) {
        await scheduleNotification(schedule, member, department, position);
      }
    }
  } catch (error) {
    console.error('Error processing schedules for notifications:', error);
  }
}
