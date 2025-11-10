// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Client with user JWT to verify caller
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
  });

  // Admin client with service role to perform privileged updates
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 401,
      });
    }

    // Verify caller is admin
    const { data: callerProfile, error: profErr } = await supabase
      .from("profiles")
      .select("is_admin, role")
      .eq("id", user.id)
      .single();
    if (profErr || !callerProfile || !(callerProfile.is_admin || callerProfile.role === "admin")) {
      return new Response(JSON.stringify({ success: false, message: "Forbidden" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 403,
      });
    }

    const payload = await req.json();
    // Health check
    if (payload?.ping) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 200,
      });
    }
    // Simulations for diagnostics
    if (payload?.simulate === "missing_service_key") {
      return new Response(JSON.stringify({ success: false, message: "Service role key missing or invalid" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 500,
      });
    }
    if (payload?.simulate === "bucket_policy") {
      return new Response(JSON.stringify({ success: false, message: "Storage bucket policies may block access. Verify select/insert/update/delete policies for user prefixes." }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 403,
      });
    }
    if (payload?.simulate === "target_not_found") {
      return new Response(JSON.stringify({ success: false, message: "Target user not found" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 404,
      });
    }
    const email = String(payload?.email || "").trim();
    const role = String(payload?.role || "").trim();
    const is_admin = Boolean(payload?.is_admin);
    const dry_run = Boolean(payload?.dry_run);

    if (!email || !role) {
      return new Response(JSON.stringify({ success: false, message: "Missing email or role" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 400,
      });
    }

    const { data: target, error: findErr } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();
    if (findErr || !target) {
      return new Response(JSON.stringify({ success: false, message: "Target user not found" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 404,
      });
    }

    if (dry_run) {
      return new Response(JSON.stringify({ success: true, message: "Dry run OK", target_id: target.id }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 200,
      });
    }

    const { error: updErr } = await supabaseAdmin
      .from("profiles")
      .update({ role, is_admin })
      .eq("id", target.id);
    if (updErr) {
      return new Response(JSON.stringify({ success: false, message: updErr.message }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200,
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, message: e?.message || "Unknown error" }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 500,
    });
  }
});
