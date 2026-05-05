import { useState, useEffect, useMemo } from 'react';
import {
    Search,
    Trash2,
    AlertCircle,
    Activity
} from 'lucide-react';
import { cn } from '../lib/utils';

function extractNamedGroups(pattern: string): string[] {
    const names: string[] = [];
    const re = /\(\?<([^>]+)>/g;
    let m;
    while ((m = re.exec(pattern)) !== null) names.push(m[1]);
    return names;
}

export default function RegexTester() {
    const [regex, setRegex] = useState('([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})');
    const [flags, setFlags] = useState('g');
    const [testText, setTestText] = useState('Contact us at support@example.com or admin@dev-tools.io');
    const [matches, setMatches] = useState<RegExpMatchArray[]>([]);
    const [error, setError] = useState<string | null>(null);

    const namedGroups = useMemo(() => extractNamedGroups(regex), [regex]);

    useEffect(() => {
        if (!regex) {
            setMatches([]);
            setError(null);
            return;
        }

        try {
            const re = new RegExp(regex, flags);
            const allMatches = Array.from(testText.matchAll(re));
            setMatches(allMatches);
            setError(null);
        } catch (e: any) {
            setMatches([]);
            setError(e.message);
        }
    }, [regex, flags, testText]);

    const toggleFlag = (f: string) => {
        setFlags(prev => prev.includes(f) ? prev.replace(f, '') : prev + f);
    };

    const clear = () => {
        setRegex('');
        setTestText('');
    };

    return (
        <div className="h-full flex flex-col bg-background p-6 overflow-auto">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Search className="text-primary" /> RegEx Tester
                </h2>
                <button
                    onClick={clear}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    title="Clear all"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            <div className="space-y-6 flex-1 max-w-5xl mx-auto w-full">
                {/* Regex Input */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Regular Expression</label>
                        <div className="flex items-center gap-1">
                            {['g', 'i', 'm', 's', 'u', 'y'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => toggleFlag(f)}
                                    className={cn(
                                        "w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border transition-all",
                                        flags.includes(f)
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-secondary/30 text-muted-foreground hover:bg-secondary border-transparent"
                                    )}
                                    title={`Toggle ${f} flag`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none font-mono text-xl">/</div>
                        <input
                            value={regex}
                            onChange={(e) => setRegex(e.target.value)}
                            placeholder="Enter regex here..."
                            className={cn(
                                "w-full p-4 pl-8 pr-12 rounded-xl border bg-card font-mono text-lg focus:outline-none focus:ring-2 transition-all",
                                error ? "focus:ring-destructive border-destructive" : "focus:ring-primary"
                            )}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none font-mono text-xl">/{flags}</div>
                    </div>
                    {error && (
                        <div className="flex items-center gap-2 text-destructive text-xs px-1">
                            <AlertCircle size={14} />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {/* Test Text */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Test String</label>
                    <textarea
                        value={testText}
                        onChange={(e) => setTestText(e.target.value)}
                        placeholder="Enter text to test against..."
                        className="w-full p-4 rounded-xl border bg-card font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[150px] resize-none"
                    />
                </div>

                {/* Results */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Match Results</label>
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Activity size={12} /> {matches.length} matches found
                        </div>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-auto rounded-xl border bg-secondary/10 p-2">
                        {matches.length > 0 ? (
                            matches.map((match, idx) => (
                                <div key={idx} className="p-3 bg-card border rounded-lg shadow-sm space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Match {idx + 1}</span>
                                        <span className="text-[10px] font-mono text-muted-foreground">Index: {match.index}</span>
                                    </div>
                                    <div className="font-mono text-sm break-all bg-secondary/50 p-2 rounded border">
                                        {match[0]}
                                    </div>
                                    {match.length > 1 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-dashed">
                                            {Array.from(match).slice(1).map((group, gIdx) => {
                                                const name = namedGroups[gIdx];
                                                return (
                                                    <div key={gIdx} className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Group {gIdx + 1}</span>
                                                            {name && <span className="text-[9px] font-mono px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">{name}</span>}
                                                        </div>
                                                        <span className="text-xs font-mono break-all">{group ?? <span className="italic opacity-30">null</span>}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {namedGroups.length > 0 && match.groups && (
                                        <div className="mt-2 pt-2 border-t border-dashed">
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase mb-2">Named Groups</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {namedGroups.map(name => (
                                                    <div key={name} className="flex flex-col gap-1">
                                                        <span className="text-[9px] font-mono px-1.5 py-0.5 bg-primary/10 text-primary rounded-full w-fit">{name}</span>
                                                        <span className="text-xs font-mono break-all">{match.groups![name] ?? <span className="italic opacity-30">null</span>}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center text-muted-foreground italic text-sm">
                                No matches found with current pattern
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
