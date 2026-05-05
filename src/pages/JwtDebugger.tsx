import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { useToolPageMeta } from '../hooks/useToolPageMeta';

export default function JwtDebugger() {
    const meta = useToolPageMeta();
    const [token, setToken] = useState('');
    const [header, setHeader] = useState<unknown>(null);
    const [payload, setPayload] = useState<unknown>(null);
    const [error, setError] = useState<string | null>(null);
    const [copiedSection, setCopiedSection] = useState<'header' | 'payload' | null>(null);

    useEffect(() => {
        const jwt = token;
        if (!jwt.trim()) {
            setHeader(null);
            setPayload(null);
            setError(null);
            return;
        }

        try {
            const parts = jwt.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid JWT format: A JWT must have 3 parts separated by dots.');
            }

            const decodePart = (part: string): unknown => {
                try {
                    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(
                        atob(base64)
                            .split('')
                            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                            .join('')
                    );
                    return JSON.parse(jsonPayload) as unknown;
                } catch {
                    throw new Error('Failed to decode part: base64/JSON error');
                }
            };

            setHeader(decodePart(parts[0]));
            setPayload(decodePart(parts[1]));
            setError(null);
        } catch (e: unknown) {
            setHeader(null);
            setPayload(null);
            setError(e instanceof Error ? e.message : 'Decode failed');
        }
    }, [token]);

    const copySection = async (text: string, section: 'header' | 'payload') => {
        if (!text) return;
        await navigator.clipboard.writeText(text);
        setCopiedSection(section);
        setTimeout(() => setCopiedSection(null), 2000);
    };

    const clear = () => {
        setToken('');
        setError(null);
    };

    const combinedForToolbar = () => {
        if (header == null && payload == null) return '';
        const h = header != null ? JSON.stringify(header, null, 2) : '';
        const p = payload != null ? JSON.stringify(payload, null, 2) : '';
        return `Header:\n${h}\n\nPayload:\n${p}`;
    };

    return (
        <ToolLayout
            title={meta?.label ?? 'JWT Debugger'}
            description={meta?.desc}
            error={error}
            onCopy={() => {
                const text = combinedForToolbar().trim();
                if (!text) return;
                return navigator.clipboard.writeText(text);
            }}
            onClear={clear}
        >
            <div className="p-4 md:p-6 h-full min-h-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1400px] mx-auto min-h-[min(100%,560px)]">
                    <div className="flex flex-col space-y-2 min-h-[280px]">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex justify-between gap-2">
                            Encoded
                            <span className="text-[10px] lowercase text-muted-foreground/60 font-normal">Paste your token here</span>
                        </label>
                        <textarea
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            className="flex-1 w-full p-4 rounded-lg border bg-card resize-none font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary break-all min-h-[300px]"
                        />
                    </div>

                    <div className="flex flex-col space-y-6 min-h-0 overflow-hidden">
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Header</label>
                                <button
                                    type="button"
                                    onClick={() => copySection(header != null ? JSON.stringify(header, null, 2) : '', 'header')}
                                    className="p-1 px-2 text-[10px] flex items-center gap-1.5 rounded bg-secondary hover:bg-secondary/80 transition-colors"
                                    disabled={header == null}
                                >
                                    {copiedSection === 'header' ? <Check size={10} /> : <Copy size={10} />}
                                    {copiedSection === 'header' ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <pre className="p-4 rounded-lg border bg-secondary/20 font-mono text-xs overflow-auto max-h-[200px] min-h-[100px]">
                                {header != null ? JSON.stringify(header, null, 2) : (
                                    <span className="text-muted-foreground/50">Header will appear here...</span>
                                )}
                            </pre>
                        </div>

                        <div className="flex flex-col space-y-2 flex-1 min-h-0">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Payload</label>
                                <button
                                    type="button"
                                    onClick={() => copySection(payload != null ? JSON.stringify(payload, null, 2) : '', 'payload')}
                                    className="p-1 px-2 text-[10px] flex items-center gap-1.5 rounded bg-secondary hover:bg-secondary/80 transition-colors"
                                    disabled={payload == null}
                                >
                                    {copiedSection === 'payload' ? <Check size={10} /> : <Copy size={10} />}
                                    {copiedSection === 'payload' ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <pre className="flex-1 p-4 rounded-lg border bg-secondary/20 font-mono text-xs overflow-auto min-h-[200px]">
                                {payload != null ? JSON.stringify(payload, null, 2) : (
                                    <span className="text-muted-foreground/50">Payload will appear here...</span>
                                )}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
