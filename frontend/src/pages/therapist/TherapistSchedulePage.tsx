import { useCallback, useEffect, useMemo, useState } from 'react';
import { http } from '../../api/http';

interface AvailabilitySlot {
    id: string;
    start: string;
    end: string;
    available: boolean;
}

interface AvailabilityListResponse {
    data: {
        items: AvailabilitySlot[];
    };
}

interface AvailabilityCreateResponse {
    data: {
        items: AvailabilitySlot[];
    };
}

function toLocalDateTimeValue(date: Date) {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function TherapistSchedulePage() {
    const now = useMemo(() => new Date(), []);
    const [startTime, setStartTime] = useState(toLocalDateTimeValue(new Date(now.getTime() + 3600000)));
    const [endTime, setEndTime] = useState(toLocalDateTimeValue(new Date(now.getTime() + 7200000)));
    const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const from = new Date().toISOString();
            const to = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
            const response = await http.get<AvailabilityListResponse>(`/therapist/availability?from=${from}&to=${to}`);
            setSlots(response.data.items);
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to load availability.');
            setSlots([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    async function publishSlot() {
        setIsSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await http.post<AvailabilityCreateResponse>('/therapist/availability', {
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
            });
            const created = response.data.items;
            setSlots((prev) => [...prev, ...created].sort((a, b) => a.start.localeCompare(b.start)));
            setSuccess('Availability published.');
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to publish availability.');
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <main style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <header>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>Availability</h1>
                <p style={{ margin: '0.35rem 0 0', color: '#6b7280', fontSize: '0.9375rem' }}>
                    Publish available session slots so users can book appointments.
                </p>
            </header>

            <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1rem', display: 'grid', gap: '0.9rem' }}>
                <div style={{ display: 'grid', gap: '0.8rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: '#374151' }}>
                        Start time
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={(event) => setStartTime(event.target.value)}
                            style={{ padding: '0.6rem 0.75rem', borderRadius: '0.55rem', border: '1px solid #d1d5db', fontFamily: 'inherit' }}
                        />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: '#374151' }}>
                        End time
                        <input
                            type="datetime-local"
                            value={endTime}
                            onChange={(event) => setEndTime(event.target.value)}
                            style={{ padding: '0.6rem 0.75rem', borderRadius: '0.55rem', border: '1px solid #d1d5db', fontFamily: 'inherit' }}
                        />
                    </label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        type="button"
                        onClick={() => void publishSlot()}
                        disabled={isSaving}
                        style={{ padding: '0.6rem 1rem', border: 'none', borderRadius: '0.6rem', background: '#7c3aed', color: '#fff', fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer' }}
                    >
                        {isSaving ? 'Publishing...' : 'Publish slot'}
                    </button>
                </div>
            </section>

            {error && (
                <p role="alert" style={{ margin: 0, padding: '0.75rem 0.9rem', borderRadius: '0.75rem', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                    {error}
                </p>
            )}
            {success && (
                <p role="status" style={{ margin: 0, padding: '0.75rem 0.9rem', borderRadius: '0.75rem', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                    {success}
                </p>
            )}

            <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1rem' }}>
                <h2 style={{ margin: 0, marginBottom: '0.8rem', fontSize: '1rem', color: '#111827' }}>Published slots</h2>
                {isLoading ? (
                    <p style={{ margin: 0, color: '#6b7280' }}>Loading...</p>
                ) : slots.length === 0 ? (
                    <p style={{ margin: 0, color: '#6b7280' }}>No slots published yet.</p>
                ) : (
                    <div style={{ display: 'grid', gap: '0.55rem' }}>
                        {slots
                            .slice()
                            .sort((a, b) => a.start.localeCompare(b.start))
                            .map((slot) => (
                                <div key={slot.id} style={{ border: '1px solid #e5e7eb', borderRadius: '0.7rem', padding: '0.7rem 0.8rem', display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <span style={{ color: '#111827', fontSize: '0.9rem' }}>
                                        {new Date(slot.start).toLocaleString()} - {new Date(slot.end).toLocaleTimeString()}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: slot.available ? '#047857' : '#9a3412', fontWeight: 600 }}>
                                        {slot.available ? 'Available' : 'Booked'}
                                    </span>
                                </div>
                            ))}
                    </div>
                )}
            </section>
        </main>
    );
}
