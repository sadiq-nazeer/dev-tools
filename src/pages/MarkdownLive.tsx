import { useState, useEffect } from 'react';
import { marked } from 'marked';
import Editor from '@monaco-editor/react';
import {
    FileText,
    Trash2,
    Maximize2,
    Eye,
    Code2,
    Monitor
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function MarkdownLive() {
    const [markdown, setMarkdown] = useState('# Hello World\n\nThis is a **live** markdown preview.\n\n### Features\n- Real-time preview\n- Monaco editor with highlighting\n- GitHub style alerts\n\n> [!TIP]\n> You can use this for drafting READMEs or documentation!\n\n```javascript\nfunction greet() {\n  console.log("Hello from DevTools!");\n}\n```');
    const [html, setHtml] = useState('');
    const [isPreviewOnly, setIsPreviewOnly] = useState(false);

    useEffect(() => {
        const render = async () => {
            const rawHtml = await marked.parse(markdown);
            setHtml(rawHtml);
        };
        render();
    }, [markdown]);

    const clear = () => setMarkdown('');

    return (
        <div className="h-full flex flex-col bg-background">
            <div className="flex items-center justify-between p-4 border-b bg-card">
                <div className="flex items-center gap-4">
                    <FileText className="text-primary" size={24} />
                    <h2 className="text-xl font-bold">Markdown Live</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsPreviewOnly(!isPreviewOnly)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                            isPreviewOnly ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                        )}
                    >
                        {isPreviewOnly ? <Monitor size={16} /> : <Maximize2 size={16} />}
                        {isPreviewOnly ? 'Show Editor' : 'Preview Only'}
                    </button>

                    <div className="h-6 w-px bg-border mx-1" />

                    <button
                        onClick={clear}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex min-h-0">
                {!isPreviewOnly && (
                    <div className="flex-1 border-r flex flex-col">
                        <div className="p-2 bg-secondary/10 border-b text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4 flex justify-between items-center">
                            Markdown Editor
                            <Code2 size={12} className="opacity-50" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <Editor
                                height="100%"
                                defaultLanguage="markdown"
                                theme="vs-dark"
                                value={markdown}
                                onChange={(v) => setMarkdown(v || '')}
                                options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on', padding: { top: 20 } }}
                            />
                        </div>
                    </div>
                )}
                <div className={cn("flex flex-col bg-white dark:bg-[#0d1117]", isPreviewOnly ? "w-full" : "flex-1")}>
                    <div className="p-2 bg-secondary/10 border-b text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4 flex justify-between items-center">
                        Preview
                        <Eye size={12} className="opacity-50" />
                    </div>
                    <div className="flex-1 overflow-auto p-8 md:p-12">
                        <div
                            className={[
                                'prose prose-slate dark:prose-invert max-w-none',
                                // Headings
                                'prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-6 prose-h1:mt-0 prose-h1:pb-3 prose-h1:border-b prose-h1:border-border',
                                'prose-h2:text-2xl prose-h2:font-semibold prose-h2:mb-4 prose-h2:mt-8 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border',
                                'prose-h3:text-xl prose-h3:font-semibold prose-h3:mb-3 prose-h3:mt-6',
                                'prose-h4:text-base prose-h4:font-semibold prose-h4:mb-2 prose-h4:mt-4',
                                // Body text
                                'prose-p:leading-7 prose-p:mb-4',
                                'prose-li:leading-7',
                                'prose-ul:my-4 prose-ol:my-4',
                                // Code
                                'prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none',
                                'prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:p-4 prose-pre:my-4',
                                'prose-pre:overflow-x-auto',
                                // Blockquote
                                'prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:not-italic',
                                // Table
                                'prose-table:w-full prose-th:text-left prose-th:font-semibold',
                                // Links
                                'prose-a:text-primary prose-a:underline-offset-4',
                                // HR
                                'prose-hr:border-border prose-hr:my-6',
                            ].join(' ')}
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
