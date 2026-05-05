import { useState } from 'react';
import { X509Certificate } from '@peculiar/x509';
import { ShieldCheck, Copy, Check, Trash2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const SAMPLE_PEM = `-----BEGIN CERTIFICATE-----
MIIDrzCCApegAwIBAgIQCDvgVpBCRrGhdWrJWZHHSjANBgkqhkiG9w0BAQUFADBh
MQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3
d3cuZGlnaWNlcnQuY29tMSAwHgYDVQQDExdEaWdpQ2VydCBHbG9iYWwgUm9vdCBD
QTAeFw0wNjExMTAwMDAwMDBaFw0zMTExMTAwMDAwMDBaMGExCzAJBgNVBAYTAlVT
MRUwEwYDVQQKEwxEaWdpQ2VydCBJbmMxGTAXBgNVBAsTEHd3dy5kaWdpY2VydC5j
b20xIDAeBgNVBAMTF0RpZ2lDZXJ0IEdsb2JhbCBSb290IENBMIIBIjANBgkqhkiG
9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4jvhEXLeqKTTo1eqUKKPC3eQyaKl7hLOllsB
CSDMAZOnTjC3U/dDxGkAV53ijSLdhwZAAIEJzs4bg7/fzTtxRuLWZscFs3YnFo97
nh6Vfe63SKMI2tavegw5BmV/Sl0fvBf4q77uKNd0f3p4mVmFaG5cIzJLv07A6Fpt
43C/dxC//AH2hdmoRBBYMql1GNXRor5H4idq9Joz+EkIYIvUX7Q6hL+hqkpMfT7P
T19sdl6gSzeRntwi5m3OFBqOasv+zbMUZBfHWymeMr/y7vrTC0LUq7dBMtoM1O/4
gdW7jVg/tRvoSSiicNoxBN33shbyTApOB6jtSj1etX+jkMOvJwIDAQABo2IwYDAd
BgNVHQ4EFgQUA95QNVbRTLtm8KPiGxvDl7I90VUwHwYDVR0jBBgwFoAUA95QNVbR
TLtm8KPiGxvDl7I90VUwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMCAYYw
DQYJKoZIhvcNAQEFBQADggEBAMucN6pIExIK+t1EnE9SsPTfrgT1eXkIoyQY/Esr
hMAtudXH/vTBH1jLuG2cenTnmCmrEbXjcKChzUyImZOMkXDiqw8cvpOp/2PV5Adg
06O/nVsJ8dWO41P0jmP6P6fbtGbfYmbW0W5BjfIttep3Sp+dWOIrWcBAI+0tKIJF
PnlUkiaY4IBIqDfv8NZ5YBberOgOzW6sRBc4L0na4UU+Krk2U886UAb3LujEV0ls
YSEY1QSteDwsOoBrp+uvFRTp2InBuThs4pFsiv9kuXclVzDAGySj4dzp30d8tbQk
CAUw7C29C79Fv1C5qfPrmAESrciIxpg0X40KPMbp1ZWVbd4=
-----END CERTIFICATE-----`;

function formatDate(date: Date): string {
    return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function isExpired(date: Date): boolean {
    return date < new Date();
}

function daysUntil(date: Date): number {
    return Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function CertificateInspector() {
    const [pem, setPem] = useState('');
    const [cert, setCert] = useState<X509Certificate | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    const parse = (input: string) => {
        setError(null);
        setCert(null);
        if (!input.trim()) return;
        try {
            const c = new X509Certificate(input);
            setCert(c);
        } catch (e) {
            setError((e as Error).message);
        }
    };

    const copy = async (text: string, key: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    const expired = cert ? isExpired(cert.notAfter) : false;
    const days = cert ? daysUntil(cert.notAfter) : 0;

    const Row = ({ label, value, copyKey }: { label: string; value: string; copyKey?: string }) => (
        <div className="flex items-start gap-3 px-4 py-3 border-b last:border-b-0 even:bg-secondary/10">
            <span className="text-xs font-medium text-muted-foreground w-40 shrink-0 pt-0.5">{label}</span>
            <span className="font-mono text-xs flex-1 break-all">{value}</span>
            {copyKey && (
                <button onClick={() => copy(value, copyKey)} className="text-muted-foreground hover:text-primary transition-colors shrink-0">
                    {copied === copyKey ? <Check size={13} /> : <Copy size={13} />}
                </button>
            )}
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-background p-6 overflow-auto">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <ShieldCheck className="text-primary" /> Certificate Inspector
                </h2>
                <button onClick={() => { setPem(''); setCert(null); setError(null); }}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={20} /></button>
            </div>

            <div className="space-y-6 max-w-3xl mx-auto w-full">
                <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">PEM Certificate</label>
                        <button onClick={() => { setPem(SAMPLE_PEM); parse(SAMPLE_PEM); }}
                            className="text-[10px] text-primary hover:underline">Load Sample</button>
                    </div>
                    <textarea value={pem}
                        onChange={e => { setPem(e.target.value); parse(e.target.value); }}
                        placeholder="Paste a PEM certificate (-----BEGIN CERTIFICATE----- ...)"
                        className="w-full p-4 rounded-lg border bg-card font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
                        spellCheck={false} />
                </div>

                {error && (
                    <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-4 py-3">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
                    </div>
                )}

                {cert && (
                    <div className="space-y-6">
                        {/* Validity Banner */}
                        <div className={`flex items-center gap-3 p-4 rounded-xl border ${expired ? 'bg-red-500/10 border-red-500/30' : days < 30 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                            {expired ? <XCircle className="text-red-500" size={20} /> : <CheckCircle className="text-green-500" size={20} />}
                            <div>
                                <p className={`text-sm font-bold ${expired ? 'text-red-500' : 'text-green-500'}`}>
                                    {expired ? 'Certificate Expired' : `Valid · ${days} days remaining`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {expired ? `Expired ${Math.abs(days)} days ago` : `Expires ${formatDate(cert.notAfter)}`}
                                </p>
                            </div>
                        </div>

                        {/* Certificate Details */}
                        <div className="rounded-xl border overflow-hidden">
                            <div className="px-4 py-2 bg-secondary/30 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Subject</div>
                            <Row label="Common Name" value={cert.subject} copyKey="subj" />
                        </div>

                        <div className="rounded-xl border overflow-hidden">
                            <div className="px-4 py-2 bg-secondary/30 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Issuer</div>
                            <Row label="Issuer DN" value={cert.issuer} copyKey="issuer" />
                        </div>

                        <div className="rounded-xl border overflow-hidden">
                            <div className="px-4 py-2 bg-secondary/30 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Validity</div>
                            <Row label="Not Before" value={formatDate(cert.notBefore)} />
                            <Row label="Not After" value={formatDate(cert.notAfter)} />
                        </div>

                        <div className="rounded-xl border overflow-hidden">
                            <div className="px-4 py-2 bg-secondary/30 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Key Info</div>
                            <Row label="Algorithm" value={cert.signatureAlgorithm.name ?? 'Unknown'} />
                            <Row label="Serial Number" value={cert.serialNumber} copyKey="serial" />
                            <Row label="Version" value="v3 (X.509)" />
                        </div>

                        <div className="rounded-xl border overflow-hidden">
                            <div className="px-4 py-2 bg-secondary/30 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fingerprints</div>
                            <Row label="SHA-256" value={Array.from(new Uint8Array(cert.rawData)).slice(-32).map(b => b.toString(16).padStart(2, '0')).join(':').toUpperCase()} copyKey="fp" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
