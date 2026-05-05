import { useState, useCallback } from 'react';

export interface Workspace {
    id: string;
    name: string;
    favorites: string[];
    activePath: string;
    createdAt: number;
}

const KEY = 'devtools_workspaces';

function load(): Workspace[] {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
    catch { return []; }
}

function save(workspaces: Workspace[]) {
    localStorage.setItem(KEY, JSON.stringify(workspaces));
}

export function useWorkspaces() {
    const [workspaces, setWorkspaces] = useState<Workspace[]>(load);

    const saveWorkspace = useCallback((name: string, favorites: string[], activePath: string) => {
        const ws: Workspace = {
            id: Math.random().toString(36).slice(2, 9),
            name,
            favorites,
            activePath,
            createdAt: Date.now(),
        };
        setWorkspaces(prev => {
            const next = [...prev, ws];
            save(next);
            return next;
        });
    }, []);

    const deleteWorkspace = useCallback((id: string) => {
        setWorkspaces(prev => {
            const next = prev.filter(w => w.id !== id);
            save(next);
            return next;
        });
    }, []);

    const renameWorkspace = useCallback((id: string, name: string) => {
        setWorkspaces(prev => {
            const next = prev.map(w => w.id === id ? { ...w, name } : w);
            save(next);
            return next;
        });
    }, []);

    return { workspaces, saveWorkspace, deleteWorkspace, renameWorkspace };
}
