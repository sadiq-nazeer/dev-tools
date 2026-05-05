import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import Ajv from 'ajv';
import { FileCode, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const ajv = new Ajv({ allErrors: true, strict: false });

const SAMPLE_SCHEMA = JSON.stringify({
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "required": ["name", "age", "email"],
    "properties": {
        "name": { "type": "string", "minLength": 1 },
        "age": { "type": "integer", "minimum": 0, "maximum": 150 },
        "email": { "type": "string", "format": "email" },
        "role": { "type": "string", "enum": ["admin", "user", "guest"] },
        "tags": { "type": "array", "items": { "type": "string" } }
    }
}, null, 2);

const SAMPLE_DATA = JSON.stringify({
    "name": "Alice",
    "age": 30,
    "email": "alice@example.com",
    "role": "admin",
    "tags": ["dev", "designer"]
}, null, 2);

interface ValidationError {
    path: string;
    message: string;
    schemaPath: string;
}

export default function JsonSchemaValidator() {
    const [schema, setSchema] = useState(SAMPLE_SCHEMA);
    const [data, setData] = useState(SAMPLE_DATA);
    const [errors, setErrors] = useState<ValidationError[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);
    const [valid, setValid] = useState<boolean | null>(null);

    useEffect(() => {
        validate();
    }, [schema, data]);

    const validate = () => {
        setParseError(null);
        setErrors([]);
        setValid(null);

        if (!schema.trim() || !data.trim()) return;

        let parsedSchema: unknown, parsedData: unknown;
        try { parsedSchema = JSON.parse(schema); }
        catch (e) { setParseError(`Schema: ${(e as Error).message}`); return; }
        try { parsedData = JSON.parse(data); }
        catch (e) { setParseError(`Data: ${(e as Error).message}`); return; }

        try {
            const validate = ajv.compile(parsedSchema as object);
            const isValid = validate(parsedData);
            setValid(isValid);
            if (!isValid && validate.errors) {
                setErrors(validate.errors.map(err => ({
                    path: err.instancePath || '(root)',
                    message: err.message ?? 'Unknown error',
                    schemaPath: err.schemaPath,
                })));
            }
        } catch (e) {
            setParseError(`Schema compilation: ${(e as Error).message}`);
        }
    };

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b bg-card">
                <div className="flex items-center gap-3">
                    <FileCode className="text-primary" size={20} />
                    <h2 className="font-bold text-lg">JSON Schema Validator</h2>
                </div>
                <div className="flex items-center gap-3">
                    {parseError && (
                        <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 px-3 py-1.5 rounded-lg">
                            <AlertCircle size={12} /> Parse error
                        </div>
                    )}
                    {valid === true && (
                        <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg font-medium">
                            <CheckCircle size={14} /> Valid
                        </div>
                    )}
                    {valid === false && (
                        <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 px-3 py-1.5 rounded-lg font-medium">
                            <XCircle size={14} /> {errors.length} error{errors.length !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
                {/* Editors */}
                <div className="flex-1 min-h-0 grid grid-cols-2 gap-0">
                    <div className="flex flex-col border-r">
                        <div className="px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary/20 border-b">JSON Schema</div>
                        <div className="flex-1 min-h-0">
                            <Editor height="100%" language="json" value={schema}
                                onChange={(v) => setSchema(v ?? '')}
                                theme="vs-dark"
                                options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, automaticLayout: true }} />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <div className="px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary/20 border-b">JSON Data</div>
                        <div className="flex-1 min-h-0">
                            <Editor height="100%" language="json" value={data}
                                onChange={(v) => setData(v ?? '')}
                                theme="vs-dark"
                                options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, automaticLayout: true }} />
                        </div>
                    </div>
                </div>

                {/* Validation Results */}
                <div className="border-t bg-background max-h-52 overflow-auto">
                    {parseError && (
                        <div className="flex items-start gap-2 p-4 text-sm text-destructive">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span className="font-mono">{parseError}</span>
                        </div>
                    )}
                    {valid === true && (
                        <div className="flex items-center gap-3 p-4 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle size={16} /> The data is valid against the schema.
                        </div>
                    )}
                    {valid === false && errors.length > 0 && (
                        <div className="divide-y">
                            {errors.map((err, i) => (
                                <div key={i} className="flex items-start gap-3 px-4 py-3">
                                    <XCircle size={14} className="text-destructive shrink-0 mt-0.5" />
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-mono font-bold text-destructive">{err.path}</p>
                                        <p className="text-xs text-muted-foreground">{err.message}</p>
                                        <p className="text-[10px] text-muted-foreground/50 font-mono">{err.schemaPath}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {valid === null && !parseError && (
                        <div className="p-4 text-sm text-muted-foreground">Enter schema and data to validate.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
