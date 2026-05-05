import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import yaml from 'js-yaml';
import {
    FileJson,
    ArrowLeftRight,
    Trash2,
    Copy,
    Check,
    AlertCircle
} from 'lucide-react';

export default function YamlJsonConverter() {
    const [input, setInput] = useState('name: DevTools\nversion: 1.0.0\nfeatures:\n  - JSON Formatting\n  - YAML Conversion\n  - Security Tools');
    const [output, setOutput] = useState('');
    const [isYamlToJson, setIsYamlToJson] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        convert();
    }, [input, isYamlToJson]);

    const convert = () => {
        if (!input.trim()) {
            setOutput('');
            setError(null);
            return;
        }

        try {
            if (isYamlToJson) {
                const parsed = yaml.load(input);
                setOutput(JSON.stringify(parsed, null, 2));
            } else {
                const parsed = JSON.parse(input);
                setOutput(yaml.dump(parsed));
            }
            setError(null);
        } catch (e: any) {
            setOutput('');
            setError(e.message);
        }
    };

    const swap = () => {
        setIsYamlToJson(!isYamlToJson);
        setInput(output);
    };

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const clear = () => setInput('');

    return (
        <div className="h-full flex flex-col bg-background">
            <div className="flex items-center justify-between p-4 border-b bg-card">
                <div className="flex items-center gap-4">
                    <FileJson className="text-primary" size={24} />
                    <h2 className="text-xl font-bold">YAML ↔ JSON</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={swap}
                        className="flex items-center gap-2 px-4 py-1.5 bg-secondary rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
                    >
                        <ArrowLeftRight size={16} />
                        {isYamlToJson ? 'YAML to JSON' : 'JSON to YAML'}
                    </button>

                    <div className="h-6 w-px bg-border mx-1" />

                    <button
                        onClick={copyToClipboard}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={!!error || !output}
                    >
                        {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                    </button>
                    <button
                        onClick={clear}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 relative">
                <div className="border-r flex flex-col">
                    <div className="p-2 bg-secondary/10 border-b text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4">
                        {isYamlToJson ? 'YAML Input' : 'JSON Input'}
                    </div>
                    <div className="flex-1">
                        <Editor
                            height="100%"
                            defaultLanguage={isYamlToJson ? 'yaml' : 'json'}
                            theme="vs-dark"
                            value={input}
                            onChange={(v) => setInput(v || '')}
                            options={{ minimap: { enabled: false }, fontSize: 13, padding: { top: 20 } }}
                        />
                    </div>
                </div>
                <div className="flex flex-col">
                    <div className="p-2 bg-secondary/10 border-b text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4">
                        {isYamlToJson ? 'JSON Output' : 'YAML Output'}
                    </div>
                    <div className="flex-1">
                        <Editor
                            height="100%"
                            defaultLanguage={isYamlToJson ? 'json' : 'yaml'}
                            theme="vs-dark"
                            value={output}
                            options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, padding: { top: 20 } }}
                        />
                    </div>
                </div>

                {error && (
                    <div className="absolute bottom-6 left-6 right-6">
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg flex items-center gap-3 backdrop-blur-md shadow-lg mr-1/2">
                            <AlertCircle size={18} />
                            <span className="text-sm font-medium">Error: {error}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
