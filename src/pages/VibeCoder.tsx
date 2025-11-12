"use client";

import React, { useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Code, Download, Eye, Play, Share2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import ThemeToggle from '@/components/ThemeToggle';
import { useAI } from '@/hooks/useAI';
import { supabase } from '@/integrations/supabase/client';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
// Heavy utilities are loaded on demand to cut initial bundle size
// import ThreeDCanvas from '@/components/ThreeDCanvas';

interface GeneratedCode {
  frontend: string;
  backend: string;
}

const VibeCoder = () => {
  const { user, isLoading, isProfileLoading } = useSession();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('Transform the website with a futuristic cyberpunk design featuring animated particles, custom cursor, side navigation, and smooth scroll effects. Add modern UI elements like horizontal scrolling feature cards, animated timeline, and interactive tabs for system requirements.');
  const [appName, setAppName] = useState('Unreal Engine 5.5');
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'frontend' | 'backend'>('frontend');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editorCode, setEditorCode] = useState<string>(`function App(){\n  return (<div style={{padding:20}}><h2>Hello NXE AI</h2><p>Edit code and click Run.</p></div>)\n}`);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [darkEditor, setDarkEditor] = useState<boolean>(() => {
    try { return document.documentElement.classList.contains('dark'); } catch { return true; }
  });
  const { aiAssist, aiExplain, aiFix } = useAI(user?.id);

  const buildSandboxHtml = React.useCallback((code: string) => {
    const isHtml = /<html|<!doctype/i.test(code);
    if (isHtml) return code;
    // Basic React+Babel sandbox for JSX/TSX snippets
    const safeName = appName || 'Preview';
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>${safeName}</title>
    <style>body{font-family:system-ui,sans-serif;padding:1rem;background:#f5f5f5;color:#111}#root{background:#fff;border:1px solid #ddd;padding:1rem;border-radius:8px;min-height:300px}</style>
    <script src="https://unpkg.com/react@17/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="text/babel">
      // User code
      ${code}
      const RootComponent = typeof App !== 'undefined' ? App : () => React.createElement('div', null, 'No App component found.');
      const rootEl = document.getElementById('root');
      ReactDOM.render(React.createElement(RootComponent), rootEl);
    </script>
  </body>
</html>`;
    return html;
  }, [appName]);

  React.useEffect(() => {
    if (generatedCode?.frontend) {
      const html = buildSandboxHtml(generatedCode.frontend);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [generatedCode, appName, buildSandboxHtml]);

  // Default preview reflecting the reference layout when no generated code exists
  React.useEffect(() => {
    if (!generatedCode) {
      const hero = `<!doctype html><html><head><meta charset="utf-8"/><title>${appName || 'Preview'}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <style>
        @keyframes drift{0%{transform:translateY(0)}50%{transform:translateY(-6px)}100%{transform:translateY(0)}}
        body{margin:0;background:#0b1120;color:#e2e8f0;font-family:Inter,system-ui,sans-serif}
        .bg{position:fixed;inset:0;background:radial-gradient(1200px 600px at 10% 20%, rgba(139,92,246,.15), transparent),radial-gradient(1200px 600px at 90% 80%, rgba(34,211,238,.15), transparent)}
        header{position:sticky;top:0;background:rgba(10,15,30,.6);backdrop-filter:blur(6px);border-bottom:1px solid rgba(148,163,184,.15)}
        nav{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:10px 16px}
        nav ul{display:flex;gap:20px;margin:0;padding:0;list-style:none}
        nav a{color:#cbd5e1;text-decoration:none;font-weight:500}
        nav a:hover{color:#22d3ee}
        .wrap{max-width:1200px;margin:0 auto;padding:28px 16px}
        .hero{display:flex;gap:24px;align-items:flex-start}
        .panel{flex:0 0 320px;background:#0f172a;border:1px solid rgba(148,163,184,.18);border-radius:16px;padding:16px}
        .panel h4{margin:0 0 8px 0;color:#cbd5e1}
        .panel p{font-size:14px;line-height:1.6;color:#94a3b8}
        .btns{display:flex;gap:8px;margin:12px 0}
        .btn{border:none;border-radius:999px;padding:10px 14px;font-weight:600;cursor:pointer}
        .boost{background:#22d3ee;color:#031522}
        .fix{background:#8b5cf6;color:white}
        .preview{flex:1;background:#0f172a;border:1px solid rgba(148,163,184,.18);border-radius:24px;overflow:hidden;position:relative}
        .grid{position:absolute;inset:0;background-image:radial-gradient(#22d3ee 1px, transparent 1px), radial-gradient(#8b5cf6 1px, transparent 1px);background-size:44px 44px, 64px 64px;opacity:.12}
        .content{position:relative;padding:36px}
        .brand{display:flex;align-items:center;gap:10px}
        .dot{width:10px;height:10px;border-radius:50%;background:#8b5cf6;box-shadow:0 0 12px #8b5cf6;animation:drift 3s ease-in-out infinite}
        h1{margin:12px 0 16px 0;font-size:48px;letter-spacing:.03em;background:linear-gradient(90deg,#8b5cf6,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        p{color:#94a3b8;max-width:820px}
        .cta{display:flex;gap:14px;margin-top:24px}
        .cta .primary{background:#22d3ee;color:#01242a}
        .cta .secondary{border:1px solid rgba(148,163,184,.25);color:#e2e8f0;background:transparent}
        .cta a{display:inline-block;text-decoration:none;border-radius:999px;padding:12px 18px;font-weight:700}
        .dots{position:absolute;right:18px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:12px}
        .dots span{width:10px;height:10px;border-radius:50%;background:#334155}
        .dots span.active{background:#22d3ee;box-shadow:0 0 8px #22d3ee}
      </style>
      </head>
      <body>
        <div class="bg"></div>
        <header>
          <nav>
            <strong style="color:#e2e8f0">UNREAL 5.5</strong>
            <ul>
              <li><a href="#">Features</a></li>
              <li><a href="#">Improvements</a></li>
              <li><a href="#">Requirements</a></li>
              <li><a href="#">Get Started</a></li>
              <li><a href="#">Resources</a></li>
            </ul>
          </nav>
        </header>
        <div class="wrap">
          <div class="hero">
            <aside class="panel">
              <h4>Edit</h4>
              <p>${prompt}</p>
              <div class="btns">
                <button class="btn boost">Boost</button>
                <button class="btn fix">Auto-Fix</button>
              </div>
            </aside>
            <section class="preview">
              <div class="grid"></div>
              <div class="content">
                <div class="brand"><div class="dot"></div><span style="color:#38bdf8;font-weight:700;letter-spacing:.2em">UNREAL 5.5</span></div>
                <h1>UNREAL ENGINE 5.5</h1>
                <p>Experience the next evolution in real-time 3D content creation with cutting-edge features, enhanced workflows, and industry-leading performance.</p>
                <div class="cta">
                  <a class="primary" href="#">Get Started</a>
                  <a class="secondary" href="#">Explore Features</a>
                </div>
                <div class="dots"><span class="active"></span><span></span><span></span><span></span><span></span></div>
              </div>
            </section>
          </div>
        </div>
      </body></html>`;
      const blob = new Blob([hero], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [generatedCode, appName, prompt]);

  // Collect console logs from the sandboxed iframe
  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const payload = event.data as any;
      if (payload && payload.type === 'console') {
        setConsoleLogs((logs) => [...logs, String(payload.data)].slice(-200));
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ dark: boolean }>).detail;
      if (detail && typeof detail.dark === 'boolean') setDarkEditor(detail.dark);
    };
    window.addEventListener('theme-toggle', handler as EventListener);
    return () => window.removeEventListener('theme-toggle', handler as EventListener);
  }, []);

  const runEditorCode = () => {
    setConsoleLogs([]);
    const html = `<!doctype html><html><head><meta charset=\"utf-8\"/><title>${appName || 'Preview'}</title>
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>
    <style>body{font-family:Inter,system-ui,sans-serif;margin:0;background:#0b1120;color:#e2e8f0}#root{padding:16px}</style>
    <script src=\"https://unpkg.com/react@17/umd/react.development.js\"></script>
    <script src=\"https://unpkg.com/react-dom@17/umd/react-dom.development.js\"></script>
    <script src=\"https://unpkg.com/@babel/standalone/babel.min.js\"></script>
    </head><body>
      <div id=\"root\"></div>
      <script>
        const originalLog = console.log;
        console.log = (...args) => { originalLog(...args); try { parent.postMessage({ type: 'console', data: args.map(a=>String(a)).join(' ') }, '*'); } catch(e){} };
      </script>
      <script type=\"text/babel\">${editorCode}\nconst RootComponent = typeof App !== 'undefined' ? App : () => React.createElement('div', null, 'No App component found.');\nReactDOM.render(React.createElement(RootComponent), document.getElementById('root'));</script>
    </body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
  };

  const formatCode = () => {
    try {
      const formatted = editorCode.replace(/\t/g, '  ').replace(/\s+$/gm, '').trim();
      setEditorCode(formatted);
      toast.success('Formatted');
    } catch {
      toast.error('Format failed');
    }
  };

  const doAIHelp = async () => {
    const result = await aiAssist(prompt, editorCode);
    if (result) setEditorCode(result);
  };

  const doExplain = async () => {
    const result = await aiExplain(editorCode);
    if (result) toast.info(result, { duration: 8000 });
  };

  const doFix = async () => {
    const lastError = consoleLogs.slice(-1)[0] || '';
    const result = await aiFix(editorCode, lastError);
    if (result) setEditorCode(result);
  };

  const handleBoost = () => {
    setPrompt((p) =>
      `${p}\n\nEnhance visuals with neon gradients, animated particles, custom cursor, smooth scrolling, and tidy spacing for a modern cyberpunk look.`
    );
    toast.success('Boost applied to your prompt.');
  };

  const handleAutoFix = () => {
    // Simulate a light lint/cleanup pass on the prompt
    const cleaned = prompt
      .replace(/\s{3,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    setPrompt(cleaned);
    toast.info('Prompt cleaned and normalized.');
  };

  const handleGenerateCode = async () => {
    if (!user) {
      toast.error("You must be logged in to generate code.");
      navigate('/login');
      return;
    }
    if (!prompt.trim()) {
      toast.error("Please enter a description for your app.");
      return;
    }
    if (prompt.trim().length > 2000) {
      toast.error("Description is too long. Please keep it under 2000 characters.");
      return;
    }
    if (!appName.trim()) {
      toast.error("Please enter an app name.");
      return;
      }

    setIsGenerating(true);
    setGeneratedCode(null);
    toast.info("Generating your app, this might take a moment...");

    try {
      const { data, error } = await supabase.functions.invoke('generate-code', {
        body: { prompt },
      });

      if (error) {
        console.error('Error invoking generate-code function:', error);
        toast.error("Failed to generate code: " + error.message);
        setGeneratedCode(null);
      } else if (data?.generatedCode) {
        const code = data.generatedCode as Partial<GeneratedCode>;
        if (typeof code.frontend !== 'string' || typeof code.backend !== 'string') {
          console.error('Malformed generatedCode payload:', code);
          toast.error("AI returned malformed code payload.");
          setGeneratedCode(null);
        } else {
          setGeneratedCode({ frontend: code.frontend, backend: code.backend });
        }
        toast.success("Code generated successfully!");

        // Save the generated project to Supabase
        const { error: saveError } = await supabase.from('user_projects').insert({
          user_id: user.id,
          name: appName.trim(),
          prompt: prompt.trim(),
          generated_code: code,
        });

        if (saveError) {
          console.error('Error saving project:', saveError);
          toast.error("Failed to save project: " + saveError.message);
        } else {
          toast.success("Project saved!");
        }
      } else {
        toast.error("AI did not return valid code.");
        setGeneratedCode(null);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Unexpected error during code generation:', err);
        toast.error("An unexpected error occurred: " + err.message);
      } else {
        console.error('Unexpected error during code generation:', err);
        toast.error("An unexpected error occurred.");
      }
      setGeneratedCode(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadCode = async () => {
    if (!generatedCode || !appName.trim()) {
      toast.error("No code to download or app name is missing.");
      return;
    }

    const frontend = generatedCode.frontend?.trim();
    const backend = generatedCode.backend?.trim();
    if (!frontend || !backend) {
      toast.error("Generated code is empty or malformed.");
      return;
    }

    let JSZip: any;
    let saveAs: (data: Blob, filename?: string) => void;
    try {
      JSZip = (await import('jszip')).default;
      ({ saveAs } = await import('file-saver'));
    } catch (err) {
      console.error('Failed to load download dependencies:', err);
      toast.error("Download dependencies failed to load. Please try again.");
      return;
    }

    const zip = new JSZip();
    const folderName = appName.trim().replace(/\s+/g, '-').toLowerCase();

    try {
      zip.file(`${folderName}/frontend/src/App.tsx`, frontend);
      zip.file(`${folderName}/backend/index.js`, backend);

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${folderName}.zip`);
      toast.success("Code downloaded successfully!");
    } catch (error) {
      console.error("Error zipping or downloading files:", error);
      toast.error("Failed to download code.");
    }
  };

  if (isLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading user session...</p>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Top toolbar */}
      <div className="sticky top-0 z-30 bg-white/70 dark:bg-gray-900/70 backdrop-blur border-b px-3 py-2 flex items-center gap-2">
        <Button size="sm" className="laser-button" onClick={runEditorCode}><Play className="mr-2 h-4 w-4"/> Run</Button>
        <Button size="sm" variant="outline" onClick={handleGenerateCode}><Code className="mr-2 h-4 w-4"/> Generate</Button>
        <Button size="sm" variant="outline" onClick={formatCode}><Code className="mr-2 h-4 w-4"/> Format</Button>
        <Button size="sm" variant="outline" onClick={doAIHelp}>AI Help</Button>
        <Button size="sm" variant="outline" onClick={doExplain}>Explain</Button>
        <Button size="sm" variant="outline" onClick={doFix}>Fix Error</Button>
        <Button size="sm" variant="secondary" onClick={handleDownloadCode}><Download className="mr-2 h-4 w-4"/> Save (ZIP)</Button>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>

      <Card className="w-full max-w-[1400px] mx-auto mt-4">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center laser-text tracking-wide">NXE AI — VibeCoder</CardTitle>
          <CardDescription className="text-center leading-relaxed">
            Describe your app and preview the result in real time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr,420px] gap-4">
            {/* Left sidebar */}
            <aside className="p-3 border rounded-xl bg-gray-50 dark:bg-gray-800/60 space-y-2">
              <div className="font-semibold text-sm mb-2">Navigation</div>
              <nav className="grid gap-1 text-sm">
                <Link to="/dashboard" className="hover:underline">Projects</Link>
                <Link to="/my-projects" className="hover:underline">Files</Link>
                <Link to="/ai-hub" className="hover:underline">AI Chat</Link>
                <Link to="/products" className="hover:underline">Products</Link>
                <Link to="/settings" className="hover:underline">Settings</Link>
              </nav>
            </aside>

            {/* Central editor panel */}
            <div className="space-y-4 p-4 border rounded-xl bg-gray-50 dark:bg-gray-800/60">
              <div className="space-y-2">
                <Label htmlFor="appName">App Name</Label>
                <Input
                  id="appName"
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="e.g., Unreal Engine 5.5"
                  disabled={isGenerating}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appPrompt">App Description</Label>
                <Textarea
                  id="appPrompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={8}
                  disabled={isGenerating}
                  required
                />
              </div>
              <div className="flex gap-2 mb-2">
                <Button variant="outline" onClick={handleBoost} title="Boost" className="laser-button"><span className="mr-2">⚡</span>Boost</Button>
                <Button variant="outline" onClick={handleAutoFix} title="Auto-Fix" className="laser-button">🛠️ Auto-Fix</Button>
              </div>
              <div className="space-y-2">
                <Label>Editor</Label>
                <div className="rounded-md overflow-hidden border">
                  <Editor
                    height="380px"
                    defaultLanguage="typescript"
                    theme={darkEditor ? 'vs-dark' : 'light'}
                    value={editorCode}
                    onChange={(v) => setEditorCode(v || '')}
                    options={{ fontSize: 14, minimap: { enabled: false }, smoothScrolling: true }}
                  />
                </div>
              </div>
              <Button onClick={handleGenerateCode} className="w-full laser-button" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Code className="mr-2 h-4 w-4" /> Generate Code
                  </>
                )}
              </Button>
            </div>

            {/* Right preview + console area */}
            <div className="rounded-xl overflow-hidden border bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between px-3 py-2 bg-muted dark:bg-gray-800/60 border-b">
                <span className="font-semibold flex items-center gap-2"><Eye className="h-4 w-4"/> App Preview</span>
                {previewUrl && (
                  <a className="text-sm underline" href={previewUrl} target="_blank" rel="noreferrer">Open in new tab</a>
                )}
              </div>
              {previewUrl ? (
                <iframe ref={iframeRef} title="Preview" src={previewUrl} className="w-full h-[380px]" sandbox="allow-scripts" />
              ) : (
                <div className="p-4 text-sm text-gray-700 dark:text-gray-300">No preview available.</div>
              )}

              {generatedCode && (
                <div className="border-t">
                  <div className="flex items-center gap-2 p-2">
                    <Button
                      variant={activeTab === 'frontend' ? 'default' : 'outline'}
                      onClick={() => setActiveTab('frontend')}
                      className="laser-button"
                    >
                      Frontend
                    </Button>
                    <Button
                      variant={activeTab === 'backend' ? 'default' : 'outline'}
                      onClick={() => setActiveTab('backend')}
                      className="laser-button"
                    >
                      Backend
                    </Button>
                    <Button onClick={handleDownloadCode} className="ml-auto laser-button">
                      <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                  </div>
                  <div className="relative rounded-md overflow-hidden">
                    <SyntaxHighlighter
                      language={activeTab === 'frontend' ? 'typescript' : 'javascript'}
                      style={dracula}
                      showLineNumbers
                      customStyle={{
                        padding: '1rem',
                        borderRadius: '0.375rem',
                        maxHeight: '300px',
                        overflowY: 'auto',
                      }}
                    >
                      {activeTab === 'frontend' ? generatedCode.frontend : generatedCode.backend}
                    </SyntaxHighlighter>
                  </div>
                </div>
              )}

              {/* Console logs */}
              <div className="border-t p-2 h-[140px] overflow-auto text-xs font-mono bg-gray-50 dark:bg-gray-800/50">
                {consoleLogs.length === 0 ? (
                  <p className="opacity-70">Console logs will appear here after Run.</p>
                ) : (
                  consoleLogs.map((l, i) => <div key={i}>$ {l}</div>)
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VibeCoder;
