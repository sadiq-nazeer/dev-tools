import {
    FileJson,
    FileText,
    StickyNote,
    Binary,
    Link as LinkIcon,
    Clock,
    ShieldCheck,
    Fingerprint,
    KeyRound,
    Database,
    Ruler,
    Palette,
    Columns,
    Search,
    Type,
    Terminal,
    Code,
    Globe,
    FileCode,
    Users,
    FileImageIcon,
    Image as ImageIcon,
    QrCode,
    ScanLine,
    Calendar,
    Monitor,
    FileEdit,
    FileSpreadsheet,
    CaseSensitive,
    Hash,
    Network,
    Lock,
    Eye,
    Table2,
    Settings,
    LucideIcon
} from 'lucide-react';

export interface ToolItem {
    to: string;
    icon: LucideIcon;
    label: string;
    desc: string;
    category: string;
}

export interface ToolGroup {
    title: string;
    items: Omit<ToolItem, 'category'>[];
}

export const toolGroups: ToolGroup[] = [
    {
        title: 'General',
        items: [
            { to: '/notepad', icon: FileText, label: 'Notepad', desc: 'A loose-leaf scratchpad for quick notes and text.' },
            { to: '/notes', icon: StickyNote, label: 'Notes', desc: 'A powerful notes app with categorizing and search.' },
            { to: '/json', icon: FileJson, label: 'JSON Formatter', desc: 'Prettify and format JSON data with error detection.' },
            { to: '/xml', icon: FileCode, label: 'XML Formatter', desc: 'Prettify, minify, and convert XML to JSON.' },
            { to: '/string-case', icon: CaseSensitive, label: 'String Case', desc: 'Convert text between camelCase, snake_case, kebab-case, and more.' }
        ]
    },
    {
        title: 'Envelop/Convert',
        items: [
            { to: '/base64', icon: Binary, label: 'Base64', desc: 'Encode and decode strings/files to/from Base64.' },
            { to: '/image-base64', icon: ImageIcon, label: 'Image to Base64', desc: 'Convert images to Base64 strings for direct embedding.' },
            { to: '/url', icon: LinkIcon, label: 'URL Encoder', desc: 'Encode and decode strings for safe URL usage.' },
            { to: '/timestamp', icon: Clock, label: 'Timestamp', desc: 'Convert between Unix timestamps and human-readable dates.' },
            { to: '/number-base', icon: Hash, label: 'Number Base', desc: 'Convert numbers between Binary, Octal, Decimal, and Hex.' },
        ]
    },
    {
        title: 'Security',
        items: [
            { to: '/jwt', icon: ShieldCheck, label: 'JWT Debugger', desc: 'Inspect and decode JSON Web Tokens instantly.' },
            { to: '/jwt-builder', icon: ShieldCheck, label: 'JWT Builder', desc: 'Build and sign JWT tokens with HS256/384/512 HMAC algorithms.' },
            { to: '/cert', icon: ShieldCheck, label: 'Cert Inspector', desc: 'Parse PEM certificates to view subject, issuer, expiry, and fingerprints.' },
            { to: '/chmod', icon: Lock, label: 'Chmod Calc', desc: 'Visual Unix file permission builder with octal and symbolic output.' },
            { to: '/uuid', icon: Fingerprint, label: 'UUID Gen', desc: 'Generate unique identifiers (v4) in bulk.' },
            { to: '/hash', icon: KeyRound, label: 'Hash Gen', desc: 'Generate secure MD5, SHA-1, SHA-256, and SHA-512 hashes.' },
            { to: '/hmac', icon: KeyRound, label: 'HMAC Gen', desc: 'Generate secure HMAC hashes with different algorithms.' },
            { to: '/rsa', icon: KeyRound, label: 'RSA Key Gen', desc: 'Generate secure public/private RSA key pairs.' },
            { to: '/password', icon: ShieldCheck, label: 'Password Gen', desc: 'Secure, local password generator with entropy stats.' },
        ]
    },
    {
        title: 'Network & API',
        items: [
            { to: '/api-client', icon: Globe, label: 'API Client', desc: 'A lightweight REST client for testing endpoints.' },
            { to: '/cidr', icon: Network, label: 'CIDR Calc', desc: 'Calculate subnet details from an IP/CIDR block.' },
            { to: '/curl', icon: Terminal, label: 'Curl to Code', desc: 'Convert curl commands to JS, Python, Go, or PHP code.' },
            { to: '/html-entities', icon: Code, label: 'HTML Entities', desc: 'Encode and decode HTML entities safely.' },
            { to: '/http-status', icon: Globe, label: 'HTTP Status', desc: 'Searchable database of HTTP status codes and meanings.' },
        ]
    },
    {
        title: 'Data & Types',
        items: [
            { to: '/json-to-ts', icon: FileCode, label: 'JSON to TS', desc: 'Generate TypeScript interfaces from JSON objects.' },
            { to: '/dummy-data', icon: Users, label: 'Dummy Data', desc: 'Generate mock data for users, companies, and more.' },
            { to: '/csv-json', icon: FileSpreadsheet, label: 'CSV ↔ JSON', desc: 'Convert between CSV data and JSON arrays.' },
            { to: '/yaml-json', icon: FileJson, label: 'YAML ↔ JSON', desc: 'Bi-directional conversion between YAML and JSON.' },
            { to: '/toml-json', icon: FileJson, label: 'TOML ↔ JSON', desc: 'Bi-directional conversion between TOML and JSON.' },
            { to: '/json-schema', icon: FileCode, label: 'Schema Validator', desc: 'Validate JSON data against a JSON Schema with per-field errors.' },
        ]
    },
    {
        title: 'Web Dev',
        items: [
            { to: '/sql', icon: Database, label: 'SQL Formatter', desc: 'Format SQL queries for better readability across dialects.' },
            { to: '/wcag', icon: Eye, label: 'Contrast Checker', desc: 'Check color contrast ratios against WCAG AA/AAA standards.' },
            { to: '/gradient', icon: Palette, label: 'Gradient Gen', desc: 'Build linear, radial, and conic CSS gradients visually.' },
            { to: '/palette', icon: Palette, label: 'Palette Gen', desc: 'Generate complementary, triadic, and analogous color palettes.' },
            { to: '/units', icon: Ruler, label: 'Unit Converter', desc: 'Convert between px, rem, em, and percentages.' },
            { to: '/color', icon: Palette, label: 'Color Picker', desc: 'A visual tool for color selection and format conversion.' },
            { to: '/shadow', icon: Palette, label: 'CSS Shadow', desc: 'Visual generator for complex CSS box-shadows.' },
            { to: '/layout', icon: Columns, label: 'Flex/Grid', desc: 'Interactive playground for CSS layout debugging.' },
        ]
    },
    {
        title: 'Analysis',
        items: [
            { to: '/diff', icon: Columns, label: 'Diff Viewer', desc: 'Professional side-by-side text comparison.' },
            { to: '/ascii', icon: Table2, label: 'ASCII Table', desc: 'Searchable ASCII/Unicode reference with hex, binary, and HTML entities.' },
            { to: '/regex', icon: Search, label: 'RegEx Tester', desc: 'Interactive playground for testing regular expressions.' },
            { to: '/analyzer', icon: Type, label: 'Text Analyzer', desc: 'Dashboard for comprehensive text statistics and analysis.' },
        ]
    },
    {
        title: 'Optimization',
        items: [
            { to: '/svg-compress', icon: FileImageIcon, label: 'SVG Compress', desc: 'Minify and optimize SVG files for web use.' },
            { to: '/image-optimize', icon: ImageIcon, label: 'Image Optimizer', desc: 'Compress JPG, PNG, and WebP images locally.' },
            { to: '/qrcode', icon: QrCode, label: 'QR Generator', desc: 'Create and customize QR codes with PNG export.' },
            { to: '/barcode', icon: ScanLine, label: 'Barcode Generator', desc: 'Create and customize 1D barcodes with PNG export.' },
        ]
    },
    {
        title: 'Productivity',
        items: [
            { to: '/cron', icon: Calendar, label: 'Cron Builder', desc: 'Build and parse cron expressions into human text.' },
            { to: '/markdown', icon: Monitor, label: 'Markdown Live', desc: 'Real-time Markdown editor with live GitHub-style preview.' },
            { to: '/changelog', icon: FileEdit, label: 'Changelog Gen', desc: 'Generate standardized release notes and changelogs.' },
            { to: '/settings', icon: Settings, label: 'App Settings', desc: 'Export, import, or clear all DevTools data.' },
        ]
    },
];

export const allTools: ToolItem[] = toolGroups.flatMap(group =>
    group.items.map(item => ({ ...item, category: group.title }))
);

/** Resolve catalog label + description for a tool route (e.g. `/json`). */
export function getToolByPath(path: string): Pick<ToolItem, 'label' | 'desc'> | undefined {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    const tool = allTools.find((t) => t.to === normalized);
    return tool ? { label: tool.label, desc: tool.desc } : undefined;
}

/** Same matching rules as the command palette: label, description, and category. */
export function toolMatchesSearch(
    rawQuery: string,
    tool: Pick<ToolItem, 'label' | 'desc' | 'category'>
): boolean {
    const q = rawQuery.trim().toLowerCase();
    if (!q) return true;
    return (
        tool.label.toLowerCase().includes(q) ||
        tool.desc.toLowerCase().includes(q) ||
        tool.category.toLowerCase().includes(q)
    );
}
