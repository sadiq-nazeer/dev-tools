import { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/use-local-storage';
import { Note } from '../types';
import { NoteList } from '../components/notes/NoteList';
import Editor from '@monaco-editor/react';

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function Notes() {
    const [notes, setNotes] = useLocalStorage<Note[]>('dev-tools-notes', []);
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

    // Select first note on load if none selected
    useEffect(() => {
        if (!selectedNoteId && notes.length > 0) {
            setSelectedNoteId(notes[0].id);
        }
    }, [notes.length]); // Run only when notes list changes length (e.g. initial load)

    const selectedNote = notes.find(n => n.id === selectedNoteId);

    const handleAddNote = () => {
        const newNote: Note = {
            id: generateId(),
            title: '',
            content: '',
            updatedAt: Date.now()
        };
        setNotes([newNote, ...notes]);
        setSelectedNoteId(newNote.id);
    };

    const handleDeleteNote = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this note?')) {
            const newNotes = notes.filter(n => n.id !== id);
            setNotes(newNotes);
            if (selectedNoteId === id) {
                setSelectedNoteId(newNotes.length > 0 ? newNotes[0].id : null);
            }
        }
    };

    const updateNote = (id: string, updates: Partial<Note>) => {
        setNotes(notes.map(note =>
            note.id === id
                ? { ...note, ...updates, updatedAt: Date.now() }
                : note
        ));
    };

    return (
        <div className="h-full flex w-full overflow-hidden">
            <NoteList
                notes={notes}
                selectedNoteId={selectedNoteId}
                onSelectNote={setSelectedNoteId}
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
            />

            <div className="flex-1 flex flex-col min-w-0 bg-background">
                {selectedNote ? (
                    <>
                        <div className="border-b p-4">
                            <input
                                type="text"
                                value={selectedNote.title}
                                onChange={(e) => updateNote(selectedNote.id, { title: e.target.value })}
                                placeholder="Note Title"
                                className="w-full text-2xl font-bold bg-transparent focus:outline-none placeholder:text-muted-foreground/50"
                            />
                            <div className="text-xs text-muted-foreground mt-1">
                                Last updated: {new Date(selectedNote.updatedAt).toLocaleString()}
                            </div>
                        </div>

                        <div className="flex-1 relative">
                            <Editor
                                height="100%"
                                defaultLanguage="markdown"
                                value={selectedNote.content}
                                onChange={(value) => updateNote(selectedNote.id, { content: value || '' })}
                                theme="vs-dark"
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 16,
                                    lineNumbers: 'on',
                                    wordWrap: 'on',
                                    scrollBeyondLastLine: false,
                                    padding: { top: 16, bottom: 16 },
                                }}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                            <h3 className="text-lg font-medium">No Note Selected</h3>
                            <p className="text-sm">Select a note from the list or create a new one.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
