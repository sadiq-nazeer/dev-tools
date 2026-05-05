import { useState, useCallback } from 'react';

const MAX = 10;

function loadHistory(key: string): string[] {
    try { return JSON.parse(localStorage.getItem(`history_${key}`) ?? '[]'); }
    catch { return []; }
}

function saveHistory(key: string, entries: string[]) {
    localStorage.setItem(`history_${key}`, JSON.stringify(entries));
}

export function useInputHistory(toolKey: string) {
    const [entries, setEntries] = useState<string[]>(() => loadHistory(toolKey));
    const [cursor, setCursor] = useState(-1);

    const push = useCallback((value: string) => {
        if (!value.trim()) return;
        setEntries(prev => {
            const deduped = [value, ...prev.filter(e => e !== value)].slice(0, MAX);
            saveHistory(toolKey, deduped);
            return deduped;
        });
        setCursor(-1);
    }, [toolKey]);

    const navigateUp = useCallback((_current: string, onChange: (v: string) => void) => {
        setEntries(prev => {
            const next = Math.min(cursor + 1, prev.length - 1);
            setCursor(next);
            if (prev[next] !== undefined) onChange(prev[next]);
            return prev;
        });
    }, [cursor]);

    const navigateDown = useCallback((onChange: (v: string) => void) => {
        const next = Math.max(cursor - 1, -1);
        setCursor(next);
        if (next === -1) onChange('');
        else if (entries[next] !== undefined) onChange(entries[next]);
    }, [cursor, entries]);

    const clear = useCallback(() => {
        localStorage.removeItem(`history_${toolKey}`);
        setEntries([]);
        setCursor(-1);
    }, [toolKey]);

    return { entries, push, navigateUp, navigateDown, clear, cursor };
}
