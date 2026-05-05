import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { parse as parseTOML, stringify as stringifyTOML } from 'smol-toml';
import { FileJson, ArrowLeftRight, Trash2, Copy, Check, AlertCircle } from 'lucide-react';

const TOML_SAMPLE = `[package]
name = "devtools"
version = "1.5.1"
authors = ["Developer"]

[features]
offline = true
dark_mode = true
tools = ["json", "toml", "diff"]

[settings]
max_tabs = 10
font_size = 14`;

export default function TomlJsonConverter() {
    const [input, setInput] = useState(TOML_SAMPLE);
    const [output, setOutput] = useState('');
    const [isTomlToJson, setIsTomlToJson] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => { convert(); }, [input, isTomlToJson]);

    const convert = () => {
        if (!input.trim()) { setOutput(''); setError(null); return; }
        try {
            if (isTomlToJson) {
                const parsed = parseTOML(input);
                setOutput(JSON.stringify(parsed, null, 2));
            } else {
                const parsed = JSON.parse(input);
                setOutput(stringifyTOML(parsed));
            }
            setError(null);
        } catch (e: unknown) {
            setOutput('');
            setError(e instanceof Error ? e.message : String(e));
        }
    };

    const swap = () => { setIsTomlToJson(!isTomlToJson); setInput(output); };
    const copyOutput = async () => { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    const clear = () => setInput('');

    const inputLang = isTomlToJson ? 'ini' : 'json';
    const outputLang = isTomlToJson ? 'json' : 'ini';
    const inputLabel = isTomlToJson ? 'TOML Input' : 'JSON Input';
    const outputLabel = isTomlToJson ? 'JSON Output' : 'TOML Output';

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b bg-card">
                <div className="flex items-center gap-3">
                    <FileJson className="text-primary" size={20} />
                    <h2 className="font-bold text-lg">TOML ↔ JSON</h2>
                    <button onClick={swap}
                        className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
                        <ArrowLeftRight size={14} />
                        {isTomlToJson ? 'TOML → JSON' : 'JSON → TOML'}
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={copyOutput} disabled={!output}
                        className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors">
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Copied' : 'Copy Output'}
                    </button>
                    <button onClick={clear} className="p-2 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={18} /></button>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-destructive text-xs px-4 py-2 bg-destructive/5 border-b">
                    <AlertCircle size={14} /> {error}
                </div>
            )}

            <div className="flex-1 min-h-0 grid grid-cols-2 gap-0">
                <div className="flex flex-col border-r">
                    <div className="px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary/20 border-b">{inputLabel}</div>
                    <div className="flex-1 min-h-0">
                        <Editor height="100%" language={inputLang} value={input}
                            onChange={(v) => setInput(v ?? '')}
                            theme="vs-dark"
                            options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, automaticLayout: true, wordWrap: 'on' }} />
                    </div>
                </div>
                <div className="flex flex-col">
                    <div className="px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary/20 border-b">{outputLabel}</div>
                    <div className="flex-1 min-h-0">
                        <Editor height="100%" language={outputLang} value={output}
                            theme="vs-dark"
                            options={{ minimap: { enabled: false }, fontSize: 13, readOnly: true, scrollBeyondLastLine: false, automaticLayout: true, wordWrap: 'on' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
