import styles from './Public.module.css';

export function TermsPage() {
    const updated = '19 February 2026';
    return (
        <div className={styles.page}>
            <div className={styles.prose}>
                <h1 className={styles.proseTitle}>Terms of Service</h1>
                <p className={styles.proseMeta}>Last updated: {updated}</p>

                <div className={styles.boundary} role="note">
                    <strong>Boundary statement:</strong> MindBridge is a peer support and self-help
                    platform. It is <em>not</em> a licensed medical service and does not provide
                    clinical diagnosis, treatment plans, prescriptions, or emergency care.
                    In an emergency, call <a href="tel:119">119</a> or the National Mental Health Helpline at{' '}
                    <a href="tel:1926">1926</a>.
                </div>

                <h2>1. Acceptance of terms</h2>
                <p>
                    By creating an account or using MindBridge ("the Platform"), you agree to these
                    Terms of Service. If you do not agree, please do not use the Platform.
                </p>

                <h2>2. Eligibility</h2>
                <p>
                    You must be at least 16 years of age to use MindBridge independently.
                    Users aged 13–15 may use the Platform only with documented parental or guardian consent.
                </p>

                <h2>3. Permitted use</h2>
                <p>You agree to use MindBridge only for lawful, personal well-being purposes. You must not:</p>
                <ul>
                    <li>Harass, threaten, or harm other users</li>
                    <li>Share content that promotes self-harm or suicide methods</li>
                    <li>Impersonate therapists or medical professionals</li>
                    <li>Attempt to reverse-engineer or disrupt the platform</li>
                    <li>Use the platform for commercial advertising without permission</li>
                </ul>

                <h2>4. Therapist relationships</h2>
                <p>
                    Therapists on MindBridge are independent licensed professionals, not employees
                    of MindBridge. Sessions booked through the Platform are private agreements between
                    you and the therapist. MindBridge is not responsible for the content of
                    therapeutic sessions.
                </p>

                <h2>5. AI features</h2>
                <p>
                    AI-generated insights (powered by Google Gemini) are for informational and
                    motivational purposes only. They are <strong>not</strong> medical advice,
                    diagnosis, or treatment. Always consult a qualified professional for clinical
                    concerns.
                </p>

                <h2>6. Content moderation</h2>
                <p>
                    Anonymous chat rooms are moderated. Content that violates community guidelines
                    (see Section 3) will be removed. Repeat violations may result in account suspension.
                </p>

                <h2>7. Account termination</h2>
                <p>
                    You may delete your account at any time from your Profile page. MindBridge may
                    suspend or terminate accounts that violate these Terms.
                </p>

                <h2>8. Limitation of liability</h2>
                <p>
                    MindBridge is provided "as is." To the maximum extent permitted by law,
                    MindBridge Ltd. is not liable for any indirect, incidental, or consequential
                    damages arising from use of the platform.
                </p>

                <h2>9. Changes to these terms</h2>
                <p>
                    We may update these Terms. You will be notified in-app and will be asked to
                    re-confirm your consent for material changes.
                </p>

                <h2>10. Contact</h2>
                <p>
                    Questions? Email <a href="mailto:legal@mindbridge.lk">legal@mindbridge.lk</a>.
                </p>
            </div>
        </div>
    );
}
