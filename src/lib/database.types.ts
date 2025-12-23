// Database types for Supabase integration
// These types mirror the database schema

export type AppRole = 'member' | 'department_leader' | 'admin';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type CheckinStatus = 'pending' | 'on_time' | 'late' | 'absent';

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  member_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  department_id: string | null;
  approval_status: ApprovalStatus;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  color: string;
  leader_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: string;
  department_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberPosition {
  id: string;
  member_id: string;
  position_id: string;
  created_at: string;
}

export interface Schedule {
  id: string;
  member_id: string;
  department_id: string;
  position_id: string;
  date: string; // DATE type as ISO string
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Checkin {
  id: string;
  schedule_id: string;
  member_id: string;
  department_id: string;
  date: string;
  checkin_time: string | null;
  status: CheckinStatus;
  created_at: string;
  updated_at: string;
}

export interface InternalAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  target_user_id: string | null;
  department_id: string | null;
  member_id: string | null;
  date: string;
  read: boolean;
  created_at: string;
}

// Extended types with relations
export interface ScheduleWithRelations extends Schedule {
  member?: Member;
  department?: Department;
  position?: Position;
}

export interface CheckinWithRelations extends Checkin {
  schedule?: Schedule;
  member?: Member;
  department?: Department;
}

// Check-in deadline constant (17:20)
export const CHECKIN_DEADLINE = '17:20';
export const SERVICE_END_TIME = '21:00';
