import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, User, Mail, Lock, Stethoscope, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import styles from './Auth.module.css';

export function RegisterPage() {
    const { register, isLoading } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user' as 'user' | 'listener' | 'therapist',
    });
    const [errors, setErrors] = useState<Partial<typeof form>>({});

    const set =
        (field: keyof typeof form) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
                setForm((f) => ({ ...f, [field]: e.target.value }));

    const validate = () => {
        const e: Partial<typeof form> = {};
        if (!form.name.trim()) e.name = 'Full name is required';
        if (!form.email) e.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
        if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            await register(form);
            navigate('/dashboard');
            addToast('Account created! Welcome to MindBridge.', 'success');
        } catch (err: unknown) {
            const msg = (err as { message?: string }).message ?? 'Registration failed.';
            addToast(msg, 'error');
        }
    };

    return (
        <div className={styles.authPage}>
            <div className={styles.card}>
                {/* ── Brand header ── */}
                <div className={styles.cardHeader}>
                    <div className={styles.brandMark} aria-hidden="true">
                        <Brain size={26} strokeWidth={1.75} />
                    </div>
                    <h1 className={styles.cardTitle}>Create account</h1>
                    <p className={styles.cardSubtitle}>
                        Join MindBridge — your wellness journey starts here
                    </p>
                </div>

                {/* ── Registration form ── */}
                <form onSubmit={handleSubmit} noValidate className={styles.form}>
                    <TextField
                        label="Full name"
                        type="text"
                        autoComplete="name"
                        value={form.name}
                        onChange={set('name')}
                        errorMessage={errors.name}
                        required
                        id="reg-name"
                        startIcon={<User size={16} aria-hidden="true" />}
                    />
                    <TextField
                        label="Email address"
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={set('email')}
                        errorMessage={errors.email}
                        required
                        id="reg-email"
                        startIcon={<Mail size={16} aria-hidden="true" />}
                    />
                    <TextField
                        label="Password"
                        type="password"
                        autoComplete="new-password"
                        value={form.password}
                        onChange={set('password')}
                        errorMessage={errors.password}
                        required
                        helperText="Minimum 8 characters"
                        id="reg-password"
                        startIcon={<Lock size={16} aria-hidden="true" />}
                    />

                    {/* ── Account type ── */}
                    <div className={styles.fieldGroup}>
                        <label htmlFor="reg-role" className={styles.selectLabel}>
                            I am registering as a…
                        </label>
                        <select
                            id="reg-role"
                            value={form.role}
                            onChange={set('role')}
                            className={styles.select}
                            aria-label="Account type"
                        >
                            <option value="user">Individual seeking support</option>
                            <option value="listener">Trained peer listener</option>
                            <option value="therapist">Licensed therapist / counsellor</option>
                        </select>

                        {form.role === 'therapist' && (
                            <p className={styles.infoNote}>
                                <Stethoscope size={13} strokeWidth={2} aria-hidden="true" />{' '}
                                Therapist accounts require admin approval before activation.
                            </p>
                        )}
                        {form.role === 'listener' && (
                            <p className={styles.infoNote}>
                                Listener accounts will be reviewed and require a short orientation.
                            </p>
                        )}
                    </div>

                    <Button type="submit" fullWidth isLoading={isLoading}>
                        Create Account
                    </Button>
                </form>

                <p className={styles.switchText}>
                    Already have an account?{' '}
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
