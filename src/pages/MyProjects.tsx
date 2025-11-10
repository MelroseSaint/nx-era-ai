"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Eye, Trash2, Download, Edit } from 'lucide-react'; // Added Edit icon
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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

const MyProjects = () => {
  const { user, isLoading, isProfileLoading } = useSession();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [isFetchingProjects, setIsFetchingProjects] = useState(true);
  const [selectedProjectCode, setSelectedProjectCode] = useState<GeneratedCode | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'frontend' | 'backend'>('frontend');

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    } else if (user) {
      fetchUserProjects();
    }
  }, [user, isLoading, navigate]);

  const fetchUserProjects = async () => {
    if (!user) return;
    setIsFetchingProjects(true);
    const { data, error } = await supabase
      .from('user_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Failed to fetch projects: " + error.message);
    } else {
      setProjects(data || []);
    }
    setIsFetchingProjects(false);
  };

  const handleDeleteProject = async (projectId: string) => {
    const { error } = await supabase
      .from('user_projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user?.id); // Ensure user can only delete their own projects

    if (error) {
      toast.error("Failed to delete project: " + error.message);
    } else {
      setProjects(projects.filter((project) => project.id !== projectId));
      toast.success("Project deleted successfully!");
    }
  };

  const handleDownloadProjectCode = async (project: UserProject) => {
    if (!project.generated_code || !project.name.trim()) {
      toast.error("No code to download or project name is missing.");
      return;
    }

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

  if (isLoading || isProfileLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading your projects...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-3xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">My Generated Projects</CardTitle>
          <CardDescription className="text-center">
            Review and manage the applications you've generated with VibeCoder AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {isFetchingProjects ? (
              <p className="text-gray-500 text-center">Loading your projects...</p>
            ) : projects.length === 0 ? (
              <p className="text-gray-500 text-center">
                You haven't generated any projects yet. Go to{' '}
                <Button variant="link" onClick={() => navigate('/vibe-coder')} className="p-0 h-auto">
                  VibeCoder AI
                </Button>{' '}
                to create your first app!
              </p>
            ) : (
              <div className="grid gap-4">
                {projects.map((project) => (
                  <Card key={project.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4">
                    <div className="flex-grow mb-2 sm:mb-0">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription className="text-sm line-clamp-2">{project.prompt}</CardDescription>
                      <p className="text-xs text-gray-500">
                        Generated: {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2 mt-2 sm:mt-0">
                      <Button variant="outline" size="icon" title="Edit Project" onClick={() => navigate(`/my-projects/${project.id}`)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {project.generated_code && (
                        <Dialog onOpenChange={(open) => {
                          if (open) {
                            setSelectedProjectCode(project.generated_code);
                            setActiveCodeTab('frontend'); // Default to frontend when opening
                          } else {
                            setSelectedProjectCode(null);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon" title="View Code">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                            <DialogHeader>
                              <DialogTitle>Code for "{project.name}"</DialogTitle>
                              <DialogDescription className="line-clamp-2">
                                Prompt: {project.prompt}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex-grow flex flex-col overflow-hidden">
                              <div className="flex justify-between items-center mb-2">
                                <Tabs value={activeCodeTab} onValueChange={(value) => setActiveCodeTab(value as 'frontend' | 'backend')}>
                                  <TabsList>
                                    <TabsTrigger value="frontend">Frontend</TabsTrigger>
                                    <TabsTrigger value="backend">Backend</TabsTrigger>
                                  </TabsList>
                                </Tabs>
                                <Button onClick={() => handleDownloadProjectCode(project)} size="sm">
                                  <Download className="mr-2 h-4 w-4" /> Download Project
                                </Button>
                              </div>
                              <TabsContent value="frontend" className="flex-grow overflow-auto mt-0">
                                <SyntaxHighlighter
                                  language="typescript"
                                  style={dracula}
                                  showLineNumbers
                                  customStyle={{
                                    padding: '1rem',
                                    borderRadius: '0.375rem',
                                    height: '100%',
                                    width: '100%',
                                    overflow: 'auto',
                                  }}
                                >
                                  {selectedProjectCode?.frontend || '// No frontend code generated'}
                                </SyntaxHighlighter>
                              </TabsContent>
                              <TabsContent value="backend" className="flex-grow overflow-auto mt-0">
                                <SyntaxHighlighter
                                  language="javascript"
                                  style={dracula}
                                  showLineNumbers
                                  customStyle={{
                                    padding: '1rem',
                                    borderRadius: '0.375rem',
                                    height: '100%',
                                    width: '100%',
                                    overflow: 'auto',
                                  }}
                                >
                                  {selectedProjectCode?.backend || '// No backend code generated'}
                                </SyntaxHighlighter>
                              </TabsContent>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" title="Delete Project">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your project &quot;{project.name}&quot;.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteProject(project.id)} className="bg-red-600 hover:bg-red-700">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default MyProjects;