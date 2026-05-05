import { useState } from 'react';
import { ArrowLeftRight, Hash } from 'lucide-react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { useToolPageMeta } from '../hooks/useToolPageMeta';

export default function HtmlEntityConverter() {
    const meta = useToolPageMeta();
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [isEncoding, setIsEncoding] = useState(true);

    const encode = (str: string) => {
        return str.replace(/[\u00A0-\u9999<>&]/g, (i) => {
            return '&#' + i.charCodeAt(0) + ';';
        });
    };

    const decode = (str: string) => {
        const txt = document.createElement('textarea');
        txt.innerHTML = str;
        return txt.value;
    };

    const swap = () => {
        const nextMode = !isEncoding;
        const newInput = output;
        setIsEncoding(nextMode);
        setInput(newInput);
        if (nextMode) setOutput(encode(newInput));
        else setOutput(decode(newInput));
    };

    const clear = () => {
        setInput('');
        setOutput('');
    };

    const applyInput = (val: string) => {
        setInput(val);
        if (isEncoding) setOutput(encode(val));
        else setOutput(decode(val));
    };

    return (
        <ToolLayout
            title={meta?.label ?? 'HTML Entities'}
            description={meta?.desc}
            onCopy={() => {
                if (!output.trim()) return;
                return navigator.clipboard.writeText(output);
            }}
            onClear={clear}
            actions={
                <button
                    type="button"
                    onClick={swap}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors border"
                >
                    <ArrowLeftRight size={14} />
                    {isEncoding ? 'Decode mode' : 'Encode mode'}
                </button>
            }
        >
            <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full flex-1">
                    <div className="space-y-2 flex flex-col min-h-[280px]">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">
                            {isEncoding ? 'Text to Encode' : 'Entities to Decode'}
                        </label>
                        <textarea
                            value={input}
                            onChange={(e) => applyInput(e.target.value)}
                            placeholder={isEncoding ? 'Enter text like <script>...' : 'Enter entities like &#60;script&#62;...'}
                            className="flex-1 w-full p-4 rounded-xl border bg-card font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[280px] resize-none shadow-inner"
                        />
                    </div>

                    <div className="space-y-2 flex flex-col min-h-[280px]">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">
                            {isEncoding ? 'Encoded Entities' : 'Decoded Text'}
                        </label>
                        <div className="flex-1 relative min-h-[280px]">
                            <textarea
                                readOnly
                                value={output}
                                className="w-full h-full min-h-[280px] p-4 rounded-xl border bg-secondary/10 font-mono text-sm focus:outline-none resize-none"
                            />
                            {!output && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground/30 italic">
                                    Result will appear here...
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
                    <Hash className="text-primary shrink-0 mt-0.5" size={18} />
                    <div>
                        <h4 className="text-sm font-bold text-primary italic">Note on Conversion</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            This tool converts special characters to their numeric HTML entities (encoding) or parses entities back into readable text (decoding).
                            Useful for escaping characters in source code or debugging web responses.
                        </p>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
