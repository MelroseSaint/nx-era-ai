"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Loader2, Save, Code, Download } from 'lucide-react';
// Heavy utilities are loaded on demand to reduce initial bundle size

interface GeneratedCode {
  frontend: string;
  backend: string;
}

interface UserProject {
  id: string;
  user_id: string;
  name: string;
  prompt: string;
  generated_code: GeneratedCode | null;
  created_at: string;
  updated_at: string;
}

const ProjectDetails = () => {
  const { user, isLoading, isProfileLoading } = useSession();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<UserProject | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [editName, setEditName] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'frontend' | 'backend'>('frontend');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    } else if (user && projectId) {
      fetchProjectDetails(projectId);
    }
  }, [user, isLoading, navigate, projectId]);

  const fetchProjectDetails = async (id: string) => {
    setLoadingProject(true);
    const { data, error } = await supabase
      .from('user_projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user?.id) // Ensure user can only view their own projects
      .single();

    if (error) {
      toast.error("Failed to fetch project details: " + error.message);
      navigate('/my-projects'); // Redirect if project not found or access denied
    } else if (data) {
      setProject(data);
      setEditName(data.name);
      setEditPrompt(data.prompt);
    }
    setLoadingProject(false);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !project || !editName.trim() || !editPrompt.trim()) {
      toast.error("Project name and prompt cannot be empty.");
      return;
    }

    setIsUpdatingProject(true);
    const { error } = await supabase
      .from('user_projects')
      .update({ name: editName.trim(), prompt: editPrompt.trim(), updated_at: new Date().toISOString() })
      .eq('id', project.id)
      .eq('user_id', user.id);

    if (error) {
      toast.error("Failed to update project: " + error.message);
    } else {
      await fetchProjectDetails(project.id); // Re-fetch to update local state
      toast.success("Project updated successfully!");
    }
    setIsUpdatingProject(false);
  };

  const handleRegenerateCode = async () => {
    if (!user || !project || !editPrompt.trim()) {
      toast.error("Prompt cannot be empty for regeneration.");
      return;
    }

    setIsGenerating(true);
    toast.info("Re-generating code, this might take a moment...");

    try {
      const { data, error } = await supabase.functions.invoke('generate-code', {
        body: { prompt: editPrompt.trim() },
      });

      if (error) {
        console.error('Error invoking generate-code function:', error);
        toast.error("Failed to re-generate code: " + error.message);
      } else if (data?.generatedCode) {
        const newCode = data.generatedCode as GeneratedCode;
        
        // Update the project with new code
        const { error: updateError } = await supabase.from('user_projects').update({
          generated_code: newCode,
          updated_at: new Date().toISOString(),
        }).eq('id', project.id).eq('user_id', user.id);

        if (updateError) {
          console.error('Error saving regenerated code:', updateError);
          toast.error("Failed to save regenerated code: " + updateError.message);
        } else {
          await fetchProjectDetails(project.id); // Re-fetch to update local state with new code
          toast.success("Code re-generated and saved successfully!");
        }
      } else {
        toast.error("AI did not return valid code during regeneration.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Unexpected error during code regeneration:', err);
        toast.error("An unexpected error occurred during regeneration: " + err.message);
      } else {
        console.error('Unexpected error during code regeneration:', err);
        toast.error("An unexpected error occurred during regeneration.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const buildSandboxHtml = React.useCallback((code: string) => {
    const isHtml = /<html|<!doctype/i.test(code);
    if (isHtml) return code;
    const safeName = (project?.name || 'Preview');
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
      ${code}
      const RootComponent = typeof App !== 'undefined' ? App : () => React.createElement('div', null, 'No App component found.');
      const rootEl = document.getElementById('root');
      ReactDOM.render(React.createElement(RootComponent), rootEl);
    </script>
  </body>
</html>`;
    return html;
  }, [project?.name]);

  React.useEffect(() => {
    if (project?.generated_code?.frontend) {
      const html = buildSandboxHtml(project.generated_code.frontend);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [project?.generated_code?.frontend, buildSandboxHtml]);

  const handleDownloadProjectCode = async () => {
    if (!project?.generated_code || !project.name.trim()) {
      toast.error("No code to download or project name is missing.");
      return;
    }
    const JSZip = (await import('jszip')).default;
    const { saveAs } = await import('file-saver');
    const zip = new JSZip();
    const folderName = project.name.trim().replace(/\s+/g, '-').toLowerCase();

    zip.file(`${folderName}/frontend/src/App.tsx`, project.generated_code.frontend);
    zip.file(`${folderName}/backend/index.js`, project.generated_code.backend);

    try {
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${folderName}.zip`);
      toast.success("Project code downloaded successfully!");
    } catch (error) {
      console.error("Error zipping or downloading files:", error);
      toast.error("Failed to download project code.");
    }
  };

  const highlighterStyle = React.useMemo(() => ({
    padding: '1rem',
    borderRadius: '0.375rem',
    maxHeight: '500px',
    overflowY: 'auto',
  }), []);

  if (isLoading || isProfileLoading || loadingProject || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Project Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">The project you are looking for does not exist or you do not have access.</p>
            <Button onClick={() => navigate('/my-projects')}>Back to My Projects</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-4xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Project: {project.name}</CardTitle>
          <CardDescription className="text-center">
            Details and code for your generated application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleUpdateProject} className="space-y-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Project Details</h3>
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isUpdatingProject}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectPrompt">Project Prompt</Label>
              <Textarea
                id="projectPrompt"
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                rows={5}
                disabled={isUpdatingProject}
                required
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="submit" className="flex-grow" disabled={isUpdatingProject}>
                <Save className="mr-2 h-4 w-4" /> {isUpdatingProject ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-grow"
                onClick={handleRegenerateCode}
                disabled={isGenerating || isUpdatingProject}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Re-generating...
                  </>
                ) : (
                  <>
                    <Code className="mr-2 h-4 w-4" /> Re-generate Code
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="space-y-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Generated Code & Preview</h3>
            <div className="flex space-x-2">
              <Tabs value={activeCodeTab} onValueChange={(value) => setActiveCodeTab(value as 'frontend' | 'backend')}>
                <TabsList>
                  <TabsTrigger value="frontend">Frontend</TabsTrigger>
                  <TabsTrigger value="backend">Backend</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button onClick={handleDownloadProjectCode} className="ml-auto">
                <Download className="mr-2 h-4 w-4" /> Download Project
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative rounded-md overflow-hidden">
                <SyntaxHighlighter
                  language={activeCodeTab === 'frontend' ? 'typescript' : 'javascript'}
                  style={dracula}
                  showLineNumbers
                  customStyle={highlighterStyle}
                >
                  {activeCodeTab === 'frontend' ? project.generated_code?.frontend || '// No frontend code generated' : project.generated_code?.backend || '// No backend code generated'}
                </SyntaxHighlighter>
              </div>
              <div className="rounded-md overflow-hidden border bg-white">
                <div className="flex items-center justify-between px-3 py-2 bg-muted">
                  <span className="font-semibold">App Preview</span>
                  {previewUrl && (
                    <a className="text-sm underline" href={previewUrl} target="_blank" rel="noreferrer">Open in new tab</a>
                  )}
                </div>
                {previewUrl ? (
                  <iframe title="Preview" src={previewUrl} className="w-full h-[500px]" sandbox="allow-scripts" />
                ) : (
                  <div className="p-4 text-sm text-gray-700">No preview available.</div>
                )}
              </div>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={() => navigate('/my-projects')}>
            Back to My Projects
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDetails;
