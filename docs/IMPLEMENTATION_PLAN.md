# MyLedger — Implementation Plan
## Claude Code Handoff Document

---

| Field | Details |
|---|---|
| **Document Version** | 1.0.0 |
| **Status** | Active |
| **Created** | 2026-05-22 |
| **Reference** | `docs/PRD.md` |

---

## Context for Claude Code

This document is the continuation point for building **MyLedger** — a multi-user personal income and expense tracker. All product decisions have been finalised and are documented in `docs/PRD.md`. This document provides the phase-by-phase build instructions.

### Stack Summary

| Layer | Technology |
|---|---|
| Frontend | HTML5 + Tailwind CSS (CDN) + Vanilla JavaScript |
| Auth / DB / Storage | Supabase (`@supabase/supabase-js` v2 via CDN) |
| Charts | Chart.js v4 (CDN) |
| Hosting | Vercel (static) |
| Source Control | GitHub |

### Key Constraints

- No build toolchain (no npm, no bundler) — pure static files
- No PHP, no server-side code
- All logic runs client-side via Supabase JS SDK
- All data access enforced via Supabase RLS — never bypass it
- Currency fixed to MYR throughout
- Never expose the Supabase service role key in any file

---

## Repository Structure (Target)

```
my-ledger/
├── index.html
├── login.html
├── register.html
├── reset-password.html
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
│       ├── supabase.js
│       ├── auth.js
│       ├── transactions.js
│       ├── categories.js
│       ├── storage.js
│       ├── reports.js
│       ├── charts.js
│       └── utils.js
├── docs/
│   ├── PRD.md
│   ├── IMPLEMENTATION_PLAN.md   ← this file
│   ├── DEPLOYMENT.md
│   └── CHANGELOG.md
├── .env.example
├── .gitignore
├── vercel.json
└── README.md
```

---

## Phase Checklist

### Phase 1 — Project Setup
**Goal:** Working skeleton with all services connected.

- [x] Initialise Git repository in `/Users/ariffjamili/Sites/my-ledger`
- [x] Create `.gitignore` (ignore `.env`, `node_modules`, `.DS_Store`)
- [x] Create `.env.example` with placeholder values:
  ```
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_ANON_KEY=your-anon-key
  ```
- [x] Create `assets/js/supabase.js` — initialise Supabase client reading from `window.ENV` or inline config
- [x] Create `vercel.json` with clean URL routing (no `.html` extensions)
- [x] Create stub HTML files for all 11 pages (empty shell with nav placeholder)
- [x] Write `README.md` (see documentation requirements below)
- [x] Write `docs/DEPLOYMENT.md`
- [x] Write `docs/CHANGELOG.md` with initial entry
- [x] Push to GitHub

**vercel.json routing config:**
```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    { "source": "/dashboard", "destination": "/dashboard.html" },
    { "source": "/transactions", "destination": "/transactions.html" },
    { "source": "/transactions/add", "destination": "/transactions-add.html" },
    { "source": "/transactions/edit", "destination": "/transactions-edit.html" },
    { "source": "/reports", "destination": "/reports.html" },
    { "source": "/categories", "destination": "/categories.html" },
    { "source": "/settings", "destination": "/settings.html" },
    { "source": "/login", "destination": "/login.html" },
    { "source": "/register", "destination": "/register.html" },
    { "source": "/reset-password", "destination": "/reset-password.html" }
  ]
}
```

---

### Phase 2 — Database & Storage
**Goal:** All Supabase tables, RLS policies, and storage bucket created and tested.

Run the following SQL in the Supabase SQL Editor:

**Step 1: Enable `moddatetime` extension**
```sql
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;
```

**Step 2: Create `categories` table**
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

**Step 3: Create `transactions` table**
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

**Step 4: Create `receipts` storage bucket**

In Supabase Dashboard → Storage → New Bucket:
- Name: `receipts`
- Public: No
- File size limit: 5242880 (5 MB)
- Allowed MIME types: `image/jpeg, image/png, image/webp, image/heic`

Then run storage policies:
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

- [x] All tables created and verified
- [x] RLS policies applied on both tables
- [x] Storage bucket `receipts` created
- [x] Storage policies applied

---

### Phase 3 — Authentication
**Goal:** Login, register, logout, forgot password, reset password all working. Session guard on protected pages.

**Files to create/edit:**
- `login.html` + `assets/js/auth.js`
- `register.html`
- `reset-password.html`
- `assets/js/auth.js` — shared auth helpers

**auth.js responsibilities:**
```javascript
// Key functions to implement:
checkSession()         // Redirect to /login if no session; call on every protected page
getUser()              // Return current user object
signIn(email, pass)    // supabase.auth.signInWithPassword()
signUp(email, pass)    // supabase.auth.signUp() + seed default categories
signOut()              // supabase.auth.signOut() + redirect to /login
requestPasswordReset() // supabase.auth.resetPasswordForEmail()
updatePassword()       // supabase.auth.updateUser({ password })
```

**Category seeding on sign-up:**
After `supabase.auth.signUp()` succeeds, immediately insert the default categories (listed in PRD Section 12.1) for the new user. Use a batch insert:
```javascript
const defaultCategories = [
  { name: 'Salary', type: 'income' },
  { name: 'Freelance', type: 'income' },
  { name: 'Rental Income', type: 'income' },
  { name: 'Business Income', type: 'income' },
  { name: 'Investment Returns', type: 'income' },
  { name: 'Other Income', type: 'income' },
  { name: 'Food & Dining', type: 'expense' },
  { name: 'Groceries', type: 'expense' },
  { name: 'Transport', type: 'expense' },
  { name: 'Petrol', type: 'expense' },
  { name: 'Utilities', type: 'expense' },
  { name: 'Telco & Internet', type: 'expense' },
  { name: 'Housing & Rent', type: 'expense' },
  { name: 'Loan Repayment', type: 'expense' },
  { name: 'Medical & Health', type: 'expense' },
  { name: 'Education', type: 'expense' },
  { name: 'Shopping', type: 'expense' },
  { name: 'Entertainment', type: 'expense' },
  { name: 'Travel', type: 'expense' },
  { name: 'Insurance', type: 'expense' },
  { name: 'Other Expense', type: 'expense' },
]
```

**Supabase Auth settings to configure in dashboard:**
- Enable email confirmations: Yes
- Password minimum length: 8
- Set Site URL to Vercel domain
- Add redirect URL for password reset: `https://your-domain.vercel.app/reset-password`

- [ ] Login page — form, error handling, redirect on success
- [ ] Register page — form, password confirmation, seed categories on success
- [ ] Forgot password — email input, success message
- [ ] Reset password — new password + confirm, handles Supabase redirect token
- [ ] `checkSession()` guard added to all 7 protected pages
- [ ] Logout button in nav on all protected pages

---

### Phase 4 — Categories
**Goal:** Categories page with full CRUD.

**Files:**
- `categories.html`
- `assets/js/categories.js`

**categories.js responsibilities:**
```javascript
getCategories(type?)      // Fetch all user categories, optionally filtered by type
createCategory(name, type)
updateCategory(id, name)
deleteCategory(id)        // Confirm before delete; show warning if transactions exist
```

**UI requirements:**
- Separate sections for Income and Expense categories
- Inline rename (click to edit)
- Delete with confirmation modal
- Add new category form (name + type selector)
- Show transaction count per category (optional but useful)

- [ ] List income categories
- [ ] List expense categories
- [ ] Add new category
- [ ] Rename category (inline edit)
- [ ] Delete category with confirmation

---

### Phase 5 — Transactions CRUD
**Goal:** Full transaction management with receipt upload.

**Files:**
- `transactions.html`
- `transactions-add.html`
- `transactions-edit.html`
- `assets/js/transactions.js`
- `assets/js/storage.js`

**transactions.js responsibilities:**
```javascript
getTransactions(filters, page)  // filters: { month, year, type, category_id }
                                 // page: for infinite scroll (range offset)
getTransaction(id)
createTransaction(data)
updateTransaction(id, data)
deleteTransaction(id)           // Delete receipt from storage first, then row
```

**storage.js responsibilities:**
```javascript
uploadReceipt(userId, transactionId, file)  // Returns receipt_url path
deleteReceipt(path)
getReceiptSignedUrl(path)                   // Expires in 3600 seconds
```

**Infinite scroll implementation:**
```javascript
// Load 20 per batch
const PAGE_SIZE = 20
let offset = 0
let isLoading = false
let hasMore = true

// On scroll near bottom:
window.addEventListener('scroll', () => {
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200) {
    if (!isLoading && hasMore) loadMore()
  }
})
```

**Receipt upload input:**
```html
<input type="file" accept="image/jpeg,image/png,image/webp,image/heic"
       capture="environment" id="receipt-input">
```
> `capture="environment"` opens the camera on mobile; still shows gallery option.

**Receipt validation (client-side):**
- Allowed types: `image/jpeg`, `image/png`, `image/webp`, `image/heic`
- Max size: 5 MB (5,242,880 bytes)
- Show error toast if validation fails

- [ ] Transaction list with filters (month, type, category)
- [ ] Infinite scroll (20 per batch)
- [ ] Add transaction form with all fields
- [ ] Receipt upload with validation
- [ ] Edit transaction — all fields editable; replace/remove receipt
- [ ] Delete transaction — delete receipt from storage first, then DB row
- [ ] View receipt (signed URL in modal or new tab)

---

### Phase 6 — Dashboard
**Goal:** Overview page with balance, current month summary, recent transactions, and empty state.

**Files:**
- `dashboard.html`

**Data to fetch on load:**
1. All-time running balance: `SUM(amount) WHERE type='income'` minus `SUM(amount) WHERE type='expense'`
2. Current month income: `SUM(amount) WHERE type='income' AND date in current month`
3. Current month expenses: `SUM(amount) WHERE type='expense' AND date in current month`
4. Recent 5 transactions: `ORDER BY date DESC LIMIT 5`
5. Transaction count: to determine empty state

**Empty state behaviour:**
- If transaction count = 0, show:
  - Friendly message: "Your ledger is empty. Start tracking or load some sample data."
  - Button: "Load Sample Data"
  - Button: "Add Transaction"

**Load Sample Data function:**
```javascript
// In utils.js or dashboard.js
async function loadSampleData(userId) {
  // 1. Get user's category IDs by name
  // 2. Insert 14 sample transactions (see PRD Section 12.2)
  // 3. Reload dashboard
}
```

- [ ] Running balance card
- [ ] Current month income card
- [ ] Current month expense card
- [ ] Recent 5 transactions list
- [ ] Empty state with "Load Sample Data" button
- [ ] "Add Transaction" quick-add button
- [ ] Navigation bar linking to all pages

---

### Phase 7 — Reports
**Goal:** Monthly report page with charts and CSV export.

**Files:**
- `reports.html`
- `assets/js/reports.js`
- `assets/js/charts.js`

**reports.js responsibilities:**
```javascript
getMonthlyTransactions(year, month)
getMonthSummary(year, month)         // Returns { income, expenses, net }
getDailyBreakdown(year, month)       // Returns array of { day, income, expense }
getCategoryBreakdown(year, month, type) // Returns array of { category, total }
```

**charts.js responsibilities:**
```javascript
renderDailyTrendChart(canvasId, data)     // Bar chart — daily income vs expense
renderExpenseCategoryChart(canvasId, data) // Doughnut chart
renderIncomeCategoryChart(canvasId, data)  // Doughnut chart
```

**CSV export (client-side, no server):**
```javascript
function exportToCSV(transactions, yearMonth) {
  const header = 'Date,Type,Category,Amount (MYR),Note'
  const rows = transactions.map(t =>
    `${t.date},${t.type},${t.category_name},${t.amount.toFixed(2)},"${t.note || ''}"`
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `myledger-${yearMonth}.csv`
  a.click()
}
```

- [ ] Month / year selector (defaults to current month)
- [ ] Summary cards: total income, total expenses, net balance
- [ ] Daily trend bar chart (Chart.js)
- [ ] Expense by category doughnut chart
- [ ] Income by category doughnut chart
- [ ] Transaction table for selected month
- [ ] Export CSV button

---

### Phase 8 — Polish & QA
**Goal:** Production-ready, mobile-friendly, handles errors gracefully.

**Checklist:**

**Mobile responsiveness:**
- [ ] Test all pages at 375px (iPhone SE)
- [ ] Test at 768px (tablet)
- [ ] Ensure touch targets ≥ 44px
- [ ] Navigation usable on mobile (hamburger menu or bottom nav)

**Empty states:**
- [ ] Transaction list — no transactions for selected filter
- [ ] Reports — no data for selected month
- [ ] Categories — no categories (should not happen due to seeding, but handle anyway)

**Error handling:**
- [ ] Network errors: show user-friendly toast, not raw error
- [ ] Failed uploads: clear error message, allow retry
- [ ] Supabase errors: log to console, show generic message to user
- [ ] Form validation: inline errors on all required fields

**Loading states:**
- [ ] Skeleton loaders or spinners on data fetch
- [ ] Disable submit buttons during async operations
- [ ] Loading indicator on infinite scroll batch fetch

**Accessibility:**
- [ ] All form inputs have associated `<label>`
- [ ] Colour contrast ratio ≥ 4.5:1 for text
- [ ] Focus styles visible on all interactive elements
- [ ] `aria-label` on icon-only buttons

**Final checks:**
- [ ] Test password reset flow end-to-end
- [ ] Test receipt upload on mobile (camera + gallery)
- [ ] Test CSV export
- [ ] Verify RLS — confirm one user cannot access another's data
- [ ] Check `.env.example` is accurate
- [ ] Update `docs/CHANGELOG.md` with v1.0.0 entry
- [ ] Update `README.md` with final setup steps

---

## Documentation Requirements

The following documentation files must be maintained throughout development:

| File | Purpose | When to Update |
|---|---|---|
| `README.md` | Developer onboarding; setup guide | Phase 1 creation; update at each phase |
| `docs/PRD.md` | Product requirements; source of truth | Only for scope changes |
| `docs/IMPLEMENTATION_PLAN.md` | This file; build checklist | Check off items as completed |
| `docs/DEPLOYMENT.md` | Step-by-step deployment guide | Phase 1; update if process changes |
| `docs/CHANGELOG.md` | Version history | Every meaningful change |

### README.md must include:
- Project overview (1 paragraph)
- Tech stack table
- Prerequisites
- Local setup steps (clone → configure env → open in browser)
- Supabase setup steps (create project, run SQL, create bucket)
- Vercel deployment steps
- Environment variables reference
- Project structure overview
- Link to `docs/PRD.md`
- Link to `docs/DEPLOYMENT.md`

### CHANGELOG.md format (Keep a Changelog standard):
```markdown
# Changelog

All notable changes to MyLedger will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [Unreleased]

## [1.0.0] - YYYY-MM-DD
### Added
- Initial release
```

---

## Coding Standards

### HTML
- Use semantic HTML5 elements (`<main>`, `<nav>`, `<section>`, `<article>`)
- All inputs must have a corresponding `<label>`
- Use `data-*` attributes for JS hooks, not classes

### JavaScript
- ES6+ (`const`, `let`, arrow functions, async/await, template literals)
- No jQuery
- One responsibility per file (see file list above)
- All Supabase calls wrapped in `try/catch`
- Use `console.error()` for caught errors
- No `alert()` — use toast notifications instead

### CSS / Tailwind
- Tailwind utility classes only
- No custom CSS unless Tailwind cannot achieve the result
- Responsive-first: mobile layout first, then `md:` and `lg:` breakpoints

### Naming Conventions
- HTML files: `kebab-case.html`
- JS functions: `camelCase`
- JS files: `camelCase.js`
- CSS classes: Tailwind utilities only
- Supabase table columns: `snake_case`

---

## Current Status

| Phase | Status |
|---|---|
| Phase 1 — Project Setup | ✅ Complete |
| Phase 2 — Database & Storage | ✅ Complete |
| Phase 3 — Authentication | ⬜ Not started |
| Phase 4 — Categories | ⬜ Not started |
| Phase 5 — Transactions CRUD | ⬜ Not started |
| Phase 6 — Dashboard | ⬜ Not started |
| Phase 7 — Reports | ⬜ Not started |
| Phase 8 — Polish & QA | ⬜ Not started |

---

*MyLedger Implementation Plan v1.0.0 — Created 2026-05-22*
