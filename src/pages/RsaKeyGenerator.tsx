import { useState, useCallback } from 'react';
import { KeyRound, RefreshCw, Copy, Check, Shield } from 'lucide-react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { usePersistentState } from '../hooks/usePersistentState';
import { useToolPageMeta } from '../hooks/useToolPageMeta';
import Editor from '@monaco-editor/react';

export default function RsaKeyGenerator() {
    const meta = useToolPageMeta();
    const [keySize, setKeySize] = usePersistentState<number>('rsa_key_size', 2048);
    const [keys, setKeys] = useState<{ public: string; private: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedKey, setCopiedKey] = useState<'public' | 'private' | null>(null);

    const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    const formatAsPem = (base64: string, label: string) => {
        const lines = base64.match(/.{1,64}/g) || [];
        return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
    };

    const generateKeyPair = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const keyPair = await window.crypto.subtle.generateKey(
                {
                    name: "RSA-OAEP",
                    modulusLength: keySize,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: "SHA-256",
                },
                true,
                ["encrypt", "decrypt"]
            );

            const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
            const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

            const publicKeyBase64 = arrayBufferToBase64(publicKeyBuffer);
            const privateKeyBase64 = arrayBufferToBase64(privateKeyBuffer);

            setKeys({
                public: formatAsPem(publicKeyBase64, "PUBLIC KEY"),
                private: formatAsPem(privateKeyBase64, "PRIVATE KEY"),
            });
        } catch (e: unknown) {
            setError('Failed to generate key pair: ' + (e instanceof Error ? e.message : String(e)));
        } finally {
            setIsLoading(false);
        }
    }, [keySize]);

    const copyToClipboard = (text: string, type: 'public' | 'private') => {
        navigator.clipboard.writeText(text);
        setCopiedKey(type);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const copyBothKeys = () => {
        if (!keys) return;
        return navigator.clipboard.writeText(
            `Public:\n${keys.public}\n\nPrivate:\n${keys.private}`
        );
    };

    return (
        <ToolLayout
            title={meta?.label ?? 'RSA Key Gen'}
            description={meta?.desc}
            onCopy={copyBothKeys}
            onClear={() => {
                setKeys(null);
                setError(null);
            }}
            error={error}
            actions={
                <button
                    onClick={generateKeyPair}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                >
                    <RefreshCw className={isLoading ? "animate-spin" : ""} size={14} />
                    {isLoading ? 'Generating...' : 'Generate New Key Pair'}
                </button>
            }
        >
            <div className="h-full flex flex-col p-6 space-y-6 max-w-5xl mx-auto">
                <div className="bg-card border rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 text-primary rounded-xl">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold">Key Configuration</h3>
                            <p className="text-xs text-muted-foreground">Select the size for your RSA key pair.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        {[1024, 2048, 4096].map((size) => (
                            <button
                                key={size}
                                onClick={() => setKeySize(size)}
                                className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold transition-all ${keySize === size
                                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/20"
                                        : "hover:bg-secondary border-border"
                                    }`}
                            >
                                {size} bit
                                {size === 2048 && <span className="block text-[10px] font-normal opacity-70 mt-0.5">Recommended</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {keys && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                        <div className="flex flex-col space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Public Key (SPKI)</h4>
                                <button
                                    onClick={() => copyToClipboard(keys.public, 'public')}
                                    className="flex items-center gap-1.5 px-2 py-1 text-[10px] bg-secondary hover:bg-secondary/80 rounded transition-colors"
                                >
                                    {copiedKey === 'public' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                    {copiedKey === 'public' ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <div className="flex-1 rounded-xl overflow-hidden border">
                                <Editor
                                    height="100%"
                                    defaultLanguage="plaintext"
                                    value={keys.public}
                                    theme="vs-dark"
                                    options={{
                                        readOnly: true,
                                        minimap: { enabled: false },
                                        fontSize: 12,
                                        lineNumbers: 'off',
                                        automaticLayout: true,
                                        wordWrap: 'on'
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Private Key (PKCS#8)</h4>
                                <button
                                    onClick={() => copyToClipboard(keys.private, 'private')}
                                    className="flex items-center gap-1.5 px-2 py-1 text-[10px] bg-secondary hover:bg-secondary/80 rounded transition-colors"
                                >
                                    {copiedKey === 'private' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                    {copiedKey === 'private' ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <div className="flex-1 rounded-xl overflow-hidden border">
                                <Editor
                                    height="100%"
                                    defaultLanguage="plaintext"
                                    value={keys.private}
                                    theme="vs-dark"
                                    options={{
                                        readOnly: true,
                                        minimap: { enabled: false },
                                        fontSize: 12,
                                        lineNumbers: 'off',
                                        automaticLayout: true,
                                        wordWrap: 'on'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {!keys && !isLoading && (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-12 text-center text-muted-foreground">
                        <KeyRound className="opacity-10 mb-6" size={80} />
                        <h4 className="text-xl font-bold text-foreground">No Key Pair Generated</h4>
                        <p className="max-w-md mt-2 text-sm">
                            Click the button above to generate a secure RSA public and private key pair locally in your browser.
                        </p>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
