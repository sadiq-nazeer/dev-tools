import { useMemo, type CSSProperties } from 'react';
import { Plus, Minus, Layers, Grid } from 'lucide-react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { usePersistentState } from '../hooks/usePersistentState';
import { useToolPageMeta } from '../hooks/useToolPageMeta';
import { cn } from '../lib/utils';

interface LayoutConfig {
    mode: 'flex' | 'grid';
    itemCount: number;
    // Flex properties
    flexDirection: string;
    flexWrap: string;
    justifyContent: string;
    alignItems: string;
    alignContent: string;
    gap: number;
    // Grid properties
    gridTemplateColumns: string;
    gridTemplateRows: string;
}

export default function LayoutPlayground() {
    const meta = useToolPageMeta();
    const [config, setConfig] = usePersistentState<LayoutConfig>('layout_config', {
        mode: 'flex',
        itemCount: 4,
        flexDirection: 'row',
        flexWrap: 'nowrap',
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'stretch',
        gap: 16,
        gridTemplateColumns: 'repeat(2, 1fr)',
        gridTemplateRows: 'auto',
    });

    const generatedCss = useMemo(() => {
        if (config.mode === 'flex') {
            return `display: flex;
flex-direction: ${config.flexDirection};
flex-wrap: ${config.flexWrap};
justify-content: ${config.justifyContent};
align-items: ${config.alignItems};
align-content: ${config.alignContent};
gap: ${config.gap}px;`;
        } else {
            return `display: grid;
grid-template-columns: ${config.gridTemplateColumns};
grid-template-rows: ${config.gridTemplateRows};
gap: ${config.gap}px;`;
        }
    }, [config]);

    const updateConfig = (updates: Partial<LayoutConfig>) => {
        setConfig({ ...config, ...updates });
    };

    return (
        <ToolLayout
            title={meta?.label ?? 'Flex/Grid'}
            description={meta?.desc}
            onCopy={() => navigator.clipboard.writeText(generatedCss)}
            onClear={() => setConfig({
                mode: 'flex',
                itemCount: 4,
                flexDirection: 'row',
                flexWrap: 'nowrap',
                justifyContent: 'center',
                alignItems: 'center',
                alignContent: 'stretch',
                gap: 16,
                gridTemplateColumns: 'repeat(2, 1fr)',
                gridTemplateRows: 'auto',
            })}
        >
            <div className="h-full flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x overflow-hidden">
                {/* Controls Sidebar */}
                <div className="w-full lg:w-96 bg-card overflow-y-auto p-6 space-y-8 pb-20">
                    <div className="space-y-6">
                        <div className="flex p-1 bg-secondary rounded-xl">
                            <button
                                onClick={() => updateConfig({ mode: 'flex' })}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all",
                                    config.mode === 'flex' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Layers size={14} /> Flexbox
                            </button>
                            <button
                                onClick={() => updateConfig({ mode: 'grid' })}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all",
                                    config.mode === 'grid' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Grid size={14} /> CSS Grid
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Items</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => updateConfig({ itemCount: Math.max(1, config.itemCount - 1) })}
                                        className="p-1 hover:bg-secondary rounded border"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="text-sm font-bold w-4 text-center">{config.itemCount}</span>
                                    <button
                                        onClick={() => updateConfig({ itemCount: config.itemCount + 1 })}
                                        className="p-1 hover:bg-secondary rounded border"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between">
                                    <label className="text-[11px] font-medium">Gap</label>
                                    <span className="text-[10px] font-mono text-muted-foreground">{config.gap}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={config.gap}
                                    onChange={(e) => updateConfig({ gap: parseInt(e.target.value) })}
                                    className="w-full accent-primary h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-6 border-t">
                            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                {config.mode === 'flex' ? 'Flexbox' : 'Grid'} Properties
                            </h3>

                            {config.mode === 'flex' ? (
                                <div className="space-y-4">
                                    {[
                                        { label: 'Flex Direction', key: 'flexDirection', options: ['row', 'row-reverse', 'column', 'column-reverse'] },
                                        { label: 'Flex Wrap', key: 'flexWrap', options: ['nowrap', 'wrap', 'wrap-reverse'] },
                                        { label: 'Justify Content', key: 'justifyContent', options: ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'] },
                                        { label: 'Align Items', key: 'alignItems', options: ['stretch', 'flex-start', 'flex-end', 'center', 'baseline'] },
                                        { label: 'Align Content', key: 'alignContent', options: ['stretch', 'flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'] },
                                    ].map((prop) => (
                                        <div key={prop.key} className="space-y-2">
                                            <label className="text-[11px] font-medium">{prop.label}</label>
                                            <select
                                                value={config[prop.key as keyof LayoutConfig]}
                                                onChange={(e) => updateConfig({ [prop.key]: e.target.value })}
                                                className="w-full bg-secondary border-none rounded-lg px-3 py-2 text-xs font-medium outline-none focus:ring-1 ring-primary/20"
                                            >
                                                {prop.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-medium">Grid Template Columns</label>
                                        <input
                                            type="text"
                                            value={config.gridTemplateColumns}
                                            onChange={(e) => updateConfig({ gridTemplateColumns: e.target.value })}
                                            className="w-full bg-secondary border-none rounded-lg px-3 py-2 text-xs font-mono outline-none focus:ring-1 ring-primary/20"
                                            placeholder="e.g. repeat(2, 1fr)"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-medium">Grid Template Rows</label>
                                        <input
                                            type="text"
                                            value={config.gridTemplateRows}
                                            onChange={(e) => updateConfig({ gridTemplateRows: e.target.value })}
                                            className="w-full bg-secondary border-none rounded-lg px-3 py-2 text-xs font-mono outline-none focus:ring-1 ring-primary/20"
                                            placeholder="e.g. auto"
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                                        Tip: Use CSS units like 1fr, 200px, 50% or auto.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 bg-background flex flex-col min-w-0">
                    <div className="flex-1 p-8 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:20px_20px] overflow-auto">
                        <div
                            className="bg-primary/5 min-h-full border border-dashed rounded-3xl p-4 transition-all duration-300"
                            style={{
                                display: config.mode,
                                gap: `${config.gap}px`,
                                ...(config.mode === 'flex' ? {
                                    flexDirection: config.flexDirection as CSSProperties['flexDirection'],
                                    flexWrap: config.flexWrap as CSSProperties['flexWrap'],
                                    justifyContent: config.justifyContent,
                                    alignItems: config.alignItems,
                                    alignContent: config.alignContent,
                                } : {
                                    gridTemplateColumns: config.gridTemplateColumns,
                                    gridTemplateRows: config.gridTemplateRows,
                                })
                            }}
                        >
                            {Array.from({ length: config.itemCount }).map((_, i) => (
                                <div
                                    key={i}
                                    className="min-w-[60px] min-h-[60px] p-4 bg-card border-2 border-primary/20 rounded-2xl flex items-center justify-center font-bold text-primary shadow-sm animate-in zoom-in duration-300"
                                >
                                    {i + 1}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Result Code */}
                    <div className="p-6 bg-card border-t shrink-0">
                        <div className="mb-3">
                            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Generated CSS</h3>
                        </div>
                        <div className="bg-background border rounded-2xl p-4 font-mono text-sm overflow-x-auto whitespace-pre text-primary">
                            {generatedCss}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
