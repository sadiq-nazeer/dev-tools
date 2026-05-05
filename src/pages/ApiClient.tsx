import { useState, useCallback } from 'react';
import { Send, Plus, Trash2, Clock, BookmarkPlus, History, Bookmark, X, FileJson } from 'lucide-react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { usePersistentState } from '../hooks/usePersistentState';
import { useToolPageMeta } from '../hooks/useToolPageMeta';
import Editor from '@monaco-editor/react';
import { cn } from '../lib/utils';
import { load as parseYaml } from 'js-yaml';

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

interface OpenApiOperation {
    id: string;
    method: string;
    path: string;
    name: string;
    description: string;
    tags: string[];
    bodyTemplate: string;
    headers: Header[];
}

interface OpenApiParseResult {
    baseUrl: string;
    operations: OpenApiOperation[];
}

type OpenApiPathItem = Partial<Record<'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options', OpenApiOperationObject>>;
interface OpenApiOperationObject {
    summary?: string;
    description?: string;
    operationId?: string;
    tags?: string[];
    requestBody?: {
        content?: Record<string, { example?: unknown; examples?: Record<string, { value?: unknown }>; schema?: Record<string, unknown> }>;
    };
}

const METHOD_COLORS: Record<string, string> = {
    GET: 'text-green-500', POST: 'text-blue-500', PUT: 'text-yellow-500',
    PATCH: 'text-orange-500', DELETE: 'text-red-500', HEAD: 'text-purple-500', OPTIONS: 'text-gray-500',
};

function formatTimestamp(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function safeJson(value: unknown): string {
    if (value === undefined) return '';
    if (typeof value === 'string') return value;
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return '';
    }
}

function parseOpenApiDocument(doc: unknown): OpenApiParseResult {
    if (!doc || typeof doc !== 'object') {
        throw new Error('Invalid OpenAPI document.');
    }

    const documentRecord = doc as {
        paths?: Record<string, OpenApiPathItem>;
        servers?: Array<{ url?: string }>;
    };

    const paths = documentRecord.paths;
    if (!paths || typeof paths !== 'object') {
        throw new Error('OpenAPI document has no paths.');
    }

    const baseUrl = documentRecord.servers?.[0]?.url ?? '';
    const methods: Array<keyof OpenApiPathItem> = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
    const operations: OpenApiOperation[] = [];

    Object.entries(paths).forEach(([path, pathItem]) => {
        if (!pathItem || typeof pathItem !== 'object') return;
        methods.forEach((method) => {
            const operation = pathItem[method];
            if (!operation) return;
            const content = operation.requestBody?.content ?? {};
            const jsonBody =
                content['application/json']?.example ??
                Object.values(content)[0]?.example ??
                Object.values(content)[0]?.examples?.[Object.keys(Object.values(content)[0]?.examples ?? {})[0]]?.value;

            const mappedHeaders: Header[] = [];
            if (Object.keys(content).length > 0) {
                mappedHeaders.push({
                    id: `content-${Math.random().toString(36).slice(2)}`,
                    key: 'Content-Type',
                    value: Object.keys(content)[0],
                    enabled: true,
                });
            }

            operations.push({
                id: `${method.toUpperCase()} ${path}`,
                method: method.toUpperCase(),
                path,
                name: operation.summary ?? operation.operationId ?? `${method.toUpperCase()} ${path}`,
                description: operation.description ?? '',
                tags: operation.tags ?? [],
                bodyTemplate: safeJson(jsonBody),
                headers: mappedHeaders,
            });
        });
    });

    return { baseUrl, operations };
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
    const [panel, setPanel] = useState<'none' | 'history' | 'saved' | 'openapi'>('none');
    const [savePrompt, setSavePrompt] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [openApiUrl, setOpenApiUrl] = usePersistentState<string>('api_openapi_url', '');
    const [openApiText, setOpenApiText] = usePersistentState<string>('api_openapi_text', '');
    const [openApiBaseUrl, setOpenApiBaseUrl] = useState('');
    const [openApiOps, setOpenApiOps] = useState<OpenApiOperation[]>([]);
    const [openApiError, setOpenApiError] = useState<string | null>(null);
    const [bearerToken, setBearerToken] = usePersistentState<string>('api_bearer_token', '');
    const [sendCredentials, setSendCredentials] = usePersistentState<boolean>('api_send_credentials', false);

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

    const applyOpenApiOperation = (operation: OpenApiOperation) => {
        const normalizedBase = openApiBaseUrl.replace(/\/$/, '');
        const normalizedPath = operation.path.startsWith('/') ? operation.path : `/${operation.path}`;
        setMethod(operation.method);
        setUrl(normalizedBase ? `${normalizedBase}${normalizedPath}` : normalizedPath);
        setHeaders(
            operation.headers.length > 0
                ? operation.headers
                : [{ id: `header-${Math.random().toString(36).slice(2)}`, key: '', value: '', enabled: true }]
        );
        setBody(operation.bodyTemplate);
        setPanel('none');
    };

    const applyBearerTokenHeader = useCallback((inputHeaders: Header[]): Header[] => {
        const withoutAuth = inputHeaders.filter((header) => header.key.toLowerCase() !== 'authorization');
        const trimmedToken = bearerToken.trim();
        if (!trimmedToken) return withoutAuth;
        return [
            ...withoutAuth,
            {
                id: `auth-${Math.random().toString(36).slice(2)}`,
                key: 'Authorization',
                value: `Bearer ${trimmedToken}`,
                enabled: true,
            },
        ];
    }, [bearerToken]);

    const parseOpenApiText = (rawSpec: string) => {
        const trimmed = rawSpec.trim();
        if (!trimmed) {
            setOpenApiError('OpenAPI input is empty.');
            return;
        }

        try {
            const parsed = trimmed.startsWith('{') ? JSON.parse(trimmed) : parseYaml(trimmed);
            const result = parseOpenApiDocument(parsed);
            setOpenApiBaseUrl(result.baseUrl);
            setOpenApiOps(result.operations);
            setOpenApiError(result.operations.length ? null : 'No operations found in spec.');
        } catch (e: unknown) {
            setOpenApiOps([]);
            setOpenApiBaseUrl('');
            setOpenApiError(e instanceof Error ? e.message : 'Failed to parse OpenAPI spec.');
        }
    };

    const loadOpenApiFromUrl = async () => {
        setOpenApiError(null);
        if (!openApiUrl.trim()) {
            setOpenApiError('Enter an OpenAPI URL first.');
            return;
        }
        try {
            const res = await fetch(openApiUrl);
            if (!res.ok) {
                throw new Error(`Unable to fetch spec (${res.status}).`);
            }
            const raw = await res.text();
            setOpenApiText(raw);
            parseOpenApiText(raw);
        } catch (e: unknown) {
            setOpenApiOps([]);
            setOpenApiBaseUrl('');
            setOpenApiError(e instanceof Error ? e.message : 'Failed to fetch OpenAPI URL.');
        }
    };

    const sendRequest = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setResponse(null);
        setStats(null);
        const startTime = performance.now();
        let finalStatus: number | null = null;
        try {
            const resolvedHeaders = applyBearerTokenHeader(headers);
            const requestHeaders: Record<string, string> = {};
            resolvedHeaders.forEach(h => { if (h.enabled && h.key) requestHeaders[h.key] = h.value; });
            const options: RequestInit = { method, headers: requestHeaders, credentials: sendCredentials ? 'include' : 'omit' };
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && body) options.body = body;

            const res = await fetch(url, options);
            const data = await res.text();
            const endTime = performance.now();
            finalStatus = res.status;

            setStats({ status: res.status, time: Math.round(endTime - startTime), size: (new Blob([data]).size / 1024).toFixed(2) + ' KB' });
            try { setResponse(JSON.parse(data)); } catch { setResponse(data); }
        } catch (e: unknown) {
            const rawMessage = e instanceof Error ? e.message : String(e);
            const maybeCors = rawMessage.includes('Failed to fetch') || rawMessage.includes('NetworkError');
            setError(
                maybeCors
                    ? 'Request blocked by browser (likely CORS). Allow this app origin in backend CORS, allow Authorization header, and allow OPTIONS preflight.'
                    : rawMessage
            );
        } finally {
            setIsLoading(false);
            const entry: HistoryEntry = { id: Math.random().toString(36).slice(2), method, url, status: finalStatus, timestamp: Date.now() };
            setHistory(prev => [entry, ...prev].slice(0, 20));
        }
    }, [url, method, headers, body, setHistory, applyBearerTokenHeader, sendCredentials]);

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
                    <button onClick={() => setPanel(panel === 'openapi' ? 'none' : 'openapi')}
                        className={cn("flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors", panel === 'openapi' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80')}>
                        <FileJson size={13} /> OpenAPI
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
                                {panel === 'history' ? 'Request History' : panel === 'saved' ? 'Saved Requests' : 'OpenAPI Import'}
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
                            {panel === 'openapi' && (
                                <div className="p-3 space-y-3">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Spec URL</p>
                                        <div className="flex gap-1.5">
                                            <input
                                                type="text"
                                                value={openApiUrl}
                                                onChange={(e) => setOpenApiUrl(e.target.value)}
                                                placeholder="https://api.example.com/openapi.json"
                                                className="flex-1 bg-secondary border-none rounded px-2 py-1.5 text-xs outline-none"
                                            />
                                            <button
                                                onClick={loadOpenApiFromUrl}
                                                className="px-2 py-1.5 text-[10px] font-semibold bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                                            >
                                                Load
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">OpenAPI JSON/YAML</p>
                                            <button
                                                onClick={() => parseOpenApiText(openApiText)}
                                                className="px-2 py-1 text-[10px] font-semibold bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors"
                                            >
                                                Parse
                                            </button>
                                        </div>
                                        <textarea
                                            value={openApiText}
                                            onChange={(e) => setOpenApiText(e.target.value)}
                                            placeholder="Paste OpenAPI spec here..."
                                            className="w-full h-24 bg-secondary border-none rounded px-2 py-1.5 text-xs font-mono outline-none resize-y"
                                        />
                                    </div>
                                    {openApiBaseUrl && (
                                        <p className="text-[10px] text-muted-foreground">
                                            Base URL: <span className="font-mono">{openApiBaseUrl}</span>
                                        </p>
                                    )}
                                    {openApiError && <p className="text-[10px] text-destructive">{openApiError}</p>}
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                            Operations ({openApiOps.length})
                                        </p>
                                        <div className="space-y-1 max-h-72 overflow-auto">
                                            {openApiOps.length === 0 ? (
                                                <p className="text-xs text-muted-foreground">No operations loaded yet.</p>
                                            ) : (
                                                openApiOps.map((operation) => (
                                                    <button
                                                        key={operation.id}
                                                        onClick={() => applyOpenApiOperation(operation)}
                                                        className="w-full text-left p-2 rounded border hover:bg-secondary/30 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className={cn('text-[10px] font-bold', METHOD_COLORS[operation.method] ?? 'text-muted-foreground')}>
                                                                {operation.method}
                                                            </span>
                                                            <span className="text-[11px] font-mono truncate">{operation.path}</span>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                                            {operation.name}
                                                            {operation.tags.length > 0 ? ` • ${operation.tags.join(', ')}` : ''}
                                                        </p>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
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

                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-center">
                            <input
                                type="password"
                                value={bearerToken}
                                onChange={(e) => setBearerToken(e.target.value)}
                                placeholder="Bearer token (optional)"
                                className="bg-secondary border-none rounded-lg px-3 py-2 text-xs outline-none"
                            />
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                <input
                                    type="checkbox"
                                    checked={sendCredentials}
                                    onChange={(e) => setSendCredentials(e.target.checked)}
                                    className="rounded border-secondary bg-secondary text-primary focus:ring-0"
                                />
                                Send cookies
                            </label>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            Bearer token auto-adds an <span className="font-mono">Authorization</span> header at send time.
                        </p>

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
