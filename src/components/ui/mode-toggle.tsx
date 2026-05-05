import { Moon, Sun } from 'lucide-react';
import { useTheme } from './theme-provider';
import { cn } from '../../lib/utils';

export function ModeToggle({ className }: { className?: string }) {
    const { setTheme, theme } = useTheme();

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={cn(
                "relative p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-200",
                className
            )}
            title="Toggle theme"
        >
            <div className="relative w-5 h-5">
                <Sun className="absolute inset-0 h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute inset-0 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </div>
            <span className="sr-only">Toggle theme</span>
        </button>
    );
}
