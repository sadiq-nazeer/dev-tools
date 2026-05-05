import { useContext } from 'react';
import { RecentlyUsedContext } from '../context/recently-used-context';

export function useRecentlyUsedPaths(): string[] {
    const ctx = useContext(RecentlyUsedContext);
    if (!ctx) {
        throw new Error('useRecentlyUsedPaths must be used within RecentlyUsedProvider');
    }
    return ctx.recentPaths;
}
