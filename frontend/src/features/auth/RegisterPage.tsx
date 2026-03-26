import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, User, Mail, Lock, AlertTriangle } from 'lucide-react';
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
    });
    const [errors, setErrors] = useState<Partial<typeof form>>({});

    const set =
        (field: keyof typeof form) =>
            (e: React.ChangeEvent<HTMLInputElement>) =>
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
                <div className={styles.cardHeader}>
                    <div className={styles.brandMark} aria-hidden="true">
                        <Brain size={26} strokeWidth={1.75} />
                    </div>
                    <h1 className={styles.cardTitle}>Create account</h1>
                    <p className={styles.cardSubtitle}>
                        Join MindBridge — your wellness journey starts here
                    </p>
                </div>

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
