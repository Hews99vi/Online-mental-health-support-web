import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import styles from './PublicShell.module.css';

export function PublicShell() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    return (
        <div className={styles.shell}>
            {/* Skip link for keyboard users */}
            <a href="#main-content" className={styles.skipLink}>Skip to main content</a>

            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <Link to="/" className={styles.logo} aria-label="MindBridge home">
                        <span aria-hidden="true">🧠</span>
                        <span>MindBridge</span>
                    </Link>

                    <nav className={styles.nav} aria-label="Site navigation">
                        <Link to="/about" className={styles.navLink}>About</Link>
                        <Link to="/privacy" className={styles.navLink}>Privacy</Link>
                        <Link to="/terms" className={styles.navLink}>Terms</Link>
                        <Link
                            to="/crisis"
                            className={styles.helpLink}
                            aria-label="Get help — crisis hotline 1926"
                        >
                            🆘 Get Help · 1926
                        </Link>
                    </nav>

                    <div className={styles.authActions}>
                        {isAuthenticated ? (
                            <button
                                className={styles.ctaBtn}
                                onClick={() => navigate('/dashboard')}
                            >
                                Go to App
                            </button>
                        ) : (
                            <>
                                <Link to="/login" className={styles.loginBtn}>Sign In</Link>
                                <Link to="/register" className={styles.ctaBtn}>Get Started</Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main id="main-content" className={styles.main}>
                <Outlet />
            </main>

            <footer className={styles.footer}>
                <div className={styles.footerInner}>
                    <p className={styles.footerBrand}>
                        <span aria-hidden="true">🧠</span> MindBridge &copy; {new Date().getFullYear()}
                    </p>
                    <nav className={styles.footerNav} aria-label="Footer navigation">
                        <Link to="/about">About</Link>
                        <Link to="/privacy">Privacy</Link>
                        <Link to="/terms">Terms</Link>
                        <Link to="/crisis">Crisis Help</Link>
                    </nav>
                    <p className={styles.footerDisclaimer}>
                        MindBridge supports well-being and is not a substitute for professional diagnosis or emergency services.
                    </p>
                </div>
            </footer>
        </div>
    );
}
