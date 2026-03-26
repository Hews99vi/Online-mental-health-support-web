import styles from './Public.module.css';

export function AboutPage() {
    return (
        <div className={styles.page}>
            <div className={styles.prose}>
                <h1 className={styles.proseTitle}>About MindBridge</h1>
                <div className={styles.boundary} role="note">
                    <strong>Boundary statement:</strong> MindBridge is a peer support and well-being
                    platform. It is <em>not</em> a medical service and does not provide clinical
                    diagnosis, treatment, or emergency care. If you are in crisis, please call the
                    National Mental Health Helpline at <a href="tel:1926">1926</a>.
                </div>

                <h2>Our mission</h2>
                <p>
                    Mental health struggles are common, yet stigma and barriers to access remain widespread
                    — especially in Sri Lanka. MindBridge was built to change that. We connect people
                    with peer support, verified therapists, self-help resources, and around-the-clock
                    crisis contacts, all in one private, accessible platform.
                </p>

                <h2>What we offer</h2>
                <ul>
                    <li><strong>Anonymous peer chat</strong> — talk to others who understand, no real name needed.</li>
                    <li><strong>Therapist directory</strong> — browse and book sessions with approved, licensed professionals.</li>
                    <li><strong>Mood & journal tracking</strong> — private daily logs with optional AI insights.</li>
                    <li><strong>Self-help library</strong> — curated articles, videos, and exercises.</li>
                    <li><strong>Crisis resources</strong> — the 1926 helpline and other contacts are always one tap away.</li>
                </ul>

                <h2>Privacy & safety</h2>
                <p>
                    Your data is encrypted, never sold, and never used for advertising. You control what
                    is processed, including the ability to opt out of AI personalisation and analytics
                    at any time from the <a href="/consent">Consent Centre</a>.
                </p>

                <h2>Who we are</h2>
                <p>
                    MindBridge is developed by a team dedicated to increasing access to mental health
                    support in Sri Lanka. We work closely with mental health professionals to ensure
                    content and features meet safety and ethical standards.
                </p>
            </div>
        </div>
    );
}
