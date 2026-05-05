import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Trash2,
    TextQuote,
    Type,
    Clock,
    WholeWord,
    Pilcrow
} from 'lucide-react';

export default function TextAnalyzer() {
    const [text, setText] = useState('');
    const [stats, setStats] = useState({
        characters: 0,
        charactersNoSpace: 0,
        words: 0,
        paragraphs: 0,
        sentences: 0,
        readingTime: 0
    });

    useEffect(() => {
        if (!text) {
            setStats({ characters: 0, charactersNoSpace: 0, words: 0, paragraphs: 0, sentences: 0, readingTime: 0 });
            return;
        }

        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

        setStats({
            characters: text.length,
            charactersNoSpace: text.replace(/\s/g, '').length,
            words: words.length,
            paragraphs: paragraphs.length,
            sentences: sentences.length,
            readingTime: Math.ceil(words.length / 200) // 200 words per minute
        });
    }, [text]);

    const clear = () => setText('');

    const StatCard = ({ icon: Icon, label, value, sub }: { icon: any, label: string, value: number, sub?: string }) => (
        <div className="bg-card border rounded-2xl p-6 shadow-sm flex items-start gap-4 h-full">
            <div className="p-3 bg-primary/10 rounded-xl text-primary mt-1">
                <Icon size={24} />
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
                <p className="text-3xl font-bold font-mono tracking-tighter">{value.toLocaleString()}</p>
                {sub && <p className="text-xs text-muted-foreground font-medium">{sub}</p>}
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-background p-6 overflow-auto">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <LayoutDashboard className="text-primary" /> Text Analyzer
                </h2>
                <button
                    onClick={clear}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    title="Clear all"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto w-full flex-1 min-h-0">
                {/* Input Area */}
                <div className="lg:col-span-2 flex flex-col space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Input Text</label>
                        <span className="text-[10px] text-muted-foreground/60 italic">Stats update as you type</span>
                    </div>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste your text here to analyze..."
                        className="flex-1 w-full p-6 rounded-2xl border bg-card font-sans text-sm md:text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary min-h-[400px] resize-none shadow-inner shadow-black/5"
                    />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 h-fit">
                    <StatCard icon={Type} label="Characters" value={stats.characters} sub={`${stats.charactersNoSpace} excluding spaces`} />
                    <StatCard icon={WholeWord} label="Words" value={stats.words} />
                    <StatCard icon={Pilcrow} label="Paragraphs" value={stats.paragraphs} />
                    <StatCard icon={Clock} label="Est. Reading Time" value={stats.readingTime} sub="minutes (at 200 wpm)" />
                    <StatCard icon={TextQuote} label="Sentences" value={stats.sentences} />
                </div>
            </div>
        </div>
    );
}
