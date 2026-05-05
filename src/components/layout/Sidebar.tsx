import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { toolGroups, allTools } from '../../lib/tools';
import { LayoutDashboard, ChevronLeft, ChevronRight, Search, Star, Briefcase, Plus, Trash2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ModeToggle } from '../ui/mode-toggle';
import { useFavorites } from '../../hooks/useFavorites';
import { useWorkspaces } from '../../hooks/useWorkspaces';

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [hoveredPath, setHoveredPath] = useState<string | null>(null);
    const [showWorkspaces, setShowWorkspaces] = useState(false);
    const [newWsName, setNewWsName] = useState('');
    const { favorites, toggle, isFavorite } = useFavorites();
    const { workspaces, saveWorkspace, deleteWorkspace } = useWorkspaces();
    const location = useLocation();

    const toggleSidebar = () => setCollapsed(!collapsed);

    const dashboardItem = {
        title: 'General',
        items: [{ to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true }]
    };

    const favoriteTools = allTools.filter(t => favorites.includes(t.to));
    const groups = [dashboardItem, ...toolGroups];

    const openCommandPalette = () => window.dispatchEvent(new Event('open-command-palette'));

    const handleSaveWorkspace = () => {
        const name = newWsName.trim() || `Workspace ${workspaces.length + 1}`;
        saveWorkspace(name, favorites, location.pathname);
        setNewWsName('');
    };

    const handleLoadWorkspace = (ws: { favorites: string[]; activePath: string }) => {
        localStorage.setItem('devtools_favorites', JSON.stringify(ws.favorites));
        window.location.href = ws.activePath;
    };

    return (
        <aside className={cn("flex flex-col h-screen border-r bg-background text-foreground transition-all duration-300 ease-in-out z-20", collapsed ? "w-16" : "w-64")}>
            <div className="flex items-center justify-between p-4 h-16 border-b shrink-0">
                {!collapsed && <span className="font-bold text-lg truncate">DevTools</span>}
                <button onClick={toggleSidebar} className="p-1 rounded hover:bg-secondary transition-colors ml-auto">
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-6 px-2">
                <div className="px-2">
                    <button onClick={openCommandPalette}
                        className={cn("w-full flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all hover:bg-secondary/60 text-muted-foreground", collapsed ? "justify-center px-1.5" : "justify-between")}
                        title={collapsed ? "Search tools" : undefined}>
                        <div className="flex items-center gap-3">
                            <Search size={16} />
                            {!collapsed && <span className="text-[13px] font-medium">Search</span>}
                        </div>
                        {!collapsed && (
                            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded border bg-background/50 text-[10px] font-mono opacity-80 backdrop-blur-sm">
                                <span>⌘</span><span>K</span>
                            </div>
                        )}
                    </button>
                </div>

                {/* Favorites Section */}
                {favoriteTools.length > 0 && (
                    <div className="flex flex-col gap-0.5">
                        {!collapsed && (
                            <h3 className="px-3 text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1.5 opacity-60 flex items-center gap-1.5">
                                <Star size={9} className="text-yellow-500 fill-yellow-500" /> Favorites
                            </h3>
                        )}
                        {favoriteTools.map(item => (
                            <div key={item.to} className="relative group/fav"
                                onMouseEnter={() => setHoveredPath(item.to)}
                                onMouseLeave={() => setHoveredPath(null)}>
                                <NavLink to={item.to}
                                    className={({ isActive }) => cn("flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all hover:bg-secondary/60",
                                        isActive ? "bg-primary/10 text-primary font-bold shadow-sm" : "text-muted-foreground",
                                        collapsed ? "justify-center px-2" : "pr-8")}
                                    title={collapsed ? item.label : undefined}>
                                    <item.icon size={16} />
                                    {!collapsed && <span className="truncate text-[13px]">{item.label}</span>}
                                </NavLink>
                                {!collapsed && hoveredPath === item.to && (
                                    <button onClick={() => toggle(item.to)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-secondary/80 transition-colors"
                                        title="Remove from favorites">
                                        <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {groups.map((group, index) => (
                    <div key={`${group.title}-${index}`} className="flex flex-col gap-0.5">
                        {!collapsed && (
                            <h3 className="px-3 text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1.5 opacity-60">
                                {group.title}
                            </h3>
                        )}
                        {group.items.map((item) => (
                            <div key={item.to} className="relative group/nav"
                                onMouseEnter={() => setHoveredPath(item.to)}
                                onMouseLeave={() => setHoveredPath(null)}>
                                <NavLink to={item.to}
                                    className={({ isActive }) => cn("flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all hover:bg-secondary/60",
                                        isActive ? "bg-primary/10 text-primary font-bold shadow-sm" : "text-muted-foreground",
                                        collapsed ? "justify-center px-2" : item.to !== '/' ? "pr-8" : "")}
                                    title={collapsed ? item.label : undefined}>
                                    <item.icon size={16} />
                                    {!collapsed && <span className="truncate text-[13px]">{item.label}</span>}
                                </NavLink>
                                {!collapsed && item.to !== '/' && hoveredPath === item.to && (
                                    <button onClick={() => toggle(item.to)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-secondary/80 transition-colors"
                                        title={isFavorite(item.to) ? 'Remove from favorites' : 'Add to favorites'}>
                                        <Star size={12} className={isFavorite(item.to) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/50'} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </nav>

            {/* Workspaces Panel */}
            {!collapsed && showWorkspaces && (
                <div className="border-t bg-secondary/10 p-3 space-y-2 max-h-56 overflow-auto">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Workspaces</span>
                        <button onClick={() => setShowWorkspaces(false)} className="text-muted-foreground hover:text-foreground">
                            <X size={12} />
                        </button>
                    </div>
                    <div className="flex gap-1.5">
                        <input value={newWsName} onChange={e => setNewWsName(e.target.value)}
                            placeholder="Name..."
                            onKeyDown={e => e.key === 'Enter' && handleSaveWorkspace()}
                            className="flex-1 text-xs px-2 py-1.5 rounded border bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                        <button onClick={handleSaveWorkspace}
                            className="px-2 py-1.5 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90 transition-colors">
                            <Plus size={12} />
                        </button>
                    </div>
                    {workspaces.length === 0 && (
                        <p className="text-[10px] text-muted-foreground text-center py-2">No workspaces saved yet</p>
                    )}
                    {workspaces.map(ws => (
                        <div key={ws.id} className="flex items-center gap-1.5 group/ws">
                            <button onClick={() => handleLoadWorkspace(ws)}
                                className="flex-1 text-left text-xs px-2 py-1.5 rounded hover:bg-secondary/60 transition-colors truncate">
                                {ws.name}
                            </button>
                            <button onClick={() => deleteWorkspace(ws.id)}
                                className="opacity-0 group-hover/ws:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                                <Trash2 size={11} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className={cn("p-4 border-t flex items-center gap-3 shrink-0", collapsed ? "justify-center" : "")}>
                <ModeToggle />
                {!collapsed && (
                    <>
                        <span className="text-[13px] font-medium flex-1">Theme</span>
                        <button onClick={() => setShowWorkspaces(prev => !prev)}
                            className={cn("p-1.5 rounded hover:bg-secondary transition-colors", showWorkspaces ? "text-primary" : "text-muted-foreground")}
                            title="Workspaces">
                            <Briefcase size={15} />
                        </button>
                    </>
                )}
            </div>
        </aside>
    );
}
