import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FileText, Plus, Trash2, Check, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';

interface Note {
    id: string;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
}

export const Notes: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const activeNote = notes.find(n => n.id === activeId) ?? null;

    // Load all notes
    useEffect(() => {
        const fetchNotes = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .order('updated_at', { ascending: false });
            if (error) {
                setError('Could not load notes. Check Supabase connection.');
            } else {
                setNotes(data ?? []);
                if (data && data.length > 0) {
                    setActiveId(data[0].id);
                    setTitle(data[0].title);
                    setContent(data[0].content);
                }
            }
            setLoading(false);
        };
        fetchNotes();
    }, []);

    // Select a note
    const selectNote = (note: Note) => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        setActiveId(note.id);
        setTitle(note.title);
        setContent(note.content);
        setSaved(false);
    };

    // Debounced auto-save
    const scheduleSave = useCallback((newTitle: string, newContent: string, id: string) => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
            setSaving(true);
            const { error } = await supabase
                .from('notes')
                .update({ title: newTitle, content: newContent })
                .eq('id', id);
            if (error) {
                setError('Auto-save failed.');
            } else {
                setNotes(prev => prev.map(n =>
                    n.id === id ? { ...n, title: newTitle, content: newContent } : n
                ));
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            }
            setSaving(false);
        }, 800);
    }, []);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
        if (activeId) scheduleSave(e.target.value, content, activeId);
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        if (activeId) scheduleSave(title, e.target.value, activeId);
    };

    // Create new note
    const createNote = async () => {
        const { data, error } = await supabase
            .from('notes')
            .insert({ title: 'New Note', content: '' })
            .select()
            .single();
        if (error) {
            setError('Could not create note.');
            return;
        }
        setNotes(prev => [data, ...prev]);
        setActiveId(data.id);
        setTitle(data.title);
        setContent(data.content);
    };

    // Delete note
    const deleteNote = async (id: string) => {
        const { error } = await supabase.from('notes').delete().eq('id', id);
        if (error) { setError('Could not delete note.'); return; }
        const remaining = notes.filter(n => n.id !== id);
        setNotes(remaining);
        if (activeId === id) {
            if (remaining.length > 0) {
                selectNote(remaining[0]);
            } else {
                setActiveId(null);
                setTitle('');
                setContent('');
            }
        }
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="py-24 bg-brand-cream min-h-screen">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="mb-10 flex items-end justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-olive/10 text-brand-olive text-[10px] font-bold uppercase tracking-widest mb-4">
                            <FileText size={12} /> Shared Workspace
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif">Community <span className="italic text-brand-olive">Notes</span></h1>
                        <p className="text-sm text-brand-ink/50 mt-2">Saved and shared across founder and staff dashboards.</p>
                    </div>
                    <button
                        onClick={createNote}
                        className="flex items-center gap-2 bg-brand-olive text-white text-sm font-bold px-5 py-3 rounded-2xl hover:opacity-90 transition-all"
                    >
                        <Plus size={16} /> New Note
                    </button>
                </div>

                {error && (
                    <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
                        <AlertCircle size={16} className="shrink-0" />
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-24 text-brand-ink/40">
                        <Loader2 size={28} className="animate-spin" />
                    </div>
                ) : (
                    <div className="flex gap-6 min-h-[600px]">

                        {/* Sidebar */}
                        <div className="w-56 shrink-0 flex flex-col gap-2">
                            {notes.length === 0 && (
                                <p className="text-xs text-brand-ink/40 px-2 pt-2">No notes yet. Create one.</p>
                            )}
                            {notes.map(note => (
                                <button
                                    key={note.id}
                                    onClick={() => selectNote(note)}
                                    className={`group w-full text-left px-4 py-3 rounded-2xl border transition-all ${
                                        activeId === note.id
                                            ? 'bg-brand-olive text-white border-brand-olive'
                                            : 'bg-white border-brand-olive/10 hover:border-brand-olive/30 text-brand-ink'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-1">
                                        <span className="text-sm font-bold truncate leading-snug">{note.title || 'Untitled'}</span>
                                        <button
                                            onClick={e => { e.stopPropagation(); deleteNote(note.id); }}
                                            className={`shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity mt-0.5 ${activeId === note.id ? 'text-white' : 'text-brand-ink'}`}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                    <span className={`text-[10px] mt-1 block ${activeId === note.id ? 'text-white/60' : 'text-brand-ink/40'}`}>
                                        {formatDate(note.updated_at)}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Editor */}
                        <div className="flex-1 bg-white rounded-[32px] shadow-sm border border-brand-olive/5 overflow-hidden flex flex-col">
                            {activeNote ? (
                                <>
                                    <div className="flex items-center justify-between px-8 py-4 bg-brand-cream/30 border-b border-brand-olive/5">
                                        <input
                                            value={title}
                                            onChange={handleTitleChange}
                                            placeholder="Note title..."
                                            className="text-sm font-bold bg-transparent border-none focus:ring-0 outline-none text-brand-ink placeholder:text-brand-ink/30 w-full"
                                        />
                                        <span className="shrink-0 ml-4 flex items-center gap-1.5 text-xs text-brand-ink/40">
                                            {saving && <><Loader2 size={12} className="animate-spin" /> Saving...</>}
                                            {saved && !saving && <><Check size={12} className="text-green-500" /> Saved</>}
                                        </span>
                                    </div>
                                    <textarea
                                        value={content}
                                        onChange={handleContentChange}
                                        placeholder="Start writing..."
                                        className="flex-1 w-full p-8 md:p-10 text-base font-mono focus:ring-0 border-none resize-none placeholder:text-brand-ink/20 outline-none"
                                    />
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-brand-ink/30 text-sm">
                                    Create a note to get started
                                </div>
                            )}
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
};
