import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import JsonToTS from 'json-to-ts';
import {
    FileCode,
    Copy,
    Check,
    Trash2,
    AlertCircle
} from 'lucide-react';

export default function JsonToTypeScript() {
    const [json, setJson] = useState('{\n  "id": 1,\n  "name": "John Doe",\n  "active": true,\n  "tags": ["dev", "admin"],\n  "metadata": {\n    "lastLogin": "2024-02-18"\n  }\n}');
    const [typescript, setTypescript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        generateTypes();
    }, [json]);

    const generateTypes = () => {
        if (!json.trim()) {
            setTypescript('');
            setError(null);
            return;
        }

        try {
            const parsed = JSON.parse(json);
            const interfaces = JsonToTS(parsed);
            setTypescript(interfaces.join('\n\n'));
            setError(null);
        } catch (e: any) {
            setTypescript('');
            setError(e.message);
        }
    };

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(typescript);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="h-full flex flex-col bg-background">
            <div className="flex items-center justify-between p-4 border-b bg-card">
                <div className="flex items-center gap-4">
                    <FileCode className="text-primary" size={24} />
                    <h2 className="text-xl font-bold">JSON to TypeScript</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors shadow-sm text-sm"
                        disabled={!!error || !typescript}
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied' : 'Copy Interfaces'}
                    </button>
                    <button
                        onClick={() => setJson('')}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 relative">
                <div className="border-r flex flex-col">
                    <div className="p-2 bg-secondary/10 border-b text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4">
                        JSON Input
                    </div>
                    <div className="flex-1">
                        <Editor
                            height="100%"
                            defaultLanguage="json"
                            theme="vs-dark"
                            value={json}
                            onChange={(v) => setJson(v || '')}
                            options={{ minimap: { enabled: false }, fontSize: 13, padding: { top: 20 } }}
                        />
                    </div>
                </div>
                <div className="flex flex-col">
                    <div className="p-2 bg-secondary/10 border-b text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4">
                        TS Interfaces
                    </div>
                    <div className="flex-1">
                        <Editor
                            height="100%"
                            defaultLanguage="typescript"
                            theme="vs-dark"
                            value={typescript}
                            options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, padding: { top: 20 } }}
                        />
                    </div>
                </div>

                {error && (
                    <div className="absolute bottom-6 left-6 right-6">
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg flex items-center gap-3 backdrop-blur-md shadow-lg mr-1/2">
                            <AlertCircle size={18} />
                            <span className="text-sm font-medium">Invalid JSON: {error}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
