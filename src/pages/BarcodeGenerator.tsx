import { useState, useRef } from 'react';
import Barcode from 'react-barcode';
import {
    ScanLine,
    Download,
    Settings2,
    Share2
} from 'lucide-react';

export default function BarcodeGenerator() {
    const [value, setValue] = useState('123456789012');
    const [format, setFormat] = useState('CODE128');
    const [width, setWidth] = useState(2);
    const [height, setHeight] = useState(100);
    const [lineColor, setLineColor] = useState('#000000');
    const [background, setBackground] = useState('#ffffff');
    const [displayValue, setDisplayValue] = useState(true);
    const barcodeRef = useRef<HTMLDivElement>(null);

    const download = () => {
        const svg = barcodeRef.current?.querySelector('svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = svg.clientWidth || 300;
            canvas.height = svg.clientHeight || 150;
            if (ctx) {
                // Fill background
                ctx.fillStyle = background;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            }
            const pngFile = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = `barcode-${value}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    return (
        <div className="h-full flex flex-col bg-background p-6 overflow-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <ScanLine className="text-primary" size={28} />
                    <div>
                        <h2 className="text-2xl font-bold">Barcode Generator</h2>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Customizable 1D barcodes</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto w-full flex-1 min-h-0">
                <div className="space-y-6">
                    <div className="bg-card border rounded-2xl p-6 space-y-4 shadow-sm">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Barcode Value</label>
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="Enter value..."
                                className="w-full p-4 rounded-xl border bg-secondary/10 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Format</label>
                            <select
                                value={format}
                                onChange={(e) => setFormat(e.target.value)}
                                className="w-full p-4 rounded-xl border bg-secondary/10 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                            >
                                <option value="CODE128">CODE128 (Auto)</option>
                                <option value="EAN13">EAN-13</option>
                                <option value="EAN8">EAN-8</option>
                                <option value="UPC">UPC</option>
                                <option value="CODE39">CODE39</option>
                                <option value="ITF14">ITF-14</option>
                                <option value="pharmacode">Pharmacode</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Foreground</label>
                                <div className="flex items-center gap-2 p-2 bg-secondary/10 border rounded-xl">
                                    <input
                                        type="color"
                                        value={lineColor}
                                        onChange={(e) => setLineColor(e.target.value)}
                                        className="w-8 h-8 rounded cursor-pointer bg-transparent"
                                    />
                                    <span className="text-xs font-mono uppercase">{lineColor}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Background</label>
                                <div className="flex items-center gap-2 p-2 bg-secondary/10 border rounded-xl">
                                    <input
                                        type="color"
                                        value={background}
                                        onChange={(e) => setBackground(e.target.value)}
                                        className="w-8 h-8 rounded cursor-pointer bg-transparent"
                                    />
                                    <span className="text-xs font-mono uppercase">{background}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Settings2 size={12} /> Bar Width: {width}px
                                </label>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="4"
                                step="1"
                                value={width}
                                onChange={(e) => setWidth(parseInt(e.target.value))}
                                className="w-full accent-primary"
                            />
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Settings2 size={12} /> Height: {height}px
                                </label>
                            </div>
                            <input
                                type="range"
                                min="50"
                                max="150"
                                step="10"
                                value={height}
                                onChange={(e) => setHeight(parseInt(e.target.value))}
                                className="w-full accent-primary"
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-2 pb-4">
                            <input
                                type="checkbox"
                                id="displayValue"
                                checked={displayValue}
                                onChange={(e) => setDisplayValue(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                            />
                            <label htmlFor="displayValue" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Show Value Below Barcode
                            </label>
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
                            ref={barcodeRef}
                            className="p-8 bg-white rounded-2xl shadow-2xl group-hover:scale-105 transition-transform duration-500 overflow-x-auto max-w-full"
                        >
                            {value ? (
                                <Barcode
                                    value={value}
                                    format={format as any}
                                    width={width}
                                    height={height}
                                    lineColor={lineColor}
                                    background={background}
                                    displayValue={displayValue}
                                    margin={10}
                                />
                            ) : (
                                <div className="text-muted-foreground text-sm py-12 px-8 flex flex-col items-center gap-2">
                                    <ScanLine size={32} className="opacity-50" />
                                    Enter a value to generate barcode
                                </div>
                            )}
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
