"use client";

import React, { useEffect, useState } from "react";

type Result = {
  url?: string;
  status?: number;
  ok?: boolean;
  error?: string;
  bodySnippet?: string;
  headers?: Record<string, string>;
};

export default function AuthDiagnostics() {
  const [result, setResult] = useState<Result | null>(null);
  const [tokenProbe, setTokenProbe] = useState<Result | null>(null);

  useEffect(() => {
    const run = async () => {
      const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
      const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
      if (!rawUrl || !anon) {
        setResult({
          error:
            "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Check Vercel env and redeploy.",
        });
        return;
      }
      const endpoint = `${rawUrl.replace(/\/$/, "")}/auth/v1/settings`;
      try {
        const res = await fetch(endpoint, {
          method: "GET",
          headers: {
            apikey: anon,
            Authorization: `Bearer ${anon}`,
          },
        });
        const headersObj: Record<string, string> = {};
        res.headers.forEach((v, k) => (headersObj[k] = v));
        let bodySnippet = "";
        try {
          const text = await res.text();
          bodySnippet = text.slice(0, 400);
        } catch (e) {
          bodySnippet = `Failed to read body: ${(e as any)?.message ?? e}`;
        }
        setResult({
          url: endpoint,
          status: res.status,
          ok: res.ok,
          headers: headersObj,
          bodySnippet,
        });
      } catch (e) {
        setResult({ error: (e as any)?.message ?? String(e) });
      }
    };
    run();
  }, []);

  const probeTokenEndpoint = async () => {
    const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
    const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
    if (!rawUrl || !anon) {
      setTokenProbe({ error: "Missing env vars; cannot probe token endpoint." });
      return;
    }
    const endpoint = `${rawUrl.replace(/\/$/, "")}/auth/v1/token?grant_type=password`;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          apikey: anon,
          Authorization: `Bearer ${anon}`,
        },
        body: JSON.stringify({ email: "test@example.com", password: "incorrect" }),
      });
      const headersObj: Record<string, string> = {};
      res.headers.forEach((v, k) => (headersObj[k] = v));
      let bodySnippet = "";
      try {
        const text = await res.text();
        bodySnippet = text.slice(0, 400);
      } catch (e) {
        bodySnippet = `Failed to read body: ${(e as any)?.message ?? e}`;
      }
      setTokenProbe({ url: endpoint, status: res.status, ok: res.ok, headers: headersObj, bodySnippet });
    } catch (e) {
      setTokenProbe({ error: (e as any)?.message ?? String(e) });
    }
  };

  return (
    <div className="min-h-screen p-6 flex flex-col gap-4 items-start bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-bold">Supabase Auth Diagnostics</h1>
      <p className="text-sm opacity-80">
        This checks connectivity to <code>/auth/v1/settings</code> with your current env vars.
      </p>
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-md shadow p-4">
        {!result ? (
          <p>Running checks...</p>
        ) : result.error ? (
          <div>
            <p className="font-semibold text-red-500">Error</p>
            <pre className="whitespace-pre-wrap break-words">{result.error}</pre>
          </div>
        ) : (
          <div className="space-y-2">
            <p>
              <span className="font-semibold">URL:</span> {result.url}
            </p>
            <p>
              <span className="font-semibold">Status:</span> {result.status} ({
                result.ok ? "ok" : "not ok"
              })
            </p>
            <div>
              <p className="font-semibold">Headers:</p>
              <pre className="whitespace-pre-wrap break-words text-xs">{JSON.stringify(result.headers, null, 2)}</pre>
            </div>
            <div>
              <p className="font-semibold">Body snippet:</p>
              <pre className="whitespace-pre-wrap break-words text-xs">{result.bodySnippet}</pre>
            </div>
            <div className="pt-4">
              <button className="px-3 py-2 rounded bg-primary text-primary-foreground" onClick={probeTokenEndpoint}>
                Probe token endpoint (invalid creds)
              </button>
              {tokenProbe && (
                <div className="mt-3 space-y-1">
                  <p className="font-semibold">Token probe result:</p>
                  {tokenProbe.error ? (
                    <pre className="whitespace-pre-wrap break-words">{tokenProbe.error}</pre>
                  ) : (
                    <>
                      <p>
                        <span className="font-semibold">URL:</span> {tokenProbe.url}
                      </p>
                      <p>
                        <span className="font-semibold">Status:</span> {tokenProbe.status} ({
                          tokenProbe.ok ? "ok" : "not ok"
                        })
                      </p>
                      <div>
                        <p className="font-semibold">Headers:</p>
                        <pre className="whitespace-pre-wrap break-words text-xs">{JSON.stringify(tokenProbe.headers, null, 2)}</pre>
                      </div>
                      <div>
                        <p className="font-semibold">Body snippet:</p>
                        <pre className="whitespace-pre-wrap break-words text-xs">{tokenProbe.bodySnippet}</pre>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <p className="text-xs opacity-70">
        If status is 0 or body is empty, a network/CORS/Env issue is likely. Ensure env vars
        and Supabase project URL are correct, and try again.
      </p>
    </div>
  );
}
