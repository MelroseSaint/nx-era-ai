Supabase Setup Guide

This project integrates with Supabase for auth, profiles, credits, transactions, and storage.

Prerequisites
- Create a Supabase project and obtain `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Add these to your environment (e.g., `.env` or Vite env) so the app can connect.

Initialization Steps
1) Open Supabase Dashboard → SQL Editor.
2) Paste and run the SQL from `supabase/init.sql` in this repo.
   - Creates or updates `public.profiles` with fields: `email`, `username`, `first_name`, `last_name`, `avatar_url`, `banner_url`, `is_subscriber`, `credits`, `role`, `is_admin`.
   - Creates `public.credit_transactions` for logging credit events.
   - Creates `avatars` and `banners` storage buckets and policies for public read and authenticated user write.
   - Adds a trigger to create a profile row automatically on user sign-up.

Environment Variables
- `VITE_SUPABASE_URL` = your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` = your Supabase anon key

Verification
- Sign up a new user → check `public.profiles` for an inserted row with `email`.
- Visit Profile Settings → upload avatar/banner → verify files appear in Storage under `avatars`/`banners` with folder prefix equal to user id.
- Use Credits page → earn/spend/purchase → verify `credits` updates and `credit_transactions` rows appear.

Notes
- Policies are set for clients: users can only select/update their own profile row and can only insert/select their own transactions.
- Admin actions from the browser will require special server-side logic or JWT custom claims for broader privileges. The UI provided here assumes you target a specific user email whose profile already exists.
- If you need stricter storage access (e.g., private buckets), set `public=false` for buckets and adjust policies accordingly, then request signed URLs for images.

Admin Edge Function: Role Updates
- Location: `supabase/functions/admin-update-role/`
- Purpose: Securely update `profiles.role` and `profiles.is_admin` for a target user.
- Deployment steps:
  - Install Supabase CLI and log in.
  - Set secrets so the function can use service role:
    - `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>`
    - `supabase secrets set SUPABASE_URL=<your-project-url>`
    - `supabase secrets set SUPABASE_ANON_KEY=<your-anon-key>`
  - Deploy function: `supabase functions deploy admin-update-role`
  - By default, JWT is verified; only authenticated callers with `profiles.is_admin=true` or `role='admin'` can update roles.

Client usage (example)
```
const { data, error } = await supabase.functions.invoke('admin-update-role', {
  body: { email: targetEmail, role: roleValue, is_admin: isAdminFlag },
});
```

Private Buckets and Signed URLs
- To make buckets private, update `supabase/init.sql` or via Dashboard:
  - Set `public=false` for `avatars` and `banners`.
  - Remove public read policies; keep insert/update/delete scoped to user folders.
- UI pattern for private buckets:
  - Store the file path (e.g., `${user.id}/filename.png`) in `profiles.avatar_url_path` instead of a public URL.
  - At render time, request a signed URL:
```
const { data, error } = await supabase.storage
  .from('avatars')
  .createSignedUrl(avatarPath, 3600); // 1h TTL
const avatarUrl = data?.signedUrl;
```
- Avoid storing signed URLs in DB (they expire); store object paths and resolve at runtime.

OpenRouter AI and Stripe Plans
- Set environment variables for OpenRouter AI requests:
  - `OPENROUTER_API_KEY` (server function secret for Supabase edge functions)
  - Optional: `OPENROUTER_MODEL` (default `openrouter/auto`)
  - Optional: `OPENROUTER_URL` (default `https://openrouter.ai/api/v1/chat/completions`)
- Stripe pricing environment:
  - `VITE_STRIPE_PRICE_PRO` and `VITE_STRIPE_PRICE_DEV` must be set to price IDs from your Stripe dashboard.
- Webhook function: `supabase/functions/stripe-webhook/`
  - Deploy and set secrets: `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
  - Handles `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted` to update `profiles.role`, `profiles.is_subscriber`, and stack `credits`.
- Client checkout:
  - `src/pages/Credits.tsx` and `src/pages/Dashboard.tsx` include Pro/Dev upgrade buttons using `startCheckout(...)` with `plan` metadata.
- Credits gating:
  - Server: `supabase/functions/generate-code/` enforces credits and admin bypass for scaffolding.
  - Server: `supabase/functions/trae-proxy/` enforces credits and admin bypass for Assist/Explain/Refactor (no decrement; client handles decrement).
  - Client: `src/hooks/useAI.ts` uses 1 credit per AI action and shows friendly messages when out of credits.

Deploy AI Proxy Function (OpenRouter)
- Set the secrets:
  - `supabase secrets set OPENROUTER_API_KEY=<your-openrouter-key>`
  - Optional: `supabase secrets set OPENROUTER_MODEL=openrouter/auto`
  - Optional: `supabase secrets set OPENROUTER_URL=https://openrouter.ai/api/v1/chat/completions`
- Ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` secrets are set.
- Deploy: `supabase functions deploy trae-proxy`
