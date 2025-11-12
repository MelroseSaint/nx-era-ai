"use client";

import { useSession } from "@/components/SessionContextProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
// Theme toggle is available globally in HeaderNav; avoid duplicates on this page

const Index = () => {
  const { session } = useSession();
  const navigate = useNavigate();

  // Only block on global auth loading; allow Home to render
  // even if profile details are still loading in the background.
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-200/60 via-blue-100/50 to-orange-100/60 dark:from-violet-900/40 dark:via-blue-900/30 dark:to-orange-900/40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between rounded-full px-4 py-3 bg-background/60 backdrop-blur border border-border">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary" />
              <span className="text-sm font-semibold">NXE AI</span>
            </div>
            <div className="flex items-center gap-6">
              <button className="text-sm text-muted-foreground hover:text-foreground">Pricing</button>
              <button className="text-sm text-muted-foreground hover:text-foreground">Enterprise</button>
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Button onClick={() => navigate('/studio')} className="bg-lime-300 text-black hover:bg-lime-400">Start Building</Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto text-center pt-16">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground">
              Let’s make your dream a <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">reality</span>.
            </h1>
            <h2 className="mt-4 text-lg sm:text-xl text-muted-foreground">NXE AI lets you build fully-functional apps in minutes with just your words. No coding necessary.</h2>

            <Card className="mt-10 shadow-lg">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2">
                  <Input className="flex-1 h-12 text-base" placeholder="What do you want to build?" />
                  <Button className="h-12 px-4"><ArrowUpRight className="h-5 w-5" /></Button>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {['Reporting Dashboard','Gaming Platform','Onboarding Portal','Networking App','Room Visualizer'].map((t) => (
                    <Button key={t} variant="outline" size="sm" className="rounded-full" onClick={() => navigate('/studio')}>{t}</Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 flex items-center justify-center gap-3">
              {["AL","BK","CR","DT"].map((i) => (
                <div key={i} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs">
                  {i}
                </div>
              ))}
              <span className="text-sm text-muted-foreground">Trusted by 400K+ users</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary" />
            <span className="text-sm font-semibold">NXE AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-3 text-muted-foreground">Start building from the Studio or jump into your Dashboard.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button onClick={() => navigate('/studio')}>Open Studio</Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>Open Dashboard</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
