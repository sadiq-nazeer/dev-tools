import { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import { ShieldCheck, Copy, Check, Trash2, AlertCircle } from 'lucide-react';

type Algorithm = 'HS256' | 'HS384' | 'HS512';

function base64url(str: string): string {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function b64urlEncode(obj: unknown): string {
    return base64url(JSON.stringify(obj));
}

function hmacSign(alg: Algorithm, secret: string, data: string): string {
    const hashFn = alg === 'HS256' ? CryptoJS.HmacSHA256 : alg === 'HS384' ? CryptoJS.HmacSHA384 : CryptoJS.HmacSHA512;
    const sig = hashFn(data, secret);
    const bytes = sig.toString(CryptoJS.enc.Base64);
    return bytes.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

const DEFAULT_HEADER = JSON.stringify({ alg: 'HS256', typ: 'JWT' }, null, 2);
const DEFAULT_PAYLOAD = JSON.stringify({
    sub: '1234567890',
    name: 'Alice',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
}, null, 2);

export default function JwtBuilder() {
    const [header, setHeader] = useState(DEFAULT_HEADER);
    const [payload, setPayload] = useState(DEFAULT_PAYLOAD);
    const [secret, setSecret] = useState('your-256-bit-secret');
    const [alg, setAlg] = useState<Algorithm>('HS256');
    const [token, setToken] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => { build(); }, [header, payload, secret, alg]);

    const build = () => {
        setError(null);
        try {
            const parsedHeader = JSON.parse(header);
            parsedHeader.alg = alg;
            parsedHeader.typ = 'JWT';
            const h = b64urlEncode(parsedHeader);
            const p = b64urlEncode(JSON.parse(payload));
            const sig = hmacSign(alg, secret, `${h}.${p}`);
            setToken(`${h}.${p}.${sig}`);
        } catch (e) {
            setError((e as Error).message);
            setToken('');
        }
    };

    const copy = async () => {
        await navigator.clipboard.writeText(token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const parts = token.split('.');
    const PART_COLORS = ['text-red-400', 'text-purple-400', 'text-cyan-400'];

    return (
        <div className="h-full flex flex-col bg-background p-6 overflow-auto">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <ShieldCheck className="text-primary" /> JWT Builder
                </h2>
                <button onClick={() => { setHeader(DEFAULT_HEADER); setPayload(DEFAULT_PAYLOAD); setSecret('your-256-bit-secret'); }}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors" title="Reset">
                    <Trash2 size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Inputs */}
                <div className="space-y-5">
                    {/* Algorithm */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Algorithm</label>
                        <div className="flex gap-2">
                            {(['HS256', 'HS384', 'HS512'] as Algorithm[]).map(a => (
                                <button key={a} onClick={() => setAlg(a)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-mono font-medium border transition-colors ${alg === a ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/20 border-border hover:bg-secondary/40'}`}>
                                    {a}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Header */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Header</label>
                        <textarea value={header} onChange={e => setHeader(e.target.value)}
                            className="w-full p-3 rounded-lg border bg-card font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] text-red-400"
                            spellCheck={false} />
                    </div>

                    {/* Payload */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Payload</label>
                        <textarea value={payload} onChange={e => setPayload(e.target.value)}
                            className="w-full p-3 rounded-lg border bg-card font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary min-h-[160px] text-purple-400"
                            spellCheck={false} />
                    </div>

                    {/* Secret */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Secret (HMAC key)</label>
                        <input type="text" value={secret} onChange={e => setSecret(e.target.value)}
                            className="w-full p-3 rounded-lg border bg-card font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary text-cyan-400"
                            spellCheck={false} />
                    </div>
                </div>

                {/* Right: Output */}
                <div className="space-y-5">
                    {error && (
                        <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />{error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Generated Token</label>
                            <button onClick={copy} disabled={!token}
                                className="text-[10px] text-primary hover:underline flex items-center gap-1.5 disabled:opacity-30">
                                {copied ? <Check size={12} /> : <Copy size={12} />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <div className="p-4 rounded-xl border bg-secondary/20 font-mono text-xs break-all leading-relaxed min-h-[120px]">
                            {parts.length === 3 ? (
                                <>
                                    <span className={PART_COLORS[0]}>{parts[0]}</span>
                                    <span className="text-muted-foreground">.</span>
                                    <span className={PART_COLORS[1]}>{parts[1]}</span>
                                    <span className="text-muted-foreground">.</span>
                                    <span className={PART_COLORS[2]}>{parts[2]}</span>
                                </>
                            ) : <span className="text-muted-foreground/40 italic">Fill in the fields to generate a token</span>}
                        </div>
                    </div>

                    {/* Color Legend */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Structure</label>
                        <div className="space-y-1.5">
                            {[
                                { label: 'Header', color: 'text-red-400', bg: 'bg-red-500/10' },
                                { label: 'Payload', color: 'text-purple-400', bg: 'bg-purple-500/10' },
                                { label: 'Signature', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                            ].map(({ label, color, bg }) => (
                                <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bg}`}>
                                    <div className="w-2 h-2 rounded-full bg-current" style={{ color: 'currentColor' }} />
                                    <span className={`text-xs font-medium ${color}`}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border bg-secondary/10 text-xs text-muted-foreground space-y-1">
                        <p className="font-semibold">Note</p>
                        <p>This builder supports HMAC algorithms (HS256/384/512). RS256 requires a private key and is not supported offline. The generated token is signed locally — never share tokens with real secrets in production.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
