import { useState } from 'react';
import { Network, Copy, Check } from 'lucide-react';

interface CidrInfo {
    networkAddress: string;
    broadcastAddress: string;
    subnetMask: string;
    firstHost: string;
    lastHost: string;
    totalHosts: number;
    usableHosts: number;
    prefix: number;
    ipClass: string;
    wildcardMask: string;
    binaryMask: string;
}

function ipToLong(ip: string): number {
    return ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct), 0) >>> 0;
}

function longToIp(long: number): string {
    return [(long >>> 24) & 255, (long >>> 16) & 255, (long >>> 8) & 255, long & 255].join('.');
}

function ipToBinary(ip: string): string {
    return ip.split('.').map(oct => parseInt(oct).toString(2).padStart(8, '0')).join('.');
}

function getIpClass(firstOctet: number): string {
    if (firstOctet < 128) return 'A';
    if (firstOctet < 192) return 'B';
    if (firstOctet < 224) return 'C';
    if (firstOctet < 240) return 'D (Multicast)';
    return 'E (Reserved)';
}

function calculateCidr(input: string): CidrInfo | null {
    const match = input.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/);
    if (!match) return null;

    const octets = [+match[1], +match[2], +match[3], +match[4]];
    const prefix = +match[5];

    if (octets.some(o => o > 255) || prefix > 32) return null;

    const maskLong = prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0;
    const ipLong = ipToLong(octets.join('.'));
    const networkLong = (ipLong & maskLong) >>> 0;
    const broadcastLong = (networkLong | (~maskLong >>> 0)) >>> 0;
    const totalHosts = Math.pow(2, 32 - prefix);
    const usableHosts = prefix >= 31 ? totalHosts : Math.max(0, totalHosts - 2);

    return {
        networkAddress: longToIp(networkLong),
        broadcastAddress: longToIp(broadcastLong),
        subnetMask: longToIp(maskLong),
        firstHost: prefix >= 31 ? longToIp(networkLong) : longToIp(networkLong + 1),
        lastHost: prefix >= 31 ? longToIp(broadcastLong) : longToIp(broadcastLong - 1),
        totalHosts,
        usableHosts,
        prefix,
        ipClass: getIpClass(octets[0]),
        wildcardMask: longToIp(~maskLong >>> 0),
        binaryMask: ipToBinary(longToIp(maskLong)),
    };
}

const EXAMPLES = ['192.168.1.0/24', '10.0.0.0/8', '172.16.0.0/12', '192.168.100.14/30'];

export default function CidrCalculator() {
    const [input, setInput] = useState('');
    const [copied, setCopied] = useState<string | null>(null);

    const info = calculateCidr(input);
    const hasInput = input.trim().length > 0;

    const copy = async (text: string, key: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    const rows: { label: string; value: string; key: string }[] = info ? [
        { label: 'Network Address', value: info.networkAddress, key: 'net' },
        { label: 'Broadcast Address', value: info.broadcastAddress, key: 'bcast' },
        { label: 'Subnet Mask', value: info.subnetMask, key: 'mask' },
        { label: 'Wildcard Mask', value: info.wildcardMask, key: 'wild' },
        { label: 'First Usable Host', value: info.firstHost, key: 'first' },
        { label: 'Last Usable Host', value: info.lastHost, key: 'last' },
        { label: 'Usable Hosts', value: info.usableHosts.toLocaleString(), key: 'uhosts' },
        { label: 'Total Addresses', value: info.totalHosts.toLocaleString(), key: 'thosts' },
        { label: 'IP Class', value: `Class ${info.ipClass}`, key: 'class' },
        { label: 'Binary Mask', value: info.binaryMask, key: 'binmask' },
        { label: 'CIDR Notation', value: `${info.networkAddress}/${info.prefix}`, key: 'cidr' },
    ] : [];

    return (
        <div className="h-full flex flex-col bg-background p-6 overflow-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Network className="text-primary" /> IP / CIDR Calculator
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Enter an IP address with prefix length to calculate subnet details.</p>
            </div>

            <div className="space-y-6 max-w-2xl mx-auto w-full">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">IP Address / CIDR</label>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="e.g. 192.168.1.0/24"
                        className="w-full p-4 rounded-lg border bg-card font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        spellCheck={false}
                    />
                    <div className="flex gap-2 flex-wrap">
                        {EXAMPLES.map(ex => (
                            <button
                                key={ex}
                                onClick={() => setInput(ex)}
                                className="text-[10px] font-mono px-2 py-1 rounded border bg-secondary/30 hover:bg-primary/10 hover:border-primary/40 transition-colors"
                            >
                                {ex}
                            </button>
                        ))}
                    </div>
                </div>

                {hasInput && !info && (
                    <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
                        Invalid format. Use dotted-decimal notation with a prefix, e.g. <span className="font-mono">192.168.1.0/24</span>
                    </p>
                )}

                {info && (
                    <div className="rounded-xl border overflow-hidden">
                        {rows.map((row, i) => (
                            <div key={row.key} className={`flex items-center justify-between px-4 py-3 ${i % 2 === 0 ? 'bg-secondary/10' : ''} border-b last:border-b-0`}>
                                <span className="text-xs font-medium text-muted-foreground w-44 shrink-0">{row.label}</span>
                                <span className="font-mono text-sm flex-1 break-all">{row.value}</span>
                                <button
                                    onClick={() => copy(row.value, row.key)}
                                    className="ml-3 text-muted-foreground hover:text-primary transition-colors shrink-0"
                                >
                                    {copied === row.key ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
