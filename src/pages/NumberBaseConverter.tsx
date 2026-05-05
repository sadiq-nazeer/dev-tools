import { useState } from 'react';
import { Hash, Copy, Check } from 'lucide-react';

type Base = 'bin' | 'oct' | 'dec' | 'hex';

const bases: { key: Base; label: string; radix: number; prefix: string; pattern: RegExp }[] = [
    { key: 'dec', label: 'Decimal (Base 10)', radix: 10, prefix: '', pattern: /^-?\d+$/ },
    { key: 'bin', label: 'Binary (Base 2)', radix: 2, prefix: '0b', pattern: /^[01]+$/ },
    { key: 'oct', label: 'Octal (Base 8)', radix: 8, prefix: '0o', pattern: /^[0-7]+$/ },
    { key: 'hex', label: 'Hexadecimal (Base 16)', radix: 16, prefix: '0x', pattern: /^[0-9a-fA-F]+$/ },
];

function parseToDecimal(value: string, radix: number): number | null {
    if (!value.trim()) return null;
    const n = parseInt(value, radix);
    return isNaN(n) ? null : n;
}

export default function NumberBaseConverter() {
    const [values, setValues] = useState<Record<Base, string>>({ bin: '', oct: '', dec: '', hex: '' });
    const [error, setError] = useState('');
    const [copied, setCopied] = useState<Base | null>(null);

    const handleChange = (fromBase: Base, raw: string) => {
        const base = bases.find(b => b.key === fromBase)!;
        setError('');

        if (!raw.trim()) {
            setValues({ bin: '', oct: '', dec: '', hex: '' });
            return;
        }

        if (!base.pattern.test(raw)) {
            setError(`"${raw}" is not a valid ${base.label.split(' ')[0]} number.`);
            setValues(prev => ({ ...prev, [fromBase]: raw }));
            return;
        }

        const decimal = parseToDecimal(raw, base.radix);
        if (decimal === null) {
            setError('Could not parse the number.');
            return;
        }

        setValues({
            bin: decimal.toString(2),
            oct: decimal.toString(8),
            dec: decimal.toString(10),
            hex: decimal.toString(16).toUpperCase(),
        });
    };

    const copyToClipboard = async (key: Base) => {
        const val = values[key];
        if (!val) return;
        await navigator.clipboard.writeText(val);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="h-full flex flex-col bg-background p-6 overflow-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Hash className="text-primary" /> Number Base Converter
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Type in any field to convert across all bases simultaneously.</p>
            </div>

            <div className="space-y-4 max-w-2xl mx-auto w-full">
                {bases.map(({ key, label, prefix }) => (
                    <div key={key} className="space-y-1.5">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</label>
                            <button
                                onClick={() => copyToClipboard(key)}
                                className="text-[10px] text-primary hover:underline flex items-center gap-1.5 disabled:opacity-30"
                                disabled={!values[key]}
                            >
                                {copied === key ? <Check size={12} /> : <Copy size={12} />}
                                {copied === key ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            {prefix && (
                                <span className="text-xs font-mono text-muted-foreground bg-secondary/40 px-2 py-3 rounded-lg border border-r-0 rounded-r-none">
                                    {prefix}
                                </span>
                            )}
                            <input
                                type="text"
                                value={values[key]}
                                onChange={(e) => handleChange(key, e.target.value)}
                                placeholder={`Enter ${label.split(' ')[0].toLowerCase()} number...`}
                                className={`flex-1 p-3 rounded-lg border bg-card font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary ${prefix ? 'rounded-l-none' : ''}`}
                                spellCheck={false}
                            />
                        </div>
                    </div>
                ))}

                {error && (
                    <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">{error}</p>
                )}

                {values.dec && !error && (
                    <div className="mt-6 p-4 rounded-xl border bg-secondary/20 space-y-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Quick Reference</p>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                            <span className="text-muted-foreground">Decimal:</span><span>{values.dec}</span>
                            <span className="text-muted-foreground">Binary:</span><span>{values.bin}</span>
                            <span className="text-muted-foreground">Octal:</span><span>0o{values.oct}</span>
                            <span className="text-muted-foreground">Hex:</span><span>0x{values.hex}</span>
                            <span className="text-muted-foreground">Bits needed:</span><span>{values.bin.length}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
