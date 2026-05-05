import { useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { Columns, Trash2, Copy, Check, Split, AlignLeft } from 'lucide-react';

// Simple word-level diff using LCS
type DiffOp = { type: 'eq' | 'add' | 'del'; text: string };

function wordDiff(left: string, right: string): { left: DiffOp[]; right: DiffOp[] } {
    const leftWords = left.split(/(\s+)/);
    const rightWords = right.split(/(\s+)/);
    const m = leftWords.length, n = rightWords.length;

    // LCS table
    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i--) {
        for (let j = n - 1; j >= 0; j--) {
            if (leftWords[i] === rightWords[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
            else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
    }

    const leftOps: DiffOp[] = [];
    const rightOps: DiffOp[] = [];
    let i = 0, j = 0;
    while (i < m || j < n) {
        if (i < m && j < n && leftWords[i] === rightWords[j]) {
            leftOps.push({ type: 'eq', text: leftWords[i] });
            rightOps.push({ type: 'eq', text: rightWords[j] });
            i++; j++;
        } else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
            rightOps.push({ type: 'add', text: rightWords[j] });
            j++;
        } else {
            leftOps.push({ type: 'del', text: leftWords[i] });
            i++;
        }
    }
    return { left: leftOps, right: rightOps };
}

function WordDiffPanel({ ops }: { ops: DiffOp[]; side: 'left' | 'right' }) {
    return (
        <div className="flex-1 p-4 font-mono text-sm leading-relaxed overflow-auto bg-background border-r last:border-r-0 whitespace-pre-wrap break-words">
            {ops.map((op, i) => {
                if (op.type === 'eq') return <span key={i}>{op.text}</span>;
                if (op.type === 'del') return <span key={i} className="bg-red-500/25 text-red-400 line-through rounded-sm">{op.text}</span>;
                return <span key={i} className="bg-green-500/25 text-green-400 rounded-sm">{op.text}</span>;
            })}
        </div>
    );
}

export default function DiffViewer() {
    const [original, setOriginal] = useState('');
    const [modified, setModified] = useState('');
    const [copied, setCopied] = useState(false);
    const [diffMode, setDiffMode] = useState<'line' | 'word'>('line');

    const clear = () => { setOriginal(''); setModified(''); };

    const copyModified = async () => {
        if (!modified) return;
        await navigator.clipboard.writeText(modified);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const wordDiffResult = diffMode === 'word' ? wordDiff(original, modified) : null;

    return (
        <div className="h-full flex flex-col bg-background overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b bg-card">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Columns className="text-primary" size={20} />
                        <h2 className="font-bold text-lg hidden sm:block">Diff Viewer</h2>
                    </div>
                    {/* Mode Toggle */}
                    <div className="flex gap-1 bg-secondary/30 rounded-lg p-1">
                        <button onClick={() => setDiffMode('line')}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${diffMode === 'line' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                            <Split size={12} /> Line
                        </button>
                        <button onClick={() => setDiffMode('word')}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${diffMode === 'word' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                            <AlignLeft size={12} /> Word
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={copyModified} disabled={!modified}
                        className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors shadow-sm text-sm disabled:opacity-40">
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied' : 'Copy Modified'}
                    </button>
                    <div className="h-6 w-px bg-border mx-1" />
                    <button onClick={clear} className="p-2 text-muted-foreground hover:text-destructive transition-colors" title="Clear all">
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {/* Editor Labels */}
            <div className="grid grid-cols-2 bg-secondary/10 border-b text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <div className="p-2 px-4 border-r">Original</div>
                <div className="p-2 px-4">Modified</div>
            </div>

            {/* Word Diff Mode */}
            {diffMode === 'word' && wordDiffResult ? (
                <div className="flex-1 min-h-0 flex overflow-hidden">
                    {/* Left (original) editable textarea overlay */}
                    <div className="flex-1 relative border-r">
                        <textarea
                            value={original}
                            onChange={e => setOriginal(e.target.value)}
                            placeholder="Paste original text..."
                            className="absolute inset-0 w-full h-full p-4 font-mono text-sm bg-transparent resize-none focus:outline-none focus:ring-inset focus:ring-2 focus:ring-primary z-10 opacity-0"
                        />
                        <WordDiffPanel ops={wordDiffResult.left} side="left" />
                        {!original && (
                            <div className="absolute inset-0 p-4 text-muted-foreground/40 font-mono text-sm pointer-events-none">
                                Paste original text...
                            </div>
                        )}
                        <textarea
                            value={original}
                            onChange={e => setOriginal(e.target.value)}
                            className="absolute inset-0 w-full h-full p-4 font-mono text-sm bg-transparent resize-none focus:outline-none z-20 caret-primary text-transparent selection:bg-primary/20"
                            spellCheck={false}
                        />
                    </div>
                    <div className="flex-1 relative">
                        <WordDiffPanel ops={wordDiffResult.right} side="right" />
                        {!modified && (
                            <div className="absolute inset-0 p-4 text-muted-foreground/40 font-mono text-sm pointer-events-none">
                                Paste modified text...
                            </div>
                        )}
                        <textarea
                            value={modified}
                            onChange={e => setModified(e.target.value)}
                            className="absolute inset-0 w-full h-full p-4 font-mono text-sm bg-transparent resize-none focus:outline-none z-20 caret-primary text-transparent selection:bg-primary/20"
                            spellCheck={false}
                        />
                    </div>
                </div>
            ) : (
                /* Monaco Line Diff */
                <div className="flex-1 min-h-0 relative">
                    <DiffEditor
                        height="100%"
                        original={original}
                        modified={modified}
                        onMount={(editor) => {
                            const originalEditor = editor.getOriginalEditor();
                            const modifiedEditor = editor.getModifiedEditor();
                            originalEditor.onDidChangeModelContent(() => setOriginal(originalEditor.getValue()));
                            modifiedEditor.onDidChangeModelContent(() => setModified(modifiedEditor.getValue()));
                        }}
                        theme="vs-dark"
                        options={{
                            renderSideBySide: true,
                            minimap: { enabled: false },
                            fontSize: 14,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            wordWrap: 'on',
                            originalEditable: true,
                        }}
                    />
                </div>
            )}
        </div>
    );
}
