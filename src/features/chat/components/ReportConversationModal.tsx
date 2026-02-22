import { useState } from 'react';
import { Flag, AlertTriangle } from 'lucide-react';
import { Modal, ModalConfirmFooter } from '../../../components/ui/Modal';
import { http } from '../../../api/http';

// ── Types ─────────────────────────────────────────────────────────────────────

type ReportReason =
    | 'harassment'
    | 'inappropriate_content'
    | 'impersonation'
    | 'spam'
    | 'harmful_advice'
    | 'other';

const REASONS: { value: ReportReason; label: string }[] = [
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'inappropriate_content', label: 'Inappropriate content' },
    { value: 'impersonation', label: 'Impersonating a professional' },
    { value: 'spam', label: 'Spam or advertising' },
    { value: 'harmful_advice', label: 'Harmful or dangerous advice' },
    { value: 'other', label: 'Other (please describe below)' },
];

interface Props {
    isOpen: boolean;
    roomId: string;
    onClose: () => void;
}

// ── API stub ───────────────────────────────────────────────────────────────────

async function submitReport(roomId: string, reason: ReportReason, details: string) {
    // TODO: POST /api/chat/rooms/:roomId/report { reason, details }
    return http.post(`/chat/rooms/${roomId}/report`, { reason, details });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ReportConversationModal({ isOpen, roomId, onClose }: Props) {
    const [reason, setReason] = useState<ReportReason>('harassment');
    const [details, setDetails] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        setError(null);
        setIsLoading(true);
        try {
            await submitReport(roomId, reason, details);
            setSubmitted(true);
        } catch {
            setError('Failed to submit report. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        // reset state for next open
        setSubmitted(false);
        setReason('harassment');
        setDetails('');
        setError(null);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={submitted ? 'Report submitted' : 'Report this conversation'}
            size="sm"
            disableBackdropClose={isLoading}
            footer={
                submitted ? (
                    <button
                        type="button"
                        onClick={handleClose}
                        style={{ marginLeft: 'auto', padding: '0.5rem 1.25rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                        Close
                    </button>
                ) : (
                    <ModalConfirmFooter
                        onCancel={handleClose}
                        onConfirm={handleConfirm}
                        confirmLabel="Submit report"
                        isLoading={isLoading}
                        isDanger
                    />
                )
            }
        >
            {submitted ? (
                <div style={{ textAlign: 'center', padding: '1rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Flag size={20} style={{ color: '#059669' }} aria-hidden="true" />
                    </div>
                    <p style={{ fontSize: '0.9375rem', color: '#374151', margin: 0, lineHeight: 1.6 }}>
                        Your report has been received. Our moderation team will review the conversation shortly.
                    </p>
                    <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0 }}>
                        If you are in immediate danger, please call emergency services.
                    </p>
                </div>
            ) : (
                <>
                    <p style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <AlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0, marginTop: '0.1rem' }} aria-hidden="true" />
                        Reports are anonymous and reviewed within 24 hours. Abuse of this system may result in a ban.
                    </p>

                    {/* Reason select */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label
                            htmlFor="report-reason"
                            style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}
                        >
                            Reason
                        </label>
                        <select
                            id="report-reason"
                            value={reason}
                            onChange={e => setReason(e.target.value as ReportReason)}
                            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', fontSize: '0.875rem', outline: 'none', color: '#111827', background: '#fff' }}
                        >
                            {REASONS.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Details */}
                    <div>
                        <label
                            htmlFor="report-details"
                            style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}
                        >
                            Additional details (optional)
                        </label>
                        <textarea
                            id="report-details"
                            value={details}
                            onChange={e => setDetails(e.target.value)}
                            placeholder="Describe what happened…"
                            style={{ width: '100%', minHeight: '80px', padding: '0.625rem 0.875rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', color: '#111827' }}
                        />
                    </div>

                    {error && (
                        <p role="alert" style={{ fontSize: '0.8125rem', color: '#dc2626', marginTop: '0.5rem', background: '#fef2f2', borderRadius: '0.375rem', padding: '0.5rem 0.75rem' }}>
                            {error}
                        </p>
                    )}
                </>
            )}
        </Modal>
    );
}
