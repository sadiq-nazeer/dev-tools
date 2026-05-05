import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { format } from 'sql-formatter';
import {
    Database,
    Copy,
    Check,
    Trash2,
    AlignLeft
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function SqlFormatter() {
    const [value, setValue] = useState('');
    const [copied, setCopied] = useState(false);
    const [language, setLanguage] = useState<'sql' | 'mysql' | 'postgresql'>('sql');

    const formatSql = () => {
        try {
            if (!value.trim()) return;
            const formatted = format(value, {
                language: language === 'sql' ? 'sql' : language,
                keywordCase: 'upper',
                indentStyle: 'tabularLeft',
            });
            setValue(formatted);
        } catch (e) {
            console.error('SQL Formatting failed', e);
        }
    };

    const copyToClipboard = async () => {
        if (!value) return;
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const clear = () => setValue('');

    return (
        <div className="h-full flex flex-col bg-background overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b bg-card">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Database className="text-primary" size={20} />
                        <h2 className="font-bold text-lg hidden sm:block">SQL Formatter</h2>
                    </div>

                    <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-md">
                        {(['sql', 'mysql', 'postgresql'] as const).map((lang) => (
                            <button
                                key={lang}
                                onClick={() => setLanguage(lang)}
                                className={cn(
                                    "px-3 py-1 text-xs font-medium rounded transition-all",
                                    language === lang
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {lang.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={formatSql}
                        className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors shadow-sm text-sm"
                    >
                        <AlignLeft size={16} /> Format
                    </button>

                    <div className="h-6 w-px bg-border mx-1" />

                    <button
                        onClick={copyToClipboard}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy to clipboard"
                    >
                        {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                    </button>

                    <button
                        onClick={clear}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                        title="Clear all"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 min-h-0 relative">
                <Editor
                    height="100%"
                    defaultLanguage="sql"
                    language="sql"
                    value={value}
                    onChange={(v) => setValue(v || '')}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: 'on',
                        padding: { top: 20 },
                    }}
                />
            </div>
        </div>
    );
}
