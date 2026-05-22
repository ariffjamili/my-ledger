# MyLedger

A multi-user personal income and expense tracker built with Supabase, Tailwind CSS, and Vanilla JavaScript. Hosted on Vercel.

---

## Overview

MyLedger allows individuals to log income and expenses, attach receipt images, monitor their running balance, and generate monthly reports with category breakdowns. Currency is fixed to **Malaysian Ringgit (MYR)**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5 + Tailwind CSS (CDN) + Vanilla JavaScript |
| Auth / Database / Storage | Supabase |
| Charts | Chart.js v4 (CDN) |
| Hosting | Vercel |
| Source Control | GitHub |

---

## Prerequisites

- A [Supabase](https://supabase.com) account (free tier works)
- A [Vercel](https://vercel.com) account (free tier works)
- A [GitHub](https://github.com) account
- A browser and a text editor (VS Code recommended)
- No Node.js, no npm, no build tools required

---

## Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/my-ledger.git
cd my-ledger

# 2. Copy the environment variable template
cp .env.example .env
# Edit .env and fill in your Supabase URL and anon key

# 3. Open in browser
# Option A: VS Code Live Server (recommended)
#   Install the Live Server extension, right-click index.html → Open with Live Server

# Option B: Python
python3 -m http.server 8080
# Open http://localhost:8080
```

> Update `assets/js/supabase.js` with your `SUPABASE_URL` and `SUPABASE_ANON_KEY` values from your Supabase project settings.

---

## Supabase Setup

See the full step-by-step guide in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

Quick summary:
1. Create a Supabase project
2. Run the SQL schema scripts (categories, transactions tables + RLS policies)
3. Create the `receipts` storage bucket and apply storage policies
4. Configure Auth settings (Site URL, Redirect URL, password minimum length)
5. Copy your Project URL and anon key into `assets/js/supabase.js`

---

## Vercel Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full deployment guide.

Quick summary:
1. Push this repository to GitHub
2. Import the GitHub repo into Vercel
3. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` as environment variables in Vercel
4. Deploy — every push to `main` triggers an automatic redeploy

---

## Environment Variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL (e.g. `https://xyz.supabase.co`) |
| `SUPABASE_ANON_KEY` | Your Supabase anon/public key |

> **Never use or expose the `service_role` key in this project.**

Copy `.env.example` to `.env` for local reference. The actual values are inlined in `assets/js/supabase.js`.

---

## Project Structure

```
my-ledger/
├── index.html                  # Entry point — redirects based on auth state
├── login.html                  # Login page
├── register.html               # Registration page
├── reset-password.html         # Password reset (from email link)
├── dashboard.html              # Main dashboard
├── transactions.html           # Transaction list with filters
├── transactions-add.html       # Add transaction form
├── transactions-edit.html      # Edit transaction form
├── reports.html                # Monthly reports and charts
├── categories.html             # Category management
├── settings.html               # Account settings
├── assets/
│   ├── css/
│   │   └── tailwind.min.css
│   └── js/
│       ├── supabase.js         # Supabase client initialisation
│       ├── auth.js             # Authentication helpers
│       ├── transactions.js     # Transaction CRUD
│       ├── categories.js       # Category CRUD
│       ├── storage.js          # Receipt upload/download
│       ├── reports.js          # Report data aggregation
│       ├── charts.js           # Chart.js rendering
│       └── utils.js            # Shared utilities (formatting, CSV export)
├── docs/
│   ├── PRD.md                  # Product Requirements Document
│   ├── IMPLEMENTATION_PLAN.md  # Phase-by-phase build guide
│   ├── DEPLOYMENT.md           # Deployment guide
│   └── CHANGELOG.md            # Version history
├── .env.example                # Environment variable template
├── .gitignore
├── vercel.json                 # Vercel routing configuration
└── README.md                   # This file
```

---

## Documentation

| Document | Description |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Full product requirements, data model, user flows, and security policies |
| [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) | Phase-by-phase build checklist for developers |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Step-by-step Supabase, GitHub, and Vercel deployment guide |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | Version history |

---

## Features (V1)

- Multi-user authentication with email/password
- Self-service forgot password and reset password
- Income and expense transaction logging
- Receipt image upload (camera or gallery on mobile)
- User-managed categories
- Default category set seeded on registration
- Dashboard with running balance and recent transactions
- Sample data for new users (button-triggered)
- Transaction filtering by month, type, and category
- Infinite scroll on transaction list
- Monthly reports with charts (daily trend, category breakdown)
- CSV export
- Row Level Security — each user sees only their own data

---

## V2 Roadmap

- OCR data extraction from receipt images
- Social login (Google, Apple)
- Dark mode
- Recurring transaction templates
- PWA / offline support

---

## License

Private project. All rights reserved.
