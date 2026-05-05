import Editor from '@monaco-editor/react';
import { Download, Trash2, Copy, Check, Plus, X, Pencil } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useLocalStorage } from '../hooks/use-local-storage';

interface NotepadTab {
    id: string;
    name: string;
    content: string;
}

function generateId() {
    return Math.random().toString(36).slice(2, 9);
}

function createTab(index: number): NotepadTab {
    return { id: generateId(), name: `Note ${index}`, content: '' };
}

export default function Notepad() {
    const [tabs, setTabs] = useLocalStorage<NotepadTab[]>('notepad-tabs', [createTab(1)]);
    const [activeTabId, setActiveTabId] = useLocalStorage<string>('notepad-active-tab', '');
    const [copied, setCopied] = useState(false);
    const [editingTabId, setEditingTabId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    const safeTabs = tabs.length > 0 ? tabs : [createTab(1)];
    const activeTab = safeTabs.find(t => t.id === activeTabId) ?? safeTabs[0];

    const updateActiveContent = useCallback((content: string) => {
        setTabs(safeTabs.map(t => t.id === activeTab.id ? { ...t, content } : t));
    }, [safeTabs, activeTab.id]);

    const handleDownload = () => {
        const blob = new Blob([activeTab.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeTab.name}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(activeTab.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const clearContent = () => {
        if (confirm(`Are you sure you want to clear "${activeTab.name}"?`)) {
            updateActiveContent('');
        }
    };

    const addTab = () => {
        const newTab = createTab(safeTabs.length + 1);
        setTabs([...safeTabs, newTab]);
        setActiveTabId(newTab.id);
    };

    const closeTab = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (safeTabs.length === 1) return;
        const remaining = safeTabs.filter(t => t.id !== id);
        setTabs(remaining);
        if (activeTab.id === id) {
            setActiveTabId(remaining[remaining.length - 1].id);
        }
    };

    const switchTab = (id: string) => {
        setActiveTabId(id);
    };

    const startRename = (tab: NotepadTab, e: React.MouseEvent) => {
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
        <div className="h-full flex flex-col relative w-full overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 border-b bg-background z-10 shrink-0">
                <h2 className="text-sm font-semibold px-2">Notepad</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                        title="Download as .txt"
                    >
                        <Download size={14} /> Download
                    </button>
                    <div className="w-px h-4 bg-border mx-1" />
                    <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy"
                    >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <button
                        onClick={clearContent}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
                        title="Clear"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

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
                    title="New note"
                >
                    <Plus size={14} />
                </button>
            </div>

            {/* Editor */}
            <div className="flex-1 w-full relative">
                <Editor
                    key={activeTab.id}
                    height="100%"
                    defaultLanguage="markdown"
                    value={activeTab.content}
                    onChange={(val) => updateActiveContent(val || '')}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 16,
                        lineNumbers: 'on',
                        wordWrap: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 16, bottom: 16 },
                    }}
                />
            </div>
        </div>
    );
}
