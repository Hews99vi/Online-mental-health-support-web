/**
 * src/components/RoleSidebar.tsx
 *
 * Role-based sidebar navigation.
 * AppShell owns the outer container - this component renders only nav content.
 * Accepts isCollapsed to show icon-only strip when sidebar is narrow.
 */

import { NavLink } from 'react-router-dom';

// ── Types ──────────────────────────────────────────────────────────────────────

export type AppRole = 'user' | 'listener' | 'therapist' | 'admin';

interface NavItem {
    label: string;
    path: string;
    icon: string;
}

// ── Role configs ───────────────────────────────────────────────────────────────

const NAV_CONFIG: Record<AppRole, NavItem[]> = {
    user: [
        { label: 'Dashboard', path: '/dashboard/home', icon: '⊞' },
        { label: 'Anonymous Chat', path: '/chat', icon: '💬' },
        { label: 'Find a Therapist', path: '/therapists', icon: '🔍' },
        { label: 'My Bookings', path: '/bookings', icon: '📅' },
        { label: 'Mood Tracker', path: '/mood', icon: '📊' },
        { label: 'Journal', path: '/journal', icon: '📝' },
        { label: 'Self-Help Library', path: '/library', icon: '📚' },
        { label: 'Privacy & Consent', path: '/consent', icon: '🔒' },
    ],
    listener: [
        { label: 'Dashboard', path: '/dashboard/listener', icon: '⊞' },
        { label: 'Go Online', path: '/listener/online', icon: '●' },
        { label: 'Active Chats', path: '/listener/chats', icon: '💬' },
        { label: 'Chat History', path: '/listener/history', icon: '🕑' },
        { label: 'Safety Guidelines', path: '/listener/safety', icon: '⚠' },
        { label: 'Self-Help Library', path: '/library', icon: '📚' },
    ],
    therapist: [
        { label: 'Dashboard', path: '/dashboard/therapist', icon: '⊞' },
        { label: 'My Schedule', path: '/therapist/schedule', icon: '🗓' },
        { label: 'Appointments', path: '/bookings/therapist', icon: '📅' },
        { label: 'Clients', path: '/therapist/clients', icon: '👥' },
        { label: 'Session Notes', path: '/therapist/notes', icon: '📝' },
        { label: 'Profile', path: '/profile', icon: '👤' },
    ],
    admin: [
        { label: 'Dashboard', path: '/admin', icon: '⊞' },
        { label: 'Therapist Approvals', path: '/admin/therapists', icon: '✅' },
        { label: 'Users', path: '/admin/users', icon: '👥' },
        { label: 'Content Manager', path: '/admin/content', icon: '📄' },
        { label: 'Reports', path: '/admin/reports', icon: '📋' },
        { label: 'Analytics', path: '/admin/analytics', icon: '📊' },
    ],
};

// ── Role label & accent colour ─────────────────────────────────────────────────

// Single brand system for all roles — no per-role colour noise
const BRAND_ACCENT = '#4caf82';       // lighter green visible on dark sidebar
const BRAND_ACCENT_DIM = 'rgba(76,175,130,0.14)';

const ROLE_META: Record<AppRole, { label: string; accent: string; accentDim: string }> = {
    user: { label: 'My Space', accent: BRAND_ACCENT, accentDim: BRAND_ACCENT_DIM },
    listener: { label: 'Listener', accent: BRAND_ACCENT, accentDim: BRAND_ACCENT_DIM },
    therapist: { label: 'Therapist', accent: BRAND_ACCENT, accentDim: BRAND_ACCENT_DIM },
    admin: { label: 'Admin', accent: BRAND_ACCENT, accentDim: BRAND_ACCENT_DIM },
};

// ── Component ──────────────────────────────────────────────────────────────────

interface RoleSidebarProps {
    role: AppRole;
    isCollapsed?: boolean;
}

export function RoleSidebar({ role, isCollapsed = false }: RoleSidebarProps) {
    const items = NAV_CONFIG[role];
    const meta = ROLE_META[role];

    return (
        <nav
            aria-label={`${meta.label} navigation`}
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                padding: isCollapsed ? '1rem 0' : '1.25rem 0',
            }}
        >
            {/* ── Role badge ── */}
            {!isCollapsed && (
                <div style={{ padding: '0 1rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '0.5rem' }}>
                    <span style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.65rem',
                        borderRadius: '999px',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase',
                        background: meta.accentDim,
                        color: meta.accent,
                        border: `1px solid ${meta.accent}40`,
                    }}>
                        {meta.label}
                    </span>
                </div>
            )}

            {/* ── Nav items ── */}
            <ul
                role="list"
                style={{
                    listStyle: 'none',
                    margin: 0,
                    padding: isCollapsed ? '0 0.5rem' : '0 0.75rem',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.125rem',
                }}
            >
                {items.map(({ label, path, icon }) => (
                    <li key={path}>
                        <NavLink
                            to={path}
                            end={path.split('/').length <= 2}
                            title={isCollapsed ? label : undefined}
                            aria-label={isCollapsed ? label : undefined}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: isCollapsed ? 'center' : 'flex-start',
                                gap: '0.625rem',
                                padding: isCollapsed ? '0.625rem' : '0.575rem 0.75rem',
                                borderRadius: '0.5rem',
                                textDecoration: 'none',
                                fontSize: '0.875rem',
                                fontWeight: isActive ? 600 : 400,
                                color: isActive ? '#fff' : '#94a3b8',
                                background: isActive ? meta.accentDim : 'transparent',
                                borderLeft: !isCollapsed ? (isActive ? `3px solid ${meta.accent}` : '3px solid transparent') : 'none',
                                transition: 'all 0.15s ease',
                            })}
                        >
                            <span
                                aria-hidden="true"
                                style={{ fontSize: isCollapsed ? '1.125rem' : '1rem', lineHeight: 1, flexShrink: 0 }}
                            >
                                {icon}
                            </span>
                            {!isCollapsed && (
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {label}
                                </span>
                            )}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
