import { BookOpen, FileText, Headphones, Video, Map, LayoutGrid } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import styles from '../Library.module.css';
import type { ResourceType } from '../types';

// ── Category definitions ──────────────────────────────────────────────────────

interface Category {
    value: ResourceType | 'all';
    label: string;
    Icon: LucideIcon;
}

export const CATEGORIES: Category[] = [
    { value: 'all', label: 'All', Icon: LayoutGrid },
    { value: 'article', label: 'Articles', Icon: FileText },
    { value: 'podcast', label: 'Podcasts', Icon: Headphones },
    { value: 'video', label: 'Videos', Icon: Video },
    { value: 'exercise', label: 'Exercises', Icon: BookOpen },
    { value: 'guide', label: 'Guides', Icon: Map },
];

interface Props {
    active: ResourceType | 'all';
    onChange: (cat: ResourceType | 'all') => void;
}

/**
 * CategoryFilterChips — pill-shaped toggle buttons with aria-pressed.
 */
export function CategoryFilterChips({ active, onChange }: Props) {
    return (
        <div className={styles.filterRow} role="group" aria-label="Filter by content type">
            {CATEGORIES.map(({ value, label, Icon }) => {
                const isActive = active === value;
                return (
                    <button
                        key={value}
                        type="button"
                        className={`${styles.chip} ${isActive ? styles.chipActive : ''}`}
                        aria-pressed={isActive}
                        onClick={() => onChange(value)}
                    >
                        <Icon size={13} aria-hidden="true" />
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
