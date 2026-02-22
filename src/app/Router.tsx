import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { AppShell } from '../components/AppShell';
import { PublicShell } from '../components/PublicShell';

// ── Public pages
import { LandingPage } from '../features/public/LandingPage';

import { AboutPage } from '../features/public/AboutPage';
import { PrivacyPolicyPage } from '../features/public/PrivacyPolicyPage';
import { TermsPage } from '../features/public/TermsPage';

// ── Auth pages
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage';

// ── Role dashboards
import { RoleBasedHome } from '../features/dashboard/RoleBasedHome';
import { UserDashboardPage } from '../features/dashboard/UserDashboardPage';
import { ListenerDashboardPage } from '../features/dashboard/ListenerDashboardPage';
import { TherapistDashboardPage } from '../features/dashboard/TherapistDashboardPage';

// ── Authenticated feature pages
import { ChatPage, ChatRoom } from '../features/chat/ChatPage';
import { TherapistDirectoryPage, TherapistProfilePage, TherapistOnboardingPage } from '../features/therapists/TherapistPages';
import { AppointmentsPage, TherapistAppointmentsPage, JoinSessionPage } from '../features/bookings/BookingsPage';
import { MoodTrackerPage, MoodCheckInForm, MoodHistoryPage, JournalPage, EmotionPage } from '../features/mood/MoodPages';
import { LibraryPage, LibraryContentPage } from '../features/library/LibraryPages';
import { CrisisPage } from '../features/crisis/CrisisPage';
import { ConsentCenterPage } from '../features/consent/ConsentCenterPage';
import { ProfilePage, NotFoundPage } from '../features/profile/ProfilePage';

// ── Admin pages
import {
    AdminDashboardPage,
    AdminTherapistsPage,
    AdminContentPage,
    AdminAnalyticsPage,
} from '../features/admin/AdminPages';

// ── Listener pages
import { ListenerOnlinePage } from '../pages/listener/ListenerOnlinePage';
import { ListenerChatsPage } from '../pages/listener/ListenerChatsPage';
import { ListenerHistoryPage } from '../pages/listener/ListenerHistoryPage';
import { ListenerSafetyPage } from '../pages/listener/ListenerSafetyPage';

// ── Therapist pages
import { TherapistSchedulePage } from '../pages/therapist/TherapistSchedulePage';
import { TherapistClientsPage } from '../pages/therapist/TherapistClientsPage';
import { TherapistNotesPage } from '../pages/therapist/TherapistNotesPage';

// ── New admin pages
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminReportsPage } from '../pages/admin/AdminReportsPage';

// ── Guards ────────────────────────────────────────────────────────────────────

/** Redirects authenticated users away from auth pages */
function RequireGuest() {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return null;
    return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

// ── Shell wrappers ────────────────────────────────────────────────────────────

function ShellLayout() {
    return (
        <AppShell>
            <Outlet />
        </AppShell>
    );
}

function PublicLayout() {
    return <PublicShell />;
}

// ── Router ────────────────────────────────────────────────────────────────────

export function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* ── Landing / marketing pages ─────────────────────────── */}
                <Route index element={<LandingPage />} />
                <Route element={<PublicLayout />}>
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/privacy" element={<PrivacyPolicyPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                </Route>

                {/* ── Crisis page — always accessible ────────────────────── */}
                <Route path="/crisis" element={<ShellLayout />}>
                    <Route index element={<CrisisPage />} />
                </Route>

                {/* ── Guest-only auth pages ───────────────────────────────── */}
                <Route element={<RequireGuest />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                </Route>

                {/* ── Authenticated routes (wrapped in AppShell) ─────────── */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<ShellLayout />}>

                        {/* /dashboard → role redirect → sub-dashboard */}
                        <Route path="/dashboard" element={<RoleBasedHome />} />
                        <Route path="/dashboard/home" element={<UserDashboardPage />} />
                        <Route path="/dashboard/listener" element={<ListenerDashboardPage />} />
                        <Route path="/dashboard/therapist" element={<TherapistDashboardPage />} />

                        <Route path="/chat" element={<ChatPage />} />
                        <Route path="/chat/:roomId" element={<ChatRoom />} />
                        <Route path="/therapists" element={<TherapistDirectoryPage />} />
                        <Route path="/therapists/apply" element={<TherapistOnboardingPage />} />
                        <Route path="/therapists/:id" element={<TherapistProfilePage />} />
                        <Route path="/bookings" element={<AppointmentsPage />} />
                        <Route path="/bookings/therapist" element={<TherapistAppointmentsPage />} />
                        <Route path="/appointments/:id/join" element={<JoinSessionPage />} />
                        <Route path="/mood" element={<MoodTrackerPage />} />
                        <Route path="/mood/checkin" element={<MoodCheckInForm />} />
                        <Route path="/mood/history" element={<MoodHistoryPage />} />
                        <Route path="/mood/emotion" element={<EmotionPage />} />
                        <Route path="/journal" element={<JournalPage />} />
                        <Route path="/library" element={<LibraryPage />} />
                        <Route path="/library/:id" element={<LibraryContentPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/consent" element={<ConsentCenterPage />} />

                        {/* ── Listener routes ── */}
                        <Route path="/listener/online" element={<ListenerOnlinePage />} />
                        <Route path="/listener/chats" element={<ListenerChatsPage />} />
                        <Route path="/listener/history" element={<ListenerHistoryPage />} />
                        <Route path="/listener/safety" element={<ListenerSafetyPage />} />

                        {/* ── Therapist routes ── */}
                        <Route path="/therapist/schedule" element={<TherapistSchedulePage />} />
                        <Route path="/therapist/clients" element={<TherapistClientsPage />} />
                        <Route path="/therapist/notes" element={<TherapistNotesPage />} />

                        {/* ── Admin-only routes ── */}
                        <Route element={<RoleRoute allowedRoles={['admin']} />}>
                            <Route path="/admin" element={<AdminDashboardPage />} />
                            <Route path="/admin/therapists" element={<AdminTherapistsPage />} />
                            <Route path="/admin/content" element={<AdminContentPage />} />
                            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
                            <Route path="/admin/users" element={<AdminUsersPage />} />
                            <Route path="/admin/reports" element={<AdminReportsPage />} />
                        </Route>
                    </Route>
                </Route>

                {/* ── 404 ── */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}
