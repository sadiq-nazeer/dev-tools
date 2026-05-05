import { useState, useCallback } from 'react';

const STORAGE_KEY = 'devtools_favorites';

function load(): string[] {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    } catch {
        return [];
    }
}

export function useFavorites() {
    const [favorites, setFavorites] = useState<string[]>(load);

    const toggle = useCallback((path: string) => {
        setFavorites(prev => {
            const next = prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const isFavorite = useCallback((path: string) => favorites.includes(path), [favorites]);

    return { favorites, toggle, isFavorite };
}
