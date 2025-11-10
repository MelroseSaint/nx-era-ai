import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Support comma-separated origins via ALLOWED_ORIGINS or single ALLOWED_ORIGIN, fallback to '*'
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? Deno.env.get('ALLOWED_ORIGIN') ?? '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function patternToRegex(pattern: string): RegExp | null {
  if (!pattern) return null;
  if (pattern === '*') return /^.*$/; // match anything
  // Escape regex special chars, then allow '*' wildcard
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*');
  try {
    return new RegExp(`^${escaped}$`);
  } catch (_e) {
    return null;
  }
}

function originMatches(origin: string | null, patterns: string[]): boolean {
  if (!origin) return false;
  for (const p of patterns) {
    if (p === '*') return true;
    const rx = patternToRegex(p);
    if (rx && rx.test(origin)) return true;
  }
  return false;
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin');
  const allowOrigin = origin && originMatches(origin, ALLOWED_ORIGINS)
    ? origin
    : (ALLOWED_ORIGINS.includes('*') ? '*' : (ALLOWED_ORIGINS[0] ?? '*'));
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  } as Record<string, string>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Restrict generation endpoint to admin IPs only (for testing / early access)
    // You would replace 'YOUR_ADMIN_IP_ADDRESS' with actual IP addresses
    // For now, we'll allow all for initial testing, but keep this in mind for production.
    // const clientIp = req.headers.get('X-Forwarded-For') || req.headers.get('Client-IP');
    // const adminIps = ['YOUR_ADMIN_IP_ADDRESS_1', 'YOUR_ADMIN_IP_ADDRESS_2'];
    // if (!adminIps.includes(clientIp)) {
    //   return new Response(JSON.stringify({ error: 'Access denied: Not an admin IP' }), {
    //     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    //     status: 403,
    //   });
    // }

    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Basic input validation to avoid abuse and excessive payloads
    if (typeof prompt !== 'string' || prompt.trim().length > 2000) {
      return new Response(JSON.stringify({ error: 'Prompt must be a string under 2000 characters' }), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    const GOOGLE_AI_STUDIO_API_KEY = Deno.env.get('GOOGLE_AI_STUDIO_API_KEY');
    if (!GOOGLE_AI_STUDIO_API_KEY) {
      return new Response(JSON.stringify({ error: 'Google AI Studio API key not configured' }), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const GOOGLE_AI_STUDIO_MODEL = 'gemini-pro'; // Or your preferred model

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_AI_STUDIO_MODEL}:generateContent?key=${GOOGLE_AI_STUDIO_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate a full-stack application scaffold based on the following description. Provide both frontend (React/TypeScript/Tailwind CSS) and backend (Node.js/Express or similar, with Supabase integration) code. Structure the output as a JSON object with 'frontend' and 'backend' keys, where each value is a string containing the respective code. For example:
              {
                "frontend": "// React component code here",
                "backend": "// Node.js server code here"
              }
              
              User description: "${prompt}"
              `
            }]
          }]
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google AI Studio API error:', errorData);
      return new Response(JSON.stringify({ error: 'Failed to generate code from AI Studio', details: errorData }), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: response.status,
      });
    }

    const data = await response.json();
    const generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedContent) {
      return new Response(JSON.stringify({ error: 'No content generated by AI' }), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Attempt to parse the generated content as JSON
    let parsedCode;
    try {
      // The AI might wrap the JSON in markdown, so we need to extract it
      const jsonMatch = generatedContent.match(/```json\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : generatedContent;
      parsedCode = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI generated content as JSON:', parseError);
      // If parsing fails, return the raw text content for debugging
      return new Response(JSON.stringify({ error: 'AI generated malformed JSON', rawContent: generatedContent }), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ generatedCode: parsedCode }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Edge Function error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
