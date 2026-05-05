import { useState, useEffect, useRef, useCallback } from 'react';
import CryptoJS from 'crypto-js';
import { Copy, Check, Upload, FileText, ChevronUp, ChevronDown } from 'lucide-react';
import { useInputHistory } from '../hooks/useInputHistory';
import { ToolLayout } from '../components/layout/ToolLayout';
import { useToolPageMeta } from '../hooks/useToolPageMeta';

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function hashFile(file: File): Promise<{ md5: string; sha1: string; sha256: string; sha512: string }> {
    const buffer = await file.arrayBuffer();
    const wordArray = CryptoJS.lib.WordArray.create(new Uint8Array(buffer) as unknown as number[]);
    return {
        md5: CryptoJS.MD5(wordArray).toString(),
        sha1: CryptoJS.SHA1(wordArray).toString(),
        sha256: CryptoJS.SHA256(wordArray).toString(),
        sha512: CryptoJS.SHA512(wordArray).toString(),
    };
}

export default function HashGenerator() {
    const meta = useToolPageMeta();
    const [input, setInput] = useState('');
    const [hashes, setHashes] = useState({ md5: '', sha1: '', sha256: '', sha512: '' });
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [mode, setMode] = useState<'text' | 'file'>('text');
    const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
    const history = useInputHistory('hash-generator');
    const [isDragging, setIsDragging] = useState(false);
    const [isHashing, setIsHashing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (mode !== 'text') return;
        if (!input) { setHashes({ md5: '', sha1: '', sha256: '', sha512: '' }); return; }
        setHashes({
            md5: CryptoJS.MD5(input).toString(),
            sha1: CryptoJS.SHA1(input).toString(),
            sha256: CryptoJS.SHA256(input).toString(),
            sha512: CryptoJS.SHA512(input).toString(),
        });
    }, [input, mode]);

    const processFile = useCallback(async (file: File) => {
        setIsHashing(true);
        setFileInfo({ name: file.name, size: file.size });
        setHashes({ md5: '', sha1: '', sha256: '', sha512: '' });
        try {
            const result = await hashFile(file);
            setHashes(result);
        } finally {
            setIsHashing(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    }, [processFile]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const copyToClipboard = async (text: string, key: string) => {
        if (!text) return;
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const clear = () => {
        setInput('');
        setFileInfo(null);
        setHashes({ md5: '', sha1: '', sha256: '', sha512: '' });
    };

    const hashItems = [
        { label: 'MD5', value: hashes.md5, key: 'md5' },
        { label: 'SHA-1', value: hashes.sha1, key: 'sha1' },
        { label: 'SHA-256', value: hashes.sha256, key: 'sha256' },
        { label: 'SHA-512', value: hashes.sha512, key: 'sha512' },
    ];

    const copyAllHashes = () => {
        const lines = hashItems.filter((i) => i.value).map((i) => `${i.label}: ${i.value}`);
        if (!lines.length) return;
        return navigator.clipboard.writeText(lines.join('\n'));
    };

    return (
        <ToolLayout
            title={meta?.label ?? 'Hash Gen'}
            description={meta?.desc}
            onCopy={copyAllHashes}
            onClear={clear}
            actions={
                <div className="flex gap-1">
                    {(['text', 'file'] as const).map((m) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => {
                                setMode(m);
                                clear();
                            }}
                            className={`px-3 py-1.5 rounded text-xs font-medium capitalize transition-colors border ${mode === m ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/20 border-border hover:bg-secondary/40'}`}
                        >
                            {m === 'text' ? 'Text' : 'File'}
                        </button>
                    ))}
                </div>
            }
        >
            <div className="p-4 md:p-6 space-y-8 max-w-4xl mx-auto">
                {mode === 'text' ? (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Input Text</label>
                            {history.entries.length > 0 && (
                                <div className="flex gap-1">
                                    <button onClick={() => history.navigateUp(input, setInput)} title="Previous (Ctrl+↑)" className="p-1 rounded hover:bg-secondary text-muted-foreground"><ChevronUp size={12} /></button>
                                    <button onClick={() => history.navigateDown(setInput)} title="Next (Ctrl+↓)" className="p-1 rounded hover:bg-secondary text-muted-foreground"><ChevronDown size={12} /></button>
                                    <span className="text-[10px] text-muted-foreground/50 self-center ml-1">{history.entries.length} saved</span>
                                </div>
                            )}
                        </div>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onBlur={() => { if (input.trim()) history.push(input); }}
                            onKeyDown={e => {
                                if (e.key === 'ArrowUp' && e.ctrlKey) { e.preventDefault(); history.navigateUp(input, setInput); }
                                if (e.key === 'ArrowDown' && e.ctrlKey) { e.preventDefault(); history.navigateDown(setInput); }
                            }}
                            placeholder="Type or paste text to hash..."
                            className="w-full p-4 rounded-lg border bg-card resize-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
                        />
                    </div>
                ) : (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Drop a File</label>
                        <div
                            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-secondary/20'}`}
                        >
                            <input ref={fileInputRef} type="file" onChange={handleFileInput} className="hidden" />
                            {fileInfo ? (
                                <div className="flex items-center justify-center gap-3">
                                    <FileText className="text-primary" size={28} />
                                    <div className="text-left">
                                        <p className="font-medium text-sm">{fileInfo.name}</p>
                                        <p className="text-xs text-muted-foreground">{formatBytes(fileInfo.size)}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Upload className="mx-auto text-muted-foreground" size={28} />
                                    <p className="text-sm text-muted-foreground">Drop any file here, or click to browse</p>
                                    <p className="text-xs text-muted-foreground/60">All hashing is done locally — no data leaves your machine</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Results */}
                <div className="grid grid-cols-1 gap-4">
                    {hashItems.map((item) => (
                        <div key={item.key} className="space-y-1.5">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.label}</label>
                                <button onClick={() => copyToClipboard(item.value, item.key)}
                                    className="text-[10px] text-primary hover:underline flex items-center gap-1.5 disabled:opacity-30" disabled={!item.value}>
                                    {copiedKey === item.key ? <Check size={12} /> : <Copy size={12} />}
                                    {copiedKey === item.key ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <div className="p-3 rounded-lg border bg-secondary/20 font-mono text-xs break-all min-h-[40px] flex items-center">
                                {isHashing ? (
                                    <span className="text-muted-foreground/50 italic text-[10px]">Hashing…</span>
                                ) : item.value ? item.value : (
                                    <span className="text-muted-foreground/30 italic text-[10px]">No input provided</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </ToolLayout>
    );
}
