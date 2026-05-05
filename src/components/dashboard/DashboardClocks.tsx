import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Globe2, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

const STORAGE_KEY = 'devtools_dashboard_tz';
/** Default second clock — Kuala Lumpur (distinct from most Asia/Colombo local setups). */
const DEFAULT_SECOND_TZ = 'Asia/Kuala_Lumpur';

function loadTz(): string {
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        if (v && typeof v === 'string') return v;
    } catch {
        /* ignore */
    }
    return DEFAULT_SECOND_TZ;
}

const FALLBACK_TIME_ZONES = [
    DEFAULT_SECOND_TZ,
    'Asia/Colombo',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Asia/Hong_Kong',
    'Europe/London',
    'America/New_York',
    'America/Los_Angeles',
    'UTC',
];

function getAllTimeZones(): string[] {
    try {
        const supportedValuesOf = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] })
            .supportedValuesOf;
        const list = supportedValuesOf?.('timeZone');
        if (Array.isArray(list) && list.length > 0) {
            return [...list].sort((a: string, b: string) => a.localeCompare(b));
        }
    } catch {
        /* ignore */
    }
    return [...FALLBACK_TIME_ZONES];
}

function shortIanaLabel(iana: string): string {
    const tail = iana.includes('/') ? iana.split('/').slice(1).join(' · ') : iana;
    return tail.replace(/_/g, ' ');
}

type ClockParts = { time: string; dateLine: string; tzId: string };

function getClockParts(now: Date, timeZone?: string): ClockParts {
    const tzOpts = timeZone ? { timeZone } : {};
    const time = new Intl.DateTimeFormat(undefined, {
        ...tzOpts,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).format(now);
    const dateLine = new Intl.DateTimeFormat(undefined, {
        ...tzOpts,
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(now);
    const tzId = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Local';
    return { time, dateLine, tzId };
}

export function DashboardClocks() {
    const [now, setNow] = useState(() => new Date());
    const [selectedTz, setSelectedTz] = useState(loadTz);
    const [tzPickerOpen, setTzPickerOpen] = useState(false);
    const [tzSearch, setTzSearch] = useState('');
    const tzSearchRef = useRef<HTMLInputElement>(null);

    const allZones = useMemo(() => getAllTimeZones(), []);

    const searchActive = tzSearch.trim().length > 0;

    useEffect(() => {
        if (!tzPickerOpen) setTzSearch('');
    }, [tzPickerOpen]);

    useEffect(() => {
        if (tzPickerOpen) {
            const id = requestAnimationFrame(() => tzSearchRef.current?.focus());
            return () => cancelAnimationFrame(id);
        }
    }, [tzPickerOpen]);

    const zoneOptions = useMemo(() => {
        const q = tzSearch.trim().toLowerCase();
        const base = q
            ? allZones.filter(z => {
                  const id = z.toLowerCase();
                  const label = shortIanaLabel(z).toLowerCase();
                  return id.includes(q) || label.includes(q);
              })
            : allZones;
        if (base.includes(selectedTz)) return base;
        return [selectedTz, ...base];
    }, [allZones, tzSearch, selectedTz]);

    useEffect(() => {
        const id = window.setInterval(() => setNow(new Date()), 1000);
        return () => window.clearInterval(id);
    }, []);

    const localParts = useMemo(() => getClockParts(now), [now]);
    const remoteParts = useMemo(() => {
        try {
            return getClockParts(now, selectedTz);
        } catch {
            return { time: '—', dateLine: '', tzId: selectedTz };
        }
    }, [now, selectedTz]);

    const persistTz = (tz: string) => {
        setSelectedTz(tz);
        try {
            localStorage.setItem(STORAGE_KEY, tz);
        } catch {
            /* ignore */
        }
    };

    const pickZone = (tz: string) => {
        persistTz(tz);
        setTzPickerOpen(false);
    };

    const clockFace = (parts: ClockParts, eyebrow: string, subtle?: string) => (
        <div className="flex flex-col items-center justify-center text-center py-7 px-5 md:py-9 md:px-8 gap-0">
            <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                {eyebrow}
            </span>
            {subtle ? (
                <span className="text-[11px] text-muted-foreground/70 mt-2 font-medium tracking-wide">{subtle}</span>
            ) : null}
            <time
                dateTime={now.toISOString()}
                className="mt-4 text-[2.75rem] leading-none sm:text-5xl md:text-[3.25rem] font-mono font-semibold tabular-nums tracking-tight text-foreground [text-shadow:0_1px_0_rgb(0_0_0_/0.15)] dark:[text-shadow:0_1px_0_rgb(255_255_255_/0.06)]"
            >
                {parts.time}
            </time>
            <p className="mt-4 text-sm md:text-[15px] text-muted-foreground font-medium leading-snug max-w-[22ch]">
                {parts.dateLine}
            </p>
            <p className="mt-3 text-[11px] font-mono text-muted-foreground/80 tracking-wide">{parts.tzId}</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto w-full grid sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
            <div className="rounded-2xl border border-border/80 bg-gradient-to-b from-card to-card/90 shadow-lg shadow-black/20 overflow-hidden ring-1 ring-white/5">
                {clockFace(localParts, 'Local', 'This device')}
            </div>

            <div className="rounded-2xl border border-border/80 bg-gradient-to-b from-card to-card/90 shadow-lg shadow-black/20 overflow-hidden ring-1 ring-white/5 flex flex-col">
                {clockFace(remoteParts, 'World clock')}
                <div className="border-t border-border/40 bg-muted/5 px-2.5 pb-2 pt-1.5 text-left">
                    <button
                        type="button"
                        id="dashboard-world-clock-tz-toggle"
                        aria-expanded={tzPickerOpen}
                        aria-controls="dashboard-world-clock-tz-panel"
                        aria-label={`Time zone ${shortIanaLabel(selectedTz)}. ${tzPickerOpen ? 'Collapse' : 'Expand'} to change.`}
                        onClick={() => setTzPickerOpen(o => !o)}
                        className="group flex w-full items-center gap-2 rounded-lg border border-border/60 bg-background/70 px-2 py-1 pr-1 shadow-sm shadow-black/10 outline-none transition-colors hover:border-border hover:bg-secondary/30 focus-visible:ring-2 focus-visible:ring-primary/30 dark:shadow-black/30"
                    >
                        <Globe2 className="size-3.5 shrink-0 text-primary/80" strokeWidth={2} aria-hidden />
                        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground whitespace-nowrap">
                            Zone
                        </span>
                        <span className="h-3 w-px shrink-0 rounded-full bg-border/80" aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-left font-mono text-xs font-medium text-foreground">
                            {shortIanaLabel(selectedTz)}
                        </span>
                        <span
                            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors group-hover:text-foreground"
                            aria-hidden
                        >
                            <ChevronDown
                                size={15}
                                strokeWidth={2.25}
                                className={cn('transition-transform duration-200', tzPickerOpen && 'rotate-180')}
                            />
                        </span>
                    </button>
                    {tzPickerOpen ? (
                        <div
                            id="dashboard-world-clock-tz-panel"
                            className="mt-1.5 animate-in fade-in slide-in-from-top-1 duration-150 space-y-1.5"
                        >
                            <div className="relative">
                                <Search
                                    className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                                    strokeWidth={2}
                                    aria-hidden
                                />
                                <input
                                    ref={tzSearchRef}
                                    id="dashboard-world-clock-tz-search"
                                    type="search"
                                    value={tzSearch}
                                    onChange={e => setTzSearch(e.target.value)}
                                    placeholder="Search…"
                                    autoComplete="off"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    className="h-8 w-full rounded-lg border border-border/70 bg-background py-0 pl-8 pr-2 text-xs outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-1 focus-visible:ring-primary/25"
                                    aria-label="Search time zones"
                                    aria-controls="dashboard-world-clock-tz-listbox"
                                    aria-expanded={searchActive}
                                />
                            </div>
                            {searchActive ? (
                                <ul
                                    id="dashboard-world-clock-tz-listbox"
                                    role="listbox"
                                    aria-label="Matching time zones"
                                    className="max-h-44 overflow-y-auto rounded-lg border border-border/70 bg-background text-xs shadow-inner shadow-black/5 dark:shadow-black/20"
                                >
                                    {zoneOptions.length === 0 ? (
                                        <li className="px-2.5 py-5 text-center text-[11px] text-muted-foreground">
                                            No matches.
                                        </li>
                                    ) : (
                                        zoneOptions.map(z => {
                                            const picked = selectedTz === z;
                                            return (
                                                <li key={z} role="presentation">
                                                    <button
                                                        type="button"
                                                        role="option"
                                                        aria-selected={picked}
                                                        onClick={() => pickZone(z)}
                                                        className={cn(
                                                            'flex w-full flex-col gap-0 border-b border-border/40 px-2.5 py-1.5 text-left transition-colors last:border-b-0',
                                                            picked
                                                                ? 'bg-primary/15 text-primary'
                                                                : 'hover:bg-secondary/60 text-foreground'
                                                        )}
                                                    >
                                                        <span className="truncate font-mono text-[11px] font-medium leading-tight">
                                                            {shortIanaLabel(z)}
                                                        </span>
                                                        <span className="truncate font-mono text-[9px] text-muted-foreground opacity-90">
                                                            {z}
                                                        </span>
                                                    </button>
                                                </li>
                                            );
                                        })
                                    )}
                                </ul>
                            ) : (
                                <p className="rounded-lg border border-border/40 bg-muted/10 px-2 py-2 text-center text-[10px] leading-snug text-muted-foreground">
                                    Type to filter — results appear here.
                                </p>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
