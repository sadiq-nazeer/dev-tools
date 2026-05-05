import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { useToolPageMeta } from '../hooks/useToolPageMeta';

function toWords(input: string): string[] {
    return input
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .replace(/[-_./\s]+/g, ' ')
        .trim()
        .toLowerCase()
        .split(' ')
        .filter(Boolean);
}

function convert(input: string) {
    const words = toWords(input);
    if (!words.length) return { camel: '', pascal: '', snake: '', kebab: '', screaming: '', title: '', upper: '', lower: '', dot: '', path: '' };

    return {
        camel: words[0] + words.slice(1).map(w => w[0].toUpperCase() + w.slice(1)).join(''),
        pascal: words.map(w => w[0].toUpperCase() + w.slice(1)).join(''),
        snake: words.join('_'),
        kebab: words.join('-'),
        screaming: words.join('_').toUpperCase(),
        title: words.map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
        upper: words.join(' ').toUpperCase(),
        lower: words.join(' '),
        dot: words.join('.'),
        path: words.join('/'),
    };
}

export default function StringCaseConverter() {
    const meta = useToolPageMeta();
    const [input, setInput] = useState('');
    const [copied, setCopied] = useState<string | null>(null);

    const result = convert(input);

    const copyToClipboard = async (text: string, key: string) => {
        if (!text) return;
        await navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    const cases = [
        { key: 'camel', label: 'camelCase', value: result.camel },
        { key: 'pascal', label: 'PascalCase', value: result.pascal },
        { key: 'snake', label: 'snake_case', value: result.snake },
        { key: 'kebab', label: 'kebab-case', value: result.kebab },
        { key: 'screaming', label: 'SCREAMING_SNAKE_CASE', value: result.screaming },
        { key: 'title', label: 'Title Case', value: result.title },
        { key: 'upper', label: 'UPPER CASE', value: result.upper },
        { key: 'lower', label: 'lower case', value: result.lower },
        { key: 'dot', label: 'dot.case', value: result.dot },
        { key: 'path', label: 'path/case', value: result.path },
    ];

    const copyAllCases = () => {
        const lines = cases.filter((c) => c.value).map((c) => `${c.label}: ${c.value}`);
        if (!lines.length) return;
        return navigator.clipboard.writeText(lines.join('\n'));
    };

    return (
        <ToolLayout
            title={meta?.label ?? 'String Case'}
            description={meta?.desc}
            onCopy={copyAllCases}
            onClear={() => setInput('')}
        >
            <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Input</label>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="e.g. hello world, helloWorld, hello-world..."
                        className="w-full p-4 rounded-lg border bg-card font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cases.map(({ key, label, value }) => (
                        <div key={key} className="space-y-1.5">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</label>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(value, key)}
                                    className="text-[10px] text-primary hover:underline flex items-center gap-1.5 disabled:opacity-30"
                                    disabled={!value}
                                >
                                    {copied === key ? <Check size={12} /> : <Copy size={12} />}
                                    {copied === key ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <div className="p-3 rounded-lg border bg-secondary/20 font-mono text-sm min-h-[40px] flex items-center break-all">
                                {value || <span className="text-muted-foreground/30 italic text-[10px]">No input</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </ToolLayout>
    );
}
