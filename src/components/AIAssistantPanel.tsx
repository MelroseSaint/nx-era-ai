import React from 'react';
import { assist, explain, refactor } from '@/integrations/ai/trae';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

type Props = {
  getActiveCode: () => string;
  applyToActiveFile: (newContent: string) => void;
};

export default function AIAssistantPanel({ getActiveCode, applyToActiveFile }: Props){
  const [prompt, setPrompt] = React.useState('');
  const [messages, setMessages] = React.useState<{ role: 'user'|'assistant'; content: string }[]>([]);
  const [isBusy, setBusy] = React.useState(false);

  const pushAssistant = (text: string) => setMessages(prev => [...prev, { role: 'assistant', content: text }]);
  const pushUser = (text: string) => setMessages(prev => [...prev, { role: 'user', content: text }]);

  const onAsk = async () => {
    if (!prompt.trim()) return;
    setBusy(true);
    pushUser(prompt.trim());
    try {
      const res = await assist([{ role: 'user', content: prompt.trim() }]);
      pushAssistant(res.text);
    } catch (e){
      toast.error('AI error');
    } finally { setBusy(false); setPrompt(''); }
  };

  const onExplain = async () => {
    setBusy(true);
    try {
      const res = await explain(getActiveCode());
      pushAssistant(res.text);
    } catch { toast.error('Explain failed'); } finally { setBusy(false); }
  };

  const onRefactor = async () => {
    if (!prompt.trim()) return toast.error('Provide refactor instructions');
    setBusy(true);
    try {
      const res = await refactor(getActiveCode(), prompt.trim());
      pushAssistant(res.text);
    } catch { toast.error('Refactor failed'); } finally { setBusy(false); }
  };

  const onApplyFix = () => {
    const last = [...messages].reverse().find(m => m.role==='assistant');
    if (!last) return toast.error('No assistant response to apply');
    applyToActiveFile(last.content);
    toast.success('Applied to editor');
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="laser-text">AI Assistant</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} placeholder="Ask for code, fixes, or refactors"/>
          <Button disabled={isBusy} onClick={onAsk} className="laser-button">Ask</Button>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onExplain} disabled={isBusy}>Explain</Button>
          <Button variant="secondary" onClick={onRefactor} disabled={isBusy}>Refactor</Button>
          <Button variant="secondary" onClick={onApplyFix}>Apply Fix</Button>
        </div>
        <div className="border rounded-md p-3 max-h-[240px] overflow-auto bg-muted">
          {messages.length===0 ? (
            <div className="text-sm text-muted-foreground">No messages yet.</div>
          ) : (
            <ul className="space-y-2">
              {messages.map((m,i)=> (
                <li key={i} className="text-sm"><span className="font-semibold">{m.role}:</span> <pre className="whitespace-pre-wrap">{m.content}</pre></li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

