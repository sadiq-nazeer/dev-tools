import { useState } from 'react';
import { FileJson, AlignLeft, Minimize2 } from 'lucide-react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { usePersistentState } from '../hooks/usePersistentState';
import { useToolPageMeta } from '../hooks/useToolPageMeta';
import Editor from '@monaco-editor/react';

export default function XmlFormatter() {
    const meta = useToolPageMeta();
    const [editorValue, setEditorValue] = usePersistentState<string>('xml_value', '');
    const [error, setError] = useState<string | null>(null);



    const handleFormat = () => {
        if (!editorValue) return;
        setError(null);
        try {
            // Very basic XML formatter logic
            const xml = editorValue.replace(/>\s*</g, '><').trim();
            let formatted = '';
            let indent = 0;
            const tab = '  ';
            const nodes = xml.match(/(<[^>]+>)/g);

            if (!nodes) throw new Error('Invalid XML');

            nodes.forEach(node => {
                if (node.match(/^<\/\w/)) {
                    indent--;
                }

                formatted += tab.repeat(Math.max(0, indent)) + node + '\n';

                if (node.match(/^<\w([^>]*[^/])?>$/) && !node.match(/^<\/\w/)) {
                    indent++;
                }
            });

            setEditorValue(formatted.trim());
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        }
    };

    const handleMinify = () => {
        if (!editorValue) return;
        setError(null);
        try {
            const minified = editorValue.replace(/>\s*</g, '><').trim();
            setEditorValue(minified);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        }
    };

    const handleXmlToJson = () => {
        if (!editorValue) return;
        setError(null);
        try {
            // This is a VERY simplified XML to JSON converter for basic structures
            const xml = editorValue;
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xml, "text/xml");

            const parseNode = (node: Node): unknown => {
                const obj: Record<string, unknown> = {};
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as Element;
                    if (element.attributes.length > 0) {
                        const attrs: Record<string, string | null> = {};
                        for (let j = 0; j < element.attributes.length; j++) {
                            const attribute = element.attributes.item(j);
                            if (attribute) attrs[attribute.nodeName] = attribute.nodeValue;
                        }
                        obj['@attributes'] = attrs;
                    }
                } else if (node.nodeType === Node.TEXT_NODE) {
                    return node.nodeValue;
                }

                if (node.hasChildNodes()) {
                    for (let i = 0; i < node.childNodes.length; i++) {
                        const item = node.childNodes.item(i);
                        const nodeName = item.nodeName;
                        if (nodeName === '#text') {
                            const val = item.nodeValue?.trim();
                            if (val) return val;
                            continue;
                        }
                        if (obj[nodeName] === undefined) {
                            obj[nodeName] = parseNode(item);
                        } else {
                            const cur = obj[nodeName];
                            if (!Array.isArray(cur)) {
                                obj[nodeName] = [cur, parseNode(item)];
                            } else {
                                cur.push(parseNode(item));
                            }
                        }
                    }
                }
                return obj;
            };

            const root = xmlDoc.firstChild;
            if (!root) throw new Error('Empty XML document');
            const json = parseNode(root);
            setEditorValue(JSON.stringify(json, null, 2));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            setError('Failed to convert to JSON: ' + msg);
        }
    };

    return (
        <ToolLayout
            title={meta?.label ?? 'XML Formatter'}
            description={meta?.desc}
            onCopy={() => navigator.clipboard.writeText(editorValue)}
            onClear={() => {
                setEditorValue('');
                setError(null);
            }}
            error={error}
            actions={
                <div className="flex gap-2">
                    <button
                        onClick={handleXmlToJson}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors"
                    >
                        <FileJson size={14} />
                        Convert to JSON
                    </button>
                    <button
                        onClick={handleMinify}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors"
                    >
                        <Minimize2 size={14} />
                        Minify
                    </button>
                    <button
                        onClick={handleFormat}
                        className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                        <AlignLeft size={14} />
                        Format XML
                    </button>
                </div>
            }
        >
            <div className="h-full w-full relative group">
                <Editor
                    height="100%"
                    defaultLanguage="xml"
                    value={editorValue}
                    onChange={(value) => {
                        setEditorValue(value || '');
                        if (error) setError(null);
                    }}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: 'on',
                        formatOnPaste: true,
                        formatOnType: true
                    }}
                />
            </div>
        </ToolLayout>
    );
}
