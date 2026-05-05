import { useState } from 'react';
import { Palette, Copy, Check, Plus, Trash2 } from 'lucide-react';

type GradientType = 'linear' | 'radial' | 'conic';
type RadialShape = 'ellipse' | 'circle';
type RadialPosition = 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top left' | 'top right' | 'bottom left' | 'bottom right';

interface Stop { id: number; color: string; position: number }

let _id = 0;
const newStop = (color: string, position: number): Stop => ({ id: ++_id, color, position });

const DEFAULT_STOPS: Stop[] = [newStop('#6366f1', 0), newStop('#06b6d4', 100)];

function buildCss(type: GradientType, angle: number, shape: RadialShape, position: RadialPosition, stops: Stop[]): string {
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    const stopStr = sorted.map(s => `${s.color} ${s.position}%`).join(', ');
    if (type === 'linear') return `linear-gradient(${angle}deg, ${stopStr})`;
    if (type === 'radial') return `radial-gradient(${shape} at ${position}, ${stopStr})`;
    return `conic-gradient(from ${angle}deg at center, ${stopStr})`;
}

export default function CssGradientGenerator() {
    const [type, setType] = useState<GradientType>('linear');
    const [angle, setAngle] = useState(135);
    const [shape, setShape] = useState<RadialShape>('ellipse');
    const [position, setPosition] = useState<RadialPosition>('center');
    const [stops, setStops] = useState<Stop[]>(DEFAULT_STOPS);
    const [copied, setCopied] = useState(false);

    const css = buildCss(type, angle, shape, position, stops);
    const fullCss = `background: ${css};`;

    const copy = async () => {
        await navigator.clipboard.writeText(fullCss);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const addStop = () => {
        const mid = Math.round((stops[0].position + stops[stops.length - 1].position) / 2);
        setStops(prev => [...prev, newStop('#f59e0b', mid)].sort((a, b) => a.position - b.position));
    };

    const updateStop = (id: number, field: keyof Stop, value: string | number) => {
        setStops(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const removeStop = (id: number) => {
        if (stops.length <= 2) return;
        setStops(prev => prev.filter(s => s.id !== id));
    };

    const POSITIONS: RadialPosition[] = ['center', 'top', 'bottom', 'left', 'right', 'top left', 'top right', 'bottom left', 'bottom right'];

    return (
        <div className="h-full flex flex-col bg-background p-6 overflow-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Palette className="text-primary" /> CSS Gradient Generator
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Build beautiful gradients visually and copy the CSS.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Controls */}
                <div className="space-y-6">
                    {/* Type */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Type</label>
                        <div className="flex gap-2">
                            {(['linear', 'radial', 'conic'] as GradientType[]).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors border ${type === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/20 hover:bg-secondary/40 border-border'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Angle (linear & conic) */}
                    {(type === 'linear' || type === 'conic') && (
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Angle</label>
                                <span className="text-xs font-mono text-muted-foreground">{angle}°</span>
                            </div>
                            <input
                                type="range" min={0} max={360} value={angle}
                                onChange={e => setAngle(+e.target.value)}
                                className="w-full accent-primary"
                            />
                        </div>
                    )}

                    {/* Shape + Position (radial) */}
                    {type === 'radial' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Shape</label>
                                <div className="flex gap-2">
                                    {(['ellipse', 'circle'] as RadialShape[]).map(s => (
                                        <button key={s} onClick={() => setShape(s)}
                                            className={`flex-1 py-2 rounded-lg text-sm capitalize border transition-colors ${shape === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/20 border-border'}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Position</label>
                                <select value={position} onChange={e => setPosition(e.target.value as RadialPosition)}
                                    className="w-full p-2 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary capitalize">
                                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Color Stops */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Color Stops</label>
                            <button onClick={addStop} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                                <Plus size={12} /> Add stop
                            </button>
                        </div>
                        <div className="space-y-2">
                            {stops.map(stop => (
                                <div key={stop.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                                    <input type="color" value={stop.color}
                                        onChange={e => updateStop(stop.id, 'color', e.target.value)}
                                        className="w-9 h-9 rounded-lg border cursor-pointer bg-transparent" />
                                    <input type="text" value={stop.color}
                                        onChange={e => updateStop(stop.id, 'color', e.target.value)}
                                        className="w-24 font-mono text-sm bg-transparent focus:outline-none uppercase" />
                                    <div className="flex-1 flex items-center gap-2">
                                        <input type="range" min={0} max={100} value={stop.position}
                                            onChange={e => updateStop(stop.id, 'position', +e.target.value)}
                                            className="flex-1 accent-primary" />
                                        <span className="text-xs font-mono text-muted-foreground w-10 text-right">{stop.position}%</span>
                                    </div>
                                    <button onClick={() => removeStop(stop.id)} disabled={stops.length <= 2}
                                        className="text-muted-foreground hover:text-destructive disabled:opacity-20 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview + Output */}
                <div className="space-y-6">
                    {/* Preview */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Preview</label>
                        <div className="rounded-xl border overflow-hidden h-56" style={{ background: css }} />
                    </div>

                    {/* CSS Output */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">CSS Output</label>
                            <button onClick={copy} className="text-[10px] text-primary hover:underline flex items-center gap-1.5">
                                {copied ? <Check size={12} /> : <Copy size={12} />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <div className="p-4 rounded-lg border bg-secondary/20 font-mono text-xs break-all leading-relaxed">
                            <span className="text-blue-500">background</span>
                            <span className="text-muted-foreground">: </span>
                            <span>{css}</span>
                            <span className="text-muted-foreground">;</span>
                        </div>
                    </div>

                    {/* Gradient Bar */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Stop Preview</label>
                        <div className="h-8 rounded-lg border" style={{ background: `linear-gradient(90deg, ${[...stops].sort((a,b)=>a.position-b.position).map(s=>`${s.color} ${s.position}%`).join(', ')})` }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
