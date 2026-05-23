# MyLedger — Deployment Guide

---

| Field | Details |
|---|---|
| **Document Version** | 1.0.0 |
| **Last Updated** | 2026-05-22 |

---

## Overview

MyLedger is a static web application. There is no server-side runtime. The frontend is hosted on **Cloudflare Pages**, the database and auth are managed by **Supabase**, and the source code lives on **GitHub**. Cloudflare Pages auto-deploys on every push to the `main` branch.

---

## Prerequisites

Before deploying, ensure you have accounts on:

- [GitHub](https://github.com) — source control
- [Supabase](https://supabase.com) — database, auth, and storage
- [Cloudflare](https://dash.cloudflare.com) — static hosting via Cloudflare Pages

No Node.js, no build tools, and no package manager are required to run this project.

---

## Step 1 — Supabase Setup

### 1.1 Create a Supabase Project

1. Log in to [supabase.com](https://supabase.com)
2. Click **New Project**
3. Choose your organisation, enter a project name (e.g. `myledger`), set a strong database password, and choose a region closest to your users (e.g. Southeast Asia)
4. Wait for the project to finish provisioning (~2 minutes)

### 1.2 Run the Database Schema

1. In the Supabase dashboard, go to **SQL Editor**
2. Run the following scripts in order:

**Script 1 — Enable extension:**
```sql
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;
```

**Script 2 — Categories table:**
```sql
CREATE TABLE categories (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  type       TEXT        NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE USING (auth.uid() = user_id);
```

**Script 3 — Transactions table:**
```sql
CREATE TABLE transactions (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          DATE          NOT NULL,
  type          TEXT          NOT NULL CHECK (type IN ('income', 'expense')),
  amount        NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  category_id   UUID          REFERENCES categories(id) ON DELETE SET NULL,
  note          TEXT,
  receipt_url   TEXT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE USING (auth.uid() = user_id);
```

### 1.3 Create the Storage Bucket

1. In the Supabase dashboard, go to **Storage**
2. Click **New Bucket**
3. Set:
   - **Name:** `receipts`
   - **Public bucket:** Off (unchecked)
   - **File size limit:** 5242880 (5 MB)
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp, image/heic`
4. Click **Save**

### 1.4 Apply Storage Policies

In **SQL Editor**, run:

```sql
CREATE POLICY "Users can upload own receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own receipts"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 1.5 Configure Auth Settings

1. Go to **Authentication → Settings**
2. Set **Site URL** to your Cloudflare Pages URL (e.g. `https://my-ledger.pages.dev`)
3. Under **Redirect URLs**, add: `https://my-ledger.pages.dev/**`
4. Enable **Email confirmations** if desired
5. Set **Minimum password length** to `8`

### 1.6 Get Your API Keys

1. Go to **Settings → API**
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon / public key** → `SUPABASE_ANON_KEY`
3. **Never copy or use the `service_role` key in this project**

---

## Step 2 — GitHub Setup

### 2.1 Create the Repository

1. Log in to [github.com](https://github.com)
2. Click **New repository**
3. Name it `my-ledger` (or preferred name)
4. Set to **Private** (recommended) or Public
5. Do **not** initialise with README (the project already has one)
6. Click **Create repository**

### 2.2 Push the Code

From your local project folder:

```bash
cd /Users/ariffjamili/Sites/my-ledger
git init
git add .
git commit -m "chore: initial project setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/my-ledger.git
git push -u origin main
```

---

## Step 3 — Cloudflare Pages Setup

### 3.1 Connect the GitHub Repository

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Workers & Pages → Create → Pages → Connect to Git**
3. Authorise Cloudflare to access your GitHub account if prompted
4. Select your `my-ledger` repository → **Begin setup**

### 3.2 Configure the Build

On the build configuration screen:
- **Project name:** `my-ledger` (this becomes part of the default `*.pages.dev` URL)
- **Production branch:** `main`
- **Framework preset:** None
- **Build command:** (leave empty)
- **Build output directory:** (leave empty — defaults to the repo root)
- **Root directory:** (leave empty)

Click **Save and Deploy**. The first deployment takes ~30 seconds and the app goes live at `https://my-ledger.pages.dev` (or `https://my-ledger-<hash>.pages.dev` if the project name is taken).

### 3.3 Set Environment Variables

In **Pages project → Settings → Environment variables**, add for both **Production** and **Preview**:

| Name | Value |
|---|---|
| `SUPABASE_URL` | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | `your-anon-key` |

> **Note:** Since this is a static frontend with no build step, Cloudflare Pages does **not** inject these into HTML at deploy time. The values are inlined in `assets/js/supabase.js`. The variables above are stored for reference and for any future build step that may pick them up via `window.ENV` (see the fallback chain at the top of [`assets/js/supabase.js`](../assets/js/supabase.js)).

### 3.4 Clean URLs

Clean URLs (no `.html` extension) are configured via the [`_redirects`](../_redirects) file in the project root — Cloudflare Pages reads it at deploy time. No dashboard configuration is required.

### 3.5 Update Supabase Auth URLs

After the first Pages deployment, get your live URL (e.g. `https://my-ledger.pages.dev`) and:
1. Go to Supabase → **Authentication → URL Configuration**
2. Set **Site URL** to your Pages URL
3. Under **Redirect URLs (allowlist)**, add `https://my-ledger.pages.dev/**`

---

## Step 4 — Custom Domain (Optional)

Because your DNS is already on Cloudflare, this is a native two-click setup with no external DNS edits.

1. In your Pages project → **Custom domains → Set up a custom domain**
2. Enter the domain (apex like `myledger.example.com` or subdomain) → **Continue**
3. Cloudflare auto-creates the required DNS record in your zone and provisions a TLS certificate
4. Once active, update Supabase **Site URL** and add the new domain (with `/**`) to **Redirect URLs**

---

## Continuous Deployment

Once connected, every push to the `main` branch on GitHub automatically triggers a new Cloudflare Pages deployment. No manual steps required.

| Branch | Environment |
|---|---|
| `main` | Production (`<project>.pages.dev` and any custom domains) |
| Any other branch | Preview URL (`<branch>.<project>.pages.dev`) |

---

## Local Development

To run locally, simply open the HTML files in a browser. Since all logic is client-side, no local server is strictly required — however, some browsers restrict ES modules and fetch from `file://` URLs. Recommended approach:

**Using VS Code Live Server extension:**
1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension
2. Open the project folder in VS Code
3. Right-click `index.html` → **Open with Live Server**
4. App runs at `http://127.0.0.1:5500`

**Using Python (if installed):**
```bash
cd /Users/ariffjamili/Sites/my-ledger
python3 -m http.server 8080
# Open http://localhost:8080
```

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Login not working | Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` values in `supabase.js` |
| Password reset email not received | Check Supabase Auth → Logs; verify Site URL and Redirect URL are set correctly |
| Receipt upload fails | Verify storage bucket name is `receipts` and storage policies are applied |
| RLS errors in console | Check that RLS policies exist on both tables; verify user is authenticated |
| Cloudflare Pages 404 on page refresh | Ensure `_redirects` is present in the repo root and rules use status `200` (rewrite, not 301) |
| CORS errors | Ensure Supabase Site URL matches the domain you are accessing from |

---

*MyLedger Deployment Guide v1.0.0 — Last updated 2026-05-22*
