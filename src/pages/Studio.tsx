import React from 'react';
import { Editor } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { buildSandboxHtml, makeSandboxUrl } from '@/utils/sandbox';
import { Download, Play, Eye, Terminal, Save, Share2, Bot } from 'lucide-react';
import AIAssistantPanel from '@/components/AIAssistantPanel';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type FileNode = {
  path: string;
  content: string;
};

const initialFiles: FileNode[] = [
  { path: 'index.html', content: `<!doctype html><html><head><meta charset="utf-8"/><title>App</title></head><body><h1>Hello NXE</h1><div id="app"></div></body></html>` },
  { path: 'styles.css', content: `body{font-family:Inter, system-ui; padding:1rem}` },
  { path: 'script.js', content: `const el = document.getElementById('app'); el.textContent = 'Ready to code!'; console.log('App started');` },
];

const languageFromPath = (path: string) => {
  if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript';
  if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript';
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.html')) return 'html';
  return 'plaintext';
};

export default function Studio() {
  const { user, isLoading } = useSession();
  const navigate = useNavigate();
  const [files, setFiles] = React.useState<FileNode[]>(initialFiles);
  const [activePath, setActivePath] = React.useState<string>(initialFiles[0].path);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [consoleLines, setConsoleLines] = React.useState<string[]>([]);
  const [projectName, setProjectName] = React.useState<string>('My NXE Project');
  const [assistantOpen, setAssistantOpen] = React.useState<boolean>(false);

  const activeFile = files.find(f => f.path === activePath)!;

  React.useEffect(() => {
    const handler = (e: MessageEvent) => {
      const data = e.data;
      if (data?.type === 'console') {
        setConsoleLines(prev => [...prev, `[${data.level}] ${data.args.join(' ')}`].slice(-500));
      } else if (data?.type === 'error') {
        setConsoleLines(prev => [...prev, `[error] ${data.message}`].slice(-500));
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const updateFile = (path: string, content: string) => {
    setFiles(prev => prev.map(f => (f.path === path ? { ...f, content } : f)));
  };

  // Autosave to localStorage
  React.useEffect(() => {
    const payload = JSON.stringify({ files, projectName });
    const t = setTimeout(() => localStorage.setItem('nxera-studio', payload), 300);
    return () => clearTimeout(t);
  }, [files, projectName]);

  React.useEffect(() => {
    const raw = localStorage.getItem('nxera-studio');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.files)) setFiles(parsed.files);
        if (typeof parsed.projectName === 'string') setProjectName(parsed.projectName);
      } catch {}
    }
  }, []);

  const run = () => {
    const html = files.find(f => f.path === 'index.html')?.content || '';
    const css = files.find(f => f.path === 'styles.css')?.content || '';
    const js = files.find(f => f.path === 'script.js')?.content || '';
    const full = buildSandboxHtml({ html, css, js, title: 'NXE Preview' });
    const url = makeSandboxUrl(full);
    setPreviewUrl(url);
    setConsoleLines([]);
  };

  const addFile = () => {
    const name = prompt('New file name (e.g., new.js)');
    if (!name) return;
    if (files.some(f => f.path === name)) return alert('File exists');
    const node: FileNode = { path: name, content: '' };
    setFiles(prev => [...prev, node]);
    setActivePath(name);
  };

  const renameFile = (path: string) => {
    const name = prompt('Rename file', path);
    if (!name || name === path) return;
    if (files.some(f => f.path === name)) return alert('Target exists');
    setFiles(prev => prev.map(f => (f.path === path ? { ...f, path: name } : f)));
    setActivePath(name);
  };

  const deleteFile = (path: string) => {
    if (!confirm(`Delete ${path}?`)) return;
    setFiles(prev => prev.filter(f => f.path !== path));
    if (activePath === path && files.length > 1) setActivePath(files[0].path);
  };

  const handleDownload = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const { saveAs } = await import('file-saver');
      const zip = new JSZip();
      files.forEach(f => zip.file(f.path, f.content));
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, 'nxe-project.zip');
    } catch (err) {
      console.error('Zip error', err);
    }
  };

  const saveToCloud = async () => {
    try {
      // Build a single HTML document and store as generated_code.frontend for compatibility
      const html = files.find(f => f.path === 'index.html')?.content || '';
      const css = files.find(f => f.path === 'styles.css')?.content || '';
      const js = files.find(f => f.path === 'script.js')?.content || '';
      const full = buildSandboxHtml({ html, css, js, title: projectName.trim() || 'NXE Project' });
      const payload = { name: projectName.trim(), generated_code: { frontend: full, backend: '/* Studio backend not used */' } };
      const { data, error } = await supabase.from('user_projects').insert(payload).select().single();
      if (error) throw error;
      setProjectName(data.name);
      toastSuccess('Saved to cloud');
    } catch (e: any) {
      toastError('Save failed: ' + (e?.message || 'Unknown'));
    }
  };

  const createShare = async () => {
    try {
      // Build a single HTML document and store as generated_code.frontend for compatibility
      const html = files.find(f => f.path === 'index.html')?.content || '';
      const css = files.find(f => f.path === 'styles.css')?.content || '';
      const js = files.find(f => f.path === 'script.js')?.content || '';
      const full = buildSandboxHtml({ html, css, js, title: projectName.trim() || 'NXE Project' });
      const payload = { name: projectName.trim(), generated_code: { frontend: full, backend: '/* Studio backend not used */' }, is_shared: true };
      const { data, error } = await supabase.from('user_projects').insert(payload).select().single();
      if (error) throw error;
      const shareUrl = `${window.location.origin}/share/${data.id}`;
      navigator.clipboard?.writeText(shareUrl);
      toastSuccess('Share URL copied to clipboard');
    } catch (e: any) {
      toastError('Share failed: ' + (e?.message || 'Unknown'));
    }
  };

  const toastSuccess = (m: string) => {
    try { const { toast } = require('sonner'); toast.success(m); } catch { console.log(m); }
  };
  const toastError = (m: string) => {
    try { const { toast } = require('sonner'); toast.error(m); } catch { console.error(m); }
  };

  // Access gating for guests and loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-lg text-foreground">Loading Studio...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md mx-auto bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Sign in to use Studio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center">The web IDE is available to registered users.</p>
            <div className="mt-3 flex gap-3">
              <Button className="bg-primary text-primary-foreground w-full" onClick={() => navigate('/login')}>Sign in</Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold laser-text tracking-wide">NXE Studio</h1>
            <input className="border rounded px-2 py-1 text-sm" value={projectName} onChange={(e)=>setProjectName(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button onClick={run} className="laser-button"><Play className="h-4 w-4 mr-1"/> Run</Button>
            <Button onClick={saveToCloud} variant="secondary"><Save className="h-4 w-4 mr-1"/> Save</Button>
            <Button onClick={createShare} variant="secondary"><Share2 className="h-4 w-4 mr-1"/> Share</Button>
            <Button onClick={()=>setAssistantOpen(v=>!v)} variant="outline"><Bot className="h-4 w-4 mr-1"/> AI</Button>
            <Button onClick={handleDownload} variant="secondary" className="laser-button"><Download className="h-4 w-4 mr-1"/> Deploy (ZIP)</Button>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* File Tree + Editor */}
        <div className="lg:col-span-2 rounded-md border bg-card">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <div className="flex gap-2 items-center">
              <span className="font-semibold">Files</span>
              <Button size="sm" onClick={addFile}>New</Button>
            </div>
            <div className="text-sm text-muted-foreground">{activePath}</div>
          </div>
          <div className="grid grid-cols-12">
            <aside className="col-span-4 border-r border-border max-h-[480px] overflow-auto bg-card text-card-foreground">
              <ul>
                {files.map(f => (
                  <li key={f.path} className={`flex items-center justify-between px-3 py-2 cursor-pointer ${activePath===f.path?'bg-muted':''}`}
                      onClick={() => setActivePath(f.path)}>
                    <span>{f.path}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={(e)=>{e.stopPropagation(); renameFile(f.path);}}>Rename</Button>
                      <Button size="sm" variant="ghost" onClick={(e)=>{e.stopPropagation(); deleteFile(f.path);}}>Delete</Button>
                    </div>
                  </li>
                ))}
              </ul>
            </aside>
            <section className="col-span-8">
              <Editor
                height="480px"
                theme="vs-dark"
                language={languageFromPath(activeFile.path)}
                value={activeFile.content}
                onChange={(v) => updateFile(activeFile.path, v || '')}
                options={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, roundedSelection: true, minimap: { enabled: false } }}
              />
            </section>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-md border border-border bg-card">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="font-semibold flex items-center gap-2"><Eye className="h-4 w-4"/> Preview</span>
          </div>
          {previewUrl ? (
            <iframe title="Preview" src={previewUrl} className="w-full h-[480px]" sandbox="allow-scripts" />
          ) : (
            <div className="p-4 text-sm text-muted-foreground">Click Run to render your app.</div>
          )}
        </div>
        {/* Assistant */}
        {assistantOpen && (
          <div className="lg:col-span-3">
            <AIAssistantPanel
              getActiveCode={() => activeFile?.content || ''}
              applyToActiveFile={(newContent) => updateFile(activeFile.path, newContent)}
            />
          </div>
        )}
      </div>

      {/* Console */}
      <div className="rounded-md border border-border bg-card">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <Terminal className="h-4 w-4"/>
          <span className="font-semibold">Console</span>
          <Button size="sm" variant="ghost" onClick={()=>setConsoleLines([])} className="ml-auto">Clear</Button>
        </div>
        <div className="p-3 text-sm max-h-[200px] overflow-auto font-mono">
          {consoleLines.length === 0 ? (
            <div className="text-muted-foreground">No output yet.</div>
          ) : (
            <ul>
              {consoleLines.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
  </div>
  );
}
