import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Brain, Mail, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import styles from './Auth.module.css';

export function LoginPage() {
    const { login, isLoading } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const returnUrl = searchParams.get('returnUrl') ?? '/dashboard';

    const validate = () => {
        const next: typeof errors = {};
        if (!email) next.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) next.email = 'Enter a valid email';
        if (!password) next.password = 'Password is required';
        setErrors(next);
        return Object.keys(next).length === 0;
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

    return (
        <div className={styles.authPage}>
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <div className={styles.brandMark} aria-hidden="true">
                        <Brain size={26} strokeWidth={1.75} />
                    </div>
                    <h1 className={styles.cardTitle}>Welcome back</h1>
                    <p className={styles.cardSubtitle}>Sign in to your MindBridge account</p>
                </div>

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

            <div className={styles.crisisNote} role="note">
                <AlertTriangle size={15} aria-hidden="true" style={{ flexShrink: 0, color: '#b91c1c' }} />
                In crisis?{' '}
                <Link to="/crisis" className={styles.crisisLink}>
                    Get immediate help - call 1926
                </Link>
            </div>
        </div>
    );
}
