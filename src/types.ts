import { Timestamp } from 'firebase/firestore';

export enum MealType {
  KidsLunch = 'Bữa trưa (trẻ)',
  KidsBreakfast = 'Bữa mai (trẻ)',
  TeachersLunch = 'Bữa trưa (GV)',
}

export interface MealRegistration {
  id: string;
  className: string;
  date: string; // YYYY-MM-DD format
  mealType: MealType;
  count: number;
  updatedAt?: Timestamp;
  registeredBy?: string; // Name of the user who registered/updated
  registeredById?: string; // UID of the user
}

export interface ClassInfo {
  id: string; // Document ID from Firestore
  name: string;
  studentCount: number;
  updatedAt?: Timestamp;
}

export enum View {
  Dashboard = 'dashboard',
  Register = 'register',
  List = 'list',
  Summary = 'summary',
  Management = 'management',
  Announcements = 'announcements',
}

export enum ManagementTab {
  Classes = 'classes',
  Users = 'users',
  AuditLogs = 'audit_logs',
  Archive = 'archive',
}

export enum Tab {
  Daily = 'daily',
  MultiDay = 'multi-day',
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export interface Notification {
  id: number;
  message: string;
}

export enum Role {
  Admin = 'Admin',
  BGH = 'Ban Giám hiệu',
  KT_CD = 'KT & CD',
  GV = 'Giáo viên',
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  assignedClass?: string; // Class name, only for GV role
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    createdAt: Timestamp;
    createdBy: string; // User's display name
    createdById: string; // User's ID
    readBy: string[]; // Array of user IDs who have read it
}

export type AuditLogAction = 
    | 'CREATE_REGISTRATION' | 'UPDATE_REGISTRATION' | 'DELETE_REGISTRATION'
    | 'CREATE_CLASS' | 'UPDATE_CLASS' | 'DELETE_CLASS'
    | 'CREATE_USER' | 'UPDATE_USER' | 'DELETE_USER'
    | 'CREATE_ANNOUNCEMENT' | 'UPDATE_ANNOUNCEMENT' | 'DELETE_ANNOUNCEMENT'
    | 'ARCHIVE_DATA';

export interface AuditLog {
    id: string;
    timestamp: Timestamp;
    userId: string;
    userName: string;
    action: AuditLogAction;
    details: Record<string, any>; // Flexible field for action-specific details
}