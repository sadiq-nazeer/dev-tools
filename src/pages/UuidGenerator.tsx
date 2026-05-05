import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Copy, Check, Hash, RefreshCcw, LayoutList } from 'lucide-react';
import { cn } from '../lib/utils';
import { ToolLayout } from '../components/layout/ToolLayout';
import { useToolPageMeta } from '../hooks/useToolPageMeta';

export default function UuidGenerator() {
    const meta = useToolPageMeta();
    const [uuids, setUuids] = useState<string[]>([]);
    const [count, setCount] = useState(1);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const generateUuids = () => {
        const newUuids = Array.from({ length: Math.min(Math.max(count, 1), 100) }, () => uuidv4());
        setUuids(newUuids);
    };

    const copyToClipboard = async (text: string, index: number) => {
        await navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <ToolLayout
            title={meta?.label ?? 'UUID Gen'}
            description={meta?.desc}
            onCopy={() => {
                if (!uuids.length) return;
                return navigator.clipboard.writeText(uuids.join('\n'));
            }}
            onClear={() => setUuids([])}
            actions={
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 border rounded-md px-2 py-1 bg-card">
                        <LayoutList size={14} className="text-muted-foreground" />
                        <input
                            type="number"
                            min={1}
                            max={100}
                            value={count}
                            onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)}
                            className="w-10 bg-transparent focus:outline-none text-xs font-medium"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={generateUuids}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90 transition-colors"
                    >
                        <RefreshCcw size={14} /> Generate
                    </button>
                </div>
            }
        >
            <div className="p-4 md:p-6 flex-1 min-h-0 flex flex-col space-y-4 max-w-3xl mx-auto w-full">
                {uuids.length > 0 ? (
                    <div className="flex-1 overflow-auto rounded-xl border bg-card/50">
                        <div className="flex flex-col">
                            {uuids.map((uuid, idx) => (
                                <div
                                    key={uuid}
                                    className={cn(
                                        'flex items-center justify-between p-4 border-b last:border-0 hover:bg-secondary/40 transition-colors group',
                                        idx % 2 === 0 ? 'bg-secondary/10' : 'bg-card'
                                    )}
                                >
                                    <span className="font-mono text-sm tracking-tight">{uuid}</span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(uuid, idx)}
                                        className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all text-muted-foreground hover:text-foreground"
                                        title="Copy this UUID"
                                    >
                                        {copiedIndex === idx ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl border-muted text-muted-foreground space-y-4 min-h-[240px]">
                        <div className="p-6 bg-secondary/50 rounded-full">
                            <Hash size={48} className="opacity-20" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-medium text-lg">No UUIDs Generated</h3>
                            <p className="text-sm">Adjust the count and click Generate to start.</p>
                        </div>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
