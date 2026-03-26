import { useEffect, useMemo, useState } from 'react';
import { FilePlus, FileText, MoreHorizontal, Pencil, Trash2, Eye, Save } from 'lucide-react';
import { http } from '../../api/http';
import { Button } from '../../components/ui/Button';
import type { ResourceType } from '../library/types';
import styles from './Admin.module.css';

type ContentStatus = 'draft' | 'published';

interface LibraryAdminItem {
    id: string;
    type: ResourceType;
    title: string;
    category: string;
    body?: string;
    excerpt?: string;
    tags?: string[];
    status?: ContentStatus;
    author: string;
    publishedAt: string;
    readTimeMin?: number;
}

interface LibraryListResponse {
    data: {
        items: LibraryAdminItem[];
    };
}

interface LibraryItemResponse {
    data: {
        item: LibraryAdminItem;
    };
}

interface EditorState {
    id: string | null;
    type: ResourceType;
    title: string;
    category: string;
    content: string;
    tags: string;
    status: ContentStatus;
}

const STATUS_FILTERS = ['all', 'published', 'draft'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const EMPTY_EDITOR: EditorState = {
    id: null,
    type: 'article',
    title: '',
    category: '',
    content: '',
    tags: '',
    status: 'draft',
};

async function fetchAdminLibrary(): Promise<LibraryAdminItem[]> {
    const response = await http.get<LibraryListResponse>('/library?includeDraft=true');
    return response.data.items;
}

function statusBadgeStyle(status: ContentStatus | undefined) {
    if (status === 'published') return { background: '#d1fae5', color: '#065f46' };
    return { background: '#fef3c7', color: '#92400e' };
}

export function AdminContentManagerPage() {
    const [filter, setFilter] = useState<StatusFilter>('all');
    const [items, setItems] = useState<LibraryAdminItem[]>([]);
    const [editor, setEditor] = useState<EditorState>(EMPTY_EDITOR);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            setIsLoading(true);
            setError(null);
            try {
                const list = await fetchAdminLibrary();
                setItems(list);
            } catch (err: unknown) {
                setError((err as { message?: string }).message ?? 'Failed to load library content.');
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const filtered = useMemo(() => {
        if (filter === 'all') return items;
        return items.filter((item) => (item.status ?? 'draft') === filter);
    }, [filter, items]);

    function openNewEditor() {
        setEditor(EMPTY_EDITOR);
        setError(null);
        setSuccess(null);
    }

    function openEditEditor(item: LibraryAdminItem) {
        setEditor({
            id: item.id,
            type: item.type ?? 'article',
            title: item.title,
            category: item.category,
            content: item.body ?? item.excerpt ?? '',
            tags: (item.tags ?? []).join(', '),
            status: item.status ?? 'draft',
        });
        setError(null);
        setSuccess(null);
    }

    async function saveItem() {
        if (!editor.title.trim() || !editor.category.trim() || !editor.content.trim()) {
            setError('Title, category and content are required.');
            return;
        }

        setIsSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const payload = {
                type: editor.type,
                title: editor.title.trim(),
                category: editor.category.trim(),
                content: editor.content.trim(),
                tags: editor.tags
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                status: editor.status,
            };

            const response = editor.id
                ? await http.put<LibraryItemResponse>(`/admin/library/${editor.id}`, payload)
                : await http.post<LibraryItemResponse>('/admin/library', payload);

            const saved = response.data.item;
            setItems((prev) => {
                const next = prev.filter((item) => item.id !== saved.id);
                return [saved, ...next];
            });
            setEditor({
                id: saved.id,
                type: saved.type ?? 'article',
                title: saved.title,
                category: saved.category,
                content: saved.body ?? saved.excerpt ?? '',
                tags: (saved.tags ?? []).join(', '),
                status: saved.status ?? 'draft',
            });
            setSuccess(editor.id ? 'Content updated.' : 'Content created.');
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to save content.');
        } finally {
            setIsSaving(false);
        }
    }

    async function deleteItem(id: string) {
        if (!window.confirm('Delete this content item? This action cannot be undone.')) return;
        setError(null);
        setSuccess(null);
        try {
            await http.delete(`/admin/library/${id}`);
            setItems((prev) => prev.filter((item) => item.id !== id));
            if (editor.id === id) setEditor(EMPTY_EDITOR);
            setSuccess('Content deleted.');
        } catch (err: unknown) {
            setError((err as { message?: string }).message ?? 'Failed to delete content.');
        }
    }

    return (
        <main className={styles.page}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Content Manager</h1>
                    <p className={styles.subtitle}>Manage self-help articles, guides and exercises in the library.</p>
                </div>
                <div className={styles.headerActions}>
                    <Button size="sm" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }} onClick={openNewEditor}>
                        <FilePlus size={15} aria-hidden="true" />
                        New content
                    </Button>
                </div>
            </div>

            <div className={styles.card} style={{ padding: '1rem 1.25rem', display: 'grid', gap: '0.75rem' }}>
                <h2 className={styles.cardTitle}>Editor</h2>
                <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <input
                        className={styles.searchInput}
                        style={{ minWidth: 0, backgroundImage: 'none', paddingLeft: '0.875rem' }}
                        placeholder="Title"
                        value={editor.title}
                        onChange={(event) => setEditor((prev) => ({ ...prev, title: event.target.value }))}
                    />
                    <input
                        className={styles.searchInput}
                        style={{ minWidth: 0, backgroundImage: 'none', paddingLeft: '0.875rem' }}
                        placeholder="Category"
                        value={editor.category}
                        onChange={(event) => setEditor((prev) => ({ ...prev, category: event.target.value }))}
                    />
                    <select
                        className={styles.filterSelect}
                        value={editor.type}
                        onChange={(event) => setEditor((prev) => ({ ...prev, type: event.target.value as ResourceType }))}
                    >
                        <option value="article">Article</option>
                        <option value="podcast">Podcast</option>
                        <option value="video">Video</option>
                        <option value="exercise">Exercise</option>
                        <option value="guide">Guide</option>
                    </select>
                    <select
                        className={styles.filterSelect}
                        value={editor.status}
                        onChange={(event) => setEditor((prev) => ({ ...prev, status: event.target.value as ContentStatus }))}
                    >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                    </select>
                </div>
                <input
                    className={styles.searchInput}
                    style={{ minWidth: 0, backgroundImage: 'none', paddingLeft: '0.875rem' }}
                    placeholder="Tags (comma separated)"
                    value={editor.tags}
                    onChange={(event) => setEditor((prev) => ({ ...prev, tags: event.target.value }))}
                />
                <textarea
                    className={styles.notesTextarea}
                    style={{ minHeight: '180px' }}
                    placeholder="Content (HTML or plain text)"
                    value={editor.content}
                    onChange={(event) => setEditor((prev) => ({ ...prev, content: event.target.value }))}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <Button variant="ghost" size="sm" onClick={openNewEditor}>
                        Reset
                    </Button>
                    <Button size="sm" onClick={() => void saveItem()} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Save size={14} aria-hidden="true" />
                        {isSaving ? 'Saving...' : editor.id ? 'Update' : 'Create'}
                    </Button>
                </div>
                {error && <p role="alert" style={{ margin: 0, color: '#b91c1c', fontSize: '0.85rem' }}>{error}</p>}
                {success && <p role="status" style={{ margin: 0, color: '#166534', fontSize: '0.85rem' }}>{success}</p>}
            </div>

            <div className={styles.card}>
                <div className={styles.contentToolbar}>
                    {STATUS_FILTERS.map((status) => (
                        <button
                            key={status}
                            type="button"
                            onClick={() => setFilter(status)}
                            style={{
                                padding: '0.35rem 0.875rem',
                                borderRadius: '99px',
                                border: '1px solid',
                                fontSize: '0.8125rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                                background: filter === status ? '#7c3aed' : '#f3f4f6',
                                color: filter === status ? '#fff' : '#374151',
                                borderColor: filter === status ? '#7c3aed' : '#e5e7eb',
                                textTransform: 'capitalize',
                            }}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                {isLoading ? (
                    <div className={styles.contentGrid}>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className={styles.contentCard} style={{ opacity: 0.55, minHeight: '170px' }} />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className={styles.empty}>No content items in this filter.</div>
                ) : (
                    <div className={styles.contentGrid}>
                        {filtered.map((item) => (
                            <div key={item.id} className={styles.contentCard}>
                                <div className={styles.contentThumb}>
                                    <FileText size={32} aria-hidden="true" style={{ color: '#7c3aed' }} />
                                </div>
                                <div className={styles.contentInfo}>
                                    <p className={styles.contentInfoTitle}>{item.title}</p>
                                    <div className={styles.contentInfoMeta}>
                                        <span className={styles.badge} style={statusBadgeStyle(item.status)}>{item.status ?? 'draft'}</span>
                                        <span style={{ color: '#9ca3af' }}>·</span>
                                        <Eye size={11} aria-hidden="true" />
                                        {(item.readTimeMin ?? 0)} min
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                                        By {item.author} · {new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                </div>
                                <div className={styles.contentActions}>
                                    <Button size="sm" variant="ghost" aria-label="Edit" onClick={() => openEditEditor(item)}>
                                        <Pencil size={13} aria-hidden="true" />
                                    </Button>
                                    <Button size="sm" variant="danger" onClick={() => void deleteItem(item.id)} aria-label="Delete">
                                        <Trash2 size={13} aria-hidden="true" />
                                    </Button>
                                    <Button size="sm" variant="ghost" aria-label="More">
                                        <MoreHorizontal size={13} aria-hidden="true" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
