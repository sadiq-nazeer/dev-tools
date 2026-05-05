import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import {
    Terminal,
    Copy,
    Check,
    Trash2,
    Code2
} from 'lucide-react';
import { cn } from '../lib/utils';

type Language = 'javascript' | 'python' | 'go' | 'php';

export default function CurlToCode() {
    const [curl, setCurl] = useState('curl -X POST https://api.example.com/data \\\n  -H "Content-Type: application/json" \\\n  -d \'{"key": "value"}\'');
    const [output, setOutput] = useState('');
    const [language, setLanguage] = useState<Language>('javascript');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        generateCode();
    }, [curl, language]);

    const parseCurl = (input: string) => {
        const lines = input.replace(/\\\n/g, ' ').split(/\s+/);
        let method = 'GET';
        let url = '';
        const headers: Record<string, string> = {};
        let data = '';

        for (let i = 0; i < lines.length; i++) {
            const part = lines[i];
            if (part === '-X' || part === '--request') {
                method = lines[++i]?.replace(/['"]/g, '') || 'GET';
            } else if (part === '-H' || part === '--header') {
                const header = lines[++i];
                if (header) {
                    const [key, ...vals] = header.replace(/['"]/g, '').split(':');
                    headers[key.trim()] = vals.join(':').trim();
                }
            } else if (part === '-d' || part === '--data' || part === '--data-raw') {
                data = lines[++i]?.replace(/^['"]|['"]$/g, '') || '';
            } else if (part.startsWith('http')) {
                url = part.replace(/['"]/g, '');
            } else if (!url && part && !part.startsWith('-')) {
                if (part.includes('://')) url = part.replace(/['"]/g, '');
            }
        }

        return { method, url, headers, data };
    };

    const generateCode = () => {
        const { method, url, headers, data } = parseCurl(curl);
        if (!url) {
            setOutput('// Please enter a valid curl command with a URL');
            return;
        }

        let code = '';
        switch (language) {
            case 'javascript':
                code = `fetch("${url}", {
  method: "${method}",
  headers: ${JSON.stringify(headers, null, 2)},
  ${data ? `body: JSON.stringify(${data})` : ''}
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error(error));`;
                break;
            case 'python':
                code = `import requests

url = "${url}"
headers = ${JSON.stringify(headers, null, 4)}
${data ? `payload = ${data}` : 'payload = {}'}

response = requests.request("${method}", url, headers=headers, json=payload)

print(response.text)`;
                break;
            case 'go':
                code = `package main

import (
    "fmt"
    "net/http"
    "io/ioutil"
    "bytes"
)

func main() {
    url := "${url}"
    ${data ? `payload := []byte(\`${data}\`)` : 'payload := []byte(nil)'}

    req, _ := http.NewRequest("${method}", url, bytes.NewBuffer(payload))
    ${Object.entries(headers).map(([k, v]) => `req.Header.Add("${k}", "${v}")`).join('\n    ')}

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := ioutil.ReadAll(resp.Body)
    fmt.Println(string(body))
}`;
                break;
            case 'php':
                code = `<?php
$client = new \\GuzzleHttp\\Client();
$response = $client->request('${method}', '${url}', [
    'headers' => ${JSON.stringify(headers, null, 8)},
    ${data ? `'json' => ${data}` : ''}
]);

echo $response->getBody();`;
                break;
        }
        setOutput(code);
    };

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="h-full flex flex-col bg-background">
            <div className="flex items-center justify-between p-4 border-b bg-card">
                <div className="flex items-center gap-4">
                    <Terminal className="text-primary" size={24} />
                    <h2 className="text-xl font-bold">Curl to Code</h2>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-secondary/30 rounded-lg p-1">
                        {(['javascript', 'python', 'go', 'php'] as const).map((lang) => (
                            <button
                                key={lang}
                                onClick={() => setLanguage(lang)}
                                className={cn(
                                    "px-3 py-1 text-xs font-bold rounded-md transition-all",
                                    language === lang ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-secondary"
                                )}
                            >
                                {lang.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={copyToClipboard}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                    </button>
                    <button
                        onClick={() => setCurl('')}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0">
                <div className="border-r flex flex-col">
                    <div className="p-2 bg-secondary/10 border-b text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4">
                        Curl Command
                    </div>
                    <div className="flex-1">
                        <Editor
                            height="100%"
                            defaultLanguage="shell"
                            theme="vs-dark"
                            value={curl}
                            onChange={(v) => setCurl(v || '')}
                            options={{ minimap: { enabled: false }, fontSize: 13, padding: { top: 20 } }}
                        />
                    </div>
                </div>
                <div className="flex flex-col">
                    <div className="p-2 bg-secondary/10 border-b text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4 flex justify-between items-center">
                        Generated Code ({language})
                        <Code2 size={12} className="opacity-50" />
                    </div>
                    <div className="flex-1">
                        <Editor
                            height="100%"
                            defaultLanguage={language === 'php' ? 'php' : language}
                            theme="vs-dark"
                            value={output}
                            options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, padding: { top: 20 } }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
