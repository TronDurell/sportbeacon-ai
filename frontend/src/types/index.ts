// Core types
export interface User {
  id: string;
  uid?: string; // Add uid property for Firebase compatibility
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organization?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'player' | 'coach' | 'parent' | 'admin';

export interface Team {
  id: string;
  name: string;
  leagueId: string;
  coachId: string;
  players: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface League {
  id: string;
  name: string;
  description?: string;
  adminId: string;
  teams: string[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface Game {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  date: Date;
  location: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  homeScore?: number;
  awayScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Facility {
  id: string;
  name: string;
  address: string;
  fields: Field[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Field {
  id: string;
  name: string;
  facilityId: string;
  type: 'soccer' | 'basketball' | 'baseball' | 'football' | 'other';
  capacity?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleConstraint {
  id: string;
  type: 'team_availability' | 'field_availability' | 'referee_availability';
  teamId?: string;
  fieldId?: string;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type MessageType = 'text' | 'image' | 'file' | 'system';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'unread';

export interface Registration {
  id: string;
  userId: string;
  leagueId: string;
  teamId?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  type: 'league_fee' | 'equipment' | 'other';
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
  role: UserRole;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  organization?: string;
}

// Dashboard types
export interface DashboardStats {
  totalTeams: number;
  totalPlayers: number;
  upcomingGames: number;
  winRate: number;
}

// Player types
export interface PlayerStats {
  goals: number;
  assists: number;
  gamesPlayed: number;
  minutesPlayed: number;
  shotsOnTarget: number;
  passAccuracy: number;
}

// Coach types
export interface CoachStats {
  totalTeams: number;
  totalPlayers: number;
  winRate: number;
  gamesCoached: number;
}

// Parent types
export interface ParentStats {
  children: number;
  upcomingGames: number;
  unreadMessages: number;
  totalGoals: number;
}

// Admin types
export interface AdminStats {
  totalLeagues: number;
  activeUsers: number;
  totalTeams: number;
  systemStatus: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filter types
export interface FilterParams {
  search?: string;
  role?: UserRole;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
} 