import { useState, useEffect, Dispatch, SetStateAction } from 'react';

export function usePersistentState<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        const saved = localStorage.getItem(`devtools_${key}`);
        if (saved !== null) {
            try { return JSON.parse(saved); }
            catch { return defaultValue; }
        }
        return defaultValue;
    });

    useEffect(() => {
        localStorage.setItem(`devtools_${key}`, JSON.stringify(state));
    }, [key, state]);

    return [state, setState];
}
