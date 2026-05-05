import { useLocation } from 'react-router-dom';
import { getToolByPath } from '../lib/tools';

export function useToolPageMeta() {
    const { pathname } = useLocation();
    return getToolByPath(pathname);
}
