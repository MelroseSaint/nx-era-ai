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

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
  });
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const { data: auth, error: userErr } = await supabase.auth.getUser();
    const user = auth?.user;
    if (userErr || !user) {
      return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 401,
      });
    }

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

    const { data, error } = await supabaseAdmin.rpc("backfill_profile_paths");
    if (error) {
      return new Response(JSON.stringify({ success: false, message: error.message }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true, result: data }), {
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

