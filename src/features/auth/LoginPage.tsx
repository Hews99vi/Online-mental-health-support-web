import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Brain,
    Mail,
    Lock,
    User,
    Stethoscope,
    Shield,
    Zap,
    AlertTriangle,
    Loader2,
    Headphones,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import styles from './Auth.module.css';

type DemoRole = 'user' | 'listener' | 'therapist' | 'admin';

const DEMO_ROLES: { role: DemoRole; label: string; Icon: LucideIcon; cls: string }[] = [
    { role: 'user', label: 'User', Icon: User, cls: styles.demoBtnUser },
    { role: 'listener', label: 'Listener', Icon: Headphones, cls: styles.demoBtnListener },
    { role: 'therapist', label: 'Therapist', Icon: Stethoscope, cls: styles.demoBtnTherapist },
    { role: 'admin', label: 'Admin', Icon: Shield, cls: styles.demoBtnAdmin },
];

export function LoginPage() {
    const { login, loginDemo, isLoading } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [demoLoading, setDemoLoading] = useState<DemoRole | null>(null);

    const returnUrl = searchParams.get('returnUrl') ?? '/dashboard';

    const validate = () => {
        const e: typeof errors = {};
        if (!email) e.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
        if (!password) e.password = 'Password is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            await login({ email, password });
            navigate(returnUrl);
        } catch (err: unknown) {
            const msg = (err as { message?: string }).message ?? 'Login failed. Please try again.';
            addToast(msg, 'error');
        }
    };

    const handleDemo = (role: DemoRole) => {
        setDemoLoading(role);
        setTimeout(() => {
            loginDemo(role);
            navigate('/dashboard');
        }, 300);
    };

    return (
        <div className={styles.authPage}>
            <div className={styles.card}>
                {/* ── Brand header ── */}
                <div className={styles.cardHeader}>
                    <div className={styles.brandMark} aria-hidden="true">
                        <Brain size={26} strokeWidth={1.75} />
                    </div>
                    <h1 className={styles.cardTitle}>Welcome back</h1>
                    <p className={styles.cardSubtitle}>Sign in to your MindBridge account</p>
                </div>

                {/* ── Demo access ── */}
                <div className={styles.demoSection} role="group" aria-labelledby="demo-label">
                    <p id="demo-label" className={styles.demoLabel}>
                        <Zap size={13} strokeWidth={2.5} aria-hidden="true" />
                        Quick demo access
                    </p>
                    <div className={styles.demoButtons}>
                        {DEMO_ROLES.map(({ role, label, Icon, cls }) => (
                            <button
                                key={role}
                                type="button"
                                className={`${styles.demoBtn} ${cls}`}
                                onClick={() => handleDemo(role)}
                                disabled={demoLoading !== null}
                                aria-label={`Sign in as demo ${label.toLowerCase()}`}
                            >
                                {demoLoading === role ? (
                                    <Loader2 size={18} className="spin" aria-hidden="true" />
                                ) : (
                                    <Icon size={18} aria-hidden="true" />
                                )}
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.divider}>
                    <span>or sign in with email</span>
                </div>

                {/* ── Credentials form ── */}
                <form onSubmit={handleSubmit} noValidate className={styles.form}>
                    <TextField
                        label="Email address"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        errorMessage={errors.email}
                        required
                        id="login-email"
                        startIcon={<Mail size={16} aria-hidden="true" />}
                    />
                    <TextField
                        label="Password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        errorMessage={errors.password}
                        required
                        id="login-password"
                        startIcon={<Lock size={16} aria-hidden="true" />}
                    />
                    <div className={styles.forgotRow}>
                        <Link to="/forgot-password" className={styles.link}>
                            Forgot password?
                        </Link>
                    </div>
                    <Button type="submit" fullWidth isLoading={isLoading}>
                        Sign In
                    </Button>
                </form>

                <p className={styles.switchText}>
                    Don&apos;t have an account?{' '}
                    <Link to="/register" className={styles.link}>Create one</Link>
                </p>
            </div>

            {/* ── Crisis note ── */}
            <div className={styles.crisisNote} role="note">
                <AlertTriangle size={15} aria-hidden="true" style={{ flexShrink: 0, color: '#b91c1c' }} />
                In crisis?{' '}
                <Link to="/crisis" className={styles.crisisLink}>
                    Get immediate help — call 1926
                </Link>
            </div>
        </div>
    );
}
