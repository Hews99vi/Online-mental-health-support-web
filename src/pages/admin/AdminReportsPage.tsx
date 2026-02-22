import { useState, useEffect, useRef } from 'react';

type ReportStatus = 'Open' | 'Under Review' | 'Resolved' | 'Closed';
type ReportType = 'Harassment' | 'Misinformation' | 'Crisis Mishandled' | 'Inappropriate Content' | 'Spam' | 'Other';

interface Report {
    id: string;
    type: ReportType;
    summary: string;
    detail: string;
    reporter: string;
    reported: string;
    date: string;
    status: ReportStatus;
}

const REPORTS: Report[] = [
    {
        id: '1', type: 'Harassment', date: 'Feb 19, 2026', status: 'Open',
        summary: 'Listener made inappropriate personal remarks.',
        detail: 'The user reported that the listener asked for personal contact details and made comments unrelated to mental health support during a session.',
        reporter: 'Anonymous Sunflower', reported: 'Listener: Priya K.',
    },
    {
        id: '2', type: 'Crisis Mishandled', date: 'Feb 18, 2026', status: 'Under Review',
        summary: 'Listener did not escalate a suicide risk disclosure.',
        detail: 'User disclosed suicidal ideation during a chat session. The listener failed to follow the crisis protocol and did not direct the user to emergency services or use the report button.',
        reporter: 'Anonymous River', reported: 'Listener: Kasun P.',
    },
    {
        id: '3', type: 'Inappropriate Content', date: 'Feb 17, 2026', status: 'Open',
        summary: 'Therapist shared unverified health claims.',
        detail: 'The therapist reportedly recommended unverified supplements during a session and shared links to external commercial products.',
        reporter: 'Anonymous Storm', reported: 'Therapist: Rohan M.',
    },
    {
        id: '4', type: 'Spam', date: 'Feb 16, 2026', status: 'Resolved',
        summary: 'User sent repetitive unsolicited messages in chat lobby.',
        detail: 'Multiple listeners reported the same user sending copy-pasted promotional messages in the open chat lobby over a period of two hours.',
        reporter: 'Listener: Fatima N.', reported: 'User: Anonymous Ember',
    },
    {
        id: '5', type: 'Misinformation', date: 'Feb 15, 2026', status: 'Closed',
        summary: 'User claimed to be a licensed therapist without credentials.',
        detail: 'A user in the community forum identified themselves as a licensed therapist and gave clinical advice, without being registered on the platform as a therapist.',
        reporter: 'Therapist: Mei S.', reported: 'User: Anonymous Willow',
    },
    {
        id: '6', type: 'Harassment', date: 'Feb 14, 2026', status: 'Under Review',
        summary: 'Repeated unsolicited contact after session ended.',
        detail: 'The user reported receiving persistent follow-up messages from a listener after the session had formally closed, including through the platform\'s feedback channel.',
        reporter: 'Anonymous Cedar', reported: 'Listener: Samuel O.',
    },
    {
        id: '7', type: 'Other', date: 'Feb 12, 2026', status: 'Open',
        summary: 'Session recording shared without consent.',
        detail: 'The reporter alleges that audio from their session appeared in a post on an external social media platform, though attribution has not yet been confirmed.',
        reporter: 'Anonymous Birch', reported: 'Unknown',
    },
    {
        id: '8', type: 'Inappropriate Content', date: 'Feb 10, 2026', status: 'Resolved',
        summary: 'Offensive language used during group chat session.',
        detail: 'Multiple users flagged sustained use of discriminatory language in a group support thread. Moderator intervention resolved the session.',
        reporter: 'Anonymous Maple', reported: 'User: Anonymous Pine',
    },
];

const STATUS_STYLES: Record<ReportStatus, { bg: string; color: string; border: string }> = {
    'Open': { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
    'Under Review': { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
    'Resolved': { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
    'Closed': { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' },
};

const TYPE_ICON: Record<ReportType, string> = {
    'Harassment': '⚠️',
    'Crisis Mishandled': '🆘',
    'Inappropriate Content': '🚫',
    'Spam': '📩',
    'Misinformation': '❗',
    'Other': '📋',
};

// ── Review Modal ───────────────────────────────────────────────────────────────

interface ReviewModalProps {
    report: Report;
    currentStatus: ReportStatus;
    onResolve: () => void;
    onClose: () => void;
}

function ReviewModal({ report, currentStatus, onResolve, onClose }: ReviewModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const ss = STATUS_STYLES[currentStatus];
    const canAct = currentStatus === 'Open' || currentStatus === 'Under Review';

    useEffect(() => {
        const firstBtn = modalRef.current?.querySelector<HTMLElement>('button');
        firstBtn?.focus();

        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') { onClose(); return; }
            if (e.key === 'Tab') {
                const focusable = modalRef.current?.querySelectorAll<HTMLElement>('button, textarea, [tabindex]');
                if (!focusable?.length) return;
                const first = focusable[0], last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div role="presentation" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="report-modal-title" onClick={(e) => e.stopPropagation()}
                style={{ background: '#fff', borderRadius: '1rem', padding: '1.75rem', width: '100%', maxWidth: '560px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h2 id="report-modal-title" style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>
                            {TYPE_ICON[report.type]} {report.type}
                        </h2>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>{report.date}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '999px', background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>
                            {currentStatus}
                        </span>
                        <button type="button" aria-label="Close" onClick={onClose}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#9ca3af', lineHeight: 1, padding: '0.25rem' }}>
                            ✕
                        </button>
                    </div>
                </div>

                {/* Detail fields */}
                {[
                    { label: 'Summary', value: report.summary },
                    { label: 'Details', value: report.detail },
                    { label: 'Reporter', value: report.reporter },
                    { label: 'Reported', value: report.reported },
                ].map(({ label, value }) => (
                    <div key={label}>
                        <p style={{ margin: '0 0 0.25rem', fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#374151', lineHeight: 1.6 }}>{value}</p>
                    </div>
                ))}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end', paddingTop: '0.25rem', borderTop: '1px solid #f3f4f6' }}>
                    <button type="button" onClick={onClose}
                        style={{ padding: '0.5rem 1.125rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                        Close
                    </button>
                    {canAct && (
                        <button type="button" onClick={onResolve}
                            style={{ padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: '#6366f1', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                            Mark as Resolved
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function AdminReportsPage() {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [statuses, setStatuses] = useState<Record<string, ReportStatus>>({});

    const getStatus = (id: string): ReportStatus =>
        statuses[id] ?? REPORTS.find((r) => r.id === id)!.status;

    const activeReport = REPORTS.find((r) => r.id === activeId) ?? null;

    function resolve(id: string) {
        setStatuses((prev) => ({ ...prev, [id]: 'Resolved' }));
        setActiveId(null);
    }

    const openCount = REPORTS.filter((r) => {
        const s = getStatus(r.id);
        return s === 'Open' || s === 'Under Review';
    }).length;

    return (
        <>
            <main style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem', fontFamily: 'inherit' }}>
                {/* ── Heading ── */}
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', margin: '0 0 0.375rem' }}>
                    Reports
                </h1>
                <p style={{ fontSize: '0.9375rem', color: '#6b7280', margin: '0 0 2rem' }}>
                    {openCount} open · {REPORTS.length} total
                </p>

                {/* ── Report list ── */}
                <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {REPORTS.map((report) => {
                        const status = getStatus(report.id);
                        const ss = STATUS_STYLES[status];
                        const isOpen = status === 'Open' || status === 'Under Review';

                        return (
                            <li
                                key={report.id}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 1.25rem', borderRadius: '0.875rem', border: `1px solid ${isOpen ? '#fecaca' : '#e5e7eb'}`, background: isOpen ? '#fffafa' : '#fff', transition: 'border-color 0.15s, background 0.15s' }}
                            >
                                {/* Left: icon + info */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0 }}>
                                    <span aria-hidden="true" style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                                        {TYPE_ICON[report.type]}
                                    </span>
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>
                                            {report.type}
                                        </p>
                                        <p style={{ margin: '0.125rem 0 0', fontSize: '0.8125rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '360px' }}>
                                            {report.summary}
                                        </p>
                                        <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                                            {report.date}
                                        </p>
                                    </div>
                                </div>

                                {/* Right: status badge + Review button */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, whiteSpace: 'nowrap' }}>
                                        {status}
                                    </span>
                                    <button
                                        type="button"
                                        aria-label={`Review report: ${report.summary}`}
                                        onClick={() => setActiveId(report.id)}
                                        style={{ padding: '0.425rem 0.875rem', borderRadius: '0.5rem', border: 'none', background: isOpen ? '#6366f1' : '#f3f4f6', color: isOpen ? '#fff' : '#6b7280', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
                                    >
                                        Review
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </main>

            {/* ── Modal ── */}
            {activeReport && (
                <ReviewModal
                    report={activeReport}
                    currentStatus={getStatus(activeReport.id)}
                    onResolve={() => resolve(activeReport.id)}
                    onClose={() => setActiveId(null)}
                />
            )}
        </>
    );
}
