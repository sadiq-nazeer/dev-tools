import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command as CommandIcon } from 'lucide-react';
import { allTools, ToolItem, toolMatchesSearch } from '../../lib/tools';
import { cn } from '../../lib/utils';

export function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredTools = allTools.filter(tool => toolMatchesSearch(search, tool));

    const handleOpen = useCallback(() => {
        setIsOpen(true);
        setSearch('');
        setSelectedIndex(0);
        setTimeout(() => inputRef.current?.focus(), 10);
    }, []);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    const handleSelect = useCallback((tool: ToolItem) => {
        navigate(tool.to);
        handleClose();
    }, [navigate, handleClose]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleClose]);

    useEffect(() => {
        const handleOpenEvent = () => handleOpen();
        window.addEventListener('open-command-palette', handleOpenEvent);
        return () => window.removeEventListener('open-command-palette', handleOpenEvent);
    }, [handleOpen]);

    useEffect(() => {
        if (isOpen) {
            setSelectedIndex(0);
            inputRef.current?.focus();
        }
    }, [isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredTools.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredTools.length) % filteredTools.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredTools[selectedIndex]) {
                handleSelect(filteredTools[selectedIndex]);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-2xl bg-card border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center px-4 py-3 border-b">
                    <Search className="text-muted-foreground mr-3" size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search for a tool..."
                        className="flex-1 bg-transparent border-none outline-none text-lg text-foreground placeholder:text-muted-foreground"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono text-muted-foreground ml-2">
                        <CommandIcon size={10} />
                        <span>K</span>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {filteredTools.length > 0 ? (
                        <div className="space-y-1">
                            {filteredTools.map((tool, index) => (
                                <button
                                    key={tool.to}
                                    className={cn(
                                        "w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all text-left",
                                        index === selectedIndex ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-secondary/60 text-foreground"
                                    )}
                                    onClick={() => handleSelect(tool)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                >
                                    <div className={cn(
                                        "p-2 rounded-lg shrink-0",
                                        index === selectedIndex ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                                    )}>
                                        <tool.icon size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold truncate">{tool.label}</span>
                                            <span className={cn(
                                                "text-[10px] uppercase tracking-wider font-bold opacity-60",
                                                index === selectedIndex ? "text-white" : "text-muted-foreground"
                                            )}>
                                                {tool.category}
                                            </span>
                                        </div>
                                        <p className={cn(
                                            "text-xs truncate",
                                            index === selectedIndex ? "text-white/80" : "text-muted-foreground"
                                        )}>
                                            {tool.desc}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-muted-foreground">
                            <Search className="mx-auto mb-4 opacity-20" size={40} />
                            <p>No tools found for "{search}"</p>
                        </div>
                    )}
                </div>

                <div className="px-4 py-3 bg-muted/50 border-t flex items-center justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1"><span className="px-1 py-0.5 rounded border bg-background">↑↓</span> Navigate</span>
                        <span className="flex items-center gap-1"><span className="px-1 py-0.5 rounded border bg-background">↵</span> Select</span>
                    </div>
                    <span>{filteredTools.length} tools available</span>
                </div>
            </div>
            <div className="fixed inset-0 -z-10" onClick={handleClose} />
        </div>
    );
}
