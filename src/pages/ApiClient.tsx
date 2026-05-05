import { useState, useCallback } from 'react';
import { Send, Plus, Trash2, Clock, BookmarkPlus, History, Bookmark, X } from 'lucide-react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { usePersistentState } from '../hooks/usePersistentState';
import { useToolPageMeta } from '../hooks/useToolPageMeta';
import Editor from '@monaco-editor/react';
import { cn } from '../lib/utils';

interface Header { id: string; key: string; value: string; enabled: boolean }

interface HistoryEntry {
    id: string;
    method: string;
    url: string;
    status: number | null;
    timestamp: number;
}

interface SavedRequest {
    id: string;
    name: string;
    method: string;
    url: string;
    headers: Header[];
    body: string;
}

const METHOD_COLORS: Record<string, string> = {
    GET: 'text-green-500', POST: 'text-blue-500', PUT: 'text-yellow-500',
    PATCH: 'text-orange-500', DELETE: 'text-red-500', HEAD: 'text-purple-500', OPTIONS: 'text-gray-500',
};

function formatTimestamp(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function ApiClient() {
    const meta = useToolPageMeta();
    const [url, setUrl] = usePersistentState<string>('api_url', 'https://jsonplaceholder.typicode.com/todos/1');
    const [method, setMethod] = usePersistentState<string>('api_method', 'GET');
    const [headers, setHeaders] = usePersistentState<Header[]>('api_headers', [
        { id: '1', key: 'Content-Type', value: 'application/json', enabled: true }
    ]);
    const [body, setBody] = usePersistentState<string>('api_body', '');
    const [response, setResponse] = useState<unknown>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<{ status: number; time: number; size: string } | null>(null);

    const [history, setHistory] = usePersistentState<HistoryEntry[]>('api_history', []);
    const [saved, setSaved] = usePersistentState<SavedRequest[]>('api_saved', []);
    const [panel, setPanel] = useState<'none' | 'history' | 'saved'>('none');
    const [savePrompt, setSavePrompt] = useState(false);
    const [saveName, setSaveName] = useState('');

    const addHeader = () => setHeaders([...headers, { id: Math.random().toString(36).substr(2, 9), key: '', value: '', enabled: true }]);
    const removeHeader = (id: string) => setHeaders(headers.filter(h => h.id !== id));
    const updateHeader = (id: string, updates: Partial<Header>) => setHeaders(headers.map(h => h.id === id ? { ...h, ...updates } : h));

    const loadRequest = (req: { method: string; url: string; headers: Header[]; body: string }) => {
        setMethod(req.method);
        setUrl(req.url);
        setHeaders(req.headers);
        setBody(req.body);
        setPanel('none');
    };

    const sendRequest = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setResponse(null);
        setStats(null);
        const startTime = performance.now();
        let finalStatus: number | null = null;
        try {
            const requestHeaders: Record<string, string> = {};
            headers.forEach(h => { if (h.enabled && h.key) requestHeaders[h.key] = h.value; });
            const options: RequestInit = { method, headers: requestHeaders };
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && body) options.body = body;

            const res = await fetch(url, options);
            const data = await res.text();
            const endTime = performance.now();
            finalStatus = res.status;

            setStats({ status: res.status, time: Math.round(endTime - startTime), size: (new Blob([data]).size / 1024).toFixed(2) + ' KB' });
            try { setResponse(JSON.parse(data)); } catch { setResponse(data); }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setIsLoading(false);
            const entry: HistoryEntry = { id: Math.random().toString(36).slice(2), method, url, status: finalStatus, timestamp: Date.now() };
            setHistory(prev => [entry, ...prev].slice(0, 20));
        }
    }, [url, method, headers, body, setHistory]);

    const handleSave = () => {
        const name = saveName.trim() || `${method} ${url.slice(0, 40)}`;
        const req: SavedRequest = { id: Math.random().toString(36).slice(2), name, method, url, headers, body };
        setSaved(prev => [req, ...prev]);
        setSavePrompt(false);
        setSaveName('');
    };

    const deleteHistory = (id: string) => setHistory(prev => prev.filter(h => h.id !== id));
    const deleteSaved = (id: string) => setSaved(prev => prev.filter(s => s.id !== id));

    const copyResponse = () => {
        if (response === null) return;
        const text = typeof response === 'string' ? response : JSON.stringify(response, null, 2);
        return navigator.clipboard.writeText(text);
    };

    return (
        <ToolLayout
            title={meta?.label ?? 'API Client'}
            description={meta?.desc}
            onCopy={copyResponse}
            onClear={() => { setResponse(null); setError(null); setStats(null); }}
            error={error}
            actions={
                <div className="flex items-center gap-2">
                    <button onClick={() => { setSavePrompt(prev => !prev); setPanel('none'); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">
                        <BookmarkPlus size={13} /> Save
                    </button>
                    <button onClick={() => setPanel(panel === 'history' ? 'none' : 'history')}
                        className={cn("flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors", panel === 'history' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80')}>
                        <History size={13} /> History
                    </button>
                    <button onClick={() => setPanel(panel === 'saved' ? 'none' : 'saved')}
                        className={cn("flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors", panel === 'saved' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80')}>
                        <Bookmark size={13} /> Saved
                    </button>
                    <button onClick={sendRequest} disabled={isLoading || !url}
                        className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20">
                        {isLoading ? <Clock className="animate-spin" size={14} /> : <Send size={14} />}
                        {isLoading ? 'Sending...' : 'Send'}
                    </button>
                </div>
            }
        >
            <div className="h-full flex overflow-hidden">
                {/* Side Panel */}
                {panel !== 'none' && (
                    <div className="w-72 border-r flex flex-col bg-background shrink-0">
                        <div className="flex items-center justify-between px-3 py-2 border-b bg-secondary/20">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                {panel === 'history' ? 'Request History' : 'Saved Requests'}
                            </span>
                            <button onClick={() => setPanel('none')} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
                        </div>
                        <div className="flex-1 overflow-auto">
                            {panel === 'history' && (
                                history.length === 0
                                    ? <p className="p-4 text-xs text-muted-foreground">No history yet. Send a request!</p>
                                    : history.map(h => (
                                        <div key={h.id} className="group flex items-start gap-2 px-3 py-2 border-b hover:bg-secondary/20 cursor-pointer"
                                            onClick={() => loadRequest({ method: h.method, url: h.url, headers, body })}>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("text-[10px] font-bold", METHOD_COLORS[h.method] ?? 'text-muted-foreground')}>{h.method}</span>
                                                    {h.status && <span className={cn("text-[9px] px-1 rounded", h.status < 300 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500')}>{h.status}</span>}
                                                </div>
                                                <p className="text-xs font-mono truncate text-muted-foreground mt-0.5">{h.url}</p>
                                                <p className="text-[9px] text-muted-foreground/50 mt-0.5">{formatTimestamp(h.timestamp)}</p>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); deleteHistory(h.id); }}
                                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all mt-1">
                                                <X size={11} />
                                            </button>
                                        </div>
                                    ))
                            )}
                            {panel === 'saved' && (
                                saved.length === 0
                                    ? <p className="p-4 text-xs text-muted-foreground">No saved requests. Use the Save button.</p>
                                    : saved.map(s => (
                                        <div key={s.id} className="group flex items-start gap-2 px-3 py-2 border-b hover:bg-secondary/20 cursor-pointer"
                                            onClick={() => loadRequest(s)}>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("text-[10px] font-bold", METHOD_COLORS[s.method] ?? 'text-muted-foreground')}>{s.method}</span>
                                                    <span className="text-xs font-medium truncate">{s.name}</span>
                                                </div>
                                                <p className="text-[10px] font-mono truncate text-muted-foreground/60 mt-0.5">{s.url}</p>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); deleteSaved(s.id); }}
                                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all mt-1">
                                                <Trash2 size={11} />
                                            </button>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                )}

                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Save prompt */}
                    {savePrompt && (
                        <div className="flex items-center gap-2 px-3 py-2 border-b bg-secondary/10">
                            <input value={saveName} onChange={e => setSaveName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSave()}
                                placeholder="Request name..."
                                className="flex-1 text-xs px-2 py-1.5 rounded border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                                autoFocus />
                            <button onClick={handleSave} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90 transition-colors">Save</button>
                            <button onClick={() => setSavePrompt(false)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
                        </div>
                    )}

                    <div className="p-4 border-b bg-card space-y-4">
                        <div className="flex gap-2">
                            <select value={method} onChange={(e) => setMethod(e.target.value)}
                                className="bg-secondary border-none rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 ring-primary/20 outline-none">
                                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://api.example.com/v1/resource"
                                className="flex-1 bg-secondary border-none rounded-lg px-4 py-2 text-sm focus:ring-2 ring-primary/20 outline-none" />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Headers</h3>
                                <button onClick={addHeader} className="p-1 hover:bg-secondary rounded text-primary transition-colors"><Plus size={16} /></button>
                            </div>
                            <div className="space-y-2">
                                {headers.map((header) => (
                                    <div key={header.id} className="flex gap-2 items-center">
                                        <input type="checkbox" checked={header.enabled}
                                            onChange={(e) => updateHeader(header.id, { enabled: e.target.checked })}
                                            className="rounded border-secondary bg-secondary text-primary focus:ring-0" />
                                        <input type="text" value={header.key}
                                            onChange={(e) => updateHeader(header.id, { key: e.target.value })}
                                            placeholder="Key" className="flex-1 bg-secondary border-none rounded-lg px-3 py-1.5 text-xs outline-none" />
                                        <input type="text" value={header.value}
                                            onChange={(e) => updateHeader(header.id, { value: e.target.value })}
                                            placeholder="Value" className="flex-1 bg-secondary border-none rounded-lg px-3 py-1.5 text-xs outline-none" />
                                        <button onClick={() => removeHeader(header.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && (
                            <div className="space-y-2">
                                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Request Body</h3>
                                <div className="h-40 rounded-lg overflow-hidden border">
                                    <Editor height="100%" defaultLanguage="json" value={body}
                                        onChange={(value) => setBody(value || '')}
                                        theme="vs-dark"
                                        options={{ minimap: { enabled: false }, fontSize: 12, lineNumbers: 'off', scrollBeyondLastLine: false, automaticLayout: true }} />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 bg-background relative overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-3 border-b bg-card/50">
                            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Response</h3>
                            {stats && (
                                <div className="flex gap-4 text-[10px] font-mono">
                                    <span className={cn("px-2 py-0.5 rounded", stats.status >= 200 && stats.status < 300 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                                        STATUS: {stats.status}
                                    </span>
                                    <span className="text-muted-foreground">TIME: {stats.time}ms</span>
                                    <span className="text-muted-foreground">SIZE: {stats.size}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <Editor height="100%" defaultLanguage="json"
                                value={response ? (typeof response === 'string' ? response : JSON.stringify(response, null, 2)) : ''}
                                theme="vs-dark"
                                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', automaticLayout: true, wordWrap: 'on' }} />
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
