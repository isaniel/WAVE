import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'student' | 'lecturer' | 'admin';

export interface User {
  uid: string;
  fullName: string;
  email: string;
  role: UserRole;
  department: string;
  matricNumber?: string;
  staffId?: string;
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type RoomCategory = 'course' | 'department' | 'faculty' | 'social' | 'announcements';

export interface Room {
  id: string;
  name: string;
  description: string;
  category: RoomCategory;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  visibility: 'public' | 'private';
  isArchived: boolean;
  lastMessage?: string;
  lastMessageAt?: Timestamp;
}

export interface RoomMember {
  userId: string;
  joinedAt: Timestamp;
  roleInRoom?: string;
}

export interface RoomMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  edited: boolean;
  deleted: boolean;
}

export interface PrivateChat {
  id: string;
  participants: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessage?: string;
  lastMessageAt?: Timestamp;
  otherUser?: User;
}

export interface PrivateMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deleted: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  pinned: boolean;
  targetAudience: 'all' | 'students' | 'lecturers' | 'admins';
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  matricNumber?: string;
  staffId?: string;
}
