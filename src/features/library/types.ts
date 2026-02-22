/**
 * types.ts — shared types for the Library feature
 */

export type ResourceType = 'article' | 'podcast' | 'video' | 'exercise' | 'guide';

export interface ResourceItem {
    id: string;
    type: ResourceType;
    title: string;
    excerpt?: string;
    body?: string;           // full content — available on detail fetch
    author: string;
    category: string;        // e.g. "Anxiety", "Sleep", "CBT"
    readTimeMin?: number;
    publishedAt: string;     // ISO-8601
    thumbnailUrl?: string;
    tags?: string[];
}

export interface ResourcesPage {
    items: ResourceItem[];
    total: number;
    nextCursor?: string;
}
