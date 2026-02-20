# Supabase Configuration Guide

To ensure your application runs without errors, specific settings must be configured in your Supabase Dashboard. Follow these steps exactly.

## 1. Zero: Initialize Database (CRITICAL)
If you see "No tables found" or "Relation does not exist" errors:
1.  Go to **SQL Editor**.
2.  Open/Paste the `FINAL_SUPABASE_FIX.sql` script I created.
3.  Click **Run**.
This creates the tables and the `admin` user.

---

## 2. Authentication Settings

### URL Configuration
Go to **Authentication > URL Configuration**.
*   **Site URL**: `https://hospital-man.onrender.com`
*   **Redirect URLs**: Add the following:
    *   `https://hospital-man.onrender.com/**`
    *   `http://localhost:5173/**` (for local testing)

*> Explanation: This prevents "Redirect URL mismatch" errors during login.*

### Email Provider
Go to **Authentication > Providers > Email**.
*   **Enable Email**: ON
*   **Confirm Email**: OFF (Recommended for testing/initial setup so you don't need to verify emails manually)

---

## 3. Edge Function Secrets (For AI Chat & Voice)
If you use the Maya Chat (`maya-chat`) or Voice Calling (`vapi-appointment-call`), you MUST set these secrets.

Go to **Edge Functions > Secrets** (or use `npx supabase secrets set`).
Add the following keys:

| Key | Value Description |
| :--- | :--- |
| `SUPABASE_URL` | Your Supabase Project URL (e.g., https://xyz.supabase.co) |
| `SUPABASE_ANON_KEY` | Your Public Anon Key (from Project Settings > API) |
| `LOVABLE_API_KEY` | **Required for Maya Chat**. (If you don't have this, chat will fail) |
| `VAPI_PRIVATE_KEY` | **Required for Voice**. The private key from Vapi.ai |

*> Explanation: Without these keys, the AI features will return 500 Errors.*

---

## 4. Deploy Edge Functions (If used)
If your application relies on the AI features, you must deploy the functions to Supabase.
Run this command in your terminal:
```bash
npx supabase functions deploy --no-verify-jwt
```
*(Select all functions if asked)*

---

## Summary Checklist
- [ ] Database initialized (`FINAL_SUPABASE_FIX.sql` run)
- [ ] Site URL set to `https://hospital-man.onrender.com`
- [ ] Redirect URLs include `https://hospital-man.onrender.com/**`
- [ ] Email Confirmation disabled (optional but recommended)
- [ ] Secrets (`LOVABLE_API_KEY`, `VAPI_PRIVATE_KEY`) added if using AI.

Once these are set, your application should run without console errors.
