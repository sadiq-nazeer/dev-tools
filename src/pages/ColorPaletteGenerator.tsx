import { useState } from 'react';
import { Palette, Copy, Check } from 'lucide-react';

function hexToHsl(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
    const hNorm = ((h % 360) + 360) % 360;
    const sNorm = s / 100, lNorm = l / 100;
    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
    const x = c * (1 - Math.abs((hNorm / 60) % 2 - 1));
    const m = lNorm - c / 2;
    let r = 0, g = 0, b = 0;
    if (hNorm < 60) { r = c; g = x; }
    else if (hNorm < 120) { r = x; g = c; }
    else if (hNorm < 180) { g = c; b = x; }
    else if (hNorm < 240) { g = x; b = c; }
    else if (hNorm < 300) { r = x; b = c; }
    else { r = c; b = x; }
    const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToRgb(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
}

interface Swatch { label: string; hex: string }

function generatePalettes(baseHex: string): Record<string, Swatch[]> {
    const [h, s, l] = hexToHsl(baseHex);

    return {
        'Complementary': [
            { label: 'Base', hex: baseHex },
            { label: 'Complement', hex: hslToHex(h + 180, s, l) },
        ],
        'Analogous': [
            { label: '-30°', hex: hslToHex(h - 30, s, l) },
            { label: 'Base', hex: baseHex },
            { label: '+30°', hex: hslToHex(h + 30, s, l) },
        ],
        'Triadic': [
            { label: 'Base', hex: baseHex },
            { label: '+120°', hex: hslToHex(h + 120, s, l) },
            { label: '+240°', hex: hslToHex(h + 240, s, l) },
        ],
        'Split-Complementary': [
            { label: 'Base', hex: baseHex },
            { label: '+150°', hex: hslToHex(h + 150, s, l) },
            { label: '+210°', hex: hslToHex(h + 210, s, l) },
        ],
        'Tints': [90, 80, 70, 60, 50].map((lightness, i) => ({
            label: `${100 - i * 10}%`,
            hex: hslToHex(h, s, lightness),
        })),
        'Shades': [40, 30, 20, 15, 10].map((lightness, i) => ({
            label: `${40 - i * 10}%`,
            hex: hslToHex(h, s, lightness),
        })),
        'Saturations': [20, 40, 60, 80, 100].map(sat => ({
            label: `${sat}%`,
            hex: hslToHex(h, sat, l),
        })),
    };
}

export default function ColorPaletteGenerator() {
    const [base, setBase] = useState('#6366f1');
    const [copied, setCopied] = useState<string | null>(null);

    const palettes = generatePalettes(base);
    const [h, s, l] = hexToHsl(base);

    const copy = async (text: string, key: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 1500);
    };

    return (
        <div className="h-full flex flex-col bg-background p-6 overflow-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Palette className="text-primary" /> Color Palette Generator
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Pick a base color and explore harmonious palettes, tints, and shades.</p>
            </div>

            <div className="space-y-8">
                {/* Base Color Picker */}
                <div className="flex items-center gap-6 p-5 rounded-xl border bg-card">
                    <input
                        type="color"
                        value={base}
                        onChange={e => setBase(e.target.value)}
                        className="w-16 h-16 rounded-xl border-2 cursor-pointer bg-transparent"
                    />
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Base Color</p>
                        <div className="flex gap-3 flex-wrap text-sm font-mono">
                            <button onClick={() => copy(base, 'hex')} className="hover:text-primary transition-colors flex items-center gap-1">
                                {base.toUpperCase()}
                                {copied === 'hex' ? <Check size={12} /> : <Copy size={12} className="opacity-50" />}
                            </button>
                            <span className="text-muted-foreground">·</span>
                            <button onClick={() => copy(hexToRgb(base), 'rgb')} className="hover:text-primary transition-colors flex items-center gap-1">
                                {hexToRgb(base)}
                                {copied === 'rgb' ? <Check size={12} /> : <Copy size={12} className="opacity-50" />}
                            </button>
                            <span className="text-muted-foreground">·</span>
                            <button onClick={() => copy(`hsl(${h}, ${s}%, ${l}%)`, 'hsl')} className="hover:text-primary transition-colors flex items-center gap-1">
                                hsl({h}, {s}%, {l}%)
                                {copied === 'hsl' ? <Check size={12} /> : <Copy size={12} className="opacity-50" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Palettes */}
                {Object.entries(palettes).map(([name, swatches]) => (
                    <div key={name} className="space-y-3">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{name}</p>
                        <div className="flex gap-3 flex-wrap">
                            {swatches.map((swatch, i) => (
                                <button
                                    key={i}
                                    onClick={() => copy(swatch.hex, `${name}-${i}`)}
                                    className="group flex flex-col items-center gap-2"
                                    title={`Copy ${swatch.hex}`}
                                >
                                    <div
                                        className="w-16 h-16 rounded-xl border-2 border-border group-hover:border-primary transition-all shadow-sm group-hover:scale-110 duration-200 relative"
                                        style={{ backgroundColor: swatch.hex }}
                                    >
                                        {copied === `${name}-${i}` && (
                                            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/20">
                                                <Check size={16} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-mono text-foreground">{swatch.hex.toUpperCase()}</p>
                                        <p className="text-[9px] text-muted-foreground">{swatch.label}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
