/* eslint-disable react-refresh/only-export-components -- context + provider module */
import { createContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_KEY = 'devtools_recent';
/** Two full rows at 8 columns on xl / 2xl (8 × 2 = 16). */
const MAX_RECENT = 16;

function load(): string[] {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
        if (!Array.isArray(parsed)) return [];
        const arr = parsed.filter((p): p is string => typeof p === 'string');
        return arr.slice(0, MAX_RECENT);
    } catch {
        return [];
    }
}

type RecentlyUsedContextValue = {
    recentPaths: string[];
};

export const RecentlyUsedContext = createContext<RecentlyUsedContextValue | null>(null);

export function RecentlyUsedProvider({ children }: { children: ReactNode }) {
    const location = useLocation();
    const [recentPaths, setRecentPaths] = useState<string[]>(() => load());

    useEffect(() => {
        const path = location.pathname;
        if (path === '/') return;

        setRecentPaths(prev => {
            const next = [path, ...prev.filter(p => p !== path)].slice(0, MAX_RECENT);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }, [location.pathname]);

    return (
        <RecentlyUsedContext.Provider value={{ recentPaths }}>
            {children}
        </RecentlyUsedContext.Provider>
    );
}
