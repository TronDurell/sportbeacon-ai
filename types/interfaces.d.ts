export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    updatedBy?: string;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    statusCode?: number;
    timestamp: Date;
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface User extends BaseEntity {
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
    lastLogin?: Date;
    profileImage?: string;
    phoneNumber?: string;
    preferences?: UserPreferences;
}
export type UserRole = 'admin' | 'director' | 'coach' | 'parent' | 'player' | 'referee' | 'scout';
export interface UserPreferences {
    notifications: {
        email: boolean;
        push: boolean;
        sms: boolean;
    };
    privacy: {
        profileVisibility: 'public' | 'private' | 'friends';
        showContactInfo: boolean;
    };
    language: string;
    timezone: string;
}
export interface AuthContext {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
}
export interface Player extends BaseEntity {
    userId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: 'male' | 'female' | 'other';
    position: PlayerPosition[];
    skillLevel: SkillLevel;
    experience: number;
    height?: number;
    weight?: number;
    dominantFoot?: 'left' | 'right' | 'both';
    jerseyNumber?: number;
    teamId?: string;
    leagueId?: string;
    stats?: PlayerStats;
    medicalInfo?: MedicalInfo;
    emergencyContact?: EmergencyContact;
}
export type PlayerPosition = 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'utility';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite';
export interface PlayerStats {
    gamesPlayed: number;
    goals: number;
    assists: number;
    cleanSheets: number;
    yellowCards: number;
    redCards: number;
    minutesPlayed: number;
    rating: number;
}
export interface MedicalInfo {
    allergies: string[];
    medications: string[];
    conditions: string[];
    emergencyContact: EmergencyContact;
}
export interface EmergencyContact {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
}
export interface Team extends BaseEntity {
    name: string;
    leagueId: string;
    coachId: string;
    players: Player[];
    maxPlayers: number;
    minPlayers: number;
    logo?: string;
    colors: TeamColors;
    stats?: TeamStats;
}
export interface TeamColors {
    primary: string;
    secondary: string;
    accent: string;
}
export interface TeamStats {
    wins: number;
    losses: number;
    draws: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
}
export interface League extends BaseEntity {
    name: string;
    description: string;
    directorId: string;
    season: string;
    startDate: Date;
    endDate: Date;
    registrationDeadline: Date;
    maxTeams: number;
    minTeams: number;
    ageGroups: AgeGroup[];
    divisions: Division[];
    rules: LeagueRules;
    status: LeagueStatus;
    teams: Team[];
}
export interface AgeGroup {
    id: string;
    name: string;
    minAge: number;
    maxAge: number;
    divisions: Division[];
}
export interface Division {
    id: string;
    name: string;
    skillLevel: SkillLevel;
    teams: Team[];
    schedule: Game[];
}
export interface LeagueRules {
    maxPlayersPerTeam: number;
    minPlayersPerTeam: number;
    gameDuration: number;
    substitutionRules: string;
    tiebreakerRules: string;
    playoffFormat: string;
}
export type LeagueStatus = 'draft' | 'registration' | 'active' | 'completed' | 'cancelled';
export interface Game extends BaseEntity {
    homeTeamId: string;
    awayTeamId: string;
    divisionId: string;
    leagueId: string;
    scheduledDate: Date;
    actualDate?: Date;
    venueId: string;
    refereeId?: string;
    status: GameStatus;
    score?: GameScore;
    events: GameEvent[];
    notes?: string;
}
export type GameStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
export interface GameScore {
    homeScore: number;
    awayScore: number;
    homeHalfScore?: number;
    awayHalfScore?: number;
    isFinal: boolean;
}
export interface GameEvent {
    id: string;
    type: GameEventType;
    playerId: string;
    teamId: string;
    minute: number;
    description: string;
    timestamp: Date;
}
export type GameEventType = 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'substitution' | 'injury' | 'other';
export interface Venue extends BaseEntity {
    name: string;
    address: Address;
    contact: ContactInfo;
    facilities: Facility[];
    capacity: number;
    surfaceType: SurfaceType;
    amenities: string[];
    availability: VenueAvailability[];
    pricing: VenuePricing;
}
export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
}
export interface ContactInfo {
    phone: string;
    email: string;
    website?: string;
    contactPerson?: string;
}
export interface Facility {
    id: string;
    name: string;
    type: FacilityType;
    capacity: number;
    surfaceType: SurfaceType;
    amenities: string[];
}
export type FacilityType = 'field' | 'court' | 'gym' | 'track' | 'pool' | 'other';
export type SurfaceType = 'grass' | 'turf' | 'concrete' | 'wood' | 'clay' | 'other';
export interface VenueAvailability {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
}
export interface VenuePricing {
    hourlyRate: number;
    dailyRate: number;
    seasonalRate?: number;
    currency: string;
}
export interface SiblingRequest extends BaseEntity {
    familyId: string;
    parentId: string;
    children: ChildInfo[];
    requestedTeams: string[];
    priority: 'high' | 'medium' | 'low';
    status: RequestStatus;
    notes?: string;
    approvedBy?: string;
    approvedAt?: Date;
    deniedBy?: string;
    deniedAt?: Date;
    denialReason?: string;
}
export interface ChildInfo {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: 'male' | 'female' | 'other';
    skillLevel: SkillLevel;
    previousTeam?: string;
    specialNeeds?: string[];
}
export interface AgeOverrideRequest extends BaseEntity {
    playerId: string;
    parentId: string;
    requestedAgeGroup: string;
    currentAgeGroup: string;
    reason: string;
    supportingDocuments?: string[];
    status: RequestStatus;
    approvedBy?: string;
    approvedAt?: Date;
    deniedBy?: string;
    deniedAt?: Date;
    denialReason?: string;
}
export interface WaitlistEntry extends BaseEntity {
    playerId: string;
    parentId: string;
    leagueId: string;
    ageGroup: string;
    skillLevel: SkillLevel;
    priority: number;
    status: WaitlistStatus;
    notes?: string;
    contactedAt?: Date;
    contactedBy?: string;
}
export type RequestStatus = 'pending' | 'approved' | 'denied' | 'cancelled';
export type WaitlistStatus = 'waiting' | 'contacted' | 'placed' | 'removed';
export interface Payment extends BaseEntity {
    userId: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    type: PaymentType;
    method: PaymentMethod;
    description: string;
    referenceId?: string;
    stripePaymentId?: string;
    refundedAmount?: number;
    refundedAt?: Date;
    refundedBy?: string;
}
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type PaymentType = 'registration' | 'league_fee' | 'equipment' | 'refund' | 'other';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash' | 'check';
export interface Refund extends BaseEntity {
    paymentId: string;
    amount: number;
    reason: string;
    status: RefundStatus;
    processedBy: string;
    processedAt: Date;
    notes?: string;
}
export type RefundStatus = 'pending' | 'processed' | 'failed' | 'cancelled';
export interface Notification extends BaseEntity {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    isRead: boolean;
    readAt?: Date;
    priority: NotificationPriority;
    expiresAt?: Date;
}
export type NotificationType = 'game_reminder' | 'registration_deadline' | 'team_update' | 'payment_reminder' | 'system_alert';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    variables: string[];
    isActive: boolean;
}
export interface AuditLog extends BaseEntity {
    userId: string;
    action: string;
    resource: string;
    resourceId: string;
    changes: Record<string, {
        old: unknown;
        new: unknown;
    }>;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
}
export interface SystemLog extends BaseEntity {
    level: LogLevel;
    message: string;
    context: string;
    error?: Error;
    metadata?: Record<string, unknown>;
    stackTrace?: string;
}
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export interface PlayerAnalysis extends BaseEntity {
    playerId: string;
    analysisType: AnalysisType;
    data: AnalysisData;
    confidence: number;
    recommendations: string[];
    generatedBy: string;
}
export type AnalysisType = 'performance' | 'skill_assessment' | 'team_fit' | 'development_plan';
export type AnalysisData = Record<string, unknown>;
export interface DrillRecommendation extends BaseEntity {
    playerId: string;
    drillType: DrillType;
    difficulty: SkillLevel;
    duration: number;
    description: string;
    instructions: string[];
    equipment: string[];
    benefits: string[];
    videoUrl?: string;
}
export type DrillType = 'technical' | 'tactical' | 'physical' | 'mental' | 'team';
export interface ApiRequest<T = unknown> {
    body: T;
    params: Record<string, string>;
    query: Record<string, string>;
    headers: Record<string, string>;
    user?: User;
    timestamp: Date;
}
export interface ApiContext {
    auth: AuthContext;
    user: User;
    request: ApiRequest;
    response: ApiResponse;
}
export interface ValidationRule {
    type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
    value?: unknown;
    message: string;
    custom?: (value: unknown) => boolean;
    sanitize?: (value: unknown) => unknown;
}
export interface ValidationSchema {
    [fieldName: string]: ValidationRule[];
}
export interface AppConfig {
    environment: 'development' | 'staging' | 'production';
    version: string;
    features: FeatureFlags;
    services: ServiceConfig;
    security: SecurityConfig;
}
export interface FeatureFlags {
    enableAI: boolean;
    enablePayments: boolean;
    enableNotifications: boolean;
    enableAnalytics: boolean;
    enableMultiLanguage: boolean;
}
export interface ServiceConfig {
    firebase: FirebaseConfig;
    stripe: StripeConfig;
    email: EmailConfig;
    ai: AIConfig;
}
export interface FirebaseConfig {
    apiKey: string;
    projectId: string;
    authDomain: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
}
export interface StripeConfig {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
}
export interface EmailConfig {
    provider: 'sendgrid' | 'mailgun' | 'smtp';
    apiKey: string;
    fromEmail: string;
    fromName: string;
}
export interface AIConfig {
    openaiApiKey: string;
    anthropicApiKey: string;
    modelVersion: string;
    maxTokens: number;
}
export interface SecurityConfig {
    jwtSecret: string;
    jwtExpiration: number;
    bcryptRounds: number;
    rateLimitWindow: number;
    rateLimitMax: number;
}
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type NonNullableFields<T, K extends keyof T> = T & {
    [P in K]: NonNullable<T[P]>;
};
export type TodoFixMe = Record<string, unknown>;
export type TodoFixMeRequest = ApiRequest;
export type TodoFixMeResponse = ApiResponse;
export type TodoFixMeContext = ApiContext;
export type TodoFixMeConfig = AppConfig;
export type TodoFixMeData = Record<string, unknown>;
//# sourceMappingURL=interfaces.d.ts.map