import { Note } from '../../types';
import { cn } from '../../lib/utils';
import { Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface NoteListProps {
    notes: Note[];
    selectedNoteId: string | null;
    onSelectNote: (id: string) => void;
    onAddNote: () => void;
    onDeleteNote: (e: React.MouseEvent, id: string) => void;
}

export function NoteList({
    notes,
    selectedNoteId,
    onSelectNote,
    onAddNote,
    onDeleteNote
}: NoteListProps) {
    const [search, setSearch] = useState('');

    const filteredNotes = notes
        .filter(note =>
            note.title.toLowerCase().includes(search.toLowerCase()) ||
            note.content.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => b.updatedAt - a.updatedAt);

    return (
        <div className="w-64 border-r h-full flex flex-col bg-background/50">
            <div className="p-4 border-b space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Notes</h2>
                    <button
                        onClick={onAddNote}
                        className="p-1.5 rounded-md hover:bg-secondary transition-colors text-primary"
                        title="New Note"
                    >
                        <Plus size={18} />
                    </button>
                </div>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 rounded-md border text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {filteredNotes.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                        {search ? 'No matches found' : 'No notes yet'}
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {filteredNotes.map(note => (
                            <div
                                key={note.id}
                                onClick={() => onSelectNote(note.id)}
                                className={cn(
                                    "p-4 border-b cursor-pointer transition-colors hover:bg-secondary/50 group relative",
                                    selectedNoteId === note.id ? "bg-secondary" : ""
                                )}
                            >
                                <h3 className={cn("font-medium truncate pr-6", !note.title && "text-muted-foreground")}>
                                    {note.title || 'Untitled Note'}
                                </h3>
                                <p className="text-xs text-muted-foreground truncate mt-1">
                                    {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                                    {' • '}
                                    {note.content.slice(0, 30).replace(/\n/g, ' ') || 'No content...'}
                                </p>

                                <button
                                    onClick={(e) => onDeleteNote(e, note.id)}
                                    className="absolute right-2 top-4 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                                    title="Delete"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
