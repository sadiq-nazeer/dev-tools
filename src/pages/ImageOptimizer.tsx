import { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import {
    Image,
    Upload,
    Trash2,
    Check,
    AlertCircle,
    FileDown,
    Zap
} from 'lucide-react';

export default function ImageOptimizer() {
    const [file, setFile] = useState<File | null>(null);
    const [compressing, setCompressing] = useState(false);
    const [optimizedUrl, setOptimizedUrl] = useState<string | null>(null);
    const [stats, setStats] = useState({ original: 0, optimized: 0, saving: 0 });
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            if (selected.size > 20 * 1024 * 1024) {
                setError('File size too large. Max 20MB.');
                return;
            }
            setFile(selected);
            setError(null);
            optimizeImage(selected);
        }
    };

    const optimizeImage = async (imageFile: File) => {
        setCompressing(true);
        setOptimizedUrl(null);
        try {
            const options = {
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                initialQuality: 0.8,
            };

            const compressedFile = await imageCompression(imageFile, options);
            const url = URL.createObjectURL(compressedFile);
            setOptimizedUrl(url);

            setStats({
                original: imageFile.size,
                optimized: compressedFile.size,
                saving: ((imageFile.size - compressedFile.size) / imageFile.size) * 100
            });
        } catch (e: any) {
            setError(e.message);
        } finally {
            setCompressing(false);
        }
    };

    const download = () => {
        if (!optimizedUrl) return;
        const a = document.createElement('a');
        a.href = optimizedUrl;
        a.download = `optimized_${file?.name}`;
        a.click();
    };

    const clear = () => {
        setFile(null);
        setOptimizedUrl(null);
        setStats({ original: 0, optimized: 0, saving: 0 });
        setError(null);
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="h-full flex flex-col bg-background p-6 overflow-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Image className="text-primary" size={28} />
                    <div>
                        <h2 className="text-2xl font-bold">Image Optimizer</h2>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Local compression for web</p>
                    </div>
                </div>
                {file && (
                    <button
                        onClick={clear}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                        <Trash2 size={20} />
                    </button>
                )}
            </div>

            <div className="max-w-4xl mx-auto w-full flex-1">
                {!file ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="h-[400px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-6 hover:bg-secondary/20 transition-all cursor-pointer group"
                    >
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <Upload size={32} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold mb-1">Click to upload image</h3>
                            <p className="text-sm text-muted-foreground">Supports PNG, JPG, WebP up to 20MB</p>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleUpload}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-fit">
                        {/* Comparison Card */}
                        <div className="space-y-6">
                            <div className="bg-card border rounded-2xl p-6 space-y-4 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Optimizing: {file.name}</span>
                                    {compressing ? <Zap size={16} className="text-yellow-500 animate-pulse" /> : <Check size={16} className="text-green-500" />}
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Original Size</span>
                                        <span className="font-bold font-mono">{formatSize(stats.original)}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: '100%' }} />
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Optimized Size</span>
                                        <span className="font-bold font-mono text-primary">{compressing ? 'Crunching...' : formatSize(stats.optimized)}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 transition-all duration-1000"
                                            style={{ width: compressing ? '0%' : `${(stats.optimized / stats.original) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {stats.saving > 0 && (
                                    <div className="pt-4 border-t flex flex-col items-center gap-1">
                                        <span className="text-[10px] font-bold text-green-500 uppercase">You saved</span>
                                        <span className="text-4xl font-extrabold text-green-500">{stats.saving.toFixed(1)}%</span>
                                    </div>
                                )}

                                <button
                                    onClick={download}
                                    disabled={!optimizedUrl || compressing}
                                    className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                >
                                    <FileDown size={20} /> Download Optimized
                                </button>
                            </div>

                            {error && (
                                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3">
                                    <AlertCircle size={20} />
                                    <p className="text-sm font-medium">{error}</p>
                                </div>
                            )}
                        </div>

                        {/* Preview Card */}
                        <div className="flex flex-col gap-4 h-full min-h-[400px]">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Live Preview</span>
                            <div className="flex-1 border rounded-3xl bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] relative overflow-hidden flex items-center justify-center shadow-inner">
                                {compressing ? (
                                    <div className="flex flex-col items-center gap-4 animate-pulse">
                                        <RefreshCw className="text-primary animate-spin" size={48} />
                                        <span className="text-sm font-bold text-primary">Compressing Locally...</span>
                                    </div>
                                ) : optimizedUrl ? (
                                    <img
                                        src={optimizedUrl}
                                        alt="Optimized Preview"
                                        className="max-w-full max-h-full object-contain p-4 drop-shadow-2xl"
                                    />
                                ) : null}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto w-full">
                <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-4 space-y-2">
                    <span className="text-[9px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">Privacy</span>
                    <h4 className="text-sm font-bold">100% Client-Side</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">Images never leave your computer. Processing happens in your browser.</p>
                </div>
                <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-4 space-y-2">
                    <span className="text-[9px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">Speed</span>
                    <h4 className="text-sm font-bold">Instant Results</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">High-speed compression using multi-threaded web workers.</p>
                </div>
                <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-4 space-y-2">
                    <span className="text-[9px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">Quality</span>
                    <h4 className="text-sm font-bold">Balanced Compression</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">Smart algorithms reduce web-friendly sizes while preserving visual detail.</p>
                </div>
            </div>
        </div>
    );
}

const RefreshCw = ({ className, size }: { className?: string, size?: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M3 21v-5h5" />
    </svg>
);
