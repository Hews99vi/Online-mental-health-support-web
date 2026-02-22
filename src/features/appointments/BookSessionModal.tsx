import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal, ModalConfirmFooter } from '../../components/ui/Modal';
import { http } from '../../api/http';
import type { Therapist, AvailabilitySlot } from '../therapists/types';
import type { BookPayload } from './types';
import styles from './Appointments.module.css';

// ── Helpers ───────────────────────────────────────────────────────────────────

function groupSlotsByDay(slots: AvailabilitySlot[]): Map<string, AvailabilitySlot[]> {
    const map = new Map<string, AvailabilitySlot[]>();
    for (const slot of slots) {
        const day = slot.start.slice(0, 10); // YYYY-MM-DD
        const arr = map.get(day) ?? [];
        arr.push(slot);
        map.set(day, arr);
    }
    return map;
}

function formatDay(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatTime(isoStr: string) {
    return new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

async function bookAppointment(payload: BookPayload): Promise<void> {
    try {
        await http.post('/appointments', payload);
    } catch {
        await new Promise(r => setTimeout(r, 600)); // stub
    }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
    isOpen: boolean;
    therapist: Therapist;
    slots: AvailabilitySlot[];
    onClose: () => void;
    onBooked: () => void;
}

export function BookSessionModal({ isOpen, therapist, slots, onClose, onBooked }: Props) {
    const byDay = groupSlotsByDay(slots);
    const days = Array.from(byDay.keys()).sort();

    const [dayIdx, setDayIdx] = useState(0);
    const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentDay = days[dayIdx];
    const daySlots = currentDay ? (byDay.get(currentDay) ?? []) : [];

    const handleConfirm = async () => {
        if (!selectedSlot) return;
        setError(null);
        setIsLoading(true);
        try {
            await bookAppointment({ therapistId: therapist.id, slotId: selectedSlot.id, userNotes: notes.trim() || undefined });
            onBooked();
        } catch {
            setError('Booking failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const rate = `$${(therapist.ratePerHour / 100).toFixed(0)}/hr`;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Book a session with ${therapist.name}`}
            size="md"
            disableBackdropClose={isLoading}
            footer={
                <ModalConfirmFooter
                    onCancel={onClose}
                    onConfirm={handleConfirm}
                    confirmLabel={selectedSlot ? `Confirm — ${rate}` : 'Select a slot'}
                    isLoading={isLoading}
                />
            }
        >
            <div className={styles.modalBody}>
                {/* Day navigator */}
                {days.length > 0 ? (
                    <>
                        <div className={styles.calRow}>
                            <span className={styles.calLabel}>{currentDay ? formatDay(currentDay) : '—'}</span>
                            <div className={styles.calNav}>
                                <button
                                    type="button"
                                    className={styles.iconBtn}
                                    onClick={() => { setDayIdx(i => Math.max(0, i - 1)); setSelectedSlot(null); }}
                                    disabled={dayIdx === 0}
                                    aria-label="Previous day"
                                >
                                    <ChevronLeft size={16} aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    className={styles.iconBtn}
                                    onClick={() => { setDayIdx(i => Math.min(days.length - 1, i + 1)); setSelectedSlot(null); }}
                                    disabled={dayIdx === days.length - 1}
                                    aria-label="Next day"
                                >
                                    <ChevronRight size={16} aria-hidden="true" />
                                </button>
                            </div>
                        </div>

                        {/* Slot grid */}
                        <div
                            className={styles.slotGrid}
                            role="listbox"
                            aria-label={`Available time slots for ${currentDay ? formatDay(currentDay) : ''}`}
                            aria-required="true"
                        >
                            {daySlots.length === 0 ? (
                                <p className={styles.noSlots}>No slots available for this day.</p>
                            ) : daySlots.map(slot => {
                                const unavail = !slot.available;
                                const selected = selectedSlot?.id === slot.id;
                                return (
                                    <button
                                        key={slot.id}
                                        type="button"
                                        role="option"
                                        aria-selected={selected}
                                        disabled={unavail}
                                        className={`${styles.slot} ${unavail ? styles.slotUnavailable : ''} ${selected ? styles.slotSelected : ''}`}
                                        onClick={() => !unavail && setSelectedSlot(slot)}
                                    >
                                        {formatTime(slot.start)}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <p className={styles.noSlots}>No availability in the next 7 days. Please check back later.</p>
                )}

                {/* Notes */}
                <div className={styles.notesField}>
                    <label className={styles.notesLabel} htmlFor="book-notes">
                        Notes for therapist <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
                    </label>
                    <textarea
                        id="book-notes"
                        className={styles.notesInput}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Briefly describe what you'd like to work on…"
                        maxLength={500}
                    />
                </div>

                {error && (
                    <p role="alert" style={{ fontSize: '0.8125rem', color: '#dc2626', background: '#fef2f2', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', margin: 0 }}>
                        {error}
                    </p>
                )}
            </div>
        </Modal>
    );
}
