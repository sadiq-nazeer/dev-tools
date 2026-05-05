import { useState } from 'react';
import { Eye } from 'lucide-react';

function hexToRgb(hex: string): [number, number, number] | null {
    const cleaned = hex.replace('#', '');
    if (cleaned.length === 3) {
        const r = parseInt(cleaned[0] + cleaned[0], 16);
        const g = parseInt(cleaned[1] + cleaned[1], 16);
        const b = parseInt(cleaned[2] + cleaned[2], 16);
        return [r, g, b];
    }
    if (cleaned.length === 6) {
        return [parseInt(cleaned.slice(0, 2), 16), parseInt(cleaned.slice(2, 4), 16), parseInt(cleaned.slice(4, 6), 16)];
    }
    return null;
}

function linearize(c: number): number {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrastRatio(l1: number, l2: number): number {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

interface WcagLevel {
    label: string;
    requirement: string;
    min: number;
}

const LEVELS: Record<string, WcagLevel[]> = {
    'Normal Text': [
        { label: 'AA', requirement: 'Minimum', min: 4.5 },
        { label: 'AAA', requirement: 'Enhanced', min: 7 },
    ],
    'Large Text (18pt+ / 14pt bold)': [
        { label: 'AA', requirement: 'Minimum', min: 3 },
        { label: 'AAA', requirement: 'Enhanced', min: 4.5 },
    ],
    'UI Components & Graphics': [
        { label: 'AA', requirement: 'Minimum', min: 3 },
    ],
};

const SAMPLE_PAIRS = [
    { label: 'Black on White', fg: '#000000', bg: '#FFFFFF' },
    { label: 'White on Blue', fg: '#FFFFFF', bg: '#0052CC' },
    { label: 'Gray on White', fg: '#767676', bg: '#FFFFFF' },
    { label: 'Yellow on Black', fg: '#FFD700', bg: '#000000' },
];

export default function WcagContrastChecker() {
    const [fg, setFg] = useState('#000000');
    const [bg, setBg] = useState('#FFFFFF');

    const fgRgb = hexToRgb(fg);
    const bgRgb = hexToRgb(bg);

    const ratio = fgRgb && bgRgb
        ? contrastRatio(relativeLuminance(fgRgb), relativeLuminance(bgRgb))
        : null;

    const ratioDisplay = ratio ? ratio.toFixed(2) + ':1' : '—';

    return (
        <div className="h-full flex flex-col bg-background p-6 overflow-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Eye className="text-primary" /> WCAG Contrast Checker
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Check color contrast ratios against WCAG 2.1 accessibility guidelines.</p>
            </div>

            <div className="space-y-8 max-w-2xl mx-auto w-full">
                {/* Color Inputs */}
                <div className="grid grid-cols-2 gap-6">
                    {[
                        { label: 'Foreground (Text)', value: fg, onChange: setFg },
                        { label: 'Background', value: bg, onChange: setBg },
                    ].map(({ label, value, onChange }) => (
                        <div key={label} className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</label>
                            <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                                <input
                                    type="color"
                                    value={value}
                                    onChange={(e) => onChange(e.target.value)}
                                    className="w-10 h-10 rounded-lg border cursor-pointer bg-transparent"
                                />
                                <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => onChange(e.target.value)}
                                    className="flex-1 font-mono text-sm bg-transparent focus:outline-none uppercase"
                                    maxLength={7}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Live Preview */}
                <div
                    className="rounded-xl border overflow-hidden"
                    style={{ backgroundColor: bg }}
                >
                    <div className="p-6" style={{ color: fg }}>
                        <p className="text-2xl font-bold mb-1">The quick brown fox</p>
                        <p className="text-base mb-1">Jumps over the lazy dog. 0123456789</p>
                        <p className="text-sm">Small text — harder to read at low contrast</p>
                    </div>
                    <div className="px-6 pb-4 flex gap-3" style={{ color: fg }}>
                        <button className="px-4 py-2 rounded-lg border text-sm font-medium" style={{ borderColor: fg }}>Button</button>
                        <span className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: fg, color: bg }}>Inverted</span>
                    </div>
                </div>

                {/* Contrast Ratio */}
                <div className="text-center p-6 rounded-xl border bg-secondary/20">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Contrast Ratio</p>
                    <p className="text-5xl font-extrabold text-primary">{ratioDisplay}</p>
                </div>

                {/* WCAG Results */}
                {ratio && (
                    <div className="space-y-4">
                        {Object.entries(LEVELS).map(([context, levels]) => (
                            <div key={context} className="rounded-xl border overflow-hidden">
                                <div className="px-4 py-2 bg-secondary/30 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    {context}
                                </div>
                                {levels.map(level => {
                                    const pass = ratio >= level.min;
                                    return (
                                        <div key={level.label} className="flex items-center justify-between px-4 py-3 border-t">
                                            <div>
                                                <span className="font-bold text-sm">WCAG {level.label}</span>
                                                <span className="text-xs text-muted-foreground ml-2">{level.requirement} (≥ {level.min}:1)</span>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${pass ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}`}>
                                                {pass ? '✓ Pass' : '✗ Fail'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}

                {/* Sample Pairs */}
                <div className="space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Sample Pairs</p>
                    <div className="grid grid-cols-2 gap-2">
                        {SAMPLE_PAIRS.map(pair => (
                            <button
                                key={pair.label}
                                onClick={() => { setFg(pair.fg); setBg(pair.bg); }}
                                className="p-3 rounded-lg border text-left hover:border-primary/50 transition-colors"
                            >
                                <div className="flex gap-2 mb-1">
                                    <div className="w-5 h-5 rounded border" style={{ backgroundColor: pair.fg }} />
                                    <div className="w-5 h-5 rounded border" style={{ backgroundColor: pair.bg }} />
                                </div>
                                <p className="text-xs font-medium">{pair.label}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
