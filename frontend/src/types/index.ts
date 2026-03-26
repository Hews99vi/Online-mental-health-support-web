// User and auth
export type UserRole = 'user' | 'listener' | 'therapist' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: string;
    status?: UserStatus;
    listenerOnline?: boolean;
    avatarUrl?: string;
    isAnonymous?: boolean;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken?: string;
}

export interface AuthState {
    user: User | null;
    tokens: AuthTokens | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

// Profile
export interface UserProfilePreferences {
    bio?: string;
    location?: string;
    timeZone?: string;
    emailUpdates?: boolean;
}

export interface UserProfile {
    id: string;
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    preferences: UserProfilePreferences;
    createdAt: string;
    updatedAt: string;
}

// Appointments and booking
export type AppointmentStatus = 'requested' | 'confirmed' | 'cancelled' | 'completed';

export interface AppointmentSummary {
    id: string;
    therapistId: string;
    therapistName: string;
    therapistInitials: string;
    therapistAvatarUrl?: string;
    userId: string;
    userName?: string;
    userEmail?: string | null;
    slotId: string;
    start: string;
    end: string;
    status: AppointmentStatus;
    sessionType: 'video' | 'audio' | 'chat';
    userNotes?: string;
    therapistNotes?: string;
    rateCharged?: number;
    currency?: string;
}

export interface JoinInfo {
    appointmentId: string;
    joinUrl: string | null;
    provider: 'daily' | 'whereby' | 'zoom' | 'custom' | 'jitsi';
    roomName: string | null;
    availableAt: string;
}

// Compatibility aliases for existing naming
export type BookingStatus = AppointmentStatus;
export type Booking = AppointmentSummary;

// Mood and journal
export type MoodScore = 1 | 2 | 3 | 4 | 5;

export interface MoodEntry {
    id: string;
    userId: string;
    moodScore: MoodScore;
    note?: string;
    tags: string[];
    createdAt: string;
}

export interface JournalEntry {
    id: string;
    userId: string;
    title?: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface WeeklyFeedback {
    summaryText: string;
    suggestions: string[];
    disclaimer: string;
}

// Library and content
export type ResourceType = 'article' | 'podcast' | 'video' | 'exercise' | 'guide';
export type ResourceStatus = 'draft' | 'published';

export interface LibraryItem {
    id: string;
    type: ResourceType;
    title: string;
    excerpt?: string;
    body?: string;
    author: string;
    authorInitials?: string;
    category: string;
    readTimeMin?: number;
    publishedAt: string;
    tags: string[];
    status: ResourceStatus;
}

export interface LibraryPage {
    items: LibraryItem[];
    total: number;
    nextCursor?: string;
}

// Compatibility aliases for existing naming
export type ContentType = ResourceType;
export type LibraryContent = LibraryItem;

// Chat and realtime
export type ChatSessionStatus = 'queued' | 'active' | 'closed';
export type ChatSenderRole = 'user' | 'listener';

export interface ChatSession {
    id: string;
    status: ChatSessionStatus;
    userId: string | null;
    listenerId: string | null;
    createdAt: string;
    closedAt: string | null;
}

export interface ChatSessionMessage {
    id: string;
    sessionId: string;
    senderRole: ChatSenderRole;
    text: string;
    createdAt: string;
}

// Compatibility aliases for existing naming
export type ChatRoom = ChatSession;
export type ChatMessage = ChatSessionMessage;

// API helpers
export interface ApiError {
    message: string;
    code?: string;
    status: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
    id: string;
    message: string;
    variant: ToastVariant;
    durationMs?: number;
}

// Consent
export interface ConsentItem {
    id: string;
    label: string;
    description: string;
    required: boolean;
    enabled: boolean;
    updatedAt: string;
}

export interface ConsentPreferences {
    termsAccepted: boolean;
    privacyAccepted: boolean;
    biometricConsent: boolean;
    aiConsent: boolean;
    analyticsConsent: boolean;
    updatedAt: string;
}

// Crisis resources
export interface Hotline {
    name: string;
    number: string;
    available: string;
    description: string;
    isSriLanka?: boolean;
    actionLabel?: string;
}

export interface CrisisResources {
    emergencyHotline: Hotline;
    supportText: string;
    localResources: Hotline[];
    quickActionLabels?: string[];
}
