// Comprehensive Player Types to replace TodoFixMe
export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: Date;
  age: number;
  gender: 'male' | 'female' | 'other';
  phoneNumber?: string;
  address?: Address;
  emergencyContact?: EmergencyContact;
  medicalInfo?: MedicalInfo;
  preferences?: PlayerPreferences;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
}

export interface MedicalInfo {
  allergies: string[];
  medications: string[];
  conditions: string[];
  notes?: string;
}

export interface PlayerPreferences {
  preferredPosition?: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  availability: AvailabilitySchedule;
  communicationPreferences: CommunicationPreferences;
}

export interface AvailabilitySchedule {
  weekdays: boolean[];
  weekendDays: boolean[];
  timeSlots: TimeSlot[];
}

export interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

export interface CommunicationPreferences {
  email: boolean;
  sms: boolean;
  pushNotifications: boolean;
  phone: boolean;
}

export interface PlayerStats {
  playerId: string;
  gamesPlayed: number;
  goalsScored: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  minutesPlayed: number;
  season: string;
  teamId?: string;
}

export interface PlayerPerformance {
  playerId: string;
  sessionId: string;
  metrics: PerformanceMetrics;
  timestamp: Date;
  coachNotes?: string;
}

export interface PerformanceMetrics {
  fitness: number;
  technique: number;
  teamwork: number;
  leadership: number;
  overall: number;
}

export interface PlayerRegistration {
  id: string;
  playerId: string;
  leagueId: string;
  season: string;
  status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  registrationDate: Date;
  approvedDate?: Date;
  rejectedDate?: Date;
  rejectionReason?: string;
  fees: RegistrationFees;
  documents: RegistrationDocument[];
}

export interface RegistrationFees {
  amount: number;
  currency: string;
  paid: boolean;
  paymentDate?: Date;
  paymentMethod?: string;
}

export interface RegistrationDocument {
  id: string;
  type: 'birth_certificate' | 'medical_form' | 'waiver' | 'photo' | 'other';
  filename: string;
  url: string;
  uploadedAt: Date;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
}

// API Request/Response Types
export interface CreatePlayerRequest {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  phoneNumber?: string;
  address?: Address;
  emergencyContact?: EmergencyContact;
  medicalInfo?: MedicalInfo;
  preferences?: PlayerPreferences;
}

export interface UpdatePlayerRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  address?: Address;
  emergencyContact?: EmergencyContact;
  medicalInfo?: MedicalInfo;
  preferences?: PlayerPreferences;
  isActive?: boolean;
}

export interface PlayerSearchFilters {
  name?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  teamId?: string;
  leagueId?: string;
  isActive?: boolean;
}

export interface PlayerListResponse {
  players: Player[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Validation Functions
export const validatePlayer = (player: unknown): player is Player => {
  if (!player || typeof player !== 'object') return false;
  const p = player as any;
  
  return (
    typeof p.id === 'string' &&
    typeof p.firstName === 'string' &&
    typeof p.lastName === 'string' &&
    typeof p.email === 'string' &&
    p.dateOfBirth instanceof Date &&
    typeof p.age === 'number' &&
    ['male', 'female', 'other'].includes(p.gender) &&
    p.createdAt instanceof Date &&
    p.updatedAt instanceof Date &&
    typeof p.isActive === 'boolean'
  );
};

export const validateCreatePlayerRequest = (data: unknown): data is CreatePlayerRequest => {
  if (!data || typeof data !== 'object') return false;
  const d = data as any;
  
  return (
    typeof d.firstName === 'string' &&
    typeof d.lastName === 'string' &&
    typeof d.email === 'string' &&
    typeof d.dateOfBirth === 'string' &&
    ['male', 'female', 'other'].includes(d.gender)
  );
};

export const validateUpdatePlayerRequest = (data: unknown): data is UpdatePlayerRequest => {
  if (!data || typeof data !== 'object') return false;
  const d = data as any;
  
  // At least one field should be present
  const hasValidField = Object.keys(d).some(key => 
    ['firstName', 'lastName', 'email', 'phoneNumber', 'address', 'emergencyContact', 'medicalInfo', 'preferences', 'isActive'].includes(key)
  );
  
  if (!hasValidField) return false;
  
  // Validate individual fields if present
  if (d.firstName !== undefined && typeof d.firstName !== 'string') return false;
  if (d.lastName !== undefined && typeof d.lastName !== 'string') return false;
  if (d.email !== undefined && typeof d.email !== 'string') return false;
  if (d.phoneNumber !== undefined && typeof d.phoneNumber !== 'string') return false;
  if (d.isActive !== undefined && typeof d.isActive !== 'boolean') return false;
  
  return true;
}; 