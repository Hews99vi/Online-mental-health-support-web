import styles from './Public.module.css';

export function PrivacyPolicyPage() {
    const updated = '19 February 2026';
    return (
        <div className={styles.page}>
            <div className={styles.prose}>
                <h1 className={styles.proseTitle}>Privacy Policy</h1>
                <p className={styles.proseMeta}>Last updated: {updated}</p>

                <div className={styles.boundary} role="note">
                    <strong>Boundary statement:</strong> This platform is for well-being support.
                    It is not a medical record system and is not a substitute for professional care
                    or emergency services.
                </div>

                <h2>1. What we collect</h2>
                <p>We collect only what is necessary to provide the service:</p>
                <ul>
                    <li>Account information (name, email, role)</li>
                    <li>Mood entries and journal content you create</li>
                    <li>Booking history with therapists</li>
                    <li>Chat messages (anonymous by default)</li>
                    <li>Consent preferences</li>
                    <li>Device/browser type for security logging</li>
                </ul>

                <h2>2. How we use your data</h2>
                <ul>
                    <li>To operate and personalise the platform</li>
                    <li>To generate AI-powered weekly insights (only if you consent)</li>
                    <li>To match you with therapists</li>
                    <li>To improve the platform via anonymous analytics (only if you consent)</li>
                </ul>
                <p>We never sell your data. We never use it for advertising.</p>

                <h2>3. AI & Gemini</h2>
                <p>
                    If you enable AI Personalisation in your <a href="/consent">Consent Centre</a>,
                    your journal and mood entries are sent to the Google Gemini API to generate
                    weekly insights. This data is processed under Google's data processing agreement
                    and is not used to train general AI models.
                </p>

                <h2>4. Biometric data</h2>
                <p>
                    MindBridge may optionally receive heart-rate data from wearable integrations.
                    This feature is opt-in only and can be disabled at any time in your Consent Centre.
                    Biometric data is never shared with third parties.
                </p>

                <h2>5. Data retention</h2>
                <p>
                    Account data is retained until you delete your account. After deletion, all
                    personal data is purged within 30 days. Anonymous analytics data may be retained
                    in aggregate form.
                </p>

                <h2>6. Your rights</h2>
                <ul>
                    <li>Access and download your data at any time</li>
                    <li>Correct inaccurate information</li>
                    <li>Delete your account and all associated data</li>
                    <li>Withdraw consent for optional processing (Consent Centre)</li>
                </ul>

                <h2>7. Contact</h2>
                <p>
                    For privacy questions, contact us at{' '}
                    <a href="mailto:privacy@mindbridge.lk">privacy@mindbridge.lk</a>.
                </p>
            </div>
        </div>
    );
}
