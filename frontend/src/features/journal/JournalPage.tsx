import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BookOpenText, PencilLine, PlusCircle, Save, Trash2 } from 'lucide-react';
import { http } from '../../api/http';
import type { JournalEntry } from '../../types';
import moodStyles from '../mood/Mood.module.css';
import styles from './JournalPage.module.css';

interface JournalListResponse {
    data: {
        items: JournalEntry[];
    };
}

interface JournalEntryResponse {
    data: {
        entry: JournalEntry;
    };
}

interface JournalFormState {
    title: string;
    content: string;
}

const EMPTY_FORM: JournalFormState = { title: '', content: '' };

function formatDate(value: string) {
    return new Date(value).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function JournalPage() {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [form, setForm] = useState<JournalFormState>(EMPTY_FORM);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        async function loadEntries() {
            setIsLoading(true);
            setError(null);
            try {
                const response = await http.get<JournalListResponse>('/journal', { signal: controller.signal });
                const items = response.data.items;
                setEntries(items);
                if (items.length > 0) {
                    setSelectedId(items[0].id);
                    setForm({ title: items[0].title ?? '', content: items[0].content });
                } else {
                    setSelectedId(null);
                    setForm(EMPTY_FORM);
                }
            } catch (err: unknown) {
                if ((err as { name?: string }).name === 'AbortError') return;
                setError((err as { message?: string }).message ?? 'Failed to load journal entries.');
            } finally {
                setIsLoading(false);
            }
        }

        void loadEntries();
        return () => controller.abort();
    }, []);

    const selectedEntry = useMemo(
        () => entries.find((entry) => entry.id === selectedId) ?? null,
        [entries, selectedId]
    );

    const startNewEntry = () => {
        setSelectedId(null);
        setForm(EMPTY_FORM);
        setError(null);
        setSuccess(null);
    };

    const handleSelect = async (id: string) => {
        setError(null);
        setSuccess(null);
        try {
            const response = await http.get<JournalEntryResponse>(`/journal/${id}`);
            const entry = response.data.entry;
            setSelectedId(entry.id);
            setForm({ title: entry.title ?? '', content: entry.content });
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to open journal entry.');
        }
    };

    const handleSave = async () => {
        if (!form.content.trim()) {
            setError('Write something before saving your journal.');
            return;
        }

        setIsSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const payload = {
                title: form.title.trim() || undefined,
                content: form.content.trim(),
            };

            const response = selectedId
                ? await http.put<JournalEntryResponse>(`/journal/${selectedId}`, payload)
                : await http.post<JournalEntryResponse>('/journal', payload);

            const saved = response.data.entry;
            setEntries((prev) => {
                const next = prev.filter((entry) => entry.id !== saved.id);
                return [saved, ...next].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
            });
            setSelectedId(saved.id);
            setForm({ title: saved.title ?? '', content: saved.content });
            setSuccess(selectedId ? 'Journal entry updated.' : 'Journal entry created.');
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to save journal entry.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedEntry) return;

        setIsDeleting(true);
        setError(null);
        setSuccess(null);

        try {
            await http.delete<{ message?: string }>(`/journal/${selectedEntry.id}`);
            const remaining = entries.filter((entry) => entry.id !== selectedEntry.id);
            setEntries(remaining);
            if (remaining.length > 0) {
                const next = remaining[0];
                setSelectedId(next.id);
                setForm({ title: next.title ?? '', content: next.content });
            } else {
                setSelectedId(null);
                setForm(EMPTY_FORM);
            }
            setSuccess('Journal entry deleted.');
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to delete journal entry.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <main className={moodStyles.page}>
            <div className={moodStyles.header}>
                <span className={styles.eyebrow}>
                    <BookOpenText size={15} aria-hidden="true" />
                    Private journal
                </span>
                <h1 className={moodStyles.title}>Journal</h1>
                <p className={moodStyles.subtitle}>
                    Capture what happened, what it meant, and what you want to remember next.
                </p>
            </div>

            {error && (
                <div className={`${styles.alert} ${styles.error}`} role="alert">
                    <AlertTriangle size={16} aria-hidden="true" />
                    {error}
                </div>
            )}

            {success && (
                <div className={`${styles.alert} ${styles.success}`} role="status" aria-live="polite">
                    <Save size={16} aria-hidden="true" />
                    {success}
                </div>
            )}

            <div className={styles.layout}>
                <section className={`${moodStyles.card} ${styles.editorCard}`}>
                    <div className={styles.toolbar}>
                        <div>
                            <h2 className={moodStyles.sectionTitle}>{selectedEntry ? 'Edit entry' : 'New entry'}</h2>
                            <p className={styles.muted}>
                                {selectedEntry
                                    ? `Last updated ${formatDate(selectedEntry.updatedAt)}`
                                    : 'A focused space for private reflection.'}
                            </p>
                        </div>
                        <button type="button" className={styles.secondaryBtn} onClick={startNewEntry}>
                            <PlusCircle size={16} aria-hidden="true" style={{ marginRight: '0.4rem' }} />
                            New entry
                        </button>
                    </div>

                    <label className={moodStyles.noteLabel} htmlFor="journal-title">Title</label>
                    <input
                        id="journal-title"
                        className={styles.input}
                        type="text"
                        value={form.title}
                        onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                        placeholder="Give this entry a title"
                        maxLength={120}
                    />

                    <label className={moodStyles.noteLabel} htmlFor="journal-content">Entry</label>
                    <textarea
                        id="journal-content"
                        className={moodStyles.noteInput}
                        value={form.content}
                        onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                        placeholder="Write freely. This space is yours."
                        minLength={1}
                        maxLength={5000}
                        style={{ minHeight: '320px' }}
                    />

                    <div className={styles.toolbar}>
                        <p className={styles.muted}>{form.content.length}/5000 characters</p>
                        <div className={styles.actions}>
                            {selectedEntry && (
                                <button
                                    type="button"
                                    className={styles.dangerBtn}
                                    onClick={handleDelete}
                                    disabled={isDeleting || isSaving}
                                >
                                    <Trash2 size={16} aria-hidden="true" style={{ marginRight: '0.4rem' }} />
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            )}
                            <button
                                type="button"
                                className={moodStyles.submitBtn}
                                onClick={handleSave}
                                disabled={isSaving || isDeleting}
                            >
                                <Save size={16} aria-hidden="true" style={{ marginRight: '0.4rem' }} />
                                {isSaving ? 'Saving...' : selectedEntry ? 'Save changes' : 'Create entry'}
                            </button>
                        </div>
                    </div>
                </section>

                <aside className={`${moodStyles.card} ${styles.listCard}`}>
                    <div className={styles.toolbar}>
                        <div>
                            <h2 className={moodStyles.sectionTitle}>Your entries</h2>
                            <p className={styles.muted}>
                                {entries.length === 0 ? 'No saved entries yet.' : `${entries.length} saved entries`}
                            </p>
                        </div>
                        <PencilLine size={16} aria-hidden="true" style={{ color: '#7c3aed' }} />
                    </div>

                    {isLoading ? (
                        <div aria-busy="true">
                            {[90, 80, 85, 70].map((width, index) => (
                                <div key={index} className={moodStyles.skeleton} style={{ width: `${width}%`, height: '1rem' }} />
                            ))}
                        </div>
                    ) : entries.length === 0 ? (
                        <div className={styles.emptyHint}>
                            <p className={moodStyles.emptyTitle}>No journal entries yet</p>
                            <p className={moodStyles.emptyText}>
                                Start with a few lines about today, a difficult moment, or one thing you want to remember.
                            </p>
                        </div>
                    ) : (
                        <div className={moodStyles.entryList} aria-label="Journal entries">
                            {entries.map((entry) => (
                                <button
                                    key={entry.id}
                                    type="button"
                                    className={`${styles.entryButton} ${selectedId === entry.id ? styles.entryButtonActive : ''}`}
                                    onClick={() => void handleSelect(entry.id)}
                                >
                                    <p className={styles.entryTitle}>{entry.title || 'Untitled entry'}</p>
                                    <p className={styles.entryPreview}>{entry.content}</p>
                                    <span className={styles.entryMeta}>{formatDate(entry.updatedAt)}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </aside>
            </div>
        </main>
    );
}
