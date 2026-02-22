/**
 * MoodHistoryChart.tsx — minimal SVG sparkline for mood entries
 *
 * Renders a smooth polyline over a 7/30-day window with:
 *  - Gradient fill below the line
 *  - Circular data-point markers coloured by mood score
 *  - Hover tooltip (browser-native SVG <title>)
 *  - Y-axis labels (1–5)
 *  - X-axis date labels (abbreviated)
 *  - No external chart library
 */

import type { MoodEntry } from '../types';
import { MOOD_COLORS, MOOD_EMOJIS } from '../types';

interface Props {
    entries: MoodEntry[];
    /** px width of SVG; default 100% via viewBox */
    height?: number;
}

const PAD_L = 36;   // left padding for y-axis labels
const PAD_R = 12;
const PAD_T = 16;
const PAD_B = 32;   // bottom padding for x-axis dates

function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v));
}

export function MoodHistoryChart({ entries, height = 180 }: Props) {
    if (entries.length === 0) return null;

    // Sort ascending by date
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

    const W = 520;       // internal SVG width (viewBox)
    const H = height;
    const iW = W - PAD_L - PAD_R;
    const iH = H - PAD_T - PAD_B;

    // Map score 1–5 to Y coordinate (high score = lower Y)
    const yFor = (score: number) =>
        PAD_T + iH - ((clamp(score, 1, 5) - 1) / 4) * iH;

    // Map entry index to X coordinate
    const xFor = (i: number) =>
        PAD_L + (sorted.length === 1 ? iW / 2 : (i / (sorted.length - 1)) * iW);

    const points = sorted.map((e, i) => ({ x: xFor(i), y: yFor(e.moodScore), entry: e }));

    // Smooth polyline string (using cubic bezier for visual smoothness)
    function smoothPath(pts: { x: number; y: number }[]): string {
        if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) {
            const prev = pts[i - 1];
            const curr = pts[i];
            const cp1x = prev.x + (curr.x - prev.x) * 0.45;
            const cp1y = prev.y;
            const cp2x = curr.x - (curr.x - prev.x) * 0.45;
            const cp2y = curr.y;
            d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
        }
        return d;
    }

    const linePath = smoothPath(points);

    // Area path: close to bottom
    const areaPath =
        linePath +
        ` L ${points[points.length - 1].x},${PAD_T + iH}` +
        ` L ${points[0].x},${PAD_T + iH} Z`;

    // Y-axis guide lines and labels
    const yGuides = [1, 2, 3, 4, 5];

    // X-axis date labels (show every 2nd if many)
    const step = sorted.length > 14 ? Math.ceil(sorted.length / 7) : 1;

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            aria-label="Mood history chart"
            role="img"
            style={{ width: '100%', height: 'auto', display: 'block' }}
        >
            <defs>
                {/* Gradient fill */}
                <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                </linearGradient>
            </defs>

            {/* Y-axis guide lines */}
            {yGuides.map(score => {
                const y = yFor(score);
                return (
                    <g key={score}>
                        <line
                            x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
                            stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 3"
                        />
                        <text
                            x={PAD_L - 6} y={y + 4}
                            textAnchor="end"
                            fontSize="10"
                            fill="#9ca3af"
                        >
                            {score}
                        </text>
                    </g>
                );
            })}

            {/* Gradient area fill */}
            <path d={areaPath} fill="url(#moodGrad)" />

            {/* Line */}
            <path
                d={linePath}
                fill="none"
                stroke="#7c3aed"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Data points */}
            {points.map(({ x, y, entry }) => (
                <g key={entry.id}>
                    <circle
                        cx={x} cy={y} r={5}
                        fill={MOOD_COLORS[entry.moodScore]}
                        stroke="#fff"
                        strokeWidth="2"
                    >
                        <title>{`${entry.date}: ${MOOD_EMOJIS[entry.moodScore]} ${entry.moodScore}/5${entry.note ? ' — ' + entry.note.slice(0, 80) : ''}`}</title>
                    </circle>
                </g>
            ))}

            {/* X-axis date labels */}
            {sorted.map((entry, i) => {
                if (i % step !== 0 && i !== sorted.length - 1) return null;
                const x = xFor(i);
                const label = new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                    <text
                        key={entry.id}
                        x={x} y={H - 6}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#9ca3af"
                    >
                        {label}
                    </text>
                );
            })}
        </svg>
    );
}
