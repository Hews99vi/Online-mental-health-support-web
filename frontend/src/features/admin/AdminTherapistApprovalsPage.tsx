import { useState, useCallback, useEffect } from 'react';
import {
    UserCheck,
    UserX,
    Search,
    Filter,
    ExternalLink,
    CheckCircle,
    XCircle,
    Clock,
} from 'lucide-react';
import { http } from '../../api/http';
import { Modal, ModalConfirmFooter } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import styles from './Admin.module.css';

type RequestStatus = 'pending' | 'approved' | 'rejected';

interface TherapistRequest {
    id: string;
    userId: string | null;
    name: string;
    email: string | null;
    title?: string;
    languages?: string[];
    ratePerHour?: number;
    currency?: string;
    specialty: string;
    licenseNo: string;
    licenseBody?: string;
    yearsExperience?: number;
    submittedAt: string;
    status: RequestStatus;
    notes?: string;
    bio?: string;
    documentsCount?: number;
    documents?: Array<{
        name: string;
        mimeType: string;
        size: number;
    }>;
}

interface AdminTherapistItem {
    id: string;
    userId: string | null;
    name: string;
    email: string | null;
    licenseNo: string;
    licenseBody: string;
    title: string;
    specialization: string[];
    languages: string[];
    bio: string;
    yearsExperience: number;
    ratePerHour: number;
    currency: string;
    documents: Array<{
        name: string;
        mimeType: string;
        size: number;
        lastModified: number;
        source: 'metadata';
    }>;
    status: RequestStatus;
    submittedAt: string;
    rejectedReason: string | null;
}

interface AdminTherapistListResponse {
    data: {
        items: AdminTherapistItem[];
        total: number;
    };
}

interface AdminTherapistActionResponse {
    data: {
        profile: AdminTherapistItem;
    };
}

function mapRequest(item: AdminTherapistItem): TherapistRequest {
    return {
        id: item.id,
        userId: item.userId,
        name: item.name,
        email: item.email,
        title: item.title,
        languages: item.languages,
        ratePerHour: item.ratePerHour,
        currency: item.currency,
        specialty: item.specialization.length > 0 ? item.specialization.join(', ') : 'General',
        licenseNo: item.licenseNo,
        licenseBody: item.licenseBody,
        yearsExperience: item.yearsExperience,
        submittedAt: item.submittedAt,
        status: item.status,
        notes: item.rejectedReason ?? undefined,
        bio: item.bio,
        documentsCount: item.documents.length,
        documents: item.documents.map((document) => ({
            name: document.name,
            mimeType: document.mimeType,
            size: document.size,
        })),
    };
}

async function apiFetchRequests(status: RequestStatus | 'all'): Promise<TherapistRequest[]> {
    const qs = new URLSearchParams();
    if (status !== 'all') qs.set('status', status);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    const response = await http.get<AdminTherapistListResponse>(`/admin/therapists${suffix}`);
    return response.data.items.map(mapRequest);
}

async function apiApproveRequest(id: string, notes: string): Promise<void> {
    await http.post<AdminTherapistActionResponse>(`/admin/therapists/${id}/approve`, {
        notes: notes.trim() || undefined,
    });
}

async function apiRejectRequest(id: string, notes: string): Promise<void> {
    await http.post<AdminTherapistActionResponse>(`/admin/therapists/${id}/reject`, {
        reason: notes.trim(),
    });
}

function StatusBadge({ status }: { status: RequestStatus }) {
    const Icon = status === 'approved' ? CheckCircle : status === 'rejected' ? XCircle : Clock;
    const cls = status === 'approved'
        ? styles.badgeApproved
        : status === 'rejected'
            ? styles.badgeRejected
            : styles.badgePending;
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    return (
        <span className={`${styles.badge} ${cls}`}>
            <Icon size={11} aria-hidden="true" />
            {label}
        </span>
    );
}

interface ActionModalProps {
    request: TherapistRequest | null;
    action: 'approve' | 'reject' | null;
    onClose: () => void;
    onConfirm: (id: string, approved: boolean, notes: string) => void;
    isLoading: boolean;
}

function ActionModal({ request, action, onClose, onConfirm, isLoading }: ActionModalProps) {
    const [notes, setNotes] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        setNotes(request?.notes ?? '');
        setLocalError(null);
    }, [request, action]);

    if (!request || !action) return null;

    const isApprove = action === 'approve';

    const handleConfirm = () => {
        if (!isApprove && !notes.trim()) {
            setLocalError('Rejection reason is required.');
            return;
        }
        onConfirm(request.id, isApprove, notes);
    };

    return (
        <Modal
            isOpen
            onClose={onClose}
            title={isApprove ? 'Approve therapist application' : 'Reject therapist application'}
            size="sm"
            disableBackdropClose={isLoading}
            footer={
                <ModalConfirmFooter
                    onCancel={onClose}
                    onConfirm={handleConfirm}
                    confirmLabel={isApprove ? 'Approve' : 'Reject'}
                    isLoading={isLoading}
                    isDanger={!isApprove}
                />
            }
        >
            <p style={{ fontSize: '0.9rem', color: '#374151', margin: '0 0 0.25rem' }}>
                You are about to <strong>{action}</strong> the application from:
            </p>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827', margin: '0 0 1rem' }}>
                {request.name} <span style={{ fontWeight: 400, color: '#6b7280' }}>- {request.specialty}</span>
            </p>

            <div className={styles.notesField}>
                <label htmlFor="action-notes" className={styles.notesLabel}>
                    {isApprove ? 'Approval notes (optional)' : 'Rejection reason (required)'}
                </label>
                <textarea
                    id="action-notes"
                    className={styles.notesTextarea}
                    placeholder={isApprove ? 'e.g. Credentials verified and approved.' : 'e.g. License could not be verified.'}
                    value={notes}
                    onChange={(event) => {
                        setNotes(event.target.value);
                        if (localError) setLocalError(null);
                    }}
                />
            </div>

            {localError && (
                <p role="alert" style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#b91c1c' }}>
                    {localError}
                </p>
            )}
        </Modal>
    );
}

export function AdminTherapistApprovalsPage() {
    const [requests, setRequests] = useState<TherapistRequest[]>([]);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<RequestStatus | 'all'>('pending');
    const [modalTarget, setModalTarget] = useState<TherapistRequest | null>(null);
    const [modalAction, setModalAction] = useState<'approve' | 'reject' | null>(null);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const loadRequests = useCallback(async (status: RequestStatus | 'all') => {
        setIsPageLoading(true);
        setError(null);
        try {
            const items = await apiFetchRequests(status);
            setRequests(items);
        } catch (err: unknown) {
            setRequests([]);
            setError((err as { message?: string }).message ?? 'Failed to load therapist requests.');
        } finally {
            setIsPageLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadRequests(filterStatus);
    }, [filterStatus, loadRequests]);

    const openModal = (request: TherapistRequest, action: 'approve' | 'reject') => {
        setModalTarget(request);
        setModalAction(action);
        setSuccess(null);
        setError(null);
    };

    const closeModal = useCallback(() => {
        if (isActionLoading) return;
        setModalTarget(null);
        setModalAction(null);
    }, [isActionLoading]);

    const handleConfirm = async (id: string, approved: boolean, notes: string) => {
        setIsActionLoading(true);
        setError(null);
        setSuccess(null);
        try {
            if (approved) {
                await apiApproveRequest(id, notes);
            } else {
                await apiRejectRequest(id, notes);
            }
            setSuccess(approved ? 'Therapist approved successfully.' : 'Therapist rejected successfully.');
            closeModal();
            await loadRequests(filterStatus);
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to submit review action.');
        } finally {
            setIsActionLoading(false);
        }
    };

    const filtered = requests.filter((request) => {
        const q = search.toLowerCase();
        const matchSearch =
            request.name.toLowerCase().includes(q) ||
            (request.email ?? '').toLowerCase().includes(q) ||
            request.specialty.toLowerCase().includes(q);
        return matchSearch;
    });

    const pendingCount = requests.filter((request) => request.status === 'pending').length;

    return (
        <main className={styles.page}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Therapist Applications</h1>
                    <p className={styles.subtitle}>
                        Review and verify therapist credentials before granting platform access.
                    </p>
                </div>
                {pendingCount > 0 && (
                    <span className={`${styles.badge} ${styles.badgePending}`} style={{ fontSize: '0.875rem', padding: '0.35rem 0.875rem' }}>
                        <Clock size={13} aria-hidden="true" />
                        {pendingCount} pending
                    </span>
                )}
            </div>

            <div className={styles.card}>
                <div className={styles.filterBar}>
                    <Search size={14} style={{ position: 'absolute', pointerEvents: 'none', color: '#9ca3af', display: 'none' }} aria-hidden="true" />
                    <input
                        type="search"
                        className={styles.searchInput}
                        placeholder="Search by name, email or specialty..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        aria-label="Search requests"
                    />
                    <select
                        className={styles.filterSelect}
                        value={filterStatus}
                        onChange={(event) => setFilterStatus(event.target.value as RequestStatus | 'all')}
                        aria-label="Filter by status"
                    >
                        <option value="pending">Pending</option>
                        <option value="all">All statuses</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>

                {(error || success) && (
                    <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #f3f4f6' }}>
                        {error && (
                            <p role="alert" style={{ margin: 0, color: '#b91c1c', fontSize: '0.85rem' }}>
                                {error}
                            </p>
                        )}
                        {success && (
                            <p role="status" style={{ margin: 0, color: '#166534', fontSize: '0.85rem' }}>
                                {success}
                            </p>
                        )}
                    </div>
                )}

                <div className={styles.tableWrap}>
                    <table className={styles.table} aria-label="Therapist verification requests">
                        <thead>
                            <tr>
                                <th>Applicant</th>
                                <th>Specialty</th>
                                <th>License no.</th>
                                <th>Submitted</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isPageLoading ? (
                                <tr>
                                    <td colSpan={6}>
                                        <div className={styles.empty}>
                                            <Clock size={28} className={styles.emptyIcon} aria-hidden="true" />
                                            Loading therapist requests...
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <div className={styles.empty}>
                                            <Filter size={28} className={styles.emptyIcon} aria-hidden="true" />
                                            No requests match your filters.
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((request) => (
                                    <tr key={request.id}>
                                        <td>
                                            <div className={styles.avatarCell}>
                                                <div className={styles.avatar} aria-hidden="true">
                                                    {request.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
                                                </div>
                                                <div>
                                                    <div className={styles.avatarName}>{request.name}</div>
                                                    <div className={styles.avatarEmail}>{request.email ?? 'No email available'}</div>
                                                    {request.documentsCount !== undefined && (
                                                        <div className={styles.avatarEmail}>
                                                            {request.documentsCount} document{request.documentsCount === 1 ? '' : 's'} (metadata)
                                                        </div>
                                                    )}
                                                    {request.documents && request.documents.length > 0 && (
                                                        <div className={styles.avatarEmail}>
                                                            {request.documents
                                                                .slice(0, 2)
                                                                .map((document) => document.name)
                                                                .join(', ')}
                                                            {request.documents.length > 2 ? '...' : ''}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <span>{request.specialty}</span>
                                                {request.title && (
                                                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                        {request.title}
                                                    </span>
                                                )}
                                                {request.languages && request.languages.length > 0 && (
                                                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                        {request.languages.join(', ')}
                                                    </span>
                                                )}
                                                {typeof request.ratePerHour === 'number' && request.ratePerHour > 0 && (
                                                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                        {(request.currency ?? 'USD')} {(request.ratePerHour / 100).toFixed(0)}/hr
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: '#6b7280' }}>
                                                    {request.licenseNo}
                                                </span>
                                                {request.licenseBody && (
                                                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                        {request.licenseBody}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>{new Date(request.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                        <td><StatusBadge status={request.status} /></td>
                                        <td>
                                            <div className={styles.rowActions}>
                                                {request.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="primary"
                                                            onClick={() => openModal(request, 'approve')}
                                                            aria-label={`Approve ${request.name}`}
                                                        >
                                                            <UserCheck size={13} aria-hidden="true" style={{ marginRight: '0.25rem' }} />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="danger"
                                                            onClick={() => openModal(request, 'reject')}
                                                            aria-label={`Reject ${request.name}`}
                                                        >
                                                            <UserX size={13} aria-hidden="true" style={{ marginRight: '0.25rem' }} />
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                                {request.email && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        as="a"
                                                        href={`mailto:${request.email}`}
                                                        aria-label={`Email ${request.name}`}
                                                    >
                                                        <ExternalLink size={13} aria-hidden="true" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ActionModal
                request={modalTarget}
                action={modalAction}
                onClose={closeModal}
                onConfirm={handleConfirm}
                isLoading={isActionLoading}
            />
        </main>
    );
}
