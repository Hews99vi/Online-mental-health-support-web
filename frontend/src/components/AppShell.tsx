import { type ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    Brain,
    Menu,
    X,
    LogOut,
    LogIn,
    PhoneCall,
} from 'lucide-react';

import { RoleSidebar, type AppRole } from './RoleSidebar';
import styles from './AppShell.module.css';
import { useAuth } from '../app/AuthContext';
import { CrisisHelpModal } from '../features/crisis/CrisisHelpModal';

// ── Role derivation ───────────────────────────────────────────────────────────

function deriveRole(pathname: string): AppRole {
    if (pathname.startsWith('/admin')) return 'admin';
    if (pathname.startsWith('/dashboard/therapist') || pathname.startsWith('/therapist')) return 'therapist';
    if (pathname.startsWith('/dashboard/listener') || pathname.startsWith('/listener')) return 'listener';
    return 'user';
}


// ── TopNav ───────────────────────────────────────────────────────────────────

interface TopNavProps {
    onToggle: () => void;
    isOpen: boolean;
}

function TopNav({ onToggle, isOpen }: TopNavProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const initials = user?.name
        ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
        : '?';

    return (
        <header className={styles.topNav}>
            <button
                type="button"
                className={styles.iconBtn}
                onClick={onToggle}
                aria-label={isOpen ? 'Collapse navigation' : 'Expand navigation'}
                aria-expanded={isOpen}
                aria-controls="side-nav"
            >
                {isOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
            </button>

            <Link to="/dashboard" className={styles.logo} aria-label="MindBridge — go to dashboard">
                <Brain size={22} strokeWidth={1.75} aria-hidden="true" />
                <span>MindBridge</span>
            </Link>

            <div className={styles.topNavSpacer} />

            <nav className={styles.topNavActions} aria-label="User account actions">
                {user ? (
                    <>
                        <button
                            type="button"
                            className={styles.avatarBtn}
                            onClick={() => navigate('/profile')}
                            aria-label={`Profile for ${user.name}`}
                            title={user.name}
                        >
                            {initials}
                        </button>
                        <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={logout}
                            aria-label="Sign out"
                            title="Sign out"
                        >
                            <LogOut size={18} strokeWidth={2} />
                        </button>
                    </>
                ) : (
                    <Link to="/login" className={styles.signInLink}>
                        <LogIn size={16} strokeWidth={2} aria-hidden="true" />
                        Sign In
                    </Link>
                )}
            </nav>
        </header>
    );
}

// ── SideNav ──────────────────────────────────────────────────────────────────

interface SideNavProps {
    isCollapsed: boolean;
    isMobileOpen: boolean;
}

function SideNav({ isCollapsed, isMobileOpen }: SideNavProps) {
    const { user } = useAuth();
    const { pathname } = useLocation();
    // Prefer the authenticated user's actual role — shared routes like
    // /profile, /library, /bookings/therapist have no role prefix in their
    // URL so path-based derivation would always fall to 'user'.
    const role: AppRole = (user?.role as AppRole) ?? deriveRole(pathname);

    return (
        <div
            id="side-nav"
            className={[
                styles.sideNav,
                isMobileOpen ? styles.mobileOpen : '',
                isCollapsed ? styles.collapsed : '',
            ].filter(Boolean).join(' ')}
        >
            <RoleSidebar role={role} isCollapsed={isCollapsed} />
        </div>
    );
}

// ── GetHelpButton ─────────────────────────────────────────────────────────────

interface GetHelpButtonProps {
    onOpen: () => void;
}

function GetHelpButton({ onOpen }: GetHelpButtonProps) {
    return (
        <button
            type="button"
            className={styles.getHelpBtn}
            onClick={onOpen}
            aria-label="Get immediate mental health help — Hotline 1926"
        >
            <PhoneCall size={16} strokeWidth={2.5} aria-hidden="true" />
            Get Help · 1926
        </button>
    );
}

// ── AppShell ──────────────────────────────────────────────────────────────────

export function AppShell({ children }: { children: ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [crisisOpen, setCrisisOpen] = useState(false);

    const toggle = () => {
        if (window.innerWidth <= 768) {
            setMobileOpen((v) => !v);
        } else {
            setCollapsed((v) => !v);
        }
    };

    return (
        <div className={[styles.shell, collapsed ? styles.navCollapsed : ''].filter(Boolean).join(' ')}>
            <TopNav onToggle={toggle} isOpen={!collapsed} />
            <SideNav isCollapsed={collapsed} isMobileOpen={mobileOpen} />

            <main className={styles.main} id="main-content" tabIndex={-1}>
                {children}
            </main>

            <footer className={styles.footer}>
                <span>© {new Date().getFullYear()} MindBridge. All rights reserved.</span>
                <nav className={styles.footerLinks} aria-label="Footer links">
                    <Link to="/privacy" className={styles.footerLink}>Privacy Policy</Link>
                    <Link to="/terms" className={styles.footerLink}>Terms of Service</Link>
                    <Link to="/consent" className={styles.footerLink}>Consent Centre</Link>
                </nav>
            </footer>

            <GetHelpButton onOpen={() => setCrisisOpen(true)} />
            <CrisisHelpModal isOpen={crisisOpen} onClose={() => setCrisisOpen(false)} />
        </div>
    );
}
