import { useState, useRef } from 'react';
import {
    Image as ImageIcon,
    Upload,
    Trash2,
    Check,
    Copy,
    AlertCircle,
    ArrowRight
} from 'lucide-react';

export default function ImageToBase64() {
    const [file, setFile] = useState<File | null>(null);
    const [base64String, setBase64String] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            if (selected.size > 10 * 1024 * 1024) { // 10MB limit for base64 conversions typically
                setError('File size too large. Max 10MB.');
                return;
            }
            setFile(selected);
            setError(null);
            convertToBase64(selected);
        }
    };

    const convertToBase64 = (imageFile: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setBase64String(reader.result);
            } else {
                setError('Failed to convert image to Base64.');
            }
        };
        reader.onerror = () => {
            setError('Error reading file.');
        };
        reader.readAsDataURL(imageFile);
    };

    const clear = () => {
        setFile(null);
        setBase64String('');
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const copyToClipboard = async () => {
        if (!base64String) return;
        await navigator.clipboard.writeText(base64String);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                    <ImageIcon className="text-primary" size={28} />
                    <div>
                        <h2 className="text-2xl font-bold">Image to Base64</h2>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Encode image files to base64 strings</p>
                    </div>
                </div>
                {file && (
                    <button
                        onClick={clear}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                        title="Clear all"
                    >
                        <Trash2 size={20} />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] gap-4 items-center flex-1 min-h-[400px]">
                {/* Input Area */}
                <div className="flex flex-col h-full space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Input Image</label>
                    <div className="flex-1 border rounded-lg overflow-hidden flex flex-col items-center justify-center relative bg-card h-full min-h-[300px]">
                        {!file ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 border-2 border-dashed m-4 rounded-xl border-border/50 flex flex-col items-center justify-center gap-6 hover:bg-secondary/20 hover:border-primary/50 transition-all cursor-pointer group"
                            >
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Upload size={28} />
                                </div>
                                <div className="text-center px-4">
                                    <h3 className="text-lg font-bold mb-1">Click to upload image</h3>
                                    <p className="text-xs text-muted-foreground">Supports PNG, JPG, WebP, SVG, GIF up to 10MB</p>
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
                            <div className="absolute inset-0 flex flex-col">
                                <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] relative overflow-hidden flex items-center justify-center shadow-inner">
                                    <img
                                        src={base64String}
                                        alt="Preview"
                                        className="max-w-full max-h-full object-contain p-4 drop-shadow-2xl"
                                    />
                                </div>
                                <div className="p-4 border-t bg-secondary/20 flex justify-between items-center z-10">
                                    <div className="truncate pr-4">
                                        <p className="text-sm font-bold truncate" title={file.name}>{file.name}</p>
                                        <p className="text-xs text-muted-foreground">{formatSize(file.size)} &bull; {file.type}</p>
                                    </div>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-xs px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-md font-medium transition-colors whitespace-nowrap"
                                    >   
                                        Change Image
                                    </button>
                                     <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleUpload}
                                    />
                                </div>
                            </div>
                        )}
                        {error && (
                            <div className="absolute bottom-4 left-4 right-4 bg-destructive/10 backdrop-blur-md border border-destructive/20 text-destructive p-3 rounded-lg flex items-center gap-2 z-20">
                                <AlertCircle size={16} />
                                <p className="text-xs font-medium">{error}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Separator / Icon */}
                <div className="flex lg:flex-col gap-2 justify-center py-4 lg:py-0 text-muted-foreground opacity-50">
                     <ArrowRight size={24} className="hidden lg:block" />
                     <ArrowRight size={24} className="block lg:hidden rotate-90" />
                </div>

                {/* Output Area */}
                <div className="flex flex-col h-full space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Base64 Output</label>
                        <div className="flex items-center gap-3">
                            {base64String && (
                                <span className="text-xs text-muted-foreground mr-2 font-mono">
                                    {formatSize(base64String.length)}
                                </span>
                            )}
                            <button
                                onClick={copyToClipboard}
                                className="p-1 px-2 text-xs flex items-center gap-1.5 rounded bg-secondary hover:bg-secondary/80 transition-colors"
                                disabled={!base64String}
                            >
                                {copied ? <Check size={12} /> : <Copy size={12} />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>
                    <div className="relative flex-1">
                        <textarea
                            readOnly
                            value={base64String}
                            placeholder="Base64 string will appear here..."
                            className="w-full h-full p-4 rounded-lg border bg-secondary/30 resize-none font-mono text-sm focus:outline-none min-h-[300px]"
                        />
                    </div>
                </div>
            </div>
            
             <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-4 space-y-2">
                    <span className="text-[9px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">Format</span>
                    <h4 className="text-sm font-bold">Data URI Scheme</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">The output is prefixed with data:image/type;base64, making it ready to drop into an img src attribute or CSS background-image.</p>
                </div>
                <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-4 space-y-2">
                    <span className="text-[9px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">Privacy</span>
                    <h4 className="text-sm font-bold">100% Local Processing</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">Images never leave your browser. They are converted fully locally using the DOM FileReader API.</p>
                </div>
                 <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-4 space-y-2">
                    <span className="text-[9px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">Use Cases</span>
                    <h4 className="text-sm font-bold">When to use Base64</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">Best used for tiny icons, placeholders, or when you need to distribute an HTML snippet with embedded assets to avoid external requests.</p>
                </div>
            </div>
        </div>
    );
}
