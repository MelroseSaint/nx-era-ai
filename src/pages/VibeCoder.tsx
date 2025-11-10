"use client";

import React, { useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Code, Download, Eye } from 'lucide-react';
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
  const [prompt, setPrompt] = useState('');
  const [appName, setAppName] = useState('');
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'frontend' | 'backend'>('frontend');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-900 p-4">
      {/* Theme toggle temporarily disabled until ThemeProvider is restored */}
      <Card className="w-full max-w-4xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center laser-text tracking-wide">NXE AI — VibeCoder</CardTitle>
          <CardDescription className="text-center leading-relaxed">
            Describe your app in natural language, and let AI generate the code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 3D canvas temporarily disabled to avoid runtime errors in dev */}
          <div className="space-y-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white laser-text tracking-wide">Describe Your App</h3>
            <div className="space-y-2">
              <Label htmlFor="appName">App Name</Label>
              <Input
                id="appName"
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g., My Todo App"
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
                placeholder="Describe the app you want to build, e.g., 'A simple task manager with user authentication and a list of tasks.'"
                rows={5}
                disabled={isGenerating}
                required
              />
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

          {generatedCode && (
            <div className="space-y-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white laser-text tracking-wide">Generated Code & Preview</h3>
              <div className="flex space-x-2">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative rounded-md overflow-hidden">
                  <SyntaxHighlighter
                    language={activeTab === 'frontend' ? 'typescript' : 'javascript'}
                    style={dracula}
                    showLineNumbers
                    customStyle={{
                      padding: '1rem',
                      borderRadius: '0.375rem',
                      maxHeight: '500px',
                      overflowY: 'auto',
                    }}
                  >
                    {activeTab === 'frontend' ? generatedCode.frontend : generatedCode.backend}
                  </SyntaxHighlighter>
                </div>
                <div className="rounded-md overflow-hidden border bg-white">
                  <div className="flex items-center justify-between px-3 py-2 bg-muted">
                    <span className="font-semibold flex items-center gap-2"><Eye className="h-4 w-4"/> App Preview</span>
                    {previewUrl && (
                      <a className="text-sm underline" href={previewUrl} target="_blank" rel="noreferrer">Open in new tab</a>
                    )}
                  </div>
                  {previewUrl ? (
                    <iframe title="Preview" src={previewUrl} className="w-full h-[500px]" />
                  ) : (
                    <div className="p-4 text-sm text-gray-700">No preview available.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VibeCoder;
