import { useState } from 'react';
import { Lock, Copy, Check } from 'lucide-react';

type Entity = 'owner' | 'group' | 'other';
type Permission = 'read' | 'write' | 'execute';

interface Perms { read: boolean; write: boolean; execute: boolean }
type State = Record<Entity, Perms>;

const ENTITIES: { key: Entity; label: string }[] = [
    { key: 'owner', label: 'Owner (u)' },
    { key: 'group', label: 'Group (g)' },
    { key: 'other', label: 'Others (o)' },
];
const PERMS: { key: Permission; label: string; bit: number }[] = [
    { key: 'read', label: 'Read', bit: 4 },
    { key: 'write', label: 'Write', bit: 2 },
    { key: 'execute', label: 'Execute', bit: 1 },
];

const DEFAULT: State = {
    owner: { read: true, write: true, execute: false },
    group: { read: true, write: false, execute: false },
    other: { read: true, write: false, execute: false },
};

function toOctal(state: State): string {
    return ENTITIES.map(e =>
        PERMS.reduce((sum, p) => sum + (state[e.key][p.key] ? p.bit : 0), 0)
    ).join('');
}

function toSymbolic(state: State): string {
    return ENTITIES.map(e =>
        (state[e.key].read ? 'r' : '-') +
        (state[e.key].write ? 'w' : '-') +
        (state[e.key].execute ? 'x' : '-')
    ).join('');
}

function fromOctal(octal: string): State | null {
    if (!/^[0-7]{3}$/.test(octal)) return null;
    const digits = octal.split('').map(Number);
    const keys: Entity[] = ['owner', 'group', 'other'];
    const state = {} as State;
    keys.forEach((key, i) => {
        state[key] = {
            read: !!(digits[i] & 4),
            write: !!(digits[i] & 2),
            execute: !!(digits[i] & 1),
        };
    });
    return state;
}

const COMMON_PERMS = [
    { label: '755 — rwxr-xr-x', value: '755', desc: 'Executable (scripts, binaries)' },
    { label: '644 — rw-r--r--', value: '644', desc: 'Regular files' },
    { label: '600 — rw-------', value: '600', desc: 'Private files (SSH keys)' },
    { label: '777 — rwxrwxrwx', value: '777', desc: 'World-writable (avoid!)' },
    { label: '400 — r--------', value: '400', desc: 'Read-only (config files)' },
    { label: '700 — rwx------', value: '700', desc: 'Private directories' },
];

export default function ChmodCalculator() {
    const [state, setState] = useState<State>(DEFAULT);
    const [octalInput, setOctalInput] = useState('');
    const [copied, setCopied] = useState<string | null>(null);

    const octal = toOctal(state);
    const symbolic = toSymbolic(state);

    const toggle = (entity: Entity, perm: Permission) => {
        setState(prev => ({
            ...prev,
            [entity]: { ...prev[entity], [perm]: !prev[entity][perm] },
        }));
        setOctalInput('');
    };

    const handleOctalInput = (val: string) => {
        setOctalInput(val);
        const parsed = fromOctal(val);
        if (parsed) setState(parsed);
    };

    const applyPreset = (value: string) => {
        const parsed = fromOctal(value);
        if (parsed) { setState(parsed); setOctalInput(''); }
    };

    const copy = async (text: string, key: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="h-full flex flex-col bg-background p-6 overflow-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Lock className="text-primary" /> Chmod Calculator
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Toggle permissions or type the octal value directly.</p>
            </div>

            <div className="space-y-8 max-w-2xl mx-auto w-full">
                {/* Permission Grid */}
                <div className="rounded-xl border overflow-hidden">
                    <div className="grid grid-cols-4 bg-secondary/40 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        <div className="p-3 border-r" />
                        {PERMS.map(p => (
                            <div key={p.key} className="p-3 border-r last:border-r-0 text-center">{p.label}</div>
                        ))}
                    </div>
                    {ENTITIES.map(entity => (
                        <div key={entity.key} className="grid grid-cols-4 border-t">
                            <div className="p-3 border-r text-sm font-medium flex items-center">{entity.label}</div>
                            {PERMS.map(perm => (
                                <div key={perm.key} className="p-3 border-r last:border-r-0 flex items-center justify-center">
                                    <button
                                        onClick={() => toggle(entity.key, perm.key)}
                                        className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all border ${
                                            state[entity.key][perm.key]
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-secondary/20 text-muted-foreground border-border hover:border-primary/40'
                                        }`}
                                    >
                                        {perm.key === 'read' ? 'r' : perm.key === 'write' ? 'w' : 'x'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Output */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Numeric (Octal)</label>
                            <button onClick={() => copy(octal, 'octal')} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                                {copied === 'octal' ? <Check size={12} /> : <Copy size={12} />}
                                {copied === 'octal' ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <input
                            type="text"
                            value={octalInput || octal}
                            onChange={(e) => handleOctalInput(e.target.value)}
                            maxLength={3}
                            placeholder="e.g. 755"
                            className="w-full p-3 rounded-lg border bg-card font-mono text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-[10px] text-muted-foreground text-center px-1">Type to set permissions directly</p>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Symbolic</label>
                            <button onClick={() => copy(symbolic, 'sym')} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                                {copied === 'sym' ? <Check size={12} /> : <Copy size={12} />}
                                {copied === 'sym' ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <div className="p-3 rounded-lg border bg-secondary/20 font-mono text-2xl font-bold text-center tracking-widest">
                            {symbolic}
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center px-1">chmod {octal} filename</p>
                    </div>
                </div>

                {/* Common Presets */}
                <div className="space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Common Presets</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {COMMON_PERMS.map(preset => (
                            <button
                                key={preset.value}
                                onClick={() => applyPreset(preset.value)}
                                className={`p-3 rounded-lg border text-left transition-all hover:border-primary/50 hover:bg-secondary/30 ${octal === preset.value ? 'border-primary bg-primary/10' : ''}`}
                            >
                                <div className="text-xs font-mono font-bold">{preset.label}</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">{preset.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
