import { useEffect, useMemo, useState } from 'react';
import { http } from '../../api/http';

interface TherapistClient {
    id: string;
    name: string;
    email: string | null;
}

interface ClientsResponse {
    data: {
        items: TherapistClient[];
    };
}

interface LibraryResource {
    id: string;
    title: string;
    category: string;
    tags: string[];
}

interface ResourceCatalogResponse {
    data: {
        items: LibraryResource[];
    };
}

interface Assignment {
    id: string;
    therapistUserId: string;
    clientUserId: string;
    libraryItemId: string;
    appointmentId: string | null;
    note: string;
    status: 'assigned' | 'in_progress' | 'completed';
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
    item: {
        id: string;
        title: string;
        category: string;
    } | null;
}

interface AssignmentsResponse {
    data: {
        items: Assignment[];
    };
}

interface CreateAssignmentResponse {
    data: {
        assignment: Assignment;
    };
}

export function TherapistResourceAssignmentsPage() {
    const [clients, setClients] = useState<TherapistClient[]>([]);
    const [clientId, setClientId] = useState('');
    const [resources, setResources] = useState<LibraryResource[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [selectedResourceId, setSelectedResourceId] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [isAssigning, setIsAssigning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        void Promise.all([
            http.get<ClientsResponse>('/therapist/clients', { signal: controller.signal }),
            http.get<ResourceCatalogResponse>('/therapist/resources/catalog', { signal: controller.signal })
        ])
            .then(([clientsResponse, catalogResponse]) => {
                setClients(clientsResponse.data.items);
                setResources(catalogResponse.data.items);
                if (clientsResponse.data.items.length > 0) {
                    setClientId(clientsResponse.data.items[0].id);
                }
                if (catalogResponse.data.items.length > 0) {
                    setSelectedResourceId(catalogResponse.data.items[0].id);
                }
            })
            .catch((err: unknown) => {
                if ((err as { name?: string }).name === 'AbortError') return;
                setError((err as { message?: string }).message ?? 'Failed to load resource assignment data.');
            })
            .finally(() => setLoading(false));

        return () => controller.abort();
    }, []);

    useEffect(() => {
        if (!clientId) {
            setAssignments([]);
            return;
        }
        const controller = new AbortController();
        void http
            .get<AssignmentsResponse>(`/therapist/clients/${clientId}/resources`, { signal: controller.signal })
            .then((response) => setAssignments(response.data.items))
            .catch((err: unknown) => {
                if ((err as { name?: string }).name === 'AbortError') return;
                setError((err as { message?: string }).message ?? 'Failed to load assignments.');
            });

        return () => controller.abort();
    }, [clientId]);

    const selectedClient = useMemo(
        () => clients.find((client) => client.id === clientId) ?? null,
        [clients, clientId]
    );

    const assignResource = async () => {
        if (!clientId || !selectedResourceId) return;
        setIsAssigning(true);
        setError(null);
        try {
            const response = await http.post<CreateAssignmentResponse>(
                `/therapist/clients/${clientId}/resources`,
                {
                    libraryItemId: selectedResourceId,
                    note: note.trim() || undefined
                }
            );
            setAssignments((prev) => [response.data.assignment, ...prev]);
            setNote('');
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to assign resource.');
        } finally {
            setIsAssigning(false);
        }
    };

    const updateStatus = async (assignmentId: string, status: Assignment['status']) => {
        try {
            const response = await http.put<CreateAssignmentResponse>(
                `/therapist/resource-assignments/${assignmentId}`,
                { status }
            );
            const updated = response.data.assignment;
            setAssignments((prev) => prev.map((item) => (item.id === assignmentId ? updated : item)));
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to update assignment status.');
        }
    };

    return (
        <main style={{ maxWidth: '980px', margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'inherit' }}>
            <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#111827' }}>Assign Library Resources</h1>
            <p style={{ margin: '0.4rem 0 1.2rem', color: '#6b7280', fontSize: '0.9rem' }}>
                Assign self-help content to clients and track completion status.
            </p>

            {error && (
                <p role="alert" style={{ margin: '0 0 1rem', color: '#b91c1c', fontSize: '0.875rem' }}>
                    {error}
                </p>
            )}

            <section style={{ border: '1px solid #e5e7eb', borderRadius: '0.875rem', background: '#fff', padding: '0.9rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <select value={clientId} onChange={(event) => setClientId(event.target.value)} disabled={loading || clients.length === 0} style={{ border: '1px solid #d1d5db', borderRadius: '0.55rem', padding: '0.5rem 0.65rem', fontFamily: 'inherit' }}>
                    {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                            {client.name} {client.email ? `(${client.email})` : ''}
                        </option>
                    ))}
                </select>
                <select value={selectedResourceId} onChange={(event) => setSelectedResourceId(event.target.value)} disabled={loading || resources.length === 0} style={{ border: '1px solid #d1d5db', borderRadius: '0.55rem', padding: '0.5rem 0.65rem', fontFamily: 'inherit' }}>
                    {resources.map((resource) => (
                        <option key={resource.id} value={resource.id}>
                            {resource.title} ({resource.category})
                        </option>
                    ))}
                </select>
                <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={2}
                    placeholder="Optional therapist note for this assignment"
                    style={{ gridColumn: '1 / span 2', border: '1px solid #d1d5db', borderRadius: '0.55rem', padding: '0.55rem 0.65rem', fontFamily: 'inherit', fontSize: '0.875rem' }}
                />
                <button
                    type="button"
                    onClick={() => void assignResource()}
                    disabled={!clientId || !selectedResourceId || isAssigning}
                    style={{ gridColumn: '2 / span 1', justifySelf: 'end', border: 'none', borderRadius: '0.55rem', padding: '0.5rem 1rem', background: '#4f46e5', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: !clientId || !selectedResourceId || isAssigning ? 0.6 : 1 }}
                >
                    {isAssigning ? 'Assigning...' : 'Assign Resource'}
                </button>
            </section>

            <section style={{ marginTop: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.875rem', background: '#fff', padding: '0.8rem' }}>
                <h2 style={{ margin: '0 0 0.7rem', fontSize: '0.98rem', color: '#111827' }}>
                    {selectedClient ? `${selectedClient.name}'s assignments` : 'Assignments'}
                </h2>

                {loading ? (
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>Loading assignments...</p>
                ) : assignments.length === 0 ? (
                    <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.85rem' }}>No assignments yet.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                        {assignments.map((assignment) => (
                            <div key={assignment.id} style={{ border: '1px solid #e5e7eb', borderRadius: '0.65rem', padding: '0.55rem 0.7rem', display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.6rem', alignItems: 'center' }}>
                                <div>
                                    <div style={{ color: '#111827', fontWeight: 600, fontSize: '0.88rem' }}>{assignment.item?.title ?? 'Resource'}</div>
                                    <div style={{ fontSize: '0.77rem', color: '#6b7280' }}>
                                        Assigned {new Date(assignment.createdAt).toLocaleString()} · {assignment.item?.category ?? 'General'}
                                    </div>
                                    {assignment.note && <div style={{ marginTop: '0.2rem', fontSize: '0.78rem', color: '#4b5563' }}>{assignment.note}</div>}
                                </div>
                                <select
                                    value={assignment.status}
                                    onChange={(event) => void updateStatus(assignment.id, event.target.value as Assignment['status'])}
                                    style={{ border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.4rem 0.55rem', fontSize: '0.8rem', fontFamily: 'inherit' }}
                                >
                                    <option value="assigned">assigned</option>
                                    <option value="in_progress">in progress</option>
                                    <option value="completed">completed</option>
                                </select>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
