// Simple client wrappers to interact with Trae AI.
// In production, point to secure backend routes that proxy requests.

export type AIMessage = { role: 'user' | 'assistant' | 'system'; content: string };

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`AI request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

const API = import.meta.env.VITE_TRAE_API_URL || '/api/ai';

export async function assist(messages: AIMessage[]): Promise<{ text: string }>{
  try {
    return await postJSON<{ text: string }>(`${API}/assist`, { messages });
  } catch {
    // Fallback stub for dev
    return { text: 'Stubbed AI response: replace with Trae backend integration.' };
  }
}

export async function explain(code: string): Promise<{ text: string }>{
  try {
    return await postJSON<{ text: string }>(`${API}/explain`, { code });
  } catch {
    return { text: 'Stub explanation: connect Trae AI to enable real answers.' };
  }
}

export async function refactor(code: string, instructions: string): Promise<{ text: string }>{
  try {
    return await postJSON<{ text: string }>(`${API}/refactor`, { code, instructions });
  } catch {
    return { text: 'Stub refactor: wire to Trae AI for actual changes.' };
  }
}

