import { useState, useRef } from 'react';
import { Settings, Download, Upload, Check, AlertCircle, Trash2 } from 'lucide-react';

const EXPORT_KEYS = [
    'devtools_favorites',
    'devtools_recent',
    'devtools_dashboard_tz',
    'devtools_workspaces',
    'notepad-tabs',
    'notepad-active-tab',
    'vite-ui-theme',
    'pw_mode',
    'pw_length',
    'pw_options',
    'pp_words',
    'pp_sep',
    'pp_cap',
    'pp_num',
];

function collectState(): Record<string, unknown> {
    const state: Record<string, unknown> = { _version: 1, _exported: new Date().toISOString() };
    for (const key of EXPORT_KEYS) {
        const val = localStorage.getItem(key);
        if (val !== null) {
            try { state[key] = JSON.parse(val); }
            catch { state[key] = val; }
        }
    }
    // Also grab any notes keys
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('notes_') || k.startsWith('devtools_'))) {
            const val = localStorage.getItem(k);
            if (val !== null) {
                try { state[k] = JSON.parse(val); }
                catch { state[k] = val; }
            }
        }
    }
    return state;
}

function restoreState(data: Record<string, unknown>) {
    for (const [key, value] of Object.entries(data)) {
        if (key.startsWith('_')) continue;
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
}

export default function AppSettings() {
    const [exportStatus, setExportStatus] = useState<'idle' | 'done'>('idle');
    const [importStatus, setImportStatus] = useState<'idle' | 'done' | 'error'>('idle');
    const [importError, setImportError] = useState('');
    const [clearDone, setClearDone] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const state = collectState();
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `devtools-state-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setExportStatus('done');
        setTimeout(() => setExportStatus('idle'), 3000);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target?.result as string);
                if (typeof data !== 'object' || data._version !== 1) {
                    setImportError('Invalid file format. Please use a file exported from DevTools.');
                    setImportStatus('error');
                    return;
                }
                restoreState(data);
                setImportStatus('done');
                setTimeout(() => window.location.reload(), 1500);
            } catch {
                setImportError('Failed to parse the file. Make sure it is a valid JSON export.');
                setImportStatus('error');
            }
        };
        reader.readAsText(file);
    };

    const handleClearAll = () => {
        if (!window.confirm('Clear all DevTools data? This cannot be undone.')) return;
        localStorage.clear();
        setClearDone(true);
        setTimeout(() => window.location.reload(), 1000);
    };

    const stats = {
        keys: localStorage.length,
        sizeKb: (JSON.stringify(Object.fromEntries(
            Array.from({ length: localStorage.length }, (_, i) => {
                const k = localStorage.key(i)!;
                return [k, localStorage.getItem(k)];
            })
        )).length / 1024).toFixed(1),
    };

    return (
        <div className="h-full flex flex-col bg-background p-6 overflow-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Settings className="text-primary" /> App Settings & Data
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Export, import, or clear your DevTools data. Everything is stored locally.</p>
            </div>

            <div className="space-y-6 max-w-xl mx-auto w-full">
                {/* Storage Info */}
                <div className="p-4 rounded-xl border bg-secondary/20 flex gap-6">
                    <div className="text-center">
                        <p className="text-2xl font-bold">{stats.keys}</p>
                        <p className="text-xs text-muted-foreground">Stored Keys</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold">{stats.sizeKb} KB</p>
                        <p className="text-xs text-muted-foreground">Approx. Size</p>
                    </div>
                </div>

                {/* Export */}
                <div className="space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Export</p>
                    <div className="p-4 rounded-xl border space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Download all your notes, pinned tools, workspaces, and settings as a JSON file. Use it to back up or migrate to another device.
                        </p>
                        <button onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                            {exportStatus === 'done' ? <Check size={16} /> : <Download size={16} />}
                            {exportStatus === 'done' ? 'Exported!' : 'Export All Data'}
                        </button>
                    </div>
                </div>

                {/* Import */}
                <div className="space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Import</p>
                    <div className="p-4 rounded-xl border space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Restore a previously exported backup. This will merge data and reload the app.
                        </p>
                        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
                        <button onClick={() => { setImportStatus('idle'); fileInputRef.current?.click(); }}
                            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-secondary/30 transition-colors">
                            {importStatus === 'done' ? <Check size={16} className="text-green-500" /> : <Upload size={16} />}
                            {importStatus === 'done' ? 'Imported! Reloading…' : 'Import Backup File'}
                        </button>
                        {importStatus === 'error' && (
                            <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                {importError}
                            </div>
                        )}
                    </div>
                </div>

                {/* Clear */}
                <div className="space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Danger Zone</p>
                    <div className="p-4 rounded-xl border border-destructive/30 space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Permanently delete all stored data: notes, settings, favorites, history. This cannot be undone.
                        </p>
                        <button onClick={handleClearAll}
                            className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive border border-destructive/30 rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors">
                            {clearDone ? <Check size={16} /> : <Trash2 size={16} />}
                            {clearDone ? 'Cleared. Reloading…' : 'Clear All Data'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
