import { useState, useEffect } from 'react';
import { Ruler, Info, RefreshCw } from 'lucide-react';

export default function CssUnitConverter() {
    const [baseSize, setBaseSize] = useState(16);
    const [px, setPx] = useState<string>('16');
    const [rem, setRem] = useState<string>('1');
    const [em, setEm] = useState<string>('1');
    const [percent, setPercent] = useState<string>('100');

    const updateFromPx = (val: string) => {
        setPx(val);
        const num = parseFloat(val);
        if (!isNaN(num)) {
            setRem((num / baseSize).toString());
            setEm((num / baseSize).toString());
            setPercent((num / baseSize * 100).toString());
        }
    };

    const updateFromRem = (val: string) => {
        setRem(val);
        const num = parseFloat(val);
        if (!isNaN(num)) {
            setPx((num * baseSize).toString());
            setEm(num.toString());
            setPercent((num * 100).toString());
        }
    };

    const updateFromEm = (val: string) => {
        setEm(val);
        const num = parseFloat(val);
        if (!isNaN(num)) {
            setPx((num * baseSize).toString());
            setRem(num.toString());
            setPercent((num * 100).toString());
        }
    };

    const updateFromPercent = (val: string) => {
        setPercent(val);
        const num = parseFloat(val);
        if (!isNaN(num)) {
            const remVal = num / 100;
            setRem(remVal.toString());
            setEm(remVal.toString());
            setPx((remVal * baseSize).toString());
        }
    };

    useEffect(() => {
        updateFromPx(px);
    }, [baseSize]);

    const InputField = ({
        label,
        value,
        onChange,
        unit
    }: {
        label: string,
        value: string,
        onChange: (v: string) => void,
        unit: string
    }) => (
        <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">{label}</label>
            <div className="relative group">
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full p-4 rounded-xl border bg-card focus:outline-none focus:ring-2 focus:ring-primary font-mono text-lg transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono font-bold pointer-events-none group-focus-within:text-primary">
                    {unit}
                </span>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-background p-6 overflow-auto">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Ruler className="text-primary" /> CSS Unit Converter
                </h2>

                <div className="flex items-center gap-3 bg-secondary/30 p-3 rounded-xl border px-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Base Size</span>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={baseSize}
                                onChange={(e) => setBaseSize(parseInt(e.target.value) || 16)}
                                className="w-12 bg-transparent focus:outline-none text-lg font-bold font-mono"
                            />
                            <span className="text-sm font-bold text-muted-foreground">px</span>
                        </div>
                    </div>
                    <Info size={16} className="text-muted-foreground" />
                </div>
            </div>

            <div className="max-w-4xl mx-auto w-full space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Pixels" value={px} onChange={updateFromPx} unit="px" />
                    <InputField label="Relative (REM)" value={rem} onChange={updateFromRem} unit="rem" />
                    <InputField label="Font Relative (EM)" value={em} onChange={updateFromEm} unit="em" />
                    <InputField label="Percentage" value={percent} onChange={updateFromPercent} unit="%" />
                </div>

                <div className="bg-primary/5 rounded-2xl p-8 border border-primary/10 space-y-4">
                    <h3 className="font-bold text-primary flex items-center gap-2">
                        <RefreshCw size={18} /> Conversion Logic
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        The conversion is based on the <strong>root font-size</strong> (standard is {baseSize}px).
                        Changing the base size will automatically update relative units (rem, em, %).
                        This tool helps you translate design specs (usually in px) into accessible and responsive CSS units.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                        {[12, 14, 16, 18, 20, 24].map((s) => (
                            <button
                                key={s}
                                onClick={() => setBaseSize(s)}
                                className="px-3 py-2 rounded-lg border bg-background hover:bg-secondary text-xs font-bold transition-colors"
                                title={`Set base size to ${s}px`}
                            >
                                Set {s}px
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
