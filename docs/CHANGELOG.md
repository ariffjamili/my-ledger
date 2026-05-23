# Changelog

All notable changes to MyLedger will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Changed
- Hosting switched from Vercel to Cloudflare Pages. `vercel.json` removed; `_redirects` added in the project root with clean-URL rewrites for all 10 non-index routes. Deployment and README docs updated to reflect Cloudflare Pages setup (dashboard connect-to-Git flow, env vars, custom domain via Cloudflare-managed DNS).

### Planned for V2
- OCR / automated data extraction from receipt images
- Social login (Google, Apple)
- Dark mode
- PWA / offline support

---

## [1.0.0] - Unreleased

### Added
- Multi-user authentication with email and password (Supabase Auth)
- Forgot password and self-service password reset flow
- User-managed income and expense categories
- Default category set seeded on new account registration
- Transaction entry: date, type (income/expense), amount (MYR), category, note, receipt image
- Receipt image upload via phone camera or file picker (JPEG, PNG, WebP, HEIC; max 5 MB)
- Receipt images stored securely in Supabase Storage with per-user access control
- Transaction list with filtering by month/year, type, and category
- Infinite scroll on transaction list (20 per batch)
- Full transaction edit including type change (income ↔ expense)
- Transaction delete with associated receipt cleanup
- Dashboard: running balance, current month income/expense, recent 5 transactions
- Empty state on dashboard with "Load Sample Data" button
- Sample data set (14 transactions, 21 categories) for new users
- Monthly reports with summary cards, daily trend chart, category doughnut charts
- CSV export for any selected month
- Row Level Security (RLS) enforced on all database tables and storage
- Mobile-responsive design (375px to 1920px)
- Cloudflare Pages deployment with clean URLs via `_redirects`

---

*Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)*
