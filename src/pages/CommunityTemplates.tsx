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
import { PlusCircle, ExternalLink, Trash2 } from 'lucide-react'; // Added Trash2
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

interface CommunityTemplate {
  id: string;
  name: string;
  description: string | null;
  author_id: string;
  template_url: string | null;
  created_at: string;
}

const CommunityTemplates = () => {
  const { user, isLoading, isProfileLoading } = useSession();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<CommunityTemplate[]>([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [newTemplateUrl, setNewTemplateUrl] = useState('');
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [isFetchingTemplates, setIsFetchingTemplates] = useState(true);

  useEffect(() => {
    fetchCommunityTemplates();
  }, []); // Fetch templates on component mount, no user dependency needed for public read

  const fetchCommunityTemplates = async () => {
    setIsFetchingTemplates(true);
    const { data, error } = await supabase
      .from('community_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Failed to fetch community templates: " + error.message);
    } else {
      setTemplates(data || []);
    }
    setIsFetchingTemplates(false);
  };

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to add a template.");
      return;
    }
    if (!newTemplateName.trim()) {
      toast.error("Template name cannot be empty.");
      return;
    }

    setIsAddingTemplate(true);
    const { data, error } = await supabase
      .from('community_templates')
      .insert({
        author_id: user.id,
        name: newTemplateName.trim(),
        description: newTemplateDescription.trim() || null,
        template_url: newTemplateUrl.trim() || null,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add template: " + error.message);
    } else if (data) {
      setTemplates([data, ...templates]);
      setNewTemplateName('');
      setNewTemplateDescription('');
      setNewTemplateUrl('');
      toast.success("Template added successfully!");
    }
    setIsAddingTemplate(false);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!user) {
      toast.error("You must be logged in to delete a template.");
      return;
    }
    const { error } = await supabase
      .from('community_templates')
      .delete()
      .eq('id', templateId)
      .eq('author_id', user.id); // Ensure user can only delete their own templates

    if (error) {
      toast.error("Failed to delete template: " + error.message);
    } else {
      setTemplates(templates.filter((template) => template.id !== templateId));
      toast.success("Template deleted successfully!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-3xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Community Templates</CardTitle>
          <CardDescription className="text-center">
            Explore and share useful templates and modules with the community.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {user && (
            <form onSubmit={handleAddTemplate} className="space-y-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Contribute a New Template</h3>
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g., User Profile Card"
                  disabled={isAddingTemplate}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateDescription">Description (Optional)</Label>
                <Textarea
                  id="templateDescription"
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder="A brief description of what this template does."
                  disabled={isAddingTemplate}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateUrl">Template URL (e.g., GitHub repo, documentation link)</Label>
                <Input
                  id="templateUrl"
                  type="url"
                  value={newTemplateUrl}
                  onChange={(e) => setNewTemplateUrl(e.target.value)}
                  placeholder="https://github.com/your-template"
                  disabled={isAddingTemplate}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isAddingTemplate}>
                <PlusCircle className="mr-2 h-4 w-4" /> {isAddingTemplate ? 'Adding...' : 'Submit Template'}
              </Button>
            </form>
          )}

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Available Templates</h3>
            {isFetchingTemplates ? (
              <p className="text-gray-500 text-center">Loading community templates...</p>
            ) : templates.length === 0 ? (
              <p className="text-gray-500 text-center">No community templates available yet. Be the first to add one!</p>
            ) : (
              <div className="grid gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4">
                    <div className="flex-grow mb-2 sm:mb-0">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {template.description && <CardDescription className="text-sm">{template.description}</CardDescription>}
                      <p className="text-xs text-gray-500">
                        By {template.author_id === user?.id ? "You" : "Community Member"} | Created: {new Date(template.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {template.template_url && (
                        <Button variant="outline" size="icon" asChild>
                          <a href={template.template_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {user?.id === template.author_id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your template &quot;{template.name}&quot;.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTemplate(template.id)} className="bg-red-600 hover:bg-red-700">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
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

export default CommunityTemplates;