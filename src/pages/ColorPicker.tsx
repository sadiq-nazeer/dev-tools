import { useState } from 'react';
import { Palette, Copy, Check, RefreshCw, Layers } from 'lucide-react';

interface RGB { r: number; g: number; b: number }

function simulateColorBlindness(rgb: RGB): Record<string, string> {
    const { r, g, b } = rgb;
    const toHex = ({ r, g, b }: RGB) =>
        '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');

    const protanopia: RGB = {
        r: 0.567 * r + 0.433 * g,
        g: 0.558 * r + 0.442 * g,
        b: 0.242 * g + 0.758 * b,
    };
    const deuteranopia: RGB = {
        r: 0.625 * r + 0.375 * g,
        g: 0.700 * r + 0.300 * g,
        b: 0.300 * g + 0.700 * b,
    };
    const tritanopia: RGB = {
        r: 0.950 * r + 0.050 * g,
        g: 0.433 * g + 0.567 * b,
        b: 0.475 * g + 0.525 * b,
    };
    const lum = 0.213 * r + 0.715 * g + 0.072 * b;
    const achromatopsia: RGB = { r: lum, g: lum, b: lum };

    return {
        'Protanopia (Red-blind)': toHex(protanopia),
        'Deuteranopia (Green-blind)': toHex(deuteranopia),
        'Tritanopia (Blue-blind)': toHex(tritanopia),
        'Achromatopsia (No color)': toHex(achromatopsia),
    };
}

export default function ColorPicker() {
    const [color, setColor] = useState('#3b82f6');
    const [copied, setCopied] = useState<string | null>(null);

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    const hexToHsl = (hex: string) => {
        let { r, g, b } = hexToRgb(hex) || { r: 0, g: 0, b: 0 };
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    };

    const rgb = hexToRgb(color);
    const cvdSims = rgb ? simulateColorBlindness(rgb) : {};
    const hsl = hexToHsl(color);

    const formatRgb = rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '';
    const formatHsl = hsl ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : '';

    const copyToClipboard = async (text: string, key: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    const ColorBox = ({ label, value, keyName }: { label: string, value: string, keyName: string }) => (
        <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</label>
                <button
                    onClick={() => copyToClipboard(value, keyName)}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1"
                >
                    {copied === keyName ? <Check size={10} /> : <Copy size={10} />}
                    {copied === keyName ? 'Copied' : 'Copy'}
                </button>
            </div>
            <div className="p-4 rounded-xl border bg-card font-mono text-sm flex items-center justify-between group">
                <span className="font-bold">{value}</span>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-background p-6 overflow-auto">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Palette className="text-primary" /> Color Picker
                </h2>
            </div>

            <div className="space-y-12 max-w-5xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.5fr] gap-12">
                {/* Visual Picker */}
                <div className="space-y-6">
                    <div className="relative aspect-square w-full rounded-3xl border shadow-2xl overflow-hidden group">
                        <div
                            className="absolute inset-0 transition-colors duration-200"
                            style={{ backgroundColor: color }}
                        />
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 pointer-events-none">
                            <RefreshCw className="text-white animate-spin-slow" size={48} />
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-secondary/30 p-4 rounded-2xl border">
                        <input
                            type="text"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="flex-1 bg-transparent font-mono font-bold text-xl uppercase focus:outline-none"
                        />
                        <Layers className="text-muted-foreground" size={20} />
                    </div>
                </div>

                {/* Values and Alternatives */}
                <div className="space-y-8 py-4">
                    <div className="space-y-4">
                        <ColorBox label="Hex Code" value={color.toUpperCase()} keyName="hex" />
                        <ColorBox label="RGB" value={formatRgb} keyName="rgb" />
                        <ColorBox label="HSL" value={formatHsl} keyName="hsl" />
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Inspiration Palette</label>
                        <div className="grid grid-cols-5 gap-3">
                            {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#6366f1', '#14b8a6'].map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className="aspect-square rounded-lg border shadow-sm hover:scale-110 transition-transform duration-200"
                                    style={{ backgroundColor: c }}
                                    title={c}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Colorblindness Simulation */}
            {rgb && (
                <div className="space-y-4 pt-4 border-t">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Color Vision Deficiency Simulation</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-2 items-center">
                            <div className="w-full h-16 rounded-xl border shadow-sm" style={{ backgroundColor: color }} />
                            <p className="text-[10px] text-center text-muted-foreground font-medium">Original</p>
                            <p className="text-[10px] font-mono text-center">{color.toUpperCase()}</p>
                        </div>
                        {Object.entries(cvdSims).map(([label, simColor]) => (
                            <div key={label} className="flex flex-col gap-2 items-center">
                                <div className="w-full h-16 rounded-xl border shadow-sm" style={{ backgroundColor: simColor }} />
                                <p className="text-[10px] text-center text-muted-foreground font-medium leading-tight">{label.split(' ')[0]}</p>
                                <p className="text-[10px] font-mono text-center">{simColor.toUpperCase()}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground/60">Simulates how the color appears to people with color vision deficiency using standard CVD transformation matrices.</p>
                </div>
            )}
            </div>
        </div>
    );
}
