import { useState, useMemo } from 'react';

type Role = 'user' | 'therapist' | 'listener' | 'admin';
type Status = 'Active' | 'Suspended' | 'Pending';
type TabFilter = 'all' | 'user' | 'therapist' | 'listener';

interface UserRecord {
    id: string;
    name: string;
    email: string;
    role: Role;
    status: Status;
    created: string;
}

const ALL_USERS: UserRecord[] = [
    { id: '1', name: 'Amara Seneviratne', email: 'amara@example.com', role: 'user', status: 'Active', created: 'Jan 05, 2026' },
    { id: '2', name: 'Rohan Mendis', email: 'rohan@example.com', role: 'therapist', status: 'Active', created: 'Jan 08, 2026' },
    { id: '3', name: 'Priya Kumari', email: 'priya@example.com', role: 'listener', status: 'Active', created: 'Jan 12, 2026' },
    { id: '4', name: 'Daniel Wijeratne', email: 'daniel@example.com', role: 'user', status: 'Suspended', created: 'Jan 15, 2026' },
    { id: '5', name: 'Linh Tran', email: 'linh@example.com', role: 'therapist', status: 'Pending', created: 'Jan 20, 2026' },
    { id: '6', name: 'Samuel Okonkwo', email: 'samuel@example.com', role: 'user', status: 'Active', created: 'Jan 22, 2026' },
    { id: '7', name: 'Fatima Nasser', email: 'fatima@example.com', role: 'listener', status: 'Active', created: 'Jan 27, 2026' },
    { id: '8', name: 'Kasun Perera', email: 'kasun@example.com', role: 'user', status: 'Active', created: 'Feb 01, 2026' },
    { id: '9', name: 'Mei Sasaki', email: 'mei@example.com', role: 'therapist', status: 'Active', created: 'Feb 04, 2026' },
    { id: '10', name: 'Hassan Al-Rashid', email: 'hassan@example.com', role: 'listener', status: 'Suspended', created: 'Feb 07, 2026' },
    { id: '11', name: 'Nadia Petrov', email: 'nadia@example.com', role: 'user', status: 'Pending', created: 'Feb 10, 2026' },
    { id: '12', name: 'Kevin Osei', email: 'kevin@example.com', role: 'therapist', status: 'Active', created: 'Feb 14, 2026' },
];

const STATUS_STYLES: Record<Status, { bg: string; color: string; border: string }> = {
    Active: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
    Suspended: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
    Pending: { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
};

const ROLE_STYLES: Record<Role, { bg: string; color: string }> = {
    user: { bg: '#ede9fe', color: '#5b21b6' },
    therapist: { bg: '#dbeafe', color: '#1d4ed8' },
    listener: { bg: '#d1fae5', color: '#065f46' },
    admin: { bg: '#fef3c7', color: '#92400e' },
};

const TABS: { key: TabFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'user', label: 'Users' },
    { key: 'therapist', label: 'Therapists' },
    { key: 'listener', label: 'Listeners' },
];

export function AdminUsersPage() {
    const [tab, setTab] = useState<TabFilter>('all');
    const [query, setQuery] = useState('');
    const [statuses, setStatuses] = useState<Record<string, Status>>({});
    const [viewedId, setViewedId] = useState<string | null>(null);

    const getStatus = (u: UserRecord): Status => statuses[u.id] ?? u.status;

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim();
        return ALL_USERS.filter((u) => {
            const matchesTab = tab === 'all' || u.role === tab;
            const matchesQuery = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
            return matchesTab && matchesQuery;
        });
    }, [tab, query]);

    function toggleSuspend(id: string) {
        setStatuses((prev) => {
            const current = prev[id] ?? ALL_USERS.find((u) => u.id === id)!.status;
            return { ...prev, [id]: current === 'Suspended' ? 'Active' : 'Suspended' };
        });
    }

    return (
        <main style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem', fontFamily: 'inherit' }}>
            {/* ── Heading ── */}
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', margin: '0 0 0.375rem' }}>
                Users
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#6b7280', margin: '0 0 1.75rem' }}>
                {ALL_USERS.length} registered accounts
            </p>

            {/* ── Tabs ── */}
            <div
                role="tablist"
                aria-label="Filter by role"
                style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', background: '#f3f4f6', padding: '0.25rem', borderRadius: '0.625rem', width: 'fit-content' }}
            >
                {TABS.map(({ key, label }) => (
                    <button
                        key={key}
                        role="tab"
                        aria-selected={tab === key}
                        type="button"
                        onClick={() => setTab(key)}
                        style={{
                            padding: '0.375rem 1rem',
                            borderRadius: '0.45rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            background: tab === key ? '#fff' : 'transparent',
                            color: tab === key ? '#111827' : '#6b7280',
                            boxShadow: tab === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.15s',
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Search ── */}
            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                <span aria-hidden="true" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: '#9ca3af', pointerEvents: 'none' }}>
                    🔍
                </span>
                <input
                    type="search"
                    placeholder="Search by name or email…"
                    aria-label="Search users"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '0.625rem', border: '1px solid #e5e7eb', fontSize: '0.9rem', color: '#111827', background: '#f9fafb', outline: 'none' }}
                />
            </div>

            {/* ── Table ── */}
            {filtered.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: '3rem' }}>No users match your search.</p>
            ) : (
                <div style={{ borderRadius: '0.875rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                    {/* Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 100px 100px 110px 150px', padding: '0.625rem 1.25rem', background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                        {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                            <span key={h} style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {h}
                            </span>
                        ))}
                    </div>

                    {/* Rows */}
                    {filtered.map((user, idx) => {
                        const status = getStatus(user);
                        const ss = STATUS_STYLES[status];
                        const rs = ROLE_STYLES[user.role];
                        const isViewed = viewedId === user.id;
                        const suspended = status === 'Suspended';

                        return (
                            <div
                                key={user.id}
                                style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 100px 100px 110px 150px', alignItems: 'center', padding: '0.75rem 1.25rem', background: isViewed ? '#f5f3ff' : idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: idx < filtered.length - 1 ? '1px solid #f3f4f6' : 'none', transition: 'background 0.1s' }}
                            >
                                {/* Name */}
                                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '0.5rem' }}>
                                    {user.name}
                                </span>

                                {/* Email */}
                                <span style={{ fontSize: '0.8125rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '0.5rem' }}>
                                    {user.email}
                                </span>

                                {/* Role badge */}
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '999px', background: rs.bg, color: rs.color, width: 'fit-content', textTransform: 'capitalize' }}>
                                    {user.role}
                                </span>

                                {/* Status badge */}
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '999px', background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, width: 'fit-content' }}>
                                    {status}
                                </span>

                                {/* Joined */}
                                <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                                    {user.created}
                                </span>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        type="button"
                                        aria-label={`${suspended ? 'Unsuspend' : 'Suspend'} ${user.name}`}
                                        onClick={() => toggleSuspend(user.id)}
                                        style={{ padding: '0.3rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #e5e7eb', background: suspended ? '#fff' : '#fef2f2', color: suspended ? '#374151' : '#b91c1c', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                                    >
                                        {suspended ? 'Unsuspend' : 'Suspend'}
                                    </button>
                                    <button
                                        type="button"
                                        aria-label={`View ${user.name}`}
                                        onClick={() => setViewedId(isViewed ? null : user.id)}
                                        style={{ padding: '0.3rem 0.65rem', borderRadius: '0.375rem', border: 'none', background: isViewed ? '#6366f1' : '#ede9fe', color: isViewed ? '#fff' : '#4f46e5', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        {isViewed ? '✓' : 'View'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Result count */}
            {(query || tab !== 'all') && (
                <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#9ca3af', textAlign: 'right' }}>
                    {filtered.length} of {ALL_USERS.length} users
                </p>
            )}
        </main>
    );
}
