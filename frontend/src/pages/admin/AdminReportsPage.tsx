import { useEffect, useMemo, useRef, useState } from 'react';
import { http } from '../../api/http';

type ReportStatus = 'open' | 'closed';

interface AdminReport {
    id: string;
    reporterUserId: string | null;
    reporter: {
        id: string;
        username: string | null;
        email: string | null;
    } | null;
    targetType: string;
    targetId: string;
    reason: string;
    status: ReportStatus;
    createdAt: string;
}

interface ReportsResponse {
    data: {
        items: AdminReport[];
        total: number;
    };
}

interface CloseReportResponse {
    data: {
        report: AdminReport;
    };
}

const STATUS_STYLES: Record<ReportStatus, { bg: string; color: string; border: string }> = {
    open: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
    closed: { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' },
};

const TYPE_ICON: Record<string, string> = {
    therapist: '🩺',
    listener: '🎧',
    user: '👤',
    session: '💬',
    content: '📄',
    other: '📋',
};

function prettyStatus(status: ReportStatus): string {
    return status === 'open' ? 'Open' : 'Closed';
}

function iconForType(type: string): string {
    return TYPE_ICON[type.toLowerCase()] ?? '📋';
}

async function fetchReports(status: ReportStatus | 'all' = 'all'): Promise<AdminReport[]> {
    const qs = new URLSearchParams();
    if (status !== 'all') qs.set('status', status);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    const response = await http.get<ReportsResponse>(`/admin/reports${suffix}`);
    return response.data.items;
}

async function closeReport(id: string): Promise<void> {
    await http.post<CloseReportResponse>(`/admin/reports/${id}/close`);
}

interface ReviewModalProps {
    report: AdminReport;
    onResolve: () => void;
    onClose: () => void;
    isSaving: boolean;
}

function ReviewModal({ report, onResolve, onClose, isSaving }: ReviewModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const style = STATUS_STYLES[report.status];
    const canClose = report.status === 'open';

    useEffect(() => {
        const firstButton = modalRef.current?.querySelector<HTMLElement>('button');
        firstButton?.focus();

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    return (
        <div role="presentation" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="report-modal-title" onClick={(event) => event.stopPropagation()}
                style={{ background: '#fff', borderRadius: '1rem', padding: '1.75rem', width: '100%', maxWidth: '560px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h2 id="report-modal-title" style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>
                            {iconForType(report.targetType)} {report.targetType}
                        </h2>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>
                            {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '999px', background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                            {prettyStatus(report.status)}
                        </span>
                        <button type="button" aria-label="Close" onClick={onClose}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#9ca3af', lineHeight: 1, padding: '0.25rem' }}>
                            ×
                        </button>
                    </div>
                </div>

                <div>
                    <p style={{ margin: '0 0 0.25rem', fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reason</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#374151', lineHeight: 1.6 }}>{report.reason}</p>
                </div>

                <div>
                    <p style={{ margin: '0 0 0.25rem', fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reporter</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#374151', lineHeight: 1.6 }}>
                        {report.reporter?.email ?? report.reporter?.username ?? report.reporterUserId ?? 'Unknown'}
                    </p>
                </div>

                <div>
                    <p style={{ margin: '0 0 0.25rem', fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#374151', lineHeight: 1.6 }}>
                        {report.targetType} - {report.targetId}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end', paddingTop: '0.25rem', borderTop: '1px solid #f3f4f6' }}>
                    <button type="button" onClick={onClose}
                        style={{ padding: '0.5rem 1.125rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                        Close
                    </button>
                    {canClose && (
                        <button type="button" onClick={onResolve} disabled={isSaving}
                            style={{ padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: '#6366f1', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', opacity: isSaving ? 0.7 : 1 }}>
                            {isSaving ? 'Closing...' : 'Mark as Closed'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export function AdminReportsPage() {
    const [reports, setReports] = useState<AdminReport[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            setIsLoading(true);
            setError(null);
            try {
                const items = await fetchReports();
                setReports(items);
            } catch (err: unknown) {
                setReports([]);
                setError((err as { message?: string }).message ?? 'Failed to load reports.');
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const activeReport = useMemo(
        () => reports.find((report) => report.id === activeId) ?? null,
        [reports, activeId]
    );

    async function resolve(id: string) {
        setIsSaving(true);
        setError(null);
        try {
            await closeReport(id);
            setReports((prev) => prev.map((report) => (
                report.id === id ? { ...report, status: 'closed' } : report
            )));
            setActiveId(null);
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to close report.');
        } finally {
            setIsSaving(false);
        }
    }

    const openCount = reports.filter((report) => report.status === 'open').length;

    return (
        <>
            <main style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem', fontFamily: 'inherit' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', margin: '0 0 0.375rem' }}>
                    Reports
                </h1>
                <p style={{ fontSize: '0.9375rem', color: '#6b7280', margin: '0 0 2rem' }}>
                    {openCount} open - {reports.length} total
                </p>

                {error && (
                    <p role="alert" style={{ margin: '0 0 1rem', color: '#b91c1c', fontSize: '0.875rem' }}>
                        {error}
                    </p>
                )}

                <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {isLoading ? (
                        <li style={{ padding: '1rem', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '0.875rem' }}>
                            Loading reports...
                        </li>
                    ) : reports.length === 0 ? (
                        <li style={{ padding: '1rem', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '0.875rem' }}>
                            No reports available.
                        </li>
                    ) : (
                        reports.map((report) => {
                            const statusStyle = STATUS_STYLES[report.status];
                            const isOpen = report.status === 'open';
                            return (
                                <li
                                    key={report.id}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 1.25rem', borderRadius: '0.875rem', border: `1px solid ${isOpen ? '#fecaca' : '#e5e7eb'}`, background: isOpen ? '#fffafa' : '#fff', transition: 'border-color 0.15s, background 0.15s' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0 }}>
                                        <span aria-hidden="true" style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                                            {iconForType(report.targetType)}
                                        </span>
                                        <div style={{ minWidth: 0 }}>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>
                                                {report.targetType}
                                            </p>
                                            <p style={{ margin: '0.125rem 0 0', fontSize: '0.8125rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '360px' }}>
                                                {report.reason}
                                            </p>
                                            <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                                                {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, whiteSpace: 'nowrap' }}>
                                            {prettyStatus(report.status)}
                                        </span>
                                        <button
                                            type="button"
                                            aria-label={`Review report ${report.id}`}
                                            onClick={() => setActiveId(report.id)}
                                            style={{ padding: '0.425rem 0.875rem', borderRadius: '0.5rem', border: 'none', background: isOpen ? '#6366f1' : '#f3f4f6', color: isOpen ? '#fff' : '#6b7280', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
                                        >
                                            Review
                                        </button>
                                    </div>
                                </li>
                            );
                        })
                    )}
                </ul>
            </main>

            {activeReport && (
                <ReviewModal
                    report={activeReport}
                    onResolve={() => void resolve(activeReport.id)}
                    onClose={() => setActiveId(null)}
                    isSaving={isSaving}
                />
            )}
        </>
    );
}
