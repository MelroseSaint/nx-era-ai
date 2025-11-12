export function buildSandboxHtml(opts: {
  html?: string;
  css?: string;
  js?: string;
  title?: string;
  // The expected parent window origin for postMessage; defaults to '*'
  targetOrigin?: string;
}): string {
  const { html = '', css = '', js = '', title = 'NXE Preview', targetOrigin = '*' } = opts;

  const baseHtml = html && /<html|<!doctype/i.test(html)
    ? html
    : `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title></head><body>${html || '<div id="app"></div>'}</body></html>`;

  const injectedConsole = `
    <script>
      (function(){
        const LEVELS = ['log','info','warn','error'];
        LEVELS.forEach(l => {
          const orig = console[l].bind(console);
          console[l] = function(){
            const args = Array.from(arguments).map(a => {
              try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch { return String(a); }
            });
            window.parent.postMessage({ type: 'console', level: l, args }, '${targetOrigin}');
            orig.apply(console, arguments);
          };
        });
        // Block network calls for security
        const block = (name) => {
          return function(){
            const msg = name + ' is disabled in NXE sandbox';
            window.parent.postMessage({ type: 'error', message: msg }, '${targetOrigin}');
            throw new Error(msg);
          }
        };
        try { window.fetch = block('fetch'); } catch {}
        try {
          const XHR = window.XMLHttpRequest;
          if (XHR) {
            window.XMLHttpRequest = function(){
              return { open: block('XMLHttpRequest.open'), send: block('XMLHttpRequest.send') };
            };
          }
        } catch {}
        // Prevent navigation and opening new windows
        try { window.open = block('window.open'); } catch {}
        window.addEventListener('error', (e) => {
          window.parent.postMessage({ type: 'error', message: e.message, stack: e.error?.stack }, '${targetOrigin}');
        });
      })();
    </script>`;

  const styles = css ? `<style>${css}</style>` : '';
  const script = js ? `<script type="module">\n${js}\n</script>` : '';
  const headInjected = baseHtml.replace('</head>', `${styles}${injectedConsole}</head>`);
  const bodyInjected = headInjected.replace('</body>', `${script}</body>`);
  return bodyInjected;
}

export function makeSandboxUrl(html: string): string {
  const blob = new Blob([html], { type: 'text/html' });
  return URL.createObjectURL(blob);
}
