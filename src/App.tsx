import { lazy, Suspense, useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ThemeProvider } from './components/ui/theme-provider';
import { Layout } from './components/layout/Layout';
import { DashboardClocks } from './components/dashboard/DashboardClocks';
import { RecentlyUsedProvider } from './context/recently-used-context';
import { useRecentlyUsedPaths } from './hooks/useRecentlyUsedPaths';
import { toolGroups, allTools, toolMatchesSearch, type ToolItem } from './lib/tools';
import { Loader2, ArrowRight, Search, History } from 'lucide-react';
import { cn } from './lib/utils';

// Lazy load pages
const JsonFormatter = lazy(() => import('./pages/JsonFormatter'));
const Notepad = lazy(() => import('./pages/Notepad'));
const Notes = lazy(() => import('./pages/Notes'));
const Base64Converter = lazy(() => import('./pages/Base64Converter'));
const ImageToBase64 = lazy(() => import('./pages/ImageToBase64'));
const UrlEncoder = lazy(() => import('./pages/UrlEncoder'));
const UnixTimestamp = lazy(() => import('./pages/UnixTimestamp'));
const JwtDebugger = lazy(() => import('./pages/JwtDebugger'));
const UuidGenerator = lazy(() => import('./pages/UuidGenerator'));
const HashGenerator = lazy(() => import('./pages/HashGenerator'));
const SqlFormatter = lazy(() => import('./pages/SqlFormatter'));
const CssUnitConverter = lazy(() => import('./pages/CssUnitConverter'));
const ColorPicker = lazy(() => import('./pages/ColorPicker'));
const DiffViewer = lazy(() => import('./pages/DiffViewer'));
const RegexTester = lazy(() => import('./pages/RegexTester'));
const TextAnalyzer = lazy(() => import('./pages/TextAnalyzer'));
const CurlToCode = lazy(() => import('./pages/CurlToCode'));
const HtmlEntityConverter = lazy(() => import('./pages/HtmlEntityConverter'));
const HttpStatusCodes = lazy(() => import('./pages/HttpStatusCodes'));
const JsonToTypeScript = lazy(() => import('./pages/JsonToTypeScript'));
const DummyDataGenerator = lazy(() => import('./pages/DummyDataGenerator'));
const YamlJsonConverter = lazy(() => import('./pages/YamlJsonConverter'));
const SvgCompressor = lazy(() => import('./pages/SvgCompressor'));
const ImageOptimizer = lazy(() => import('./pages/ImageOptimizer'));
const QrCodeGenerator = lazy(() => import('./pages/QrCodeGenerator'));
const BarcodeGenerator = lazy(() => import('./pages/BarcodeGenerator'));
const CronExpression = lazy(() => import('./pages/CronExpression'));
const MarkdownLive = lazy(() => import('./pages/MarkdownLive'));
const ChangelogGenerator = lazy(() => import('./pages/ChangelogGenerator'));
const PasswordGenerator = lazy(() => import('./pages/PasswordGenerator'));
const CsvJsonConverter = lazy(() => import('./pages/CsvJsonConverter'));
const ApiClient = lazy(() => import('./pages/ApiClient'));
const XmlFormatter = lazy(() => import('./pages/XmlFormatter'));
const RsaKeyGenerator = lazy(() => import('./pages/RsaKeyGenerator'));
const HmacGenerator = lazy(() => import('./pages/HmacGenerator'));
const BoxShadowGenerator = lazy(() => import('./pages/BoxShadowGenerator'));
const LayoutPlayground = lazy(() => import('./pages/LayoutPlayground'));
const StringCaseConverter = lazy(() => import('./pages/StringCaseConverter'));
const NumberBaseConverter = lazy(() => import('./pages/NumberBaseConverter'));
const ChmodCalculator = lazy(() => import('./pages/ChmodCalculator'));
const CidrCalculator = lazy(() => import('./pages/CidrCalculator'));
const WcagContrastChecker = lazy(() => import('./pages/WcagContrastChecker'));
const AsciiTable = lazy(() => import('./pages/AsciiTable'));
const CssGradientGenerator = lazy(() => import('./pages/CssGradientGenerator'));
const ColorPaletteGenerator = lazy(() => import('./pages/ColorPaletteGenerator'));
const AppSettings = lazy(() => import('./pages/AppSettings'));
const TomlJsonConverter = lazy(() => import('./pages/TomlJsonConverter'));
const JsonSchemaValidator = lazy(() => import('./pages/JsonSchemaValidator'));
const JwtBuilder = lazy(() => import('./pages/JwtBuilder'));
const CertificateInspector = lazy(() => import('./pages/CertificateInspector'));

// Loading component
const PageLoader = () => (
  <div className="h-full w-full flex items-center justify-center p-12">
    <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
  </div>
);

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const recentPaths = useRecentlyUsedPaths();

  const recentTools = useMemo(() => {
    return recentPaths
      .map(to => allTools.find(t => t.to === to))
      .filter((t): t is ToolItem => t != null);
  }, [recentPaths]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return toolGroups;

    const query = searchQuery;
    return toolGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          toolMatchesSearch(query, { ...item, category: group.title })
        ),
      }))
      .filter(group => group.items.length > 0);
  }, [searchQuery]);

  const searching = Boolean(searchQuery.trim());
  const toolCount = toolGroups.reduce((acc, g) => acc + g.items.length, 0);

  return (
  <div className="min-h-full w-full bg-background overflow-auto pb-16 text-center py-5 px-4 sm:px-8 lg:px-10 xl:px-12 space-y-8 max-w-7xl xl:max-w-[90rem] 2xl:max-w-[min(100%,104rem)] mx-auto">
    <header className="w-full animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="w-full rounded-2xl border border-border/60 bg-gradient-to-b from-card/90 to-card/40 px-4 py-4 sm:px-5 sm:py-5 shadow-sm shadow-black/[0.06] ring-1 ring-white/[0.04] dark:shadow-black/40 dark:ring-white/[0.06]">
        <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-3 sm:gap-y-1">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-[2.5rem] md:leading-none bg-gradient-to-r from-primary via-sky-500 to-blue-600 bg-clip-text text-transparent">
            DevTools
          </h1>
          <span className="hidden h-4 w-px bg-border/70 sm:block" aria-hidden />
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground sm:text-left">
            Local toolkit
          </p>
        </div>
        <p className="mt-2 text-sm leading-snug text-muted-foreground sm:text-[15px] sm:leading-relaxed">
          <span className="font-semibold tabular-nums text-foreground">{toolCount}</span>
          <span className="mx-1 text-border">·</span>
          Fast utilities that stay on your machine.
        </p>
        <div className="relative mt-3 group">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-[17px] -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
            strokeWidth={2}
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search name, category, or description…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="h-10 w-full rounded-xl border border-border/70 bg-background/80 py-0 pl-10 pr-3 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground/80 focus-visible:border-primary/45 focus-visible:ring-2 focus-visible:ring-primary/15 dark:bg-background/50"
            aria-label="Search tools"
          />
        </div>
      </div>
    </header>

    <DashboardClocks />

    {!searching && recentTools.length > 0 && (
      <div className="max-w-7xl xl:max-w-[90rem] 2xl:max-w-[min(100%,104rem)] mx-auto w-full space-y-4 text-left animate-in fade-in duration-700">
        <div className="flex items-center gap-2 px-1">
          <History className="text-muted-foreground" size={14} aria-hidden />
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
            Recently used
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4 lg:gap-5 xl:grid-cols-8 xl:gap-3">
          {recentTools.map(tool => (
            <Link
              key={tool.to}
              to={tool.to}
              className="group flex min-h-0 min-w-0 flex-col rounded-2xl border bg-card p-4 transition-all duration-300 hover:bg-secondary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 xl:rounded-xl xl:p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="p-2 bg-primary/10 text-primary rounded-lg transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground xl:p-1.5">
                  <tool.icon className="size-[18px] xl:size-4" strokeWidth={2} />
                </div>
                <ArrowRight className="text-muted-foreground opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shrink-0 mt-1" size={14} />
              </div>
              <p className="mt-3 text-sm font-bold group-hover:text-primary transition-colors line-clamp-2 xl:mt-2 xl:text-xs xl:leading-snug">
                {tool.label}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-1 truncate xl:text-[9px]">
                {tool.category}
              </p>
            </Link>
          ))}
        </div>
      </div>
    )}

    {/* Categories Grid */}
    <div className="space-y-16 xl:space-y-14 2xl:space-y-16">
      {filteredGroups.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground animate-in fade-in">
           <Search className="mx-auto mb-4 opacity-20" size={48} />
           <p className="text-lg">No tools found for "{searchQuery}"</p>
        </div>
      ) : (
      filteredGroups.map((group, groupIdx) => (
        <div key={group.title} className={cn("space-y-6 animate-in fade-in duration-1000", `delay-${groupIdx * 50}`)}>
          <div className="flex items-center gap-4">
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] px-1 whitespace-nowrap">
              {group.title}
            </h2>
            <div className="h-px w-full bg-gradient-to-r from-border to-transparent" />
          </div>

          <div className="grid max-sm:grid-cols-1 gap-5 md:gap-6 sm:[grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]">
            {group.items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group relative bg-card hover:bg-secondary/40 border rounded-2xl p-5 md:p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
              >
                <div className="flex flex-col h-full space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                      <item.icon size={22} />
                    </div>
                    <ArrowRight className="text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" size={16} />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <h3 className="text-base font-bold group-hover:text-primary transition-colors duration-300">
                      {item.label}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="absolute inset-0 rounded-2xl border-2 border-primary/0 group-hover:border-primary/5 transition-colors pointer-events-none" />
              </Link>
            ))}
          </div>
        </div>
      ))
      )}
    </div>

    {/* Footer */}
    <div className="py-12 text-center text-muted-foreground text-[10px] uppercase tracking-[0.2em] border-t border-border/50">
      DevTools Dashboard &bull; {new Date().getFullYear()} &bull; Professional Edition
    </div>
  </div>
  );
};

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <RecentlyUsedProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/json" element={<JsonFormatter />} />
              <Route path="/notepad" element={<Notepad />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/base64" element={<Base64Converter />} />
              <Route path="/image-base64" element={<ImageToBase64 />} />
              <Route path="/url" element={<UrlEncoder />} />
              <Route path="/timestamp" element={<UnixTimestamp />} />
              <Route path="/jwt" element={<JwtDebugger />} />
              <Route path="/uuid" element={<UuidGenerator />} />
              <Route path="/hash" element={<HashGenerator />} />
              <Route path="/sql" element={<SqlFormatter />} />
              <Route path="/units" element={<CssUnitConverter />} />
              <Route path="/color" element={<ColorPicker />} />
              <Route path="/diff" element={<DiffViewer />} />
              <Route path="/regex" element={<RegexTester />} />
              <Route path="/analyzer" element={<TextAnalyzer />} />

              {/* New Routes */}
              <Route path="/curl" element={<CurlToCode />} />
              <Route path="/html-entities" element={<HtmlEntityConverter />} />
              <Route path="/http-status" element={<HttpStatusCodes />} />
              <Route path="/json-to-ts" element={<JsonToTypeScript />} />
              <Route path="/dummy-data" element={<DummyDataGenerator />} />
              <Route path="/yaml-json" element={<YamlJsonConverter />} />
              <Route path="/svg-compress" element={<SvgCompressor />} />
              <Route path="/image-optimize" element={<ImageOptimizer />} />
              <Route path="/qrcode" element={<QrCodeGenerator />} />
              <Route path="/barcode" element={<BarcodeGenerator />} />
              <Route path="/cron" element={<CronExpression />} />
              <Route path="/markdown" element={<MarkdownLive />} />
              <Route path="/changelog" element={<ChangelogGenerator />} />
              <Route path="/password" element={<PasswordGenerator />} />
              <Route path="/csv-json" element={<CsvJsonConverter />} />
              <Route path="/api-client" element={<ApiClient />} />
              <Route path="/xml" element={<XmlFormatter />} />
              <Route path="/rsa" element={<RsaKeyGenerator />} />
              <Route path="/hmac" element={<HmacGenerator />} />
              <Route path="/shadow" element={<BoxShadowGenerator />} />
              <Route path="/layout" element={<LayoutPlayground />} />
              <Route path="/string-case" element={<StringCaseConverter />} />
              <Route path="/number-base" element={<NumberBaseConverter />} />
              <Route path="/chmod" element={<ChmodCalculator />} />
              <Route path="/cidr" element={<CidrCalculator />} />
              <Route path="/wcag" element={<WcagContrastChecker />} />
              <Route path="/ascii" element={<AsciiTable />} />
              <Route path="/gradient" element={<CssGradientGenerator />} />
              <Route path="/palette" element={<ColorPaletteGenerator />} />
              <Route path="/settings" element={<AppSettings />} />
              <Route path="/toml-json" element={<TomlJsonConverter />} />
              <Route path="/json-schema" element={<JsonSchemaValidator />} />
              <Route path="/jwt-builder" element={<JwtBuilder />} />
              <Route path="/cert" element={<CertificateInspector />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
        </RecentlyUsedProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
