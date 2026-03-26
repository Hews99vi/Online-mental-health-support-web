import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Mail, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '../../app/ToastContext';
import { http } from '../../api/http';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import styles from './Auth.module.css';

export function ForgotPasswordPage() {
    const { addToast } = useToast();
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [deliveryMode, setDeliveryMode] = useState<'email' | 'unconfigured'>('email');
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
            const response = await http.post<{ data?: { delivery?: 'email' | 'unconfigured' } }>('/auth/forgot-password', { email });
            setDeliveryMode(response.data?.delivery === 'unconfigured' ? 'unconfigured' : 'email');
            addToast('If an account exists for that email, reset instructions have been generated.', 'success');
            setSubmitted(true);
            setTimeout(() => successHeadingRef.current?.focus(), 50);
        } catch (err: unknown) {
            const message = (err as { message?: string }).message ?? 'Could not process your request right now. Please try again later.';
            addToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className={styles.authPage}>
                <div className={styles.successCard} role="main" aria-labelledby="reset-request-success">
                    <div className={styles.successIcon} aria-hidden="true">
                        <CheckCircle size={32} strokeWidth={1.75} />
                    </div>
                    <h1
                        id="reset-request-success"
                        ref={successHeadingRef}
                        className={styles.successTitle}
                        tabIndex={-1}
                    >
                        Reset instructions generated
                    </h1>
                    <p className={styles.successText}>
                        If an account exists for <strong>{email}</strong>, a password reset link has been generated.
                        {deliveryMode === 'email'
                            ? ' If the email is registered, a reset link has been sent.'
                            : ' Email delivery is not configured in this environment yet, so an administrator must provide the reset link.'}
                    </p>
                    <Link to="/login" className={styles.link}>
                        Back to sign in
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.authPage}>
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <div className={styles.brandMark} aria-hidden="true">
                        <Brain size={26} strokeWidth={1.75} />
                    </div>
                    <h1 className={styles.cardTitle}>Reset password</h1>
                    <p className={styles.cardSubtitle}>
                        Enter your account email to generate a password reset link.
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

                <p className={styles.infoNote}>
                    The backend generates real reset tokens and will send email if SMTP is configured.
                </p>

                <p className={styles.switchText}>
                    Remembered it? <Link to="/login" className={styles.link}>Sign in</Link>
                </p>
            </div>

            <div className={styles.crisisNote} role="note">
                <AlertTriangle size={15} aria-hidden="true" style={{ flexShrink: 0, color: '#b91c1c' }} />
                In crisis? <Link to="/crisis" className={styles.crisisLink}>Get immediate help - call 1926</Link>
            </div>
        </div>
    );
}
