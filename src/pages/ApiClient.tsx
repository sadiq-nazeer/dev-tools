import { useState, useCallback, useMemo, useEffect } from 'react';
import { Send, Plus, Trash2, Clock, History, Bookmark, X, FileJson, ChevronDown, ChevronRight, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { usePersistentState } from '../hooks/usePersistentState';
import { useToolPageMeta } from '../hooks/useToolPageMeta';
import Editor from '@monaco-editor/react';
import { cn } from '../lib/utils';
import { load as parseYaml } from 'js-yaml';
import { invoke } from '@tauri-apps/api/core';

interface Header { id: string; key: string; value: string; enabled: boolean }
interface NativeRequestPayload {
    method: string;
    url: string;
    headers: Array<{ key: string; value: string; enabled: boolean }>;
    body?: string;
    sendCredentials: boolean;
}

interface NativeResponsePayload {
    status: number;
    body: string;
    headers: Array<{ key: string; value: string }>;
}

interface HistoryEntry {
    id: string;
    method: string;
    url: string;
    headers: Header[];
    body: string;
    sendCredentials: boolean;
    pathParamValues?: Record<string, string>;
    queryParamValues?: Record<string, string>;
    operationParams?: OpenApiParameter[];
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
    pathParamValues?: Record<string, string>;
    queryParamValues?: Record<string, string>;
    operationParams?: OpenApiParameter[];
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
    parameters: OpenApiParameter[];
}
interface OpenApiParameter {
    name: string;
    in: 'path' | 'query' | 'header' | 'cookie';
    required: boolean;
    description: string;
    defaultValue: string;
}

interface OpenApiParseResult {
    baseUrl: string;
    operations: OpenApiOperation[];
}
interface OpenApiOperationGroup {
    tag: string;
    operations: OpenApiOperation[];
}
interface ResponseHeader {
    key: string;
    value: string;
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
    parameters?: OpenApiParameterObject[];
}
interface OpenApiParameterObject {
    name?: string;
    in?: 'path' | 'query' | 'header' | 'cookie';
    required?: boolean;
    description?: string;
    example?: unknown;
    schema?: {
        default?: unknown;
        example?: unknown;
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

function asParamDefault(parameter: OpenApiParameterObject): string {
    const raw = parameter.example ?? parameter.schema?.example ?? parameter.schema?.default;
    if (raw === undefined || raw === null) return '';
    return typeof raw === 'string' ? raw : String(raw);
}

function decodeForDisplay(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
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
        const pathLevelParameters = (pathItem as { parameters?: OpenApiParameterObject[] }).parameters ?? [];
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

            const rawParameters = [...pathLevelParameters, ...(operation.parameters ?? [])];
            const dedupedParameters = new Map<string, OpenApiParameter>();
            rawParameters.forEach((parameter) => {
                if (!parameter?.name || !parameter?.in) return;
                const key = `${parameter.in}:${parameter.name}`;
                if (dedupedParameters.has(key)) return;
                dedupedParameters.set(key, {
                    name: parameter.name,
                    in: parameter.in,
                    required: Boolean(parameter.required),
                    description: parameter.description ?? '',
                    defaultValue: asParamDefault(parameter),
                });
            });

            operations.push({
                id: `${method.toUpperCase()} ${path}`,
                method: method.toUpperCase(),
                path,
                name: operation.summary ?? operation.operationId ?? `${method.toUpperCase()} ${path}`,
                description: operation.description ?? '',
                tags: operation.tags ?? [],
                bodyTemplate: safeJson(jsonBody),
                headers: mappedHeaders,
                parameters: Array.from(dedupedParameters.values()),
            });
        });
    });

    return { baseUrl, operations };
}

function isDesktopTauriRuntime(): boolean {
    if (typeof window === 'undefined') return false;
    return '__TAURI_INTERNALS__' in window;
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
    const [responseHeaders, setResponseHeaders] = useState<ResponseHeader[]>([]);
    const [responseTab, setResponseTab] = useState<'body' | 'headers'>('body');
    const [responseCopied, setResponseCopied] = useState(false);

    const [history, setHistory] = usePersistentState<HistoryEntry[]>('api_history', []);
    const [saved, setSaved] = usePersistentState<SavedRequest[]>('api_saved', []);
    const [panel, setPanel] = useState<'none' | 'history' | 'saved' | 'openapi'>('none');
    const [openApiUrl, setOpenApiUrl] = usePersistentState<string>('api_openapi_url', '');
    const [openApiText, setOpenApiText] = usePersistentState<string>('api_openapi_text', '');
    const [openApiBaseUrl, setOpenApiBaseUrl] = useState('');
    const [openApiOps, setOpenApiOps] = useState<OpenApiOperation[]>([]);
    const [openApiError, setOpenApiError] = useState<string | null>(null);
    const [collapsedTags, setCollapsedTags] = useState<Record<string, boolean>>({});
    const [openApiImportCollapsed, setOpenApiImportCollapsed] = useState(false);
    const [openApiSearch, setOpenApiSearch] = useState('');
    const [bearerToken, setBearerToken] = usePersistentState<string>('api_bearer_token', '');
    const [showBearerToken, setShowBearerToken] = useState(false);
    const [sendCredentials, setSendCredentials] = usePersistentState<boolean>('api_send_credentials', false);
    const [pathParamValues, setPathParamValues] = useState<Record<string, string>>({});
    const [queryParamValues, setQueryParamValues] = useState<Record<string, string>>({});
    const [activeOperationParams, setActiveOperationParams] = useState<OpenApiParameter[]>([]);
    const [customTitle, setCustomTitle] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState('');

    const addHeader = () => setHeaders([...headers, { id: Math.random().toString(36).substr(2, 9), key: '', value: '', enabled: true }]);
    const removeHeader = (id: string) => setHeaders(headers.filter(h => h.id !== id));
    const updateHeader = (id: string, updates: Partial<Header>) => setHeaders(headers.map(h => h.id === id ? { ...h, ...updates } : h));

    const loadRequest = (req: {
        method: string;
        url: string;
        headers: Header[];
        body: string;
        pathParamValues?: Record<string, string>;
        queryParamValues?: Record<string, string>;
        operationParams?: OpenApiParameter[];
    }) => {
        setMethod(req.method);
        setUrl(req.url);
        setHeaders(req.headers);
        setBody(req.body);
        setPathParamValues(req.pathParamValues ?? {});
        setQueryParamValues(req.queryParamValues ?? {});
        setActiveOperationParams(req.operationParams ?? []);
    };

    const resolveOpenApiUrl = (inputUrl: string): string[] => {
        const trimmed = inputUrl.trim();
        if (!trimmed) return [];
        const normalized = trimmed.replace(/#.*$/, '');
        if (normalized.includes('/swagger-ui/')) {
            const base = normalized.split('/swagger-ui/')[0];
            return [`${base}/v3/api-docs`, `${base}/v3/api-docs.yaml`, `${base}/api-docs`, normalized];
        }
        return [normalized];
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
        const nextPathValues: Record<string, string> = {};
        const nextQueryValues: Record<string, string> = {};
        operation.parameters.forEach((parameter) => {
            if (parameter.in === 'path') nextPathValues[parameter.name] = parameter.defaultValue;
            if (parameter.in === 'query') nextQueryValues[parameter.name] = parameter.defaultValue;
        });
        setPathParamValues(nextPathValues);
        setQueryParamValues(nextQueryValues);
        setActiveOperationParams(operation.parameters);
        setBody(operation.bodyTemplate);
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
            const nextCollapsed: Record<string, boolean> = {};
            result.operations.forEach((operation) => {
                const groupTag = operation.tags[0]?.trim() || 'Untagged';
                if (!(groupTag in nextCollapsed)) nextCollapsed[groupTag] = true;
            });
            setCollapsedTags(nextCollapsed);
            setOpenApiError(result.operations.length ? null : 'No operations found in spec.');
        } catch (e: unknown) {
            setOpenApiOps([]);
            setOpenApiBaseUrl('');
            setCollapsedTags({});
            setOpenApiError(e instanceof Error ? e.message : 'Failed to parse OpenAPI spec.');
        }
    };

    const loadOpenApiFromUrl = async () => {
        setOpenApiError(null);
        if (!openApiUrl.trim()) {
            setOpenApiError('Enter an OpenAPI URL first.');
            return;
        }
        const urlCandidates = resolveOpenApiUrl(openApiUrl);
        let lastError = 'Failed to fetch OpenAPI URL.';
        for (const candidate of urlCandidates) {
            try {
                const res = await fetch(candidate);
                if (!res.ok) {
                    lastError = `Unable to fetch spec (${res.status}) from ${candidate}.`;
                    continue;
                }
                const raw = await res.text();
                setOpenApiUrl(candidate);
                setOpenApiText(raw);
                parseOpenApiText(raw);
                return;
            } catch (e: unknown) {
                lastError = e instanceof Error ? e.message : 'Failed to fetch OpenAPI URL.';
            }
        }
        setOpenApiOps([]);
        setOpenApiBaseUrl('');
        setCollapsedTags({});
        setOpenApiError(lastError);
    };

    const groupedOpenApiOps = useMemo<OpenApiOperationGroup[]>(() => {
        const groups = new Map<string, OpenApiOperation[]>();
        openApiOps.forEach((operation) => {
            const q = openApiSearch.trim().toLowerCase();
            if (q) {
                const haystack = `${operation.method} ${operation.path} ${operation.name} ${(operation.tags ?? []).join(' ')}`.toLowerCase();
                if (!haystack.includes(q)) return;
            }
            const groupTag = operation.tags[0]?.trim() || 'Untagged';
            const existing = groups.get(groupTag);
            if (existing) existing.push(operation);
            else groups.set(groupTag, [operation]);
        });
        return Array.from(groups.entries()).map(([tag, operations]) => ({ tag, operations }));
    }, [openApiOps, openApiSearch]);
    const hasOpenApiSearch = openApiSearch.trim().length > 0;

    const detectedPathParams = useMemo(() => {
        const matches = Array.from(url.matchAll(/\{([^}]+)\}/g)).map((m) => m[1]);
        return Array.from(new Set(matches));
    }, [url]);

    const activeQueryParams = useMemo(
        () => activeOperationParams.filter((parameter) => parameter.in === 'query'),
        [activeOperationParams]
    );

    const resolvedUrl = useMemo(() => {
        let nextUrl = url;
        Object.entries(pathParamValues).forEach(([param, value]) => {
            const token = `{${param}}`;
            if (nextUrl.includes(token)) nextUrl = nextUrl.split(token).join(encodeURIComponent(value || ''));
        });
        const [basePart, hashPart = ''] = nextUrl.split('#');
        const [pathPart, queryString = ''] = basePart.split('?');
        const searchParams = new URLSearchParams(queryString);
        Object.entries(queryParamValues).forEach(([key, value]) => {
            if (value.trim()) searchParams.set(key, value);
            else searchParams.delete(key);
        });
        const builtQuery = searchParams.toString();
        nextUrl = `${pathPart}${builtQuery ? `?${builtQuery}` : ''}${hashPart ? `#${hashPart}` : ''}`;
        return nextUrl;
    }, [url, pathParamValues, queryParamValues]);

    const autoRequestTitle = useMemo(() => {
        const candidateUrl = resolvedUrl || url;
        if (!candidateUrl.trim()) return `${method} Untitled Request`;
        try {
            const parsed = new URL(candidateUrl);
            const compactPath = `${decodeForDisplay(parsed.pathname)}${decodeForDisplay(parsed.search)}` || parsed.hostname;
            return `${method} ${compactPath || parsed.href}`;
        } catch {
            return `${method} ${candidateUrl.slice(0, 80)}`;
        }
    }, [method, resolvedUrl, url]);
    const requestTitle = customTitle.trim() || autoRequestTitle;

    useEffect(() => {
        if (!isEditingTitle) {
            setCustomTitle('');
        }
    }, [autoRequestTitle, isEditingTitle]);

    const sendRequest = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setResponse(null);
        setStats(null);
        setResponseHeaders([]);
        setResponseTab('body');
        const startTime = performance.now();
        let finalStatus: number | null = null;
        try {
            const resolvedHeaders = applyBearerTokenHeader(headers);
            const requestHeaders: Record<string, string> = {};
            resolvedHeaders.forEach(h => { if (h.enabled && h.key) requestHeaders[h.key] = h.value; });
            let status: number;
            let data: string;
            let collectedHeaders: ResponseHeader[] = [];

            if (isDesktopTauriRuntime()) {
                const payload: NativeRequestPayload = {
                    method,
                    url: resolvedUrl,
                    headers: resolvedHeaders.map((header) => ({
                        key: header.key,
                        value: header.value,
                        enabled: header.enabled,
                    })),
                    body: ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && body ? body : undefined,
                    sendCredentials,
                };
                const nativeRes = await invoke<NativeResponsePayload>('send_native_request', { payload });
                status = nativeRes.status;
                data = nativeRes.body;
                collectedHeaders = nativeRes.headers;
            } else {
                const options: RequestInit = { method, headers: requestHeaders, credentials: sendCredentials ? 'include' : 'omit' };
                if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && body) options.body = body;
                const res = await fetch(resolvedUrl, options);
                status = res.status;
                data = await res.text();
                collectedHeaders = Array.from(res.headers.entries()).map(([key, value]) => ({ key, value }));
            }

            const endTime = performance.now();
            finalStatus = status;
            setResponseHeaders(collectedHeaders);

            setStats({ status, time: Math.round(endTime - startTime), size: (new Blob([data]).size / 1024).toFixed(2) + ' KB' });
            try { setResponse(JSON.parse(data)); } catch { setResponse(data); }
        } catch (e: unknown) {
            const rawMessage = e instanceof Error ? e.message : String(e);
            const maybeCors = rawMessage.includes('Failed to fetch') || rawMessage.includes('NetworkError');
            const maybeAuth = rawMessage.includes('401') || rawMessage.includes('403');
            const maybeDns = rawMessage.toLowerCase().includes('dns') || rawMessage.includes('ENOTFOUND');
            setError(
                maybeCors
                    ? 'Request blocked by browser (likely CORS). Allow this app origin in backend CORS, allow Authorization header, and allow OPTIONS preflight.'
                    : maybeAuth
                        ? 'Request rejected by backend auth (401/403). Check Bearer token, required headers, and endpoint permissions.'
                        : maybeDns
                            ? 'Unable to resolve host. Check URL/port and that the API server is running.'
                            : rawMessage
            );
        } finally {
            setIsLoading(false);
            const entry: HistoryEntry = {
                id: Math.random().toString(36).slice(2),
                method,
                url,
                headers,
                body,
                sendCredentials,
                pathParamValues,
                queryParamValues,
                operationParams: activeOperationParams,
                status: finalStatus,
                timestamp: Date.now()
            };
            setHistory(prev => [entry, ...prev].slice(0, 20));
        }
    }, [url, method, headers, body, setHistory, applyBearerTokenHeader, sendCredentials, resolvedUrl, pathParamValues, queryParamValues, activeOperationParams]);

    const handleSave = () => {
        const req: SavedRequest = {
            id: Math.random().toString(36).slice(2),
            name: requestTitle,
            method,
            url,
            headers,
            body,
            pathParamValues,
            queryParamValues,
            operationParams: activeOperationParams
        };
        setSaved(prev => [req, ...prev]);
        setPanel('saved');
    };

    const deleteHistory = (id: string) => setHistory(prev => prev.filter(h => h.id !== id));
    const deleteSaved = (id: string) => setSaved(prev => prev.filter(s => s.id !== id));

    const copyResponse = () => {
        if (response === null) return;
        const text = typeof response === 'string' ? response : JSON.stringify(response, null, 2);
        return navigator.clipboard.writeText(text).then(() => {
            setResponseCopied(true);
            setTimeout(() => setResponseCopied(false), 1500);
        });
    };

    const clearResponse = () => {
        setResponse(null);
        setError(null);
        setStats(null);
        setResponseHeaders([]);
        setResponseTab('body');
        setResponseCopied(false);
    };

    const copyAsCurl = () => {
        const resolvedHeaders = applyBearerTokenHeader(headers).filter((h) => h.enabled && h.key.trim());
        const methodPart = `-X ${method}`;
        const headerParts = resolvedHeaders.map((h) => `-H "${h.key}: ${h.value.replace(/"/g, '\\"')}"`);
        const bodyPart = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && body
            ? [`--data-raw "${body.replace(/"/g, '\\"')}"`]
            : [];
        const command = ['curl', methodPart, `"${resolvedUrl}"`, ...headerParts, ...bodyPart].join(' ');
        return navigator.clipboard.writeText(command);
    };

    return (
        <ToolLayout
            title={meta?.label ?? 'API Client'}
            description={meta?.desc}
            error={error}
            actions={
                <div className="flex items-center gap-2">
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
                                            onClick={() => {
                                                loadRequest({
                                                    method: h.method,
                                                    url: h.url,
                                                    headers: h.headers,
                                                    body: h.body,
                                                    pathParamValues: h.pathParamValues,
                                                    queryParamValues: h.queryParamValues,
                                                    operationParams: h.operationParams
                                                });
                                                setSendCredentials(h.sendCredentials);
                                            }}>
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
                                            onClick={() => loadRequest({
                                                method: s.method,
                                                url: s.url,
                                                headers: s.headers,
                                                body: s.body,
                                                pathParamValues: s.pathParamValues,
                                                queryParamValues: s.queryParamValues,
                                                operationParams: s.operationParams
                                            })}>
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
                                <div className="p-3 h-full flex flex-col min-h-0 gap-3">
                                    <div className="border rounded">
                                        <button
                                            type="button"
                                            onClick={() => setOpenApiImportCollapsed((prev) => !prev)}
                                            className="w-full flex items-center justify-between px-2 py-1.5 bg-secondary/20 hover:bg-secondary/30 transition-colors"
                                        >
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">OpenAPI Import</span>
                                            <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-background/70 text-foreground border border-border/70">
                                                {openApiImportCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                                            </span>
                                        </button>
                                        {!openApiImportCollapsed && (
                                            <div className="p-2 space-y-3">
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
                                            </div>
                                        )}
                                    </div>
                                    {openApiBaseUrl && (
                                        <p className="text-[10px] text-muted-foreground">
                                            Base URL: <span className="font-mono">{openApiBaseUrl}</span>
                                        </p>
                                    )}
                                    {openApiError && <p className="text-[10px] text-destructive">{openApiError}</p>}
                                    <div className="space-y-1.5 flex-1 min-h-0 flex flex-col">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                Operations ({openApiOps.length})
                                            </p>
                                            <input
                                                type="text"
                                                value={openApiSearch}
                                                onChange={(e) => setOpenApiSearch(e.target.value)}
                                                placeholder="Search operations..."
                                                className="w-full bg-secondary border-none rounded px-2 py-1.5 text-xs outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1 flex-1 min-h-0 overflow-auto">
                                            {openApiOps.length === 0 ? (
                                                <p className="text-xs text-muted-foreground">No operations loaded yet.</p>
                                            ) : (
                                                groupedOpenApiOps.map((group) => (
                                                    <div key={group.tag} className="border rounded">
                                                        {(() => {
                                                            const isCollapsed = hasOpenApiSearch ? false : (collapsedTags[group.tag] ?? true);
                                                            return (
                                                                <>
                                                        <button
                                                            type="button"
                                                            onClick={() => setCollapsedTags((prev) => ({ ...prev, [group.tag]: !(prev[group.tag] ?? true) }))}
                                                            className="w-full flex items-center justify-between px-2 py-1.5 text-left bg-secondary/20 hover:bg-secondary/30 transition-colors"
                                                        >
                                                            <span className="text-[10px] font-bold uppercase tracking-wide">{group.tag}</span>
                                                            <span className="text-[10px] text-muted-foreground">{isCollapsed ? '+' : '-'} {group.operations.length}</span>
                                                        </button>
                                                        {!isCollapsed && (
                                                            <div className="space-y-1 p-1.5">
                                                                {group.operations.map((operation) => (
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
                                                                        </p>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
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
                    <div className="p-4 border-b bg-card space-y-4">
                        <div className="flex items-center justify-between gap-2">
                            {isEditingTitle ? (
                                <input
                                    value={titleDraft}
                                    onChange={(e) => setTitleDraft(e.target.value)}
                                    onBlur={() => {
                                        setCustomTitle(titleDraft.trim());
                                        setIsEditingTitle(false);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            setCustomTitle(titleDraft.trim());
                                            setIsEditingTitle(false);
                                        } else if (e.key === 'Escape') {
                                            setTitleDraft(customTitle || autoRequestTitle);
                                            setIsEditingTitle(false);
                                        }
                                    }}
                                    className="flex-1 text-xs px-2 py-1 rounded border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                                    autoFocus
                                />
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTitleDraft(requestTitle);
                                        setIsEditingTitle(true);
                                    }}
                                    className="text-xs font-medium text-muted-foreground truncate text-left hover:text-foreground transition-colors"
                                    title="Click to edit request title"
                                >
                                    {requestTitle}
                                </button>
                            )}
                            <button
                                onClick={handleSave}
                                className="px-3 py-1.5 text-xs font-semibold bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors shrink-0"
                            >
                                Save
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <select value={method} onChange={(e) => setMethod(e.target.value)}
                                className="bg-secondary border-none rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 ring-primary/20 outline-none">
                                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://api.example.com/v1/resource"
                                className="flex-1 bg-secondary border-none rounded-lg px-4 py-2 text-sm focus:ring-2 ring-primary/20 outline-none" />
                            <button onClick={sendRequest} disabled={isLoading || !url}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20">
                                {isLoading ? <Clock className="animate-spin" size={14} /> : <Send size={14} />}
                                {isLoading ? 'Sending...' : 'Send'}
                            </button>
                            <button
                                onClick={copyAsCurl}
                                className="px-3 py-2 text-xs font-semibold bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                            >
                                Copy cURL
                            </button>
                        </div>
                        {detectedPathParams.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Path Params</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {detectedPathParams.map((param) => (
                                        <input
                                            key={param}
                                            type="text"
                                            value={pathParamValues[param] ?? ''}
                                            onChange={(e) => setPathParamValues((prev) => ({ ...prev, [param]: e.target.value }))}
                                            placeholder={param}
                                            className="bg-secondary border-none rounded-lg px-3 py-2 text-xs outline-none"
                                        />
                                    ))}
                                </div>
                                <p className="text-[10px] text-muted-foreground">Resolved URL: <span className="font-mono">{resolvedUrl}</span></p>
                            </div>
                        )}
                        {activeQueryParams.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Request Params</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {activeQueryParams.map((param) => (
                                        <input
                                            key={param.name}
                                            type="text"
                                            value={queryParamValues[param.name] ?? ''}
                                            onChange={(e) => setQueryParamValues((prev) => ({ ...prev, [param.name]: e.target.value }))}
                                            placeholder={`${param.name}${param.required ? ' *' : ''}`}
                                            title={param.description || param.name}
                                            className="bg-secondary border-none rounded-lg px-3 py-2 text-xs outline-none"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Authorization</p>
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-center">
                                <div className="flex items-center bg-secondary rounded-lg">
                                    <input
                                        type={showBearerToken ? 'text' : 'password'}
                                        value={bearerToken}
                                        onChange={(e) => setBearerToken(e.target.value)}
                                        placeholder="Bearer token (optional)"
                                        className="flex-1 bg-transparent border-none rounded-l-lg px-3 py-2 text-xs outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowBearerToken((prev) => !prev)}
                                        className="px-2 text-muted-foreground hover:text-foreground transition-colors"
                                        title={showBearerToken ? 'Hide token' : 'Show token'}
                                    >
                                        {showBearerToken ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
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
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setResponseTab('body')}
                                    className={cn('px-2 py-1 text-[10px] rounded', responseTab === 'body' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground')}
                                >
                                    Body
                                </button>
                                <button
                                    onClick={() => setResponseTab('headers')}
                                    className={cn('px-2 py-1 text-[10px] rounded', responseTab === 'headers' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground')}
                                >
                                    Headers
                                </button>
                                <button
                                    onClick={copyResponse}
                                    className="flex items-center gap-1 px-2 py-1 text-[10px] rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                                    title="Copy response"
                                >
                                    {responseCopied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                    Copy
                                </button>
                                <button
                                    onClick={clearResponse}
                                    className="flex items-center gap-1 px-2 py-1 text-[10px] rounded text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors"
                                    title="Clear response"
                                >
                                    <Trash2 size={12} />
                                    Clear
                                </button>
                            </div>
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
                            {responseTab === 'body' ? (
                                <Editor height="100%" defaultLanguage="json"
                                    value={response ? (typeof response === 'string' ? response : JSON.stringify(response, null, 2)) : ''}
                                    theme="vs-dark"
                                    options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', automaticLayout: true, wordWrap: 'on' }} />
                            ) : (
                                <Editor height="100%" defaultLanguage="json"
                                    value={JSON.stringify(responseHeaders, null, 2)}
                                    theme="vs-dark"
                                    options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', automaticLayout: true, wordWrap: 'on' }} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
