import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
    QrCode,
    Download,
    Settings2,
    Share2
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function QrCodeGenerator() {
    const [value, setValue] = useState('https://dev-tools.io');
    const [size, setSize] = useState(256);
    const [fgColor, setFgColor] = useState('#000000');
    const [bgColor, setBgColor] = useState('#ffffff');
    const [level, setLevel] = useState<'L' | 'M' | 'Q' | 'H'>('H');
    const qrRef = useRef<HTMLDivElement>(null);

    const download = () => {
        const svg = qrRef.current?.querySelector('svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = size;
            canvas.height = size;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = 'qrcode.png';
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    return (
        <div className="h-full flex flex-col bg-background p-6 overflow-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <QrCode className="text-primary" size={28} />
                    <div>
                        <h2 className="text-2xl font-bold">QR Code Generator</h2>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Customizable QR codes</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto w-full flex-1 min-h-0">
                <div className="space-y-6">
                    <div className="bg-card border rounded-2xl p-6 space-y-4 shadow-sm">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">QR Content</label>
                            <textarea
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="Enter URL or text..."
                                className="w-full p-4 rounded-xl border bg-secondary/10 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px] resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Foreground</label>
                                <div className="flex items-center gap-2 p-2 bg-secondary/10 border rounded-xl">
                                    <input
                                        type="color"
                                        value={fgColor}
                                        onChange={(e) => setFgColor(e.target.value)}
                                        className="w-8 h-8 rounded cursor-pointer bg-transparent"
                                    />
                                    <span className="text-xs font-mono uppercase">{fgColor}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Background</label>
                                <div className="flex items-center gap-2 p-2 bg-secondary/10 border rounded-xl">
                                    <input
                                        type="color"
                                        value={bgColor}
                                        onChange={(e) => setBgColor(e.target.value)}
                                        className="w-8 h-8 rounded cursor-pointer bg-transparent"
                                    />
                                    <span className="text-xs font-mono uppercase">{bgColor}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Settings2 size={12} /> Size: {size}px
                                </label>
                            </div>
                            <input
                                type="range"
                                min="128"
                                max="512"
                                step="8"
                                value={size}
                                onChange={(e) => setSize(parseInt(e.target.value))}
                                className="w-full accent-primary"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Error Correction</label>
                            <div className="flex bg-secondary/20 rounded-lg p-1">
                                {(['L', 'M', 'Q', 'H'] as const).map((l) => (
                                    <button
                                        key={l}
                                        onClick={() => setLevel(l)}
                                        className={cn(
                                            "flex-1 py-2 text-xs font-bold rounded-md transition-all",
                                            level === l ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary/40"
                                        )}
                                    >
                                        {l === 'L' ? 'Low' : l === 'M' ? 'Medium' : l === 'Q' ? 'Quartile' : 'High'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={download}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                        >
                            <Download size={20} /> Download PNG
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-4 h-full min-h-[400px]">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Live Preview</span>
                    <div className="flex-1 border rounded-3xl bg-secondary/10 flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]" />
                        <div
                            ref={qrRef}
                            className="p-8 bg-white rounded-2xl shadow-2xl group-hover:scale-105 transition-transform duration-500"
                        >
                            <QRCodeSVG
                                value={value}
                                size={Math.min(size, 300)}
                                fgColor={fgColor}
                                bgColor={bgColor}
                                level={level}
                                includeMargin={true}
                            />
                        </div>
                        <div className="absolute bottom-4 right-4 text-[10px] items-center gap-1 font-bold text-muted-foreground uppercase flex tracking-widest">
                            Live Preview <Share2 size={12} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
