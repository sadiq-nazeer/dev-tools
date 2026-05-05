import { useState, useMemo } from 'react';
import { Table2, Copy, Check, Search } from 'lucide-react';

interface CharEntry {
    dec: number;
    hex: string;
    bin: string;
    html: string;
    char: string;
    name: string;
    category: string;
}

const CONTROL_NAMES: Record<number, string> = {
    0: 'NUL', 1: 'SOH', 2: 'STX', 3: 'ETX', 4: 'EOT', 5: 'ENQ', 6: 'ACK', 7: 'BEL',
    8: 'BS', 9: 'HT', 10: 'LF', 11: 'VT', 12: 'FF', 13: 'CR', 14: 'SO', 15: 'SI',
    16: 'DLE', 17: 'DC1', 18: 'DC2', 19: 'DC3', 20: 'DC4', 21: 'NAK', 22: 'SYN', 23: 'ETB',
    24: 'CAN', 25: 'EM', 26: 'SUB', 27: 'ESC', 28: 'FS', 29: 'GS', 30: 'RS', 31: 'US',
    32: 'Space', 127: 'DEL',
};

function buildTable(): CharEntry[] {
    const entries: CharEntry[] = [];
    for (let i = 0; i <= 127; i++) {
        const isControl = i < 32 || i === 127;
        const char = isControl ? '' : String.fromCharCode(i);
        const name = isControl ? (CONTROL_NAMES[i] ?? `Control-${i}`) : char;
        const category = i < 32 ? 'Control' : i === 32 ? 'Whitespace' : i < 48 ? 'Symbol' :
            i < 58 ? 'Digit' : i < 65 ? 'Symbol' : i < 91 ? 'Uppercase' :
            i < 97 ? 'Symbol' : i < 123 ? 'Lowercase' : i < 127 ? 'Symbol' : 'Control';

        entries.push({
            dec: i,
            hex: i.toString(16).toUpperCase().padStart(2, '0'),
            bin: i.toString(2).padStart(8, '0'),
            html: i < 32 || i === 127 ? `&#${i};` : i === 32 ? '&nbsp;' :
                i === 34 ? '&quot;' : i === 38 ? '&amp;' : i === 39 ? '&apos;' :
                i === 60 ? '&lt;' : i === 62 ? '&gt;' : `&#${i};`,
            char,
            name,
            category,
        });
    }
    return entries;
}

const TABLE = buildTable();
const CATEGORIES = ['All', 'Control', 'Whitespace', 'Digit', 'Uppercase', 'Lowercase', 'Symbol'];

export default function AsciiTable() {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [copied, setCopied] = useState<string | null>(null);

    const filtered = useMemo(() => {
        return TABLE.filter(e => {
            if (category !== 'All' && e.category !== category) return false;
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                e.dec.toString().includes(q) ||
                e.hex.toLowerCase().includes(q) ||
                e.name.toLowerCase().includes(q) ||
                e.char === search
            );
        });
    }, [search, category]);

    const copy = async (text: string, key: string) => {
        if (!text) return;
        await navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 1500);
    };

    return (
        <div className="h-full flex flex-col bg-background p-6 overflow-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Table2 className="text-primary" /> ASCII / Unicode Table
                </h2>
                <p className="text-sm text-muted-foreground mt-1">ASCII 0–127 reference. Click a row to copy the character.</p>
            </div>

            <div className="space-y-4 mb-4">
                <div className="flex gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name, decimal, hex, or character..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div className="flex gap-1 flex-wrap">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${category === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary/30 hover:bg-secondary/60'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="rounded-xl border overflow-hidden flex-1">
                <div className="grid grid-cols-[60px_60px_100px_90px_80px_1fr_80px] text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary/40 border-b">
                    {['Dec', 'Hex', 'Binary', 'HTML', 'Char', 'Name', ''].map((h, i) => (
                        <div key={i} className="px-3 py-2">{h}</div>
                    ))}
                </div>
                <div className="overflow-auto max-h-[calc(100vh-320px)]">
                    {filtered.map(entry => (
                        <div
                            key={entry.dec}
                            className="grid grid-cols-[60px_60px_100px_90px_80px_1fr_80px] border-b last:border-b-0 hover:bg-secondary/20 transition-colors text-sm"
                        >
                            <div className="px-3 py-2 font-mono text-muted-foreground">{entry.dec}</div>
                            <div className="px-3 py-2 font-mono text-muted-foreground">{entry.hex}</div>
                            <div className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{entry.bin}</div>
                            <div className="px-3 py-2 font-mono text-xs">{entry.html}</div>
                            <div className="px-3 py-2 font-mono text-lg text-center">{entry.char}</div>
                            <div className="px-3 py-2 text-xs font-medium flex items-center gap-2">
                                {entry.name}
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                                    entry.category === 'Control' ? 'bg-red-500/20 text-red-500' :
                                    entry.category === 'Digit' ? 'bg-blue-500/20 text-blue-500' :
                                    entry.category === 'Uppercase' ? 'bg-green-500/20 text-green-500' :
                                    entry.category === 'Lowercase' ? 'bg-purple-500/20 text-purple-500' :
                                    'bg-secondary/40 text-muted-foreground'
                                }`}>{entry.category}</span>
                            </div>
                            <div className="px-3 py-2 flex items-center">
                                <button
                                    onClick={() => copy(entry.char || String.fromCharCode(entry.dec), `${entry.dec}`)}
                                    disabled={!entry.char && entry.dec !== 32}
                                    className="text-[10px] text-primary hover:underline flex items-center gap-1 disabled:opacity-20"
                                >
                                    {copied === `${entry.dec}` ? <Check size={12} /> : <Copy size={12} />}
                                    Copy
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
