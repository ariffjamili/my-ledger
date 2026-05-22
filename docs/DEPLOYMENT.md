# MyLedger — Deployment Guide

---

| Field | Details |
|---|---|
| **Document Version** | 1.0.0 |
| **Last Updated** | 2026-05-22 |

---

## Overview

MyLedger is a static web application. There is no server-side runtime. The frontend is hosted on **Vercel**, the database and auth are managed by **Supabase**, and the source code lives on **GitHub**. Vercel auto-deploys on every push to the `main` branch.

---

## Prerequisites

Before deploying, ensure you have accounts on:

- [GitHub](https://github.com) — source control
- [Supabase](https://supabase.com) — database, auth, and storage
- [Vercel](https://vercel.com) — static hosting

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
2. Set **Site URL** to your Vercel URL (e.g. `https://myledger.vercel.app`)
3. Under **Redirect URLs**, add: `https://myledger.vercel.app/reset-password`
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

## Step 3 — Vercel Setup

### 3.1 Import the GitHub Repository

1. Log in to [vercel.com](https://vercel.com)
2. Click **Add New → Project**
3. Select **Import Git Repository**
4. Choose your `my-ledger` GitHub repo
5. Click **Import**

### 3.2 Configure the Project

In the project settings during import:
- **Framework Preset:** Other
- **Build Command:** (leave empty)
- **Output Directory:** (leave empty — root)
- **Install Command:** (leave empty)

### 3.3 Set Environment Variables

In the Vercel project settings → **Environment Variables**, add:

| Name | Value |
|---|---|
| `SUPABASE_URL` | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | `your-anon-key` |

Set both for **Production**, **Preview**, and **Development** environments.

> **Note:** Since this is a static frontend with no server-side runtime, these env vars are referenced directly in `assets/js/supabase.js`. Vercel does not inject them automatically into static HTML. The recommended approach is to inline the values in `supabase.js` for now, or use a build script in a future version.

### 3.4 Deploy

1. Click **Deploy**
2. Wait for the build to complete (~30 seconds)
3. Your app will be live at `https://your-project-name.vercel.app`

### 3.5 Update Supabase Auth URLs

After getting your Vercel URL:
1. Go back to Supabase → **Authentication → Settings**
2. Update **Site URL** to your live Vercel URL
3. Update **Redirect URL** to `https://your-vercel-url.vercel.app/reset-password`

---

## Step 4 — Custom Domain (Optional)

1. In Vercel project → **Settings → Domains**
2. Add your custom domain
3. Update DNS records at your domain registrar as instructed by Vercel
4. Update Supabase **Site URL** and **Redirect URL** to your custom domain

---

## Continuous Deployment

Once connected, every push to the `main` branch on GitHub automatically triggers a new Vercel deployment. No manual steps required.

| Branch | Environment |
|---|---|
| `main` | Production |
| Any other branch | Preview URL (Vercel) |

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
| Vercel 404 on page refresh | Ensure `vercel.json` rewrites are present and correct |
| CORS errors | Ensure Supabase Site URL matches the domain you are accessing from |

---

*MyLedger Deployment Guide v1.0.0 — Last updated 2026-05-22*
