import { useState, useCallback } from 'react';
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
import { Modal, ModalConfirmFooter } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import styles from './Admin.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

type RequestStatus = 'pending' | 'approved' | 'rejected';

interface TherapistRequest {
    id: string;
    name: string;
    email: string;
    specialty: string;
    licenseNo: string;
    submittedAt: string;
    status: RequestStatus;
    notes?: string;
}

// ── Stub data (replace with useSWR / react-query hitting the real API) ────────

const STUB_REQUESTS: TherapistRequest[] = [
    {
        id: 'th-001',
        name: 'Dr. Emma Wilson',
        email: 'emma.wilson@clinic.com',
        specialty: 'CBT & Anxiety',
        licenseNo: 'LIC-2024-0041',
        submittedAt: '2026-02-19',
        status: 'pending',
    },
    {
        id: 'th-002',
        name: 'Dr. Marcus Lee',
        email: 'mlee@therapy.org',
        specialty: 'Trauma & PTSD',
        licenseNo: 'LIC-2023-0199',
        submittedAt: '2026-02-17',
        status: 'pending',
    },
    {
        id: 'th-003',
        name: 'Dr. Priya Sharma',
        email: 'priya.sharma@mind.health',
        specialty: 'Child & Adolescent',
        licenseNo: 'LIC-2022-0088',
        submittedAt: '2026-02-14',
        status: 'approved',
        notes: 'Credentials verified. Excellent references.',
    },
    {
        id: 'th-004',
        name: 'Dr. Johan Voss',
        email: 'j.voss@neuro.care',
        specialty: 'Neuropsychology',
        licenseNo: 'LIC-2024-0012',
        submittedAt: '2026-02-12',
        status: 'rejected',
        notes: 'License could not be verified. Please resubmit.',
    },
    {
        id: 'th-005',
        name: 'Dr. Amara Osei',
        email: 'amara.osei@counselling.co',
        specialty: 'Couples & Family',
        licenseNo: 'LIC-2021-0305',
        submittedAt: '2026-02-10',
        status: 'pending',
    },
];

// ── Badge helper ──────────────────────────────────────────────────────────────

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

// ── Action modal ──────────────────────────────────────────────────────────────

interface ActionModalProps {
    request: TherapistRequest | null;
    action: 'approve' | 'reject' | null;
    onClose: () => void;
    onConfirm: (id: string, approved: boolean, notes: string) => void;
    isLoading: boolean;
}

function ActionModal({ request, action, onClose, onConfirm, isLoading }: ActionModalProps) {
    const [notes, setNotes] = useState('');
    if (!request || !action) return null;

    const isApprove = action === 'approve';

    const handleConfirm = () => {
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
                {request.name} <span style={{ fontWeight: 400, color: '#6b7280' }}>— {request.specialty}</span>
            </p>

            <div className={styles.notesField}>
                <label htmlFor="action-notes" className={styles.notesLabel}>
                    {isApprove ? 'Approval notes (optional)' : 'Rejection reason (required)'}
                </label>
                <textarea
                    id="action-notes"
                    className={styles.notesTextarea}
                    placeholder={isApprove ? 'e.g. All credentials verified.' : 'e.g. License number could not be confirmed.'}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                />
            </div>
        </Modal>
    );
}

// ── API call stubs ────────────────────────────────────────────────────────────

async function apiReviewRequest(id: string, approved: boolean, notes: string) {
    // TODO: replace with real fetch call
    // POST /api/admin/therapists/:id/approve  { approved, notes }
    await new Promise(res => setTimeout(res, 900));
    return { id, approved, notes };
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AdminTherapistApprovalsPage() {
    const [requests, setRequests] = useState<TherapistRequest[]>(STUB_REQUESTS);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<RequestStatus | 'all'>('all');
    const [modalTarget, setModalTarget] = useState<TherapistRequest | null>(null);
    const [modalAction, setModalAction] = useState<'approve' | 'reject' | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const openModal = (request: TherapistRequest, action: 'approve' | 'reject') => {
        setModalTarget(request);
        setModalAction(action);
    };

    const closeModal = useCallback(() => {
        if (isLoading) return;
        setModalTarget(null);
        setModalAction(null);
    }, [isLoading]);

    const handleConfirm = async (id: string, approved: boolean, notes: string) => {
        setIsLoading(true);
        try {
            await apiReviewRequest(id, approved, notes);
            setRequests(prev =>
                prev.map(r =>
                    r.id === id
                        ? { ...r, status: approved ? 'approved' : 'rejected', notes }
                        : r
                )
            );
            closeModal();
        } finally {
            setIsLoading(false);
        }
    };

    const filtered = requests.filter(r => {
        const matchSearch =
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.email.toLowerCase().includes(search.toLowerCase()) ||
            r.specialty.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || r.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const pendingCount = requests.filter(r => r.status === 'pending').length;

    return (
        <main className={styles.page}>
            {/* Header */}
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

            {/* Table card */}
            <div className={styles.card}>
                {/* Filter bar */}
                <div className={styles.filterBar}>
                    <Search size={14} style={{ position: 'absolute', pointerEvents: 'none', color: '#9ca3af', display: 'none' }} aria-hidden="true" />
                    <input
                        type="search"
                        className={styles.searchInput}
                        placeholder="Search by name, email or specialty…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        aria-label="Search requests"
                    />
                    <select
                        className={styles.filterSelect}
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value as RequestStatus | 'all')}
                        aria-label="Filter by status"
                    >
                        <option value="all">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>

                {/* Table */}
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
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <div className={styles.empty}>
                                            <Filter size={28} className={styles.emptyIcon} aria-hidden="true" />
                                            No requests match your filters.
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(req => (
                                    <tr key={req.id}>
                                        <td>
                                            <div className={styles.avatarCell}>
                                                <div className={styles.avatar} aria-hidden="true">
                                                    {req.name.split(' ').map(p => p[0]).slice(0, 2).join('')}
                                                </div>
                                                <div>
                                                    <div className={styles.avatarName}>{req.name}</div>
                                                    <div className={styles.avatarEmail}>{req.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{req.specialty}</td>
                                        <td>
                                            <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: '#6b7280' }}>
                                                {req.licenseNo}
                                            </span>
                                        </td>
                                        <td>{new Date(req.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                        <td><StatusBadge status={req.status} /></td>
                                        <td>
                                            <div className={styles.rowActions}>
                                                {req.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="primary"
                                                            onClick={() => openModal(req, 'approve')}
                                                            aria-label={`Approve ${req.name}`}
                                                        >
                                                            <UserCheck size={13} aria-hidden="true" style={{ marginRight: '0.25rem' }} />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="danger"
                                                            onClick={() => openModal(req, 'reject')}
                                                            aria-label={`Reject ${req.name}`}
                                                        >
                                                            <UserX size={13} aria-hidden="true" style={{ marginRight: '0.25rem' }} />
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    as="a"
                                                    href={`mailto:${req.email}`}
                                                    aria-label={`Email ${req.name}`}
                                                >
                                                    <ExternalLink size={13} aria-hidden="true" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Action confirmation modal */}
            <ActionModal
                request={modalTarget}
                action={modalAction}
                onClose={closeModal}
                onConfirm={handleConfirm}
                isLoading={isLoading}
            />
        </main>
    );
}
