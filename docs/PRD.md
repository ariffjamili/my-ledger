# Product Requirements Document (PRD)
## MyLedger — Personal Income & Expense Tracker

---

| Field | Details |
|---|---|
| **Document Version** | 1.0.0 |
| **Status** | Draft |
| **Author** | Ariff Jamili |
| **Created** | 2026-05-21 |
| **Last Updated** | 2026-05-22 |
| **Reviewers** | — |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [Users & Use Cases](#3-users--use-cases)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Technical Architecture](#6-technical-architecture)
7. [Data Model](#7-data-model)
8. [Security & Access Control](#8-security--access-control)
9. [Pages & User Flows](#9-pages--user-flows)
10. [Receipt Upload Flow](#10-receipt-upload-flow)
11. [Reporting Requirements](#11-reporting-requirements)
12. [Sample Data](#12-sample-data)
13. [Development Phases](#13-development-phases)
14. [Out of Scope (V1)](#14-out-of-scope-v1)
15. [Open Issues & Decisions](#15-open-issues--decisions)
16. [Appendix: Glossary](#16-appendix-glossary)

---

## 1. Overview

**MyLedger** is a multi-user, web-based personal finance tracker that allows individuals to record income and expenses, attach receipt images as supporting documents, monitor their running balance, and generate monthly reports with category breakdowns. The application is currency-fixed to **Malaysian Ringgit (MYR)**.

### 1.1 Problem Statement

Individuals who manage personal or household finances manually (via spreadsheets or paper) lack a lightweight, accessible tool that combines transaction entry, receipt storage, and meaningful reporting in a single interface. Existing solutions are either too complex, subscription-heavy, or not tailored for the Malaysian context.

### 1.2 Proposed Solution

A clean, mobile-responsive web application where each user has a private ledger. Users can log transactions in seconds, attach a photo of a receipt (phone camera or gallery), and review their financial health via a dashboard and monthly reports.

---

## 2. Goals & Non-Goals

### 2.1 Goals

- Allow users to self-register and manage their own account (including password reset)
- Provide a simple, fast interface for logging income and expense transactions
- Support receipt image upload at the time of transaction entry
- Display a running balance and recent transactions on a dashboard
- Generate monthly summaries with category-level breakdowns and charts
- Allow CSV export of transaction data
- Ensure each user's data is private and inaccessible to other users
- Be fully functional on both desktop and mobile browsers

### 2.2 Non-Goals (V1)

- OCR / automated data extraction from receipt images
- Multi-currency support
- Shared/family ledger (multiple users on one account)
- Native mobile application (iOS / Android)
- Bank account or credit card synchronisation
- Budgeting or spending limits / alerts
- Recurring transaction automation
- Offline / PWA mode
- Admin panel for platform operators

---

## 3. Users & Use Cases

### 3.1 User Persona

**Primary User:** An adult professional or household manager who wants a simple digital ledger to track personal income and expenses, with receipts attached for record-keeping.

### 3.2 Core Use Cases

| ID | Use Case | Actor |
|---|---|---|
| UC-01 | Register a new account with email and password | Guest |
| UC-02 | Log in with email and password | Registered User |
| UC-03 | Request a password reset via email | Registered User |
| UC-04 | Reset password via emailed link | Registered User |
| UC-05 | Add an income or expense transaction | Authenticated User |
| UC-06 | Attach a receipt image to a transaction | Authenticated User |
| UC-07 | Edit an existing transaction | Authenticated User |
| UC-08 | Delete a transaction | Authenticated User |
| UC-09 | View dashboard: running balance and recent entries | Authenticated User |
| UC-10 | Filter transaction list by month, type, or category | Authenticated User |
| UC-11 | View monthly summary with charts | Authenticated User |
| UC-12 | Export transactions to CSV | Authenticated User |
| UC-13 | Manage personal categories | Authenticated User |
| UC-14 | View attached receipt image for a transaction | Authenticated User |
| UC-15 | Log out | Authenticated User |

---

## 4. Functional Requirements

### 4.1 Authentication

| ID | Requirement |
|---|---|
| FR-AUTH-01 | Users can register with a valid email address and a password meeting minimum security requirements (min. 8 characters) |
| FR-AUTH-02 | A verification email is sent upon registration via Supabase Auth |
| FR-AUTH-03 | Users can log in with email and password |
| FR-AUTH-04 | Users can request a password reset; a reset link is sent to their registered email |
| FR-AUTH-05 | The reset link opens a password reset form where the user enters and confirms a new password |
| FR-AUTH-06 | Sessions persist across browser tabs; user remains logged in until they explicitly log out or the session expires |
| FR-AUTH-07 | Unauthenticated users are redirected to `/login` when accessing protected pages |

### 4.2 Transactions

| ID | Requirement |
|---|---|
| FR-TXN-01 | A transaction must have: date, type (income or expense), amount (MYR), category, and optionally a note and receipt |
| FR-TXN-02 | Amount must be a positive number with up to 2 decimal places |
| FR-TXN-03 | Date defaults to today but can be changed to any past or present date |
| FR-TXN-04 | Category is selected from the user's own category list |
| FR-TXN-05 | Users can edit any field of an existing transaction, including type (income ↔ expense), date, amount, category, note, and receipt |
| FR-TXN-06 | Deleting a transaction also deletes its associated receipt image from storage |
| FR-TXN-07 | Transaction list supports filtering by: month/year, type (income / expense / all), category |
| FR-TXN-08 | Transaction list uses infinite scroll; loads 20 transactions per batch, fetching the next batch when the user scrolls near the bottom |
| FR-TXN-09 | Transaction list is sorted by date descending by default |

### 4.3 Categories

| ID | Requirement |
|---|---|
| FR-CAT-01 | Each user manages their own list of categories |
| FR-CAT-02 | A category has: name (free text), type (`income` or `expense`) |
| FR-CAT-03 | Users can create, rename, and delete categories |
| FR-CAT-04 | Deleting a category does not delete associated transactions; affected transactions show a "Uncategorised" label |
| FR-CAT-05 | On new account creation, a set of default categories is seeded for the user (see Section 12) |

### 4.4 Receipt Upload

| ID | Requirement |
|---|---|
| FR-REC-01 | Receipt upload is optional at time of transaction entry |
| FR-REC-02 | The upload input accepts image files (JPEG, PNG, HEIC, WebP) only |
| FR-REC-03 | On mobile, the input allows the user to open the camera directly or choose from gallery |
| FR-REC-04 | Maximum file size per receipt: 5 MB |
| FR-REC-05 | The uploaded image is stored in Supabase Storage under path: `receipts/{user_id}/{transaction_id}.{ext}` |
| FR-REC-06 | An authenticated user can view their own receipt images via a signed URL |
| FR-REC-07 | Receipt images are not publicly accessible |

### 4.5 Dashboard

| ID | Requirement |
|---|---|
| FR-DASH-01 | Displays the user's total running balance (all-time income minus all-time expenses) |
| FR-DASH-02 | Displays total income and total expenses for the current month |
| FR-DASH-03 | Displays the 5 most recent transactions with date, type, category, amount, and note snippet |
| FR-DASH-04 | Provides a quick-add button to navigate to the Add Transaction page |
| FR-DASH-05 | When the user has no transactions, the dashboard shows an empty state with a "Load Sample Data" button; clicking it seeds the sample transactions and categories defined in Section 12 |

### 4.6 Reports

| ID | Requirement |
|---|---|
| FR-RPT-01 | User selects a month and year to generate a monthly report |
| FR-RPT-02 | Report shows: total income, total expenses, net balance for the selected month |
| FR-RPT-03 | Report includes a bar or line chart showing daily income vs expense for the selected month |
| FR-RPT-04 | Report includes a doughnut chart showing expense breakdown by category |
| FR-RPT-05 | Report includes a doughnut chart showing income breakdown by category |
| FR-RPT-06 | User can export the transaction list for the selected month to a CSV file |
| FR-RPT-07 | CSV columns: Date, Type, Category, Amount (MYR), Note |

---

## 5. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Performance | Pages must load within 3 seconds on a standard mobile connection (4G) |
| NFR-02 | Responsiveness | All pages must be usable on screens from 375px (iPhone SE) to 1920px |
| NFR-03 | Security | All data access enforced via Supabase Row Level Security (RLS); no server-side logic bypasses RLS |
| NFR-04 | Security | Supabase anon key is the only credential exposed client-side; it must be scoped to permitted RLS operations only |
| NFR-05 | Availability | Relies on Supabase and Vercel SLAs (both offer 99.9%+ uptime on free/pro tiers) |
| NFR-06 | Accessibility | Minimum WCAG 2.1 Level AA compliance for colour contrast and keyboard navigation |
| NFR-07 | Browser Support | Chrome 110+, Safari 15+, Firefox 110+, Edge 110+ |
| NFR-08 | Storage | Receipt images must not exceed 5 MB per file; total storage per user not capped in V1 |
| NFR-09 | Maintainability | Code must follow consistent formatting and naming conventions (see Section 6) |
| NFR-10 | Observability | Client-side errors are logged to the browser console; future integration with an error monitoring service (e.g., Sentry) is considered for V2 |

---

## 6. Technical Architecture

### 6.1 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | HTML5 + Tailwind CSS + Vanilla JavaScript | Lightweight, no build toolchain required, familiar stack |
| Client SDK | `@supabase/supabase-js` v2 (via CDN) | Official SDK; handles auth, DB queries, and storage |
| Charts | Chart.js v4 (via CDN) | Lightweight, well-documented, no framework dependency |
| Backend / Database | Supabase (PostgreSQL) | Managed, RLS-native, free tier available |
| Auth | Supabase Auth (email/password) | Built-in, handles SMTP, reset flows |
| File Storage | Supabase Storage | Integrated with Auth for per-user access control |
| Hosting | Vercel (static site) | Free tier, GitHub integration, global CDN |
| Source Control | GitHub | Version control, CI/CD trigger for Vercel |

### 6.2 Deployment Architecture

```
GitHub Repository
      │
      │  push to main
      ▼
  Vercel (Static Hosting)
      │
      │  HTTPS
      ▼
  Browser (HTML + Tailwind + JS)
      │
      │  Supabase JS SDK (HTTPS API calls)
      ▼
  Supabase
    ├── Auth (email/password, password reset)
    ├── PostgreSQL (transactions, categories)
    └── Storage (receipt images)
```

### 6.3 Repository Structure

```
my-ledger/
├── index.html                  # Redirect to /dashboard or /login
├── login.html
├── register.html
├── reset-password.html         # Reset password form (linked from email)
├── dashboard.html
├── transactions.html
├── transactions-add.html
├── transactions-edit.html
├── reports.html
├── categories.html
├── settings.html
├── assets/
│   ├── css/
│   │   └── tailwind.min.css
│   └── js/
│       ├── supabase.js         # Supabase client init
│       ├── auth.js             # Auth helpers
│       ├── transactions.js     # CRUD helpers for transactions
│       ├── categories.js       # CRUD helpers for categories
│       ├── storage.js          # Receipt upload/download helpers
│       ├── reports.js          # Report data aggregation
│       ├── charts.js           # Chart.js rendering helpers
│       └── utils.js            # Formatting, date helpers, CSV export
├── docs/
│   ├── PRD.md                  # This document
│   ├── IMPLEMENTATION_PLAN.md  # Phase-by-phase build guide for Claude Code
│   ├── DEPLOYMENT.md           # Deployment guide for developers
│   └── CHANGELOG.md            # Version history
├── .env.example
├── vercel.json
└── README.md
```

### 6.4 Environment Variables

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

> **Note:** Since this is a static frontend (no Node.js server), these values are inlined at build time or referenced directly in `supabase.js`. They must never include the service role key.

---

## 7. Data Model

### 7.1 `transactions`

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

-- Auto-update updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

### 7.2 `categories`

```sql
CREATE TABLE categories (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  type       TEXT        NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

> **Design note:** All categories belong to a `user_id`. Default categories are seeded programmatically on account creation (see Section 12).

### 7.3 Storage Bucket: `receipts`

| Setting | Value |
|---|---|
| Bucket name | `receipts` |
| Public | No (private) |
| File path convention | `{user_id}/{transaction_id}.{ext}` |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp`, `image/heic` |
| Max file size | 5 MB |

---

## 8. Security & Access Control

### 8.1 Row Level Security (RLS) Policies

#### `transactions`

```sql
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

#### `categories`

```sql
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

### 8.2 Storage Policies

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

### 8.3 Client-Side Security Rules

- The Supabase **anon key** is the only credential used in client-side code
- The **service role key** must never be exposed in the frontend
- Receipt signed URLs expire after 60 minutes; generated on demand
- Session: 1hr access token, 7-day refresh token (Supabase defaults)

---

## 9. Pages & User Flows

### 9.1 Page Inventory

| Route | File | Auth Required | Description |
|---|---|---|---|
| `/` | `index.html` | No | Redirect: authenticated → `/dashboard`, guest → `/login` |
| `/login` | `login.html` | No | Email + password login form |
| `/register` | `register.html` | No | Registration form |
| `/reset-password` | `reset-password.html` | No | New password entry (from email link) |
| `/dashboard` | `dashboard.html` | Yes | Balance overview, recent transactions |
| `/transactions` | `transactions.html` | Yes | Full transaction list with filters |
| `/transactions/add` | `transactions-add.html` | Yes | Add new transaction form |
| `/transactions/edit` | `transactions-edit.html` | Yes | Edit transaction form (ID via query param) |
| `/reports` | `reports.html` | Yes | Monthly reports with charts and CSV export |
| `/categories` | `categories.html` | Yes | Manage categories |
| `/settings` | `settings.html` | Yes | Change password |

### 9.2 Authentication Flow

```
[Guest visits any protected page]
        │
        ▼
  Check session (Supabase SDK)
        │
   ┌────┴────┐
   │         │
No session   Has session
   │              │
   ▼              ▼
/login        Load page

[Login page]
  Enter email + password
        │
  supabase.auth.signInWithPassword()
        │
   ┌────┴─────┐
 Error      Success
   │              │
Show error   → /dashboard

[Forgot Password]
  Enter email
        │
  supabase.auth.resetPasswordForEmail()
        │
  Email sent with reset link
        │
  User clicks link → /reset-password
        │
  Enter new password
        │
  supabase.auth.updateUser({ password })
        │
  → /login (with success message)
```

### 9.3 Add Transaction Flow

```
User clicks "Add Transaction"
        │
        ▼
/transactions/add
  ┌─ Date (default: today)
  ├─ Type: Income | Expense
  ├─ Amount (MYR)
  ├─ Category (dropdown, filtered by type)
  ├─ Note (optional)
  └─ Receipt (optional image upload)
        │
  [Save]
        │
  Upload receipt to Storage (if provided)
        │
  Insert transaction row (with receipt_url if uploaded)
        │
  → /transactions (with success toast)
```

---

## 10. Receipt Upload Flow

```
User selects / captures image
        │
  Client-side validation:
  ├─ File type: JPEG / PNG / WebP / HEIC
  └─ File size: ≤ 5 MB
        │
   ┌────┴─────┐
 Invalid     Valid
   │              │
Show error   Generate filename:
             {user_id}/{transaction_id}.{ext}
                  │
             supabase.storage
               .from('receipts')
               .upload(path, file)
                  │
             Save path to receipt_url field
```

> **On Edit:** If a new receipt is uploaded to replace an existing one, the old file is deleted from storage before the new file is uploaded.

> **On Delete Transaction:** The associated receipt file is deleted from storage via `supabase.storage.from('receipts').remove([path])` before the row is deleted.

---

## 11. Reporting Requirements

### 11.1 Monthly Report Components

| Component | Description |
|---|---|
| Month / Year selector | Dropdown or month picker; defaults to current month |
| Summary cards | Total Income (MYR), Total Expenses (MYR), Net Balance (MYR) |
| Daily trend chart | Bar or line chart — income vs expense per day of the selected month |
| Expense by category | Doughnut chart with legend showing category name and amount |
| Income by category | Doughnut chart with legend showing category name and amount |
| Transaction table | Scrollable list of all transactions in the selected month |
| Export CSV button | Downloads filtered transactions as `.csv` |

### 11.2 CSV Export Format

```
Date,Type,Category,Amount (MYR),Note
2026-05-01,income,Salary,5000.00,May 2026
2026-05-03,expense,Food & Dining,45.50,Lunch at Subang Parade
```

---

## 12. Sample Data

### 12.1 Default Categories (seeded on registration)

#### Income Categories

| Name | Type |
|---|---|
| Salary | income |
| Freelance | income |
| Rental Income | income |
| Business Income | income |
| Investment Returns | income |
| Other Income | income |

#### Expense Categories

| Name | Type |
|---|---|
| Food & Dining | expense |
| Groceries | expense |
| Transport | expense |
| Petrol | expense |
| Utilities | expense |
| Telco & Internet | expense |
| Housing & Rent | expense |
| Loan Repayment | expense |
| Medical & Health | expense |
| Education | expense |
| Shopping | expense |
| Entertainment | expense |
| Travel | expense |
| Insurance | expense |
| Other Expense | expense |

### 12.2 Sample Transactions (button-triggered on empty dashboard)

| Date | Type | Category | Amount (MYR) | Note |
|---|---|---|---|---|
| 2026-05-01 | income | Salary | 5,000.00 | May 2026 salary |
| 2026-05-02 | expense | Housing & Rent | 1,200.00 | Monthly rent |
| 2026-05-03 | expense | Food & Dining | 38.50 | Lunch at Subang SS15 |
| 2026-05-04 | expense | Petrol | 60.00 | RON95 full tank |
| 2026-05-05 | expense | Groceries | 215.80 | Aeon Shah Alam |
| 2026-05-07 | income | Freelance | 800.00 | Web design project |
| 2026-05-09 | expense | Utilities | 120.00 | TNB & Indah Water |
| 2026-05-10 | expense | Telco & Internet | 89.00 | Unifi monthly |
| 2026-05-12 | expense | Medical & Health | 75.00 | GP visit |
| 2026-05-14 | expense | Food & Dining | 55.00 | Family dinner |
| 2026-05-15 | expense | Transport | 25.00 | Touch 'n Go reload |
| 2026-05-18 | expense | Entertainment | 48.00 | GSC movie outing |
| 2026-05-20 | expense | Shopping | 199.90 | Clothing, Uniqlo |
| 2026-05-21 | expense | Loan Repayment | 650.00 | Car loan instalment |

---

## 13. Development Phases

| Phase | Milestone | Key Deliverables |
|---|---|---|
| **Phase 1 — Project Setup** | Repo, services, config | GitHub repo; Supabase project; Vercel connected; `.env.example`; `README.md` |
| **Phase 2 — Database & Storage** | Schema live | Tables, RLS policies, storage bucket and policies |
| **Phase 3 — Authentication** | Auth functional | Login, register, logout, forgot/reset password, session guard |
| **Phase 4 — Categories** | Category CRUD | List, add, rename, delete; seed on register |
| **Phase 5 — Transactions CRUD** | Core ledger | Add, edit, delete, list with filters and infinite scroll; receipt upload/view |
| **Phase 6 — Dashboard** | Dashboard live | Running balance; current month cards; recent 5 transactions; empty state with sample data button |
| **Phase 7 — Reports** | Reports live | Month selector; summary cards; daily trend chart; category doughnut charts; CSV export |
| **Phase 8 — Polish & QA** | Production-ready | Mobile QA; empty states; error handling; loading indicators; accessibility check |

---

## 14. Out of Scope (V1)

- OCR / automated data extraction from receipt images *(planned for V2)*
- Multi-currency support
- Shared or family ledger
- Native mobile app
- Bank/credit card account sync
- Budgeting tools or spending limit alerts
- Recurring transaction templates
- Offline / PWA capabilities
- Admin or platform management panel
- Dark mode *(may be added in V1.1)*
- Social login (Google, Apple) *(may be added in V2)*

---

## 15. Open Issues & Decisions

| ID | Issue | Status |
|---|---|---|
| OI-01 | Decide whether "Load Sample Data" is shown automatically to new users or triggered manually | **Resolved:** Button-triggered on empty dashboard |
| OI-02 | Confirm whether transaction edit should allow changing transaction type (income ↔ expense) | **Resolved:** Full edit and delete allowed on all transactions |
| OI-03 | Define session expiry duration (Supabase default: 1 hour access token, 7-day refresh token) | **Resolved:** Follow Supabase defaults (1hr access token, 7-day refresh token) |
| OI-04 | Decide pagination strategy: numbered pages vs infinite scroll on `/transactions` | **Resolved:** Infinite scroll |
| OI-05 | Confirm whether category type `both` is included in V1 or only `income` / `expense` | **Resolved:** Simplified to `income` and `expense` only |

---

## 16. Appendix: Glossary

| Term | Definition |
|---|---|
| **Transaction** | A single financial event: either income received or an expense paid |
| **Running Balance** | The cumulative total of all income minus all expenses, across all time |
| **Category** | A user-defined label used to classify a transaction (e.g., "Food & Dining", "Salary") |
| **Receipt** | An image file (photo or scan) attached to a transaction as a supporting document |
| **RLS** | Row Level Security — a PostgreSQL feature used to restrict data access at the row level based on the authenticated user |
| **MYR** | Malaysian Ringgit — the fixed currency for all monetary values in this application |
| **Supabase Anon Key** | A public, scoped API key used client-side to interact with Supabase; it does not bypass RLS |
| **Signed URL** | A time-limited, authenticated URL generated by Supabase Storage for secure access to private files |
| **Seed Data** | Pre-defined data (categories, sample transactions) automatically created for new user accounts |

---

*End of Document — MyLedger PRD v1.0.0*
