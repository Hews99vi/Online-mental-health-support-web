import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Brain, CheckCircle, Lock } from 'lucide-react';
import { http } from '../../api/http';
import { useToast } from '../../app/ToastContext';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import styles from './Auth.module.css';

export function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const successHeadingRef = useRef<HTMLHeadingElement>(null);

    const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams]);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string; token?: string }>({});
    const [loading, setLoading] = useState(false);
    const [resetComplete, setResetComplete] = useState(false);

    const validate = (): boolean => {
        const next: typeof errors = {};
        if (!token) next.token = 'Reset link is missing or invalid.';
        if (password.length < 8) next.password = 'Password must be at least 8 characters';
        if (!confirmPassword) next.confirmPassword = 'Please confirm your new password';
        else if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            await http.post('/auth/reset-password', { token, password });
            setResetComplete(true);
            addToast('Password updated. You can sign in now.', 'success');
            setTimeout(() => successHeadingRef.current?.focus(), 50);
        } catch (error: unknown) {
            const message = (error as { message?: string }).message ?? 'Could not reset your password.';
            addToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (resetComplete) {
        return (
            <div className={styles.authPage}>
                <div className={styles.successCard} role="main" aria-labelledby="reset-password-success">
                    <div className={styles.successIcon} aria-hidden="true">
                        <CheckCircle size={32} strokeWidth={1.75} />
                    </div>
                    <h1
                        id="reset-password-success"
                        ref={successHeadingRef}
                        className={styles.successTitle}
                        tabIndex={-1}
                    >
                        Password updated
                    </h1>
                    <p className={styles.successText}>
                        Your password has been changed successfully. Use it the next time you sign in.
                    </p>
                    <Button type="button" fullWidth onClick={() => navigate('/login')}>
                        Back to sign in
                    </Button>
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
                    <h1 className={styles.cardTitle}>Choose a new password</h1>
                    <p className={styles.cardSubtitle}>
                        Reset links expire after one hour and can only be used once.
                    </p>
                </div>

                {!token && (
                    <p className={styles.infoNote} role="alert">
                        Reset link is missing or invalid. Request a fresh password reset link to continue.
                    </p>
                )}

                <form onSubmit={handleSubmit} noValidate className={styles.form}>
                    <TextField
                        label="New password"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        errorMessage={errors.password}
                        helperText="Minimum 8 characters"
                        required
                        id="reset-password"
                        startIcon={<Lock size={16} aria-hidden="true" />}
                    />
                    <TextField
                        label="Confirm new password"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        errorMessage={errors.confirmPassword}
                        required
                        id="reset-password-confirm"
                        startIcon={<Lock size={16} aria-hidden="true" />}
                    />
                    <Button type="submit" fullWidth isLoading={loading} disabled={!token}>
                        Reset password
                    </Button>
                </form>

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
