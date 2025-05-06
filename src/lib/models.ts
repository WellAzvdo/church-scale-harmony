
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

export type SyncStatus = 'synced' | 'pending' | 'not-synced';

// Helper types
export type EntityType = 'member' | 'department' | 'position' | 'schedule';
