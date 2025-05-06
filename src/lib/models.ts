
// Models for the application data

export interface Member {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  positions: Position[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
  syncStatus: SyncStatus;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  color?: string;
  positions: Position[];
  createdAt: number;
  updatedAt: number;
  syncStatus: SyncStatus;
  leaderId?: string; // ID of the department leader
}

export interface Position {
  id: string;
  name: string;
  departmentId: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  syncStatus: SyncStatus;
}

export interface Schedule {
  id: string;
  memberId: string;
  departmentId: string;
  positionId: string;
  date: string; // ISO string
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  notes?: string;
  createdAt: number;
  updatedAt: number;
  syncStatus: SyncStatus;
}

export interface User {
  id: string;
  username: string;
  password?: string; // Added password field as optional
  memberId?: string; // Optional link to a member
  role: UserRole;
  departmentId?: string; // For department leaders
  securityQuestion?: SecurityQuestion; // Added for password recovery
  approvalStatus: ApprovalStatus; // Added for user approval workflow
  createdAt: number;
  updatedAt: number;
  syncStatus: SyncStatus;
}

export enum UserRole {
  MEMBER = 'member',
  DEPARTMENT_LEADER = 'department_leader',
  ADMIN = 'admin'
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface SecurityQuestion {
  question: string;
  answer: string;
}

export type SyncStatus = 'synced' | 'pending' | 'not-synced';

// Helper types
export type EntityType = 'member' | 'department' | 'position' | 'schedule' | 'user';

// Security questions options
export const SECURITY_QUESTIONS = [
  "Qual é o nome da sua mãe?",
  "Em qual cidade você nasceu?",
  "Qual é o nome do seu primeiro animal de estimação?",
  "Qual é o seu mês de nascimento?",
  "Qual foi sua primeira escola?"
];
