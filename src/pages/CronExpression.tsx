import { useState, useEffect } from 'react';
import cronstrue from 'cronstrue';
import {
    Calendar,
    Clock,
    AlertCircle,
    ArrowRight,
    Info,
    CalendarDays
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function CronExpression() {
    const [expression, setExpression] = useState('*/5 * * * *');
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            if (expression.trim()) {
                const desc = cronstrue.toString(expression, { use24HourTimeFormat: true });
                setDescription(desc);
                setError(null);
            } else {
                setDescription('');
                setError(null);
            }
        } catch (e: any) {
            setError(e);
            setDescription('');
        }
    }, [expression]);

    const examples = [
        { label: 'Every minute', exp: '* * * * *' },
        { label: 'Every 5 minutes', exp: '*/5 * * * *' },
        { label: 'Every hour', exp: '0 * * * *' },
        { label: 'Every day at midnight', exp: '0 0 * * *' },
        { label: 'Every Monday at 9AM', exp: '0 9 * * 1' },
        { label: 'Every month on the 1st', exp: '0 0 1 * *' },
    ];

    return (
        <div className="h-full flex flex-col bg-background p-6 overflow-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                        <Calendar size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Cron Expression</h2>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Visual Builder & Parser</p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto w-full space-y-8">
                {/* Input Card */}
                <div className="bg-card border rounded-3xl p-8 shadow-sm space-y-6">
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Cron Expression</label>
                        <div className="relative group">
                            <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={24} />
                            <input
                                value={expression}
                                onChange={(e) => setExpression(e.target.value)}
                                placeholder="* * * * *"
                                className={cn(
                                    "w-full bg-secondary/10 border-2 rounded-2xl py-6 pl-16 pr-8 text-3xl font-mono tracking-widest focus:outline-none transition-all",
                                    error ? "border-destructive/50 focus:border-destructive" : "border-transparent focus:border-primary"
                                )}
                            />
                        </div>
                    </div>

                    <div className="min-h-[100px] flex items-center justify-center bg-secondary/5 rounded-2xl p-6 border border-dashed relative overflow-hidden group">
                        <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors duration-500" />
                        {description && !error ? (
                            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                                <ArrowRight className="text-primary shrink-0" size={24} />
                                <p className="text-xl md:text-2xl font-bold tracking-tight text-center leading-tight">
                                    "{description}"
                                </p>
                            </div>
                        ) : error ? (
                            <div className="flex items-center gap-3 text-destructive animate-in shake-x">
                                <AlertCircle size={24} />
                                <span className="font-bold">Invalid Cron Expression</span>
                            </div>
                        ) : (
                            <span className="text-muted-foreground italic">Start typing to see interpretation...</span>
                        )}
                    </div>
                </div>

                {/* Quick Examples */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {examples.map((ex, i) => (
                        <button
                            key={i}
                            onClick={() => setExpression(ex.exp)}
                            className="flex flex-col gap-2 p-5 bg-card border rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                        >
                            <span className="text-[10px] font-bold text-muted-foreground uppercase group-hover:text-primary transition-colors">{ex.label}</span>
                            <span className="text-lg font-mono font-bold">{ex.exp}</span>
                        </button>
                    ))}
                </div>

                {/* Helpful Info */}
                <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 flex flex-col md:flex-row gap-6">
                    <div className="flex gap-4 flex-1">
                        <Info className="text-primary shrink-0" size={20} />
                        <div className="space-y-4 flex-1">
                            <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Standard Format</h4>
                            <div className="grid grid-cols-5 gap-2 text-center">
                                {['Minute', 'Hour', 'Day', 'Month', 'Weekday'].map((u, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="p-2 bg-card border rounded-lg font-mono font-bold text-primary">{(expression.split(/\s+/)[i]) || '*'}</div>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{u}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="w-px bg-border hidden md:block" />
                    <div className="flex gap-4 flex-1">
                        <CalendarDays className="text-primary shrink-0" size={20} />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Cron expressions are used to schedule tasks at fixed times or intervals.
                            This tool follows the standard 5-part format (Minute, Hour, Day, Month, Weekday).
                            Perfect for Linux/Unix systems, AWS Lambda, or CI/CD pipelines.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
