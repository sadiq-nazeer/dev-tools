import { useState, useCallback } from 'react';
import { ArrowLeftRight, FileCode, FileSpreadsheet } from 'lucide-react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { usePersistentState } from '../hooks/usePersistentState';
import { useToolPageMeta } from '../hooks/useToolPageMeta';
import Editor from '@monaco-editor/react';

export default function CsvJsonConverter() {
    const meta = useToolPageMeta();
    const [input, setInput] = usePersistentState<string>('csv_json_input', '');
    const [mode, setMode] = useState<'csv-to-json' | 'json-to-csv'>('csv-to-json');
    const [error, setError] = useState<string | null>(null);

    const convert = useCallback(() => {
        if (!input.trim()) return;
        setError(null);
        try {
            if (mode === 'csv-to-json') {
                const lines = input.split(/\r?\n/).filter(line => line.trim());
                if (lines.length < 1) return;

                const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                const result = lines.slice(1).map(line => {
                    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                    const obj: Record<string, string> = {};
                    headers.forEach((header, i) => {
                        obj[header] = values[i] || '';
                    });
                    return obj;
                });
                setInput(JSON.stringify(result, null, 2));
                setMode('json-to-csv');
            } else {
                const json = JSON.parse(input);
                if (!Array.isArray(json) || json.length === 0) {
                    throw new Error('Input must be a non-empty JSON array of objects');
                }
                const firstRow = json[0] as Record<string, unknown>;
                const headers = Object.keys(firstRow);
                const csv = [
                    headers.join(','),
                    ...json.map((row: unknown) => {
                        const r = row as Record<string, unknown>;
                        return headers.map(header => {
                            const val = String(r[header] ?? '');
                            return val.includes(',') ? `"${val}"` : val;
                        }).join(',');
                    })
                ].join('\n');
                setInput(csv);
                setMode('csv-to-json');
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }, [input, mode, setInput]);

    const toggleMode = () => {
        setMode(prev => prev === 'csv-to-json' ? 'json-to-csv' : 'csv-to-json');
        setError(null);
    };

    return (
        <ToolLayout
            title={mode === 'csv-to-json' ? 'CSV to JSON' : 'JSON to CSV'}
            description={meta?.desc}
            onCopy={() => navigator.clipboard.writeText(input)}
            onClear={() => {
                setInput('');
                setError(null);
            }}
            error={error}
            actions={
                <div className="flex gap-2">
                    <button
                        onClick={toggleMode}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors"
                    >
                        <ArrowLeftRight size={14} />
                        Switch to {mode === 'csv-to-json' ? 'JSON to CSV' : 'CSV to JSON'}
                    </button>
                    <button
                        onClick={convert}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                    >
                        {mode === 'csv-to-json' ? <FileCode size={14} /> : <FileSpreadsheet size={14} />}
                        Convert
                    </button>
                </div>
            }
        >
            <div className="h-full w-full relative">
                <Editor
                    height="100%"
                    defaultLanguage={mode === 'csv-to-json' ? 'plaintext' : 'json'}
                    language={mode === 'csv-to-json' ? 'plaintext' : 'json'}
                    value={input}
                    onChange={(value) => setInput(value || '')}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: 'on'
                    }}
                />
            </div>
        </ToolLayout>
    );
}
