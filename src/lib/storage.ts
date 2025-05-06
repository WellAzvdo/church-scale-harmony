
import { Preferences } from '@capacitor/preferences';
import { Member, Department, Position, Schedule, EntityType } from './models';

// Key prefixes for different entities in storage
const STORAGE_KEYS = {
  MEMBERS: 'members',
  DEPARTMENTS: 'departments',
  POSITIONS: 'positions',
  SCHEDULES: 'schedules',
  SYNC_TIMESTAMP: 'last_sync',
};

// Generic function to set data in storage
async function setData<T>(key: string, data: T): Promise<void> {
  await Preferences.set({
    key,
    value: JSON.stringify(data),
  });
}

// Generic function to get data from storage
async function getData<T>(key: string, defaultValue: T): Promise<T> {
  const result = await Preferences.get({ key });
  if (result.value) {
    return JSON.parse(result.value) as T;
  }
  return defaultValue;
}

// Helper functions for each entity type

// Members
export async function getMembers(): Promise<Member[]> {
  return getData<Member[]>(STORAGE_KEYS.MEMBERS, []);
}

export async function saveMember(member: Member): Promise<void> {
  const members = await getMembers();
  const existingIndex = members.findIndex(m => m.id === member.id);
  
  if (existingIndex >= 0) {
    members[existingIndex] = member;
  } else {
    members.push(member);
  }
  
  await setData(STORAGE_KEYS.MEMBERS, members);
}

export async function deleteMember(memberId: string): Promise<void> {
  let members = await getMembers();
  members = members.filter(m => m.id !== memberId);
  await setData(STORAGE_KEYS.MEMBERS, members);
}

// Departments
export async function getDepartments(): Promise<Department[]> {
  return getData<Department[]>(STORAGE_KEYS.DEPARTMENTS, []);
}

export async function saveDepartment(department: Department): Promise<void> {
  const departments = await getDepartments();
  const existingIndex = departments.findIndex(d => d.id === department.id);
  
  if (existingIndex >= 0) {
    departments[existingIndex] = department;
  } else {
    departments.push(department);
  }
  
  await setData(STORAGE_KEYS.DEPARTMENTS, departments);
}

export async function deleteDepartment(departmentId: string): Promise<void> {
  let departments = await getDepartments();
  departments = departments.filter(d => d.id !== departmentId);
  await setData(STORAGE_KEYS.DEPARTMENTS, departments);
}

// Positions
export async function getPositions(): Promise<Position[]> {
  return getData<Position[]>(STORAGE_KEYS.POSITIONS, []);
}

export async function savePosition(position: Position): Promise<void> {
  const positions = await getPositions();
  const existingIndex = positions.findIndex(p => p.id === position.id);
  
  if (existingIndex >= 0) {
    positions[existingIndex] = position;
  } else {
    positions.push(position);
  }
  
  await setData(STORAGE_KEYS.POSITIONS, positions);
}

export async function deletePosition(positionId: string): Promise<void> {
  let positions = await getPositions();
  positions = positions.filter(p => p.id !== positionId);
  await setData(STORAGE_KEYS.POSITIONS, positions);
}

// Schedules
export async function getSchedules(): Promise<Schedule[]> {
  return getData<Schedule[]>(STORAGE_KEYS.SCHEDULES, []);
}

export async function saveSchedule(schedule: Schedule): Promise<void> {
  const schedules = await getSchedules();
  const existingIndex = schedules.findIndex(s => s.id === schedule.id);
  
  if (existingIndex >= 0) {
    schedules[existingIndex] = schedule;
  } else {
    schedules.push(schedule);
  }
  
  await setData(STORAGE_KEYS.SCHEDULES, schedules);
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  let schedules = await getSchedules();
  schedules = schedules.filter(s => s.id !== scheduleId);
  await setData(STORAGE_KEYS.SCHEDULES, schedules);
}

// Sync functions
export async function getLastSyncTimestamp(): Promise<number> {
  return getData<number>(STORAGE_KEYS.SYNC_TIMESTAMP, 0);
}

export async function updateLastSyncTimestamp(): Promise<void> {
  await setData(STORAGE_KEYS.SYNC_TIMESTAMP, Date.now());
}

// Clear all data (for logout or testing)
export async function clearAllData(): Promise<void> {
  await Preferences.clear();
}
