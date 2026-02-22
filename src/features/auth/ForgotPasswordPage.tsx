import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Mail, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '../../app/ToastContext';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import styles from './Auth.module.css';

export function ForgotPasswordPage() {
    const { addToast } = useToast();
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const successHeadingRef = useRef<HTMLHeadingElement>(null);

    const validate = (): boolean => {
        if (!email) {
            setEmailError('Email is required');
            return false;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setEmailError('Enter a valid email address');
            return false;
        }
        setEmailError('');
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            /* TODO: replace with real API call —
               await http.post('/auth/forgot-password', { email }) */
            await new Promise((r) => setTimeout(r, 800)); // simulated delay
            setSent(true);
            // Focus the success heading so screen-readers announce it
            setTimeout(() => successHeadingRef.current?.focus(), 50);
        } catch {
            addToast('Could not send reset email. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className={styles.authPage}>
                <div className={styles.successCard} role="main" aria-labelledby="reset-success">
                    <div className={styles.successIcon} aria-hidden="true">
                        <CheckCircle size={32} strokeWidth={1.75} />
                    </div>
                    <h1
                        id="reset-success"
                        ref={successHeadingRef}
                        className={styles.successTitle}
                        tabIndex={-1}
                    >
                        Check your inbox
                    </h1>
                    <p className={styles.successText}>
                        We&apos;ve sent a password reset link to{' '}
                        <strong>{email}</strong>. The link expires in 30 minutes.
                        If you don&apos;t see it, check your spam folder.
                    </p>
                    <Link to="/login" className={styles.link}>
                        ← Back to sign in
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.authPage}>
            <div className={styles.card}>
                {/* ── Brand header ── */}
                <div className={styles.cardHeader}>
                    <div className={styles.brandMark} aria-hidden="true">
                        <Brain size={26} strokeWidth={1.75} />
                    </div>
                    <h1 className={styles.cardTitle}>Reset password</h1>
                    <p className={styles.cardSubtitle}>
                        Enter the email linked to your account and we&apos;ll send a secure reset link.
                    </p>
                </div>

                <form onSubmit={handleSubmit} noValidate className={styles.form}>
                    <TextField
                        label="Email address"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        errorMessage={emailError}
                        required
                        id="forgot-email"
                        startIcon={<Mail size={16} aria-hidden="true" />}
                    />
                    <Button type="submit" fullWidth isLoading={loading}>
                        Send reset link
                    </Button>
                </form>

                <p className={styles.switchText}>
                    Remembered it?{' '}
                    <Link to="/login" className={styles.link}>Sign in</Link>
                </p>
            </div>

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
