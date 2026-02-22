// ─── User & Auth ────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'listener' | 'therapist' | 'admin';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatarUrl?: string;
    isAnonymous?: boolean;
    createdAt: string;
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

// ─── Therapist & Booking ─────────────────────────────────────────────────────

export type TherapistStatus = 'pending' | 'approved' | 'rejected';

export interface Therapist {
    id: string;
    userId: string;
    name: string;
    avatarUrl?: string;
    specializations: string[];
    bio: string;
    licenseNumber: string;
    yearsOfExperience: number;
    status: TherapistStatus;
    rating?: number;
    languages: string[];
    sessionTypes: ('online' | 'phone')[];
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
    id: string;
    therapistId: string;
    userId: string;
    scheduledAt: string;
    durationMinutes: number;
    status: BookingStatus;
    notes?: string;
    sessionType: 'online' | 'phone';
}

// ─── Mood & Journal ──────────────────────────────────────────────────────────

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface MoodEntry {
    id: string;
    userId: string;
    mood: MoodLevel;
    note?: string;
    tags: string[];
    recordedAt: string;
}

export interface JournalEntry {
    id: string;
    userId: string;
    title: string;
    content: string;
    isPrivate: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface WeeklyFeedback {
    id: string;
    userId: string;
    weekStartDate: string;
    summary: string;
    suggestions: string[];
    averageMood: number;
    generatedAt: string;
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export interface ChatRoom {
    id: string;
    name: string;
    description?: string;
    isAnonymous: boolean;
    participantCount: number;
    createdAt: string;
}

export interface ChatMessage {
    id: string;
    roomId: string;
    senderId: string;
    senderAlias: string;
    content: string;
    sentAt: string;
    isSystem?: boolean;
}

// ─── Self-Help Library ───────────────────────────────────────────────────────

export type ContentType = 'article' | 'video' | 'exercise' | 'guide';
export type ContentCategory =
    | 'anxiety'
    | 'depression'
    | 'stress'
    | 'sleep'
    | 'relationships'
    | 'grief'
    | 'self-care'
    | 'mindfulness';

export interface LibraryContent {
    id: string;
    title: string;
    description: string;
    type: ContentType;
    category: ContentCategory;
    thumbnailUrl?: string;
    url?: string;
    readTimeMinutes?: number;
    tags: string[];
    publishedAt: string;
    isPublished: boolean;
}

// ─── Admin / Analytics ───────────────────────────────────────────────────────

export interface AnalyticsSummary {
    totalUsers: number;
    activeUsers: number;
    totalTherapists: number;
    pendingApprovals: number;
    totalBookings: number;
    totalMessages: number;
    moodAverageThisWeek: number;
}

// ─── API Helpers ─────────────────────────────────────────────────────────────

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

// ─── Consent ─────────────────────────────────────────────────────────────────

export interface ConsentItem {
    id: string;
    label: string;
    description: string;
    /** Required consents cannot be revoked without account deletion */
    required: boolean;
    enabled: boolean;
    updatedAt: string;
}

// ─── Crisis Resources ─────────────────────────────────────────────────────────

export interface Hotline {
    name: string;
    number: string;
    available: string; // e.g. "24/7"
    description: string;
    isSriLanka?: boolean;
}

export interface CrisisResources {
    hotlines: Hotline[];
    guidanceText: string;
}
