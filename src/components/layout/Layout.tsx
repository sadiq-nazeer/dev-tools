import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { CommandPalette } from './CommandPalette';

export function Layout() {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <CommandPalette />
                <Outlet />
            </main>
        </div>
    );
}
