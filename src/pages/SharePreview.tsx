import React from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { buildSandboxHtml, makeSandboxUrl } from '@/utils/sandbox';

export default function SharePreview(){
  const { id } = useParams();
  const [url, setUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const run = async () => {
      if (!id) return;
      // Select all columns to avoid referencing fields that may not exist in the schema
      const { data, error } = await supabase.from('user_projects').select('*').eq('id', id).single();
      if (error) { setError(error.message); return; }
      try {
        let full: string | null = null;

        // Prefer generated_code.frontend if present (supports React/JSX or full HTML)
        if (data?.generated_code && typeof data.generated_code?.frontend === 'string') {
          const code: string = data.generated_code.frontend;
          const title = data?.name || 'NXE Share';
          // If the code is a full HTML document, use as-is; otherwise wrap in a React+Babel sandbox
          const isHtmlDoc = /<html|<!doctype/i.test(code);
          full = isHtmlDoc ? code : `<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>${title}</title>
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
        }

        // Fallback to files_json (Studio projects)
        if (!full && typeof data?.files_json === 'string') {
          const files = JSON.parse(data.files_json || '[]');
          const html = files.find((f:any)=>f.path==='index.html')?.content || '';
          const css = files.find((f:any)=>f.path==='styles.css')?.content || '';
          const js = files.find((f:any)=>f.path==='script.js')?.content || '';
          full = buildSandboxHtml({ html, css, js, title: data.name || 'NXE Share' });
        }

        if (!full) throw new Error('No previewable content found in project');

        const blobUrl = makeSandboxUrl(full);
        setUrl(blobUrl);
      } catch (e:any){ setError(e?.message || 'Malformed project data'); }
    };
    run();
  }, [id]);

  if (error) return <div className="container mx-auto p-4">Error: {error}</div>;
  if (!url) return <div className="container mx-auto p-4">Loading preview...</div>;
  return (
    <div className="container mx-auto p-4">
      <iframe title="Shared Preview" src={url} className="w-full h-[80vh]" sandbox="allow-scripts" />
    </div>
  );
}
