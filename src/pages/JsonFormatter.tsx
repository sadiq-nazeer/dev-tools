import { useRef, useState, useCallback, useMemo } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Braces, Minimize2, Plus, X, Pencil, Filter, Copy, Check } from 'lucide-react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { usePersistentState } from '../hooks/usePersistentState';
import { useToolPageMeta } from '../hooks/useToolPageMeta';

function jqEval(data: unknown, expr: string): unknown {
    const parts = expr.split('|').map(p => p.trim());
    let current: unknown = data;
    for (const part of parts) {
        current = evalPart(current, part);
    }
    return current;
}

function evalPart(data: unknown, expr: string): unknown {
    if (expr === '' || expr === '.') return data;
    // Strip leading dot
    const path = expr.startsWith('.') ? expr.slice(1) : expr;
    if (!path) return data;

    let current: unknown = data;
    // Tokenize: split on dots but respect [n]
    const tokens = path.match(/[^\u002E\u005B]+|\[\d+\]|\[\]/g) ?? [];
    for (const token of tokens) {
        if (token === '[]') {
            if (!Array.isArray(current)) throw new Error(`Expected array, got ${typeof current}`);
            return current; // iterate returns the array itself for our purposes
        }
        const arrIdx = token.match(/^\[(\d+)\]$/);
        if (arrIdx) {
            if (!Array.isArray(current)) throw new Error(`Expected array at index access`);
            current = (current as unknown[])[parseInt(arrIdx[1])];
        } else {
            if (current === null || typeof current !== 'object' || Array.isArray(current)) {
                throw new Error(`Cannot access key "${token}" on ${typeof current}`);
            }
            current = (current as Record<string, unknown>)[token];
        }
    }
    return current;
}

interface JsonTab {
    id: string;
    name: string;
    content: string;
}

function generateId() {
    return Math.random().toString(36).slice(2, 9);
}

function createTab(index: number): JsonTab {
    return { id: generateId(), name: `Tab ${index}`, content: '' };
}

export default function JsonFormatter() {
    const meta = useToolPageMeta();
    const [tabs, setTabs] = usePersistentState<JsonTab[]>('json_tabs', [createTab(1)]);
    const [activeTabId, setActiveTabId] = usePersistentState<string>('json_active_tab', '');
    const [error, setError] = useState<string | null>(null);
    const [editingTabId, setEditingTabId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [query, setQuery] = useState('');
    const [queryResult, setQueryResult] = useState<string | null>(null);
    const [queryError, setQueryError] = useState<string | null>(null);
    const [queryCopied, setQueryCopied] = useState(false);
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

    const safeTabs = useMemo(
        () => (tabs.length > 0 ? tabs : [createTab(1)]),
        [tabs]
    );
    const activeTab = safeTabs.find(t => t.id === activeTabId) ?? safeTabs[0];

    const handleEditorDidMount: OnMount = (editor) => {
        editorRef.current = editor;
    };

    const updateActiveContent = useCallback((content: string) => {
        setTabs(safeTabs.map(t => t.id === activeTab.id ? { ...t, content } : t));
    }, [safeTabs, activeTab.id, setTabs]);

    const formatJson = () => {
        try {
            if (!activeTab.content.trim()) return;
            const parsed = JSON.parse(activeTab.content);
            const formatted = JSON.stringify(parsed, null, 2);
            updateActiveContent(formatted);
            setError(null);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        }
    };

    const minifyJson = () => {
        try {
            if (!activeTab.content.trim()) return;
            const parsed = JSON.parse(activeTab.content);
            const minified = JSON.stringify(parsed);
            updateActiveContent(minified);
            setError(null);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        }
    };

    const addTab = () => {
        const newTab = createTab(safeTabs.length + 1);
        setTabs([...safeTabs, newTab]);
        setActiveTabId(newTab.id);
        setError(null);
    };

    const closeTab = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (safeTabs.length === 1) return; // keep at least one tab
        const remaining = safeTabs.filter(t => t.id !== id);
        setTabs(remaining);
        if (activeTab.id === id) {
            setActiveTabId(remaining[remaining.length - 1].id);
        }
        setError(null);
    };

    const switchTab = (id: string) => {
        setActiveTabId(id);
        setError(null);
        setQueryResult(null);
        setQueryError(null);
    };

    const runQuery = () => {
        setQueryResult(null);
        setQueryError(null);
        if (!query.trim()) return;
        try {
            const parsed = JSON.parse(activeTab.content);
            const result = jqEval(parsed, query.trim());
            setQueryResult(JSON.stringify(result, null, 2));
        } catch (e) {
            setQueryError((e as Error).message);
        }
    };

    const startRename = (tab: JsonTab, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingTabId(tab.id);
        setEditingName(tab.name);
    };

    const commitRename = () => {
        if (!editingTabId) return;
        const trimmed = editingName.trim();
        if (trimmed) {
            setTabs(safeTabs.map(t => t.id === editingTabId ? { ...t, name: trimmed } : t));
        }
        setEditingTabId(null);
    };

    return (
        <ToolLayout
            title={meta?.label ?? 'JSON Formatter'}
            description={meta?.desc}
            onCopy={() => navigator.clipboard.writeText(activeTab.content)}
            onClear={() => {
                updateActiveContent('');
                setError(null);
            }}
            error={error}
            actions={
                <div className="flex gap-2">
                    <button
                        onClick={formatJson}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                    >
                        <Braces size={14} /> Format
                    </button>
                    <button
                        onClick={minifyJson}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors"
                    >
                        <Minimize2 size={14} /> Minify
                    </button>
                </div>
            }
        >
            <div className="h-full w-full flex flex-col">
                {/* Tab bar */}
                <div className="flex items-center border-b bg-background shrink-0 overflow-x-auto">
                    {safeTabs.map(tab => (
                        <div
                            key={tab.id}
                            onClick={() => switchTab(tab.id)}
                            className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer border-r shrink-0 max-w-[160px] transition-colors select-none ${
                                activeTab.id === tab.id
                                    ? 'bg-background text-foreground border-b-2 border-b-primary -mb-px'
                                    : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            {editingTabId === tab.id ? (
                                <input
                                    autoFocus
                                    className="bg-transparent outline-none w-20 text-xs font-medium"
                                    value={editingName}
                                    onChange={e => setEditingName(e.target.value)}
                                    onBlur={commitRename}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') commitRename();
                                        if (e.key === 'Escape') setEditingTabId(null);
                                        e.stopPropagation();
                                    }}
                                    onClick={e => e.stopPropagation()}
                                />
                            ) : (
                                <>
                                    <span
                                        className="truncate max-w-[100px]"
                                        onDoubleClick={e => startRename(tab, e)}
                                        title={`${tab.name} (double-click to rename)`}
                                    >
                                        {tab.name}
                                    </span>
                                    <button
                                        onClick={e => startRename(tab, e)}
                                        className="opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity shrink-0"
                                        title="Rename tab"
                                    >
                                        <Pencil size={10} />
                                    </button>
                                </>
                            )}
                            {safeTabs.length > 1 && (
                                <button
                                    onClick={e => closeTab(tab.id, e)}
                                    className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity ml-0.5 shrink-0"
                                    title="Close tab"
                                >
                                    <X size={11} />
                                </button>
                            )}
                        </div>
                    ))}

                    {/* New tab button */}
                    <button
                        onClick={addTab}
                        className="flex items-center justify-center px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                        title="New tab"
                    >
                        <Plus size={14} />
                    </button>
                </div>

                {/* Query Bar */}
                <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-secondary/10">
                    <Filter size={13} className="text-muted-foreground shrink-0" />
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && runQuery()}
                        placeholder='jq path query: .users[0].name  or  .items[] | .id'
                        className="flex-1 text-xs font-mono bg-transparent focus:outline-none placeholder:text-muted-foreground/40"
                    />
                    <button onClick={runQuery}
                        className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 font-medium transition-colors shrink-0">
                        Run
                    </button>
                    {queryResult !== null && (
                        <button onClick={() => { setQuery(''); setQueryResult(null); setQueryError(null); }}
                            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors shrink-0">
                            <X size={12} />
                        </button>
                    )}
                </div>

                {/* Query Result */}
                {(queryResult !== null || queryError) && (
                    <div className="border-b bg-secondary/5 max-h-40 overflow-auto">
                        {queryError ? (
                            <div className="px-3 py-2 text-xs text-destructive font-mono">{queryError}</div>
                        ) : (
                            <div className="relative">
                                <pre className="px-3 py-2 text-xs font-mono text-green-400 whitespace-pre-wrap break-all leading-relaxed">{queryResult}</pre>
                                <button
                                    onClick={async () => { await navigator.clipboard.writeText(queryResult ?? ''); setQueryCopied(true); setTimeout(() => setQueryCopied(false), 2000); }}
                                    className="absolute top-2 right-2 text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1">
                                    {queryCopied ? <Check size={11} /> : <Copy size={11} />}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Editor */}
                <div className="flex-1 relative">
                    <Editor
                        key={activeTab.id}
                        height="100%"
                        defaultLanguage="json"
                        value={activeTab.content}
                        onChange={(value) => {
                            updateActiveContent(value || '');
                            if (error) setError(null);
                        }}
                        onMount={handleEditorDidMount}
                        theme="vs-dark"
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            tabSize: 2,
                            formatOnPaste: true,
                            wordWrap: 'on'
                        }}
                    />
                </div>
            </div>
        </ToolLayout>
    );
}
