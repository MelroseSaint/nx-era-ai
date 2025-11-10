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
import { MadeWithDyad } from '@/components/made-with-dyad';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Loader2, Code, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
        const code = data.generatedCode as GeneratedCode;
        setGeneratedCode(code);
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
    } catch (error: any) {
      console.error('Unexpected error during code generation:', error);
      toast.error("An unexpected error occurred: " + error.message);
      setGeneratedCode(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadCode = () => {
    if (!generatedCode || !appName.trim()) {
      toast.error("No code to download or app name is missing.");
      return;
    }

    const zip = new (window as any).JSZip(); // JSZip will be added as a dependency later for actual zipping

    // For now, we'll just create text files
    const frontendBlob = new Blob([generatedCode.frontend], { type: 'text/plain' });
    const backendBlob = new Blob([generatedCode.backend], { type: 'text/plain' });

    const frontendUrl = URL.createObjectURL(frontendBlob);
    const backendUrl = URL.createObjectURL(backendBlob);

    const frontendLink = document.createElement('a');
    frontendLink.href = frontendUrl;
    frontendLink.download = `${appName.trim()}-frontend.tsx`;
    document.body.appendChild(frontendLink);
    frontendLink.click();
    document.body.removeChild(frontendLink);
    URL.revokeObjectURL(frontendUrl);

    const backendLink = document.createElement('a');
    backendLink.href = backendUrl;
    backendLink.download = `${appName.trim()}-backend.js`;
    document.body.appendChild(backendLink);
    backendLink.click();
    document.body.removeChild(backendLink);
    URL.revokeObjectURL(backendUrl);

    toast.success("Code downloaded!");
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
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-4xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">VibeCoder AI</CardTitle>
          <CardDescription className="text-center">
            Describe your app in natural language, and let AI generate the code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Describe Your App</h3>
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
            <Button onClick={handleGenerateCode} className="w-full" disabled={isGenerating}>
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
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Generated Code</h3>
              <div className="flex space-x-2">
                <Button
                  variant={activeTab === 'frontend' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('frontend')}
                >
                  Frontend
                </Button>
                <Button
                  variant={activeTab === 'backend' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('backend')}
                >
                  Backend
                </Button>
                <Button onClick={handleDownloadCode} className="ml-auto">
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
                    maxHeight: '500px',
                    overflowY: 'auto',
                  }}
                >
                  {activeTab === 'frontend' ? generatedCode.frontend : generatedCode.backend}
                </SyntaxHighlighter>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                **Live Preview:** A true live preview for a full-stack app requires a sandboxed environment and a build process. For now, you can copy the generated code into your local development environment to see it in action. Future iterations could include a more integrated preview.
              </p>
            </div>
          )}

          <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default VibeCoder;