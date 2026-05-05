import { useState, useEffect } from 'react';
import { Clock, Calendar, Hash, RefreshCcw } from 'lucide-react';
import { format as formatDate, fromUnixTime, getUnixTime } from 'date-fns';
import { ToolLayout } from '../components/layout/ToolLayout';
import { useToolPageMeta } from '../hooks/useToolPageMeta';

export default function UnixTimestamp() {
    const meta = useToolPageMeta();
    const [now, setNow] = useState(new Date());
    const [timestamp, setTimestamp] = useState(Math.floor(Date.now() / 1000).toString());
    const [readableDate, setReadableDate] = useState('');
    const [inputDate, setInputDate] = useState(new Date().toISOString().slice(0, 16));
    const [outputTimestamp, setOutputTimestamp] = useState('');

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const convertToDate = () => {
        try {
            const ts = parseInt(timestamp, 10);
            if (isNaN(ts)) throw new Error('Invalid timestamp');
            const date = ts > 1000000000000 ? new Date(ts) : fromUnixTime(ts);
            setReadableDate(formatDate(date, 'PPPPpppp') + ' (Local)');
        } catch {
            setReadableDate('Invalid Timestamp');
        }
    };

    const convertToTimestamp = () => {
        try {
            const date = new Date(inputDate);
            if (isNaN(date.getTime())) throw new Error('Invalid date');
            setOutputTimestamp(getUnixTime(date).toString());
        } catch {
            setOutputTimestamp('Invalid Date');
        }
    };

    const useCurrent = () => {
        const current = Math.floor(Date.now() / 1000).toString();
        setTimestamp(current);
    };

    const reset = () => {
        setTimestamp(Math.floor(Date.now() / 1000).toString());
        setReadableDate('');
        setInputDate(new Date().toISOString().slice(0, 16));
        setOutputTimestamp('');
    };

    const buildCopyText = () => {
        const lines: string[] = [];
        lines.push(`Current Unix (s): ${Math.floor(now.getTime() / 1000)}`);
        lines.push(`Live local time: ${formatDate(now, 'PPP ppp')}`);
        if (readableDate && readableDate !== 'Invalid Timestamp') {
            lines.push(`Timestamp → date: ${readableDate}`);
        }
        if (outputTimestamp && outputTimestamp !== 'Invalid Date') {
            lines.push(`Date → Unix: ${outputTimestamp}`);
        }
        return lines.join('\n');
    };

    return (
        <ToolLayout
            title={meta?.label ?? 'Timestamp'}
            description={meta?.desc}
            onCopy={() => navigator.clipboard.writeText(buildCopyText())}
            onClear={reset}
        >
            <div className="p-4 md:p-6 overflow-auto">
                <div className="bg-secondary/30 rounded-xl p-6 mb-8 border flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                            <Clock size={28} className="animate-pulse" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Unix Timestamp</p>
                            <p className="text-4xl font-mono font-bold tracking-tighter">{Math.floor(now.getTime() / 1000)}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Human Readable</p>
                        <p className="text-lg font-medium">{formatDate(now, 'PPP ppp')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4 p-6 rounded-xl border bg-card/50">
                        <div className="flex items-center gap-2 mb-2">
                            <Hash className="text-primary" size={20} />
                            <h3 className="font-semibold text-lg">Timestamp to Date</h3>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={timestamp}
                                onChange={(e) => setTimestamp(e.target.value)}
                                placeholder="Unix timestamp (s or ms)"
                                className="flex-1 px-4 py-2 rounded-md border bg-background font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <button
                                type="button"
                                onClick={useCurrent}
                                className="p-2 border rounded-md hover:bg-secondary transition-colors"
                                title="Use current time"
                            >
                                <RefreshCcw size={18} />
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={convertToDate}
                            className="w-full py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors shadow-sm"
                        >
                            Convert to Date
                        </button>
                        {readableDate && (
                            <div className="mt-4 p-3 bg-secondary/50 rounded-md border text-sm font-medium">
                                {readableDate}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 p-6 rounded-xl border bg-card/50">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="text-primary" size={20} />
                            <h3 className="font-semibold text-lg">Date to Timestamp</h3>
                        </div>
                        <input
                            type="datetime-local"
                            value={inputDate}
                            onChange={(e) => setInputDate(e.target.value)}
                            className="w-full px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                            type="button"
                            onClick={convertToTimestamp}
                            className="w-full py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors shadow-sm"
                        >
                            Convert to Timestamp
                        </button>
                        {outputTimestamp && (
                            <div className="mt-4 p-3 bg-secondary/50 rounded-md border font-mono text-sm">
                                {outputTimestamp}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
