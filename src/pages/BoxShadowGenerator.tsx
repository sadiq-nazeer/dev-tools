import { useMemo } from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { usePersistentState } from '../hooks/usePersistentState';
import { useToolPageMeta } from '../hooks/useToolPageMeta';

interface ShadowConfig {
    inset: boolean;
    offsetX: number;
    offsetY: number;
    blur: number;
    spread: number;
    color: string;
    opacity: number;
}

export default function BoxShadowGenerator() {
    const meta = useToolPageMeta();
    const [config, setConfig] = usePersistentState<ShadowConfig>('shadow_config', {
        inset: false,
        offsetX: 10,
        offsetY: 10,
        blur: 20,
        spread: 0,
        color: '#000000',
        opacity: 0.2
    });

    const shadowString = useMemo(() => {
        const rgba = hexToRgba(config.color, config.opacity);
        return `${config.inset ? 'inset ' : ''}${config.offsetX}px ${config.offsetY}px ${config.blur}px ${config.spread}px ${rgba}`;
    }, [config]);

    function hexToRgba(hex: string, opacity: number) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    const updateConfig = (updates: Partial<ShadowConfig>) => {
        setConfig({ ...config, ...updates });
    };

    return (
        <ToolLayout
            title={meta?.label ?? 'CSS Shadow'}
            description={meta?.desc}
            onCopy={() => navigator.clipboard.writeText(`box-shadow: ${shadowString};`)}
            onClear={() => setConfig({
                inset: false,
                offsetX: 10,
                offsetY: 10,
                blur: 20,
                spread: 0,
                color: '#000000',
                opacity: 0.2
            })}
        >
            <div className="h-full flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x overflow-hidden">
                {/* Controls Sidebar */}
                <div className="w-full lg:w-96 bg-card overflow-y-auto p-6 space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Shadow Properties</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-muted-foreground">INSET</span>
                                <button
                                    onClick={() => updateConfig({ inset: !config.inset })}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${config.inset ? 'bg-primary' : 'bg-secondary'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${config.inset ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>

                        {[
                            { label: 'Shift Right', key: 'offsetX', min: -100, max: 100 },
                            { label: 'Shift Down', key: 'offsetY', min: -100, max: 100 },
                            { label: 'Blur', key: 'blur', min: 0, max: 100 },
                            { label: 'Spread', key: 'spread', min: -100, max: 100 },
                        ].map((prop) => (
                            <div key={prop.key} className="space-y-1.5">
                                <div className="flex justify-between">
                                    <label className="text-[11px] font-medium">{prop.label}</label>
                                    <span className="text-[10px] font-mono text-muted-foreground">{config[prop.key as keyof ShadowConfig]}px</span>
                                </div>
                                <input
                                    type="range"
                                    min={prop.min}
                                    max={prop.max}
                                    value={config[prop.key as keyof ShadowConfig] as number}
                                    onChange={(e) => updateConfig({ [prop.key]: parseInt(e.target.value) })}
                                    className="w-full accent-primary h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Color & Opacity</h3>

                        <div className="space-y-3">
                            <div className="flex gap-4">
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-[11px] font-medium">Color</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={config.color}
                                            onChange={(e) => updateConfig({ color: e.target.value })}
                                            className="w-10 h-10 rounded-lg overflow-hidden border-none shrink-0"
                                        />
                                        <input
                                            type="text"
                                            value={config.color}
                                            onChange={(e) => updateConfig({ color: e.target.value })}
                                            className="flex-1 bg-secondary border-none rounded-lg px-3 text-sm font-mono uppercase focus:ring-1 ring-primary/20 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between">
                                    <label className="text-[11px] font-medium">Opacity</label>
                                    <span className="text-[10px] font-mono text-muted-foreground">{Math.round(config.opacity * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={config.opacity * 100}
                                    onChange={(e) => updateConfig({ opacity: parseInt(e.target.value) / 100 })}
                                    className="w-full accent-primary h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 bg-background relative flex flex-col overflow-hidden">
                    <div className="flex-1 flex items-center justify-center p-12 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:20px_20px]">
                        <div
                            className="w-64 h-64 bg-card rounded-3xl transition-all duration-75 flex items-center justify-center text-muted-foreground/30 font-bold border"
                            style={{ boxShadow: shadowString }}
                        >
                            PREVIEW
                        </div>
                    </div>

                    {/* Result Code */}
                    <div className="p-6 bg-card border-t shrink-0">
                        <div className="mb-3">
                            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Generated CSS</h3>
                        </div>
                        <div className="bg-background border rounded-2xl p-4 font-mono text-sm overflow-x-auto whitespace-pre text-primary">
                            <span className="text-muted-foreground">box-shadow:</span> {shadowString};
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
