import { useState, useEffect } from 'react';
import * as svgo from 'svgo';
import Editor from '@monaco-editor/react';
import {
    FileImageIcon,
    Zap,
    Copy,
    Check,
    Trash2,
    FileDown,
    Info
} from 'lucide-react';

export default function SvgCompressor() {
    const [input, setInput] = useState('<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">\n  <circle cx="100" cy="100" r="80" stroke="green" stroke-width="4" fill="yellow" />\n  <rect x="60" y="60" width="80" height="80" fill="red" opacity="0.5" />\n</svg>');
    const [output, setOutput] = useState('');
    const [stats, setStats] = useState({ original: 0, optimized: 0, saving: 0 });
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        compress();
    }, [input]);

    const compress = () => {
        if (!input.trim()) {
            setOutput('');
            setStats({ original: 0, optimized: 0, saving: 0 });
            return;
        }

        try {
            const result = svgo.optimize(input, {
                multipass: true,
                plugins: [
                    'preset-default',
                ],
            });

            if (result.data) {
                setOutput(result.data);
                const origSize = new Blob([input]).size;
                const optSize = new Blob([result.data]).size;
                setStats({
                    original: origSize,
                    optimized: optSize,
                    saving: Math.max(0, ((origSize - optSize) / origSize) * 100)
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const download = () => {
        const blob = new Blob([output], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'optimized.svg';
        a.click();
        URL.revokeObjectURL(url);
    };

    const copy = async () => {
        await navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="h-full flex flex-col bg-background">
            <div className="flex items-center justify-between p-4 border-b bg-card">
                <div className="flex items-center gap-4">
                    <FileImageIcon className="text-primary" size={24} />
                    <h2 className="text-xl font-bold">SVG Compressor</h2>
                </div>
                <div className="flex items-center gap-3">
                    {stats.original > 0 && (
                        <div className="hidden sm:flex items-center gap-4 px-4 py-1 bg-primary/5 border border-primary/10 rounded-full text-xs font-bold">
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] text-muted-foreground uppercase opacity-50">Original</span>
                                <span>{formatSize(stats.original)}</span>
                            </div>
                            <div className="w-px h-6 bg-border" />
                            <div className="flex flex-col items-center text-primary">
                                <span className="text-[10px] text-muted-foreground uppercase opacity-50">Optimized</span>
                                <span>{formatSize(stats.optimized)}</span>
                            </div>
                            <div className="w-px h-6 bg-border" />
                            <div className="flex flex-col items-center text-green-500">
                                <span className="text-[10px] text-muted-foreground uppercase opacity-50">Saving</span>
                                <span>{stats.saving.toFixed(1)}%</span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={copy}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={!output}
                    >
                        {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                    </button>
                    <button
                        onClick={download}
                        className="p-2 text-muted-foreground hover:text-primary transition-colors"
                        disabled={!output}
                        title="Download Optimized SVG"
                    >
                        <FileDown size={20} />
                    </button>
                    <button
                        onClick={() => setInput('')}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 relative">
                <div className="border-r flex flex-col">
                    <div className="p-2 bg-secondary/10 border-b text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4">
                        Source SVG
                    </div>
                    <div className="flex-1">
                        <Editor
                            height="100%"
                            defaultLanguage="xml"
                            theme="vs-dark"
                            value={input}
                            onChange={(v) => setInput(v || '')}
                            options={{ minimap: { enabled: false }, fontSize: 13, padding: { top: 20 } }}
                        />
                    </div>
                </div>
                <div className="flex flex-col bg-secondary/5 relative">
                    <div className="p-2 bg-secondary/10 border-b text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4 flex justify-between items-center">
                        Preview & Optimized Code
                        <Zap size={12} className="text-yellow-500" />
                    </div>
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="h-1/2 border-b bg-white/5 flex items-center justify-center p-8 overflow-hidden">
                            <div
                                className="max-w-full max-h-full aspect-square flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] rounded-lg border shadow-inner"
                                dangerouslySetInnerHTML={{ __html: output || input }}
                            />
                        </div>
                        <div className="h-1/2">
                            <Editor
                                height="100%"
                                defaultLanguage="xml"
                                theme="vs-dark"
                                value={output}
                                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, padding: { top: 20 } }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-3 bg-secondary/30 border-t flex items-center gap-2 text-[10px] font-medium text-muted-foreground px-6">
                <Info size={12} className="text-primary" />
                Optimized locally using SVGO. Your files never leave your browser for privacy.
            </div>
        </div>
    );
}
