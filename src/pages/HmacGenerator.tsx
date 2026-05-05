import { useState, useCallback, useEffect } from 'react';
import { KeyRound, ShieldCheck, Fingerprint } from 'lucide-react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { usePersistentState } from '../hooks/usePersistentState';
import { useToolPageMeta } from '../hooks/useToolPageMeta';
import CryptoJS from 'crypto-js';

export default function HmacGenerator() {
    const meta = useToolPageMeta();
    const [message, setMessage] = usePersistentState<string>('hmac_message', '');
    const [secret, setSecret] = usePersistentState<string>('hmac_secret', '');
    const [algorithm, setAlgorithm] = usePersistentState<string>('hmac_algo', 'SHA256');
    const [hmac, setHmac] = useState('');

    const generateHmac = useCallback(() => {
        if (!message || !secret) {
            setHmac('');
            return;
        }

        let hash;
        switch (algorithm) {
            case 'MD5':
                hash = CryptoJS.HmacMD5(message, secret);
                break;
            case 'SHA1':
                hash = CryptoJS.HmacSHA1(message, secret);
                break;
            case 'SHA256':
                hash = CryptoJS.HmacSHA256(message, secret);
                break;
            case 'SHA512':
                hash = CryptoJS.HmacSHA512(message, secret);
                break;
            default:
                hash = CryptoJS.HmacSHA256(message, secret);
        }
        setHmac(hash.toString());
    }, [message, secret, algorithm]);

    useEffect(() => {
        generateHmac();
    }, [generateHmac]);

    return (
        <ToolLayout
            title={meta?.label ?? 'HMAC Gen'}
            description={meta?.desc}
            onCopy={() => {
                if (!hmac) return;
                return navigator.clipboard.writeText(hmac);
            }}
            onClear={() => {
                setMessage('');
                setSecret('');
                setHmac('');
            }}
        >
            <div className="max-w-4xl mx-auto p-6 space-y-8">
                <div className="bg-card border rounded-3xl p-8 space-y-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                            <KeyRound size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">HMAC Configuration</h3>
                            <p className="text-sm text-muted-foreground">Keyed-hash message authentication code generator.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Algorithm</label>
                            <div className="flex gap-2">
                                {['MD5', 'SHA1', 'SHA256', 'SHA512'].map((algo) => (
                                    <button
                                        key={algo}
                                        onClick={() => setAlgorithm(algo)}
                                        className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${algorithm === algo
                                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/20"
                                                : "hover:bg-secondary border-border"
                                            }`}
                                    >
                                        {algo}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Secret Key</label>
                            <input
                                type="text"
                                value={secret}
                                onChange={(e) => setSecret(e.target.value)}
                                placeholder="Enter your secret key here..."
                                className="w-full bg-secondary border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Message (Payload)</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Enter the message you want to sign..."
                                rows={4}
                                className="w-full bg-secondary border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none transition-all resize-none"
                            />
                        </div>
                    </div>
                </div>

                {hmac && (
                    <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="text-primary" size={20} />
                            <h3 className="text-sm font-bold">Generated HMAC-{algorithm}</h3>
                        </div>
                        <div className="bg-background/50 border rounded-2xl p-4 break-all font-mono text-sm leading-relaxed text-primary">
                            {hmac}
                        </div>
                    </div>
                )}

                {!hmac && (
                    <div className="py-12 text-center text-muted-foreground">
                        <Fingerprint className="mx-auto mb-4 opacity-10" size={60} />
                        <p className="text-sm">Enter a secret key and a message to generate an HMAC hash.</p>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
