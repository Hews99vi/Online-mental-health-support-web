/**
 * types.ts — shared types for the Appointments feature
 */

export type AppointmentStatus =
    | 'pending'
    | 'confirmed'
    | 'cancelled'
    | 'completed'
    | 'no_show';

export interface Appointment {
    id: string;
    therapistId: string;
    therapistName: string;
    therapistAvatarUrl?: string;
    therapistInitials: string;
    userId: string;
    slotId: string;
    start: string;          // ISO-8601
    end: string;            // ISO-8601
    status: AppointmentStatus;
    sessionType: 'video' | 'audio' | 'chat';
    userNotes?: string;
    therapistNotes?: string;
    rateCharged?: number;   // cents
    currency?: string;
}

export interface JoinInfo {
    appointmentId: string;
    joinUrl: string;
    provider: 'daily' | 'whereby' | 'zoom' | 'custom';
    availableAt: string;    // ISO-8601 — before this, joinUrl must NOT be rendered
}

export interface BookPayload {
    therapistId: string;
    slotId: string;
    userNotes?: string;
}
