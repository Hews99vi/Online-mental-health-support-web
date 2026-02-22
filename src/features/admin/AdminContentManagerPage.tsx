import { useState } from 'react';
import {
    FilePlus,
    Video,
    FileText,
    BookOpen,
    MoreHorizontal,
    Pencil,
    Trash2,
    Eye,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import styles from './Admin.module.css';

// ── Stub content items ─────────────────────────────────────────────────────────

const CONTENT_TYPES = ['All', 'Article', 'Video', 'Exercise'];

interface ContentItem {
    id: string;
    title: string;
    type: 'Article' | 'Video' | 'Exercise';
    author: string;
    published: string;
    views: number;
}

const STUB_ITEMS: ContentItem[] = [
    { id: 'c1', title: 'Understanding Anxiety: A Beginner\'s Guide', type: 'Article', author: 'Dr. Priya Sharma', published: '2026-02-14', views: 1243 },
    { id: 'c2', title: '5-Minute Breathing Exercise — Calm in a Crisis', type: 'Video', author: 'Admin', published: '2026-02-10', views: 870 },
    { id: 'c3', title: 'CBT Thought Record Worksheet', type: 'Exercise', author: 'Dr. Emma Wilson', published: '2026-02-07', views: 605 },
    { id: 'c4', title: 'Grounding Techniques for Panic Attacks', type: 'Article', author: 'Dr. Marcus Lee', published: '2026-01-29', views: 2104 },
    { id: 'c5', title: 'Mindful Walking — Guided 10-min Video', type: 'Video', author: 'Admin', published: '2026-01-22', views: 430 },
    { id: 'c6', title: 'Sleep Hygiene Checklist', type: 'Exercise', author: 'Dr. Amara Osei', published: '2026-01-15', views: 789 },
];

const TYPE_ICON: Record<ContentItem['type'], typeof FileText> = {
    Article: FileText,
    Video: Video,
    Exercise: BookOpen,
};

const TYPE_COLOR: Record<ContentItem['type'], string> = {
    Article: '#7c3aed',
    Video: '#2563eb',
    Exercise: '#059669',
};

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminContentManagerPage() {
    const [filter, setFilter] = useState('All');
    const [items, setItems] = useState(STUB_ITEMS);

    const filtered = filter === 'All' ? items : items.filter(i => i.type === filter);

    const handleDelete = (id: string) => {
        if (window.confirm('Delete this content item? This action cannot be undone.')) {
            setItems(prev => prev.filter(i => i.id !== id));
        }
    };

    return (
        <main className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Content Manager</h1>
                    <p className={styles.subtitle}>Manage self-help articles, videos, and exercises in the library.</p>
                </div>
                <div className={styles.headerActions}>
                    <Button size="sm" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <FilePlus size={15} aria-hidden="true" />
                        New content
                    </Button>
                </div>
            </div>

            <div className={styles.card}>
                {/* Toolbar */}
                <div className={styles.contentToolbar}>
                    {CONTENT_TYPES.map(t => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setFilter(t)}
                            style={{
                                padding: '0.35rem 0.875rem',
                                borderRadius: '99px',
                                border: '1px solid',
                                fontSize: '0.8125rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                                background: filter === t ? '#7c3aed' : '#f3f4f6',
                                color: filter === t ? '#fff' : '#374151',
                                borderColor: filter === t ? '#7c3aed' : '#e5e7eb',
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* Content grid */}
                <div className={styles.contentGrid}>
                    {filtered.map(item => {
                        const Icon = TYPE_ICON[item.type];
                        const color = TYPE_COLOR[item.type];
                        return (
                            <div key={item.id} className={styles.contentCard}>
                                <div className={styles.contentThumb}>
                                    <Icon size={32} aria-hidden="true" style={{ color }} />
                                </div>
                                <div className={styles.contentInfo}>
                                    <p className={styles.contentInfoTitle}>{item.title}</p>
                                    <div className={styles.contentInfoMeta}>
                                        <span className={`${styles.badge}`} style={{ background: color + '1a', color }}>
                                            {item.type}
                                        </span>
                                        <span style={{ color: '#9ca3af' }}>·</span>
                                        <Eye size={11} aria-hidden="true" />
                                        {item.views.toLocaleString()} views
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                                        By {item.author} · {new Date(item.published).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                </div>
                                <div className={styles.contentActions}>
                                    <Button size="sm" variant="ghost" aria-label="Edit">
                                        <Pencil size={13} aria-hidden="true" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() => handleDelete(item.id)}
                                        aria-label="Delete"
                                    >
                                        <Trash2 size={13} aria-hidden="true" />
                                    </Button>
                                    <Button size="sm" variant="ghost" aria-label="More">
                                        <MoreHorizontal size={13} aria-hidden="true" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
