// Supabase data service - handles all database operations
import { supabase } from '@/integrations/supabase/client';
import type { 
  Department, 
  Position, 
  Member, 
  Schedule, 
  Checkin, 
  InternalAlert,
  UserRole,
  Profile,
  CheckinStatus
} from '@/lib/database.types';
import { CHECKIN_DEADLINE } from '@/lib/database.types';

// ============= DEPARTMENTS =============

export async function getDepartments(): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data || [];
}

export async function getDepartment(id: string): Promise<Department | null> {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function createDepartment(department: Omit<Department, 'id' | 'created_at' | 'updated_at'>): Promise<Department> {
  const { data, error } = await supabase
    .from('departments')
    .insert(department)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateDepartment(id: string, updates: Partial<Department>): Promise<Department> {
  const { data, error } = await supabase
    .from('departments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteDepartment(id: string): Promise<void> {
  const { error } = await supabase
    .from('departments')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============= POSITIONS =============

export async function getPositions(departmentId?: string): Promise<Position[]> {
  let query = supabase.from('positions').select('*').order('name');
  
  if (departmentId) {
    query = query.eq('department_id', departmentId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createPosition(position: Omit<Position, 'id' | 'created_at' | 'updated_at'>): Promise<Position> {
  const { data, error } = await supabase
    .from('positions')
    .insert(position)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updatePosition(id: string, updates: Partial<Position>): Promise<Position> {
  const { data, error } = await supabase
    .from('positions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deletePosition(id: string): Promise<void> {
  const { error } = await supabase
    .from('positions')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============= MEMBERS =============

export async function getMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data || [];
}

// Get approved users assigned to a specific department (for scale creation)
export async function getApprovedUsersForDepartment(departmentId: string): Promise<Profile[]> {
  // Get user_ids assigned to this department
  const { data: userDepts, error: udError } = await supabase
    .from('user_departments')
    .select('user_id')
    .eq('department_id', departmentId);
  
  if (udError) throw udError;
  if (!userDepts || userDepts.length === 0) return [];
  
  const userIds = [...new Set(userDepts.map(ud => ud.user_id))];
  
  // Get approved users from user_roles
  const { data: approvedRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id')
    .in('user_id', userIds)
    .eq('approval_status', 'approved');
  
  if (rolesError) throw rolesError;
  if (!approvedRoles || approvedRoles.length === 0) return [];
  
  const approvedUserIds = approvedRoles.map(r => r.user_id);
  
  // Get profiles for approved users
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', approvedUserIds)
    .order('full_name');
  
  if (profilesError) throw profilesError;
  return profiles || [];
}

// Get all approved users (for admins)
export async function getAllApprovedUsers(): Promise<Profile[]> {
  // Get approved user_ids
  const { data: approvedRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('approval_status', 'approved');
  
  if (rolesError) throw rolesError;
  if (!approvedRoles || approvedRoles.length === 0) return [];
  
  const approvedUserIds = approvedRoles.map(r => r.user_id);
  
  // Get profiles for approved users
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', approvedUserIds)
    .order('full_name');
  
  if (profilesError) throw profilesError;
  return profiles || [];
}

export async function getMembersByDepartment(departmentId: string): Promise<Member[]> {
  // Get all member_positions for this department's positions
  const { data: positions, error: posError } = await supabase
    .from('positions')
    .select('id')
    .eq('department_id', departmentId);
  
  if (posError) throw posError;
  if (!positions || positions.length === 0) return [];
  
  const positionIds = positions.map(p => p.id);
  
  // Get member IDs that have positions in this department
  const { data: memberPositions, error: mpError } = await supabase
    .from('member_positions')
    .select('member_id')
    .in('position_id', positionIds);
  
  if (mpError) throw mpError;
  if (!memberPositions || memberPositions.length === 0) return [];
  
  const memberIds = [...new Set(memberPositions.map(mp => mp.member_id))];
  
  // Get the actual members
  const { data: members, error: memError } = await supabase
    .from('members')
    .select('*')
    .in('id', memberIds)
    .order('name');
  
  if (memError) throw memError;
  return members || [];
}

export async function getMember(id: string): Promise<Member | null> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function getMemberByUserId(userId: string): Promise<Member | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('member_id')
    .eq('id', userId)
    .maybeSingle();
  
  if (!profile?.member_id) return null;
  
  return getMember(profile.member_id);
}

export async function createMember(member: Omit<Member, 'id' | 'created_at' | 'updated_at'>): Promise<Member> {
  const { data, error } = await supabase
    .from('members')
    .insert(member)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateMember(id: string, updates: Partial<Member>): Promise<Member> {
  const { data, error } = await supabase
    .from('members')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteMember(id: string): Promise<void> {
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============= SCHEDULES =============

export async function getSchedules(date?: string): Promise<Schedule[]> {
  let query = supabase.from('schedules').select('*').order('date', { ascending: false });
  
  if (date) {
    query = query.eq('date', date);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getSchedulesByMember(memberId: string): Promise<Schedule[]> {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('member_id', memberId)
    .order('date', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getSchedulesByDepartment(departmentId: string, date?: string): Promise<Schedule[]> {
  let query = supabase
    .from('schedules')
    .select('*')
    .eq('department_id', departmentId)
    .order('date', { ascending: false });
  
  if (date) {
    query = query.eq('date', date);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Check for schedule conflict (same member, same date, different department)
export async function checkScheduleConflict(
  memberId: string, 
  date: string, 
  excludeScheduleId?: string
): Promise<{ hasConflict: boolean; conflictDepartment?: Department }> {
  let query = supabase
    .from('schedules')
    .select('*, department:departments(*)')
    .eq('member_id', memberId)
    .eq('date', date);
  
  if (excludeScheduleId) {
    query = query.neq('id', excludeScheduleId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  if (data && data.length > 0) {
    return { 
      hasConflict: true, 
      conflictDepartment: (data[0] as any).department as Department 
    };
  }
  
  return { hasConflict: false };
}

export async function createSchedule(schedule: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>): Promise<Schedule> {
  const { data, error } = await supabase
    .from('schedules')
    .insert(schedule)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule> {
  const { data, error } = await supabase
    .from('schedules')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteSchedule(id: string): Promise<void> {
  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============= CHECK-INS =============

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function getCurrentTime(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

export function getTodayDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
}

export function isCheckinAllowed(): boolean {
  const currentTime = getCurrentTime();
  const currentMinutes = parseTimeToMinutes(currentTime);
  const deadlineMinutes = parseTimeToMinutes(CHECKIN_DEADLINE);
  return currentMinutes <= deadlineMinutes;
}

export function calculateCheckinStatus(checkinTime: string): CheckinStatus {
  const timeStr = new Date(checkinTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const checkinMinutes = parseTimeToMinutes(timeStr);
  const deadlineMinutes = parseTimeToMinutes(CHECKIN_DEADLINE);
  
  return checkinMinutes <= deadlineMinutes ? 'on_time' : 'late';
}

export async function getCheckins(date?: string): Promise<Checkin[]> {
  let query = supabase.from('checkins').select('*');
  
  if (date) {
    query = query.eq('date', date);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getCheckinBySchedule(scheduleId: string): Promise<Checkin | null> {
  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('schedule_id', scheduleId)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function performCheckin(schedule: Schedule): Promise<{ success: boolean; checkin?: Checkin; error?: string }> {
  // Check if checkin is still allowed (before 17:20)
  if (!isCheckinAllowed()) {
    return { 
      success: false, 
      error: 'O horário limite para check-in (17:20) já foi ultrapassado.' 
    };
  }
  
  const now = new Date().toISOString();
  const status = calculateCheckinStatus(now);
  
  // Check if checkin already exists
  const existing = await getCheckinBySchedule(schedule.id);
  
  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('checkins')
      .update({ 
        checkin_time: now, 
        status 
      })
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, checkin: data };
  }
  
  // Create new checkin
  const { data, error } = await supabase
    .from('checkins')
    .insert({
      schedule_id: schedule.id,
      member_id: schedule.member_id,
      department_id: schedule.department_id,
      date: schedule.date,
      checkin_time: now,
      status
    })
    .select()
    .single();
  
  if (error) throw error;
  return { success: true, checkin: data };
}

// ============= INTERNAL ALERTS =============

export async function getAlerts(userId?: string): Promise<InternalAlert[]> {
  let query = supabase
    .from('internal_alerts')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (userId) {
    query = query.or(`target_user_id.eq.${userId},target_user_id.is.null`);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getUnreadAlerts(userId?: string): Promise<InternalAlert[]> {
  let query = supabase
    .from('internal_alerts')
    .select('*')
    .eq('read', false)
    .order('created_at', { ascending: false });
  
  if (userId) {
    query = query.or(`target_user_id.eq.${userId},target_user_id.is.null`);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createAlert(alert: Omit<InternalAlert, 'id' | 'created_at'>): Promise<InternalAlert> {
  const { data, error } = await supabase
    .from('internal_alerts')
    .insert(alert)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function markAlertAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('internal_alerts')
    .update({ read: true })
    .eq('id', id);
  
  if (error) throw error;
}

export async function markAllAlertsAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('internal_alerts')
    .update({ read: true })
    .or(`target_user_id.eq.${userId},target_user_id.is.null`);
  
  if (error) throw error;
}

// ============= USER ROLES =============

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function getPendingUsers(): Promise<(UserRole & { profile: Profile | null })[]> {
  // First get pending user roles
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('approval_status', 'pending');
  
  if (rolesError) throw rolesError;
  if (!userRoles || userRoles.length === 0) return [];
  
  // Then get profiles for these users
  const userIds = userRoles.map(ur => ur.user_id);
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds);
  
  if (profilesError) throw profilesError;
  
  // Combine the data
  return userRoles.map(ur => ({
    ...ur,
    profile: profiles?.find(p => p.id === ur.user_id) || null
  }));
}

export async function approveUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_roles')
    .update({ approval_status: 'approved' })
    .eq('user_id', userId);
  
  if (error) throw error;
}

export async function rejectUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_roles')
    .update({ approval_status: 'rejected' })
    .eq('user_id', userId);
  
  if (error) throw error;
}

export async function updateUserRole(userId: string, role: UserRole['role'], departmentId?: string): Promise<void> {
  const { error } = await supabase
    .from('user_roles')
    .update({ 
      role, 
      department_id: departmentId || null 
    })
    .eq('user_id', userId);
  
  if (error) throw error;
}

// ============= PROFILE =============

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function linkMemberToProfile(userId: string, memberId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ member_id: memberId })
    .eq('id', userId);
  
  if (error) throw error;
}

// ============= USER DEPARTMENTS =============

export async function getUserDepartments(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_departments')
    .select('department_id')
    .eq('user_id', userId);
  
  if (error) throw error;
  return data?.map(d => d.department_id) || [];
}

export async function getMembersInUserDepartments(userId: string): Promise<Member[]> {
  // Get user's department assignments
  const departmentIds = await getUserDepartments(userId);
  if (departmentIds.length === 0) return [];
  
  // Get members that are in these departments
  const { data: userDepts, error: udError } = await supabase
    .from('user_departments')
    .select('user_id')
    .in('department_id', departmentIds);
  
  if (udError) throw udError;
  
  const userIds = [...new Set(userDepts?.map(ud => ud.user_id) || [])];
  if (userIds.length === 0) return [];
  
  // Get profiles with member_id for these users
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('member_id')
    .in('id', userIds)
    .not('member_id', 'is', null);
  
  if (pError) throw pError;
  
  const memberIds = profiles?.map(p => p.member_id).filter(Boolean) as string[];
  if (memberIds.length === 0) return [];
  
  // Get the actual members
  const { data: members, error: mError } = await supabase
    .from('members')
    .select('*')
    .in('id', memberIds)
    .order('name');
  
  if (mError) throw mError;
  return members || [];
}

// ============= CHURCH SETTINGS =============

export async function getChurchSettings(): Promise<{
  latitude: number;
  longitude: number;
  radiusMeters: number;
} | null> {
  const { data, error } = await supabase
    .from('church_settings')
    .select('*')
    .limit(1)
    .maybeSingle();
  
  if (error) throw error;
  if (!data) return null;
  
  return {
    latitude: data.latitude,
    longitude: data.longitude,
    radiusMeters: data.radius_meters
  };
}

export async function updateChurchSettings(settings: {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}): Promise<void> {
  const { data: existing } = await supabase
    .from('church_settings')
    .select('id')
    .limit(1)
    .maybeSingle();
  
  if (existing) {
    const { error } = await supabase
      .from('church_settings')
      .update({
        latitude: settings.latitude,
        longitude: settings.longitude,
        radius_meters: settings.radiusMeters
      })
      .eq('id', existing.id);
    
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('church_settings')
      .insert({
        latitude: settings.latitude,
        longitude: settings.longitude,
        radius_meters: settings.radiusMeters
      });
    
    if (error) throw error;
  }
}
