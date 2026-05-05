import { useState } from 'react';
import { ArrowLeftRight, Link, Link2Off } from 'lucide-react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { useToolPageMeta } from '../hooks/useToolPageMeta';

export default function UrlEncoder() {
    const meta = useToolPageMeta();
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState<string | null>(null);

    const encode = () => {
        try {
            if (!input.trim()) return;
            setOutput(encodeURIComponent(input));
            setError(null);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            setError('Encoding failed: ' + msg);
        }
    };

    const decode = () => {
        try {
            if (!input.trim()) return;
            setOutput(decodeURIComponent(input.replace(/\+/g, ' ')));
            setError(null);
        } catch {
            setError('Decoding failed: Invalid URL encoded string');
        }
    };

    const clear = () => {
        setInput('');
        setOutput('');
        setError(null);
    };

    const swap = () => {
        setInput(output);
        setOutput(input);
        setError(null);
    };

    return (
        <ToolLayout
            title={meta?.label ?? 'URL Encoder'}
            description={meta?.desc}
            error={error}
            onCopy={() => {
                if (!output.trim()) return;
                return navigator.clipboard.writeText(output);
            }}
            onClear={clear}
            actions={
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={encode}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                    >
                        <Link size={14} /> Encode
                    </button>
                    <button
                        onClick={swap}
                        className="p-1.5 rounded border hover:bg-secondary transition-colors"
                        title="Swap input and output"
                        type="button"
                    >
                        <ArrowLeftRight size={14} />
                    </button>
                    <button
                        onClick={decode}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors border"
                    >
                        <Link2Off size={14} /> Decode
                    </button>
                </div>
            }
        >
            <div className="p-4 md:p-6 h-full min-h-0">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] gap-4 items-stretch max-w-[1400px] mx-auto min-h-[min(100%,480px)]">
                    <div className="flex flex-col min-h-[200px] space-y-2">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Input</label>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Enter text or URL here..."
                            className="flex-1 w-full p-4 rounded-lg border bg-card resize-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[200px]"
                        />
                    </div>

                    <div className="hidden lg:block w-px bg-border shrink-0" aria-hidden />

                    <div className="flex flex-col min-h-[200px] space-y-2">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Output</label>
                        <textarea
                            readOnly
                            value={output}
                            placeholder="Result will appear here..."
                            className="flex-1 w-full p-4 rounded-lg border bg-secondary/30 resize-none font-mono text-sm focus:outline-none min-h-[200px]"
                        />
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
