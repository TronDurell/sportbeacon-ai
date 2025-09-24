// Barrel exports: add new modules here to consolidate type imports everywhere.
export * from "./monetization";

// Common utility types that many services used "any" for:
export type ID = string;
export type ISODate = string;
export type DateString = string; // ISO date string format: YYYY-MM-DDTHH:mm:ss.sssZ

export interface ApiError {
  code: string;
  message: string;
  status?: number;
  cause?: unknown;
}

// Re-export commonly used types that were missing
export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Location and Post types
export interface Location {
  id: string;
  name: string;
  slug: string;
  sport: string;
  address: string;
  city: string;
  state: string;
  country: string;
  coordinates: { lat: number; lng: number };
  geo: { lat: number; lng: number };
  amenities: string[];
  hours: Record<string, string>;
  status: string;
  moderators: string[];
  visibility: string;
  type: string;
  stats: {
    followers: number;
    posts: number;
    lastPostAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LocationPost {
  id: string;
  locationId: string;
  userId: string;
  authorId: string;
  content: string;
  type: string;
  text: string;
  media: MediaFile[];
  poll?: {
    question: string;
    options: string[];
    closesAt: string;
  };
  run?: {
    startsAt: string;
    endsAt?: string;
    level?: string;
  };
  pinned: boolean;
  visibility: string;
  likeCount: number;
  replyCount: number;
  reportCount: number;
  deviceGeo: any;
  createdAt: string;
  updatedAt: string;
}

export interface MediaFile {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
}

export interface HomeFeedItem {
  id: string;
  type: 'post' | 'event' | 'announcement';
  data: LocationPost | Event | Announcement;
  source: {
    kind: string;
    id: string;
  };
  postRef: string;
  rank: number;
  createdAt: string;
}

export interface FollowLocation {
  id: string;
  userId: string;
  locationId: string;
  notifications: boolean;
  createdAt: string;
}

export interface LocationFilters {
  type?: string;
  sport?: string;
  status?: string;
  amenities?: string[];
  hasAmenities?: string[];
  radius?: number;
}

export interface PostFilters {
  locationId?: string;
  userId?: string;
  type?: string;
  visibility?: string;
  pinned?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  dateRange?: { start: string; end: string };
}

// User and Role types
export interface User {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organization?: string;
  createdAt: string;
  updatedAt?: string;
}

export type UserRole = 'admin' | 'coach' | 'player' | 'parent' | 'scout' | 'trainer' | 'athlete' | 'director' | 'townStaff';

// Game and Team types
export interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  location: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  league: string;
  leagueId: string;
  coachId: string;
  players: string[];
  coaches: string[];
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
  type: string;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}

// Unified Player Profile Interface (consolidates conflicting PlayerProfile types)
export interface PlayerProfile {
  id: ID;
  userId: ID;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: DateString;
  age: number;
  position?: string;
  jerseyNumber?: number;
  teamId?: ID;
  leagueId?: ID;
  organizationId?: ID;
  stats?: PlayerStats;
  preferences?: PlayerPreferences;
  createdAt: DateString;
  updatedAt: DateString;
}

export interface PlayerStats {
  goals?: number;
  assists?: number;
  gamesPlayed?: number;
  minutesPlayed?: number;
  rating?: number;
  [key: string]: number | undefined;
}

export interface PlayerPreferences {
  position: string[];
  trainingTimes: string[];
  communicationStyle: 'formal' | 'casual' | 'friendly';
  notificationSettings: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  digest: boolean;
}

// Unified Message Interface (consolidates conflicting Message types)
export interface Message {
  id: ID;
  senderId: ID;
  recipientId?: ID;
  channelId?: ID;
  content: string;
  type: MessageType;
  status: MessageStatus;
  metadata?: MessageMetadata;
  attachments?: MessageAttachment[];
  createdAt: DateString;
  updatedAt: DateString;
  readAt?: DateString;
  timestamp?: string;
}

export interface MessageMetadata {
  threadId?: ID;
  replyTo?: ID;
  edited?: boolean;
  editedAt?: DateString;
  reactions?: MessageReaction[];
  mentions?: ID[];
}

export interface MessageReaction {
  emoji: string;
  userId: ID;
  createdAt: DateString;
}

export interface MessageAttachment {
  id: ID;
  type: 'image' | 'video' | 'file' | 'audio';
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

// Unified Video Metadata Interface
export interface VideoMetadata {
  id: ID;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  duration: number; // seconds
  format: 'mp4' | 'webm' | 'mov' | 'avi';
  resolution: {
    width: number;
    height: number;
  };
  fileSize: number; // bytes
  uploadedBy: ID;
  visibility: 'public' | 'private' | 'team';
  tags: string[];
  createdAt: DateString;
  updatedAt: DateString;
}

// Unified Tip Response Interface
export interface TipResponse {
  id: ID;
  tipId: ID;
  userId: ID;
  response: string;
  rating?: number; // 1-5 stars
  helpful: boolean;
  feedback?: string;
  createdAt: DateString;
  updatedAt: DateString;
}

// Unified Badge Interface
export interface Badge {
  id: ID;
  name: string;
  description: string;
  icon: string;
  category: 'achievement' | 'participation' | 'skill' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  criteria: BadgeCriteria;
  points: number;
  isActive: boolean;
  createdAt: DateString;
  updatedAt: DateString;
}

export interface BadgeCriteria {
  type: 'games_played' | 'goals_scored' | 'training_sessions' | 'custom';
  threshold: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'season' | 'all_time';
  customCondition?: string;
}

// Unified Security Event Interface
export interface SecurityEvent {
  id: ID;
  type: 'login' | 'logout' | 'failed_login' | 'permission_denied' | 'data_access' | 'system_event';
  userId?: ID;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country: string;
    region: string;
    city: string;
  };
  details: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  createdAt: DateString;
  resolvedAt?: DateString;
  resolvedBy?: ID;
}

// Re-export other types from main types file
export type { Insight, FeedItem, PlayerDetailsModalProps, AIAssistantPanelProps } from '../../types';

export type MessageType = 'text' | 'image' | 'file' | 'system';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'unread';

// DataFlow interface
export interface DataFlow {
  id: string;
  userId: string | boolean;
  type: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

// ValidationRule interface
export interface ValidationRule {
  id: string;
  name: string;
  condition: (flow: DataFlow) => boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
  createdAt: string;
  updatedAt: string;
}

// TownRecRequest interface
export interface TownRecRequest {
  id: string;
  type: "WAITLIST" | "AGE_OVERRIDE" | "SIBLING_PAIRING";
  childId: string;
  leagueId: string;
  timestamp: Date;
  parentName: string;
  childName: string;
  childAge: number;
  leagueName: string;
  status: "PENDING" | "APPROVED" | "DENIED" | string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}


// CoachLogDocument interface
export interface CoachLogDocument {
  id: string;
  coachId: string;
  playerId: string;
  sessionId: string;
  date: Date;
  notes: string;
  drills: string[];
  performance: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}
