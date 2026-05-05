import { useState } from 'react';
import {
    Hammer,
    Trash2,
    Copy,
    Check,
    Plus,
    FileEdit,
    Rocket,
    Bug,
    Zap,
    Tag
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Change {
    type: 'feat' | 'fix' | 'perf' | 'other';
    text: string;
}

export default function ChangelogGenerator() {
    const [version, setVersion] = useState('1.0.0');
    const [changes, setChanges] = useState<Change[]>([
        { type: 'feat', text: 'Initial release with core features' },
        { type: 'perf', text: 'Optimized rendering performance' }
    ]);
    const [newChange, setNewChange] = useState('');
    const [newType, setNewType] = useState<Change['type']>('feat');
    const [copied, setCopied] = useState(false);

    const addChange = () => {
        if (!newChange.trim()) return;
        setChanges([...changes, { type: newType, text: newChange }]);
        setNewChange('');
    };

    const removeChange = (idx: number) => {
        setChanges(changes.filter((_, i) => i !== idx));
    };

    const generate = () => {
        const sections = {
            feat: changes.filter(c => c.type === 'feat'),
            fix: changes.filter(c => c.type === 'fix'),
            perf: changes.filter(c => c.type === 'perf'),
            other: changes.filter(c => c.type === 'other'),
        };

        let log = `## [${version}] - ${new Date().toISOString().split('T')[0]}\n\n`;

        if (sections.feat.length) log += `### Added\n${sections.feat.map(c => `- ${c.text}`).join('\n')}\n\n`;
        if (sections.fix.length) log += `### Fixed\n${sections.fix.map(c => `- ${c.text}`).join('\n')}\n\n`;
        if (sections.perf.length) log += `### Optimized\n${sections.perf.map(c => `- ${c.text}`).join('\n')}\n\n`;
        if (sections.other.length) log += `### Other Changes\n${sections.other.map(c => `- ${c.text}`).join('\n')}\n\n`;

        return log;
    };

    const copy = async () => {
        await navigator.clipboard.writeText(generate());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const clear = () => {
        setChanges([]);
        setNewChange('');
    };

    return (
        <div className="h-full flex flex-col bg-background p-6 overflow-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <FileEdit className="text-primary" size={28} />
                    <div>
                        <h2 className="text-2xl font-bold">Changelog Gen</h2>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Standardized Release Notes</p>
                    </div>
                </div>
                <button
                    onClick={clear}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto w-full flex-1">
                <div className="space-y-6">
                    <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Version Name</label>
                            <div className="relative">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                <input
                                    value={version}
                                    onChange={(e) => setVersion(e.target.value)}
                                    placeholder="e.g. 1.1.0"
                                    className="w-full pl-10 pr-4 py-2.5 bg-secondary/10 border-2 border-transparent focus:border-primary rounded-xl transition-all font-mono font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Add New Change</label>
                            <div className="flex gap-2">
                                <select
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value as any)}
                                    className="bg-secondary/10 border rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="feat">Feature</option>
                                    <option value="fix">Fix</option>
                                    <option value="perf">Perf</option>
                                    <option value="other">Other</option>
                                </select>
                                <input
                                    value={newChange}
                                    onChange={(e) => setNewChange(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addChange()}
                                    placeholder="What changed?"
                                    className="flex-1 bg-secondary/10 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <button
                                    onClick={addChange}
                                    className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Current Changes ({changes.length})</label>
                            <div className="space-y-2 max-h-[300px] overflow-auto pr-2">
                                {changes.map((c, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-secondary/10 rounded-xl group hover:bg-secondary/20 transition-all border border-transparent hover:border-border">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={cn(
                                                "p-1.5 rounded-lg shrink-0",
                                                c.type === 'feat' ? "bg-green-500/10 text-green-500" :
                                                    c.type === 'fix' ? "bg-red-500/10 text-red-500" :
                                                        c.type === 'perf' ? "bg-blue-500/10 text-blue-500" :
                                                            "bg-gray-500/10 text-gray-500"
                                            )}>
                                                {c.type === 'feat' ? <Rocket size={14} /> :
                                                    c.type === 'fix' ? <Bug size={14} /> :
                                                        c.type === 'perf' ? <Zap size={14} /> :
                                                            <Hammer size={14} />}
                                            </div>
                                            <span className="text-sm font-medium truncate">{c.text}</span>
                                        </div>
                                        <button
                                            onClick={() => removeChange(i)}
                                            className="p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {changes.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground italic text-xs">No changes added yet</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 flex flex-col">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Raw Markdown</label>
                        <button
                            onClick={copy}
                            className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-all"
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? 'Copied' : 'Copy Markdown'}
                        </button>
                    </div>
                    <div className="flex-1 bg-card border rounded-3xl p-6 font-mono text-sm shadow-inner relative group overflow-hidden">
                        <div className="absolute inset-0 opacity-10 pointer-events-none border-4 border-dashed rounded-3xl" />
                        <pre className="whitespace-pre-wrap leading-relaxed">{generate()}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
