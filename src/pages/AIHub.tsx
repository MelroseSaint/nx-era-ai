"use client";

import React from "react";
import { useTheme } from "next-themes";
import { useSession } from "@/components/SessionContextProvider";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Editor from "@monaco-editor/react";
import { toast } from "sonner";

// Optional: use existing AI integrations if available
import { assist } from "@/integrations/ai/trae";

const AIHub: React.FC = () => {
  const { user, isLoading } = useSession();
  const navigate = useNavigate();
  const displayName = (user?.first_name || user?.last_name)
    ? [user?.first_name, user?.last_name].filter(Boolean).join(" ")
    : user?.email;

  // Chat state
  const [messages, setMessages] = React.useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  // Code editors state
  const [activeTab, setActiveTab] = React.useState<"html" | "css" | "js">("html");
  const [html, setHtml] = React.useState<string>("<div class='p-4'>\n  <h1>Hello NXE AI</h1>\n  <p>Edit code to see live preview.</p>\n</div>");
  const [css, setCss] = React.useState<string>("body { font-family: system-ui, sans-serif; }\n h1 { color: #8B5CF6; }\n p { color: #94A3B8; }");
  const [js, setJs] = React.useState<string>("");

  const { theme } = useTheme();
  const [iframeVars, setIframeVars] = React.useState<string>("--background: 222.2 84% 4.9%;\n--foreground: 210 40% 98%;");

  React.useEffect(() => {
    try {
      const root = document.documentElement;
      const cs = getComputedStyle(root);
      const names = [
        "--background","--foreground","--primary","--primary-foreground",
        "--secondary","--secondary-foreground","--muted","--muted-foreground",
        "--accent","--accent-foreground","--border","--input","--ring"
      ];
      const lines = names.map(n => `${n}: ${cs.getPropertyValue(n).trim()};`).join("\n");
      setIframeVars(lines);
    } catch (_) {
      // noop: keep defaults
    }
  }, [theme]);

  const srcDoc = React.useMemo(() => {
    return `<!doctype html>
<html>
  <head>
    <meta charset=\"utf-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <style>
      :root {${iframeVars}}
      html, body { height: 100%; }
      body { margin: 0; background: hsl(var(--background)); color: hsl(var(--foreground)); }
      *, *::before, *::after { box-sizing: border-box; }
    </style>
    <style>${css}</style>
  </head>
  <body>${html}
    <script>${js}<\/script>
  </body>
</html>`;
  }, [html, css, js, iframeVars]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setBusy(true);
    setMessages(prev => [...prev, { role: "user", content: text }]);
    try {
      const res = await assist([{ role: "user", content: text }]);
      setMessages(prev => [...prev, { role: "assistant", content: res.text }]);
    } catch (e) {
      toast.error("Assistant unavailable");
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process that right now." }]);
    } finally {
      setBusy(false);
      setInput("");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 text-center text-muted-foreground">Loading...</div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-xl mx-auto bg-background text-foreground border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Sign up to use AI Hub</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Access to the chat and preview is available to registered users.</p>
            <div className="flex gap-3">
              <Button className="bg-primary hover:bg-primary/80 text-primary-foreground" onClick={() => navigate('/login')}>Sign in</Button>
              <Button className="bg-muted hover:bg-accent" onClick={() => navigate('/login')}>Create account</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full bg-background text-foreground">
      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-200/60 via-blue-100/50 to-orange-100/60 dark:from-violet-900/40 dark:via-blue-900/30 dark:to-orange-900/40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between rounded-full px-4 py-3 bg-background/60 backdrop-blur border border-border">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary" />
              <span className="text-sm font-semibold">NXE AI</span>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => navigate('/credits')} className="text-sm text-muted-foreground hover:text-foreground">Pricing</button>
              <button onClick={() => navigate('/credits')} className="text-sm text-muted-foreground hover:text-foreground">Enterprise</button>
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Button onClick={() => navigate('/studio')} className="bg-lime-300 text-black hover:bg-lime-400">Start Building</Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto text-center pt-16 pb-12">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Let’s make your dream a <span className="text-primary">reality</span>.
              <br /> Right now.
            </h1>
            <p className="mt-4 text-muted-foreground">
              Build fully-functional apps in minutes with just your words.
            </p>
            <div className="mt-8 mx-auto max-w-2xl flex items-center gap-2 rounded-2xl bg-background/70 backdrop-blur border border-border p-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="What do you want to build?"
                className="flex-1"
              />
              <Button onClick={sendMessage} className="bg-primary text-primary-foreground"><ArrowUpRight className="h-4 w-4" /></Button>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
              {[
                'Reporting Dashboard',
                'Gaming Platform',
                'Onboarding Portal',
                'Networking App',
                'Room Visualizer',
              ].map((t) => (
                <button key={t} onClick={() => setInput(t)} className="px-3 py-1 rounded-full bg-background/80 border hover:bg-accent">
                  {t}
                </button>
              ))}
            </div>
            <div className="mt-8 flex items-center justify-center gap-2 opacity-80">
              <div className="flex -space-x-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-6 w-6 rounded-full border-2 border-background bg-muted" />
                ))}
              </div>
              <span className="text-xs">Trusted by 400K+ users</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-6 px-4">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold" style={{
            background: "linear-gradient(90deg, #8B5CF6, #22D3EE)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>AI Hub</h1>
          <p className="text-muted-foreground">Chat with the assistant and preview your code live.</p>
          {user && (
            <p className="mt-1 text-sm text-muted-foreground">User: Signed in as {displayName}</p>
          )}
        </div>

        {/* Layout: responsive two-column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chat panel */}
          <section className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
            <header className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="font-medium">Assistant Chat</span>
            </header>
            <div className="flex-1 px-4 py-3 space-y-3 overflow-y-auto max-h-[50vh] md:max-h-[70vh]">
              {messages.length === 0 && (
                <p className="text-muted-foreground">Start the conversation by asking a coding question.</p>
              )}
              {messages.map((m, idx) => (
                <div key={idx} className={`rounded px-3 py-2 ${m.role === 'user' ? 'bg-muted' : 'bg-secondary'}`}>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">{m.role}</span>
                  <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}
            </div>
            <footer className="p-3 border-t border-border">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' ? sendMessage() : null}
                  placeholder="Ask the AI to help..."
                  className="flex-1 rounded bg-background border border-border px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={sendMessage}
                  disabled={busy}
                  className="px-4 py-2 rounded bg-primary hover:bg-primary/80 text-primary-foreground disabled:opacity-60"
                >Send</button>
              </div>
            </footer>
          </section>

          {/* Code editor + preview */}
          <section className="rounded-lg border border-border bg-card overflow-hidden">
            <header className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="font-medium">Code & Preview</span>
              <div className="flex gap-1">
                {(["html","css","js"] as const).map(tab => (
                  <button
                    key={tab}
                    className={`px-3 py-1 rounded ${activeTab===tab ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground/80 hover:bg-accent'}`}
                    onClick={() => setActiveTab(tab)}
                  >{tab.toUpperCase()}</button>
                ))}
              </div>
            </header>
            <div className="grid grid-rows-2 md:grid-rows-1 md:grid-cols-2">
              <div className="border-r border-border">
                {activeTab === "html" && (
                  <Editor height="50vh" defaultLanguage="html" theme="vs-dark" value={html} onChange={(v) => setHtml(v ?? "")}/>
                )}
                {activeTab === "css" && (
                  <Editor height="50vh" defaultLanguage="css" theme="vs-dark" value={css} onChange={(v) => setCss(v ?? "")}/>
                )}
                {activeTab === "js" && (
                  <Editor height="50vh" defaultLanguage="javascript" theme="vs-dark" value={js} onChange={(v) => setJs(v ?? "")}/>
                )}
              </div>
              <div className="bg-background">
                <iframe title="Preview" className="w-full h-[50vh] md:h-full" sandbox="allow-scripts" srcDoc={srcDoc} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AIHub;
