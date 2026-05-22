-- MyLedger — Row Level Security & Storage Policies
--
-- Run this in Supabase Dashboard → SQL Editor → New query.
-- Safe to re-run: each policy is dropped before being recreated.
--
-- Prerequisites:
--   * `categories` and `transactions` tables exist (see docs/IMPLEMENTATION_PLAN.md Phase 2).
--   * `receipts` storage bucket exists (created via Dashboard → Storage → New Bucket).

-- =============================================================
-- 1. categories
-- =============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own categories"   ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;

CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE USING (auth.uid() = user_id);

-- =============================================================
-- 2. transactions
-- =============================================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions"   ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE USING (auth.uid() = user_id);

-- =============================================================
-- 3. storage.objects — receipts bucket
-- Path convention: receipts/{user_id}/{transaction_id}.{ext}
-- storage.foldername(name)[1] returns the {user_id} segment.
-- =============================================================
DROP POLICY IF EXISTS "Users can upload own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own receipts"   ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own receipts" ON storage.objects;

CREATE POLICY "Users can upload own receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own receipts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================================
-- 4. Verification — copy/paste separately to confirm.
-- Should return 8 table policies + 3 storage policies.
-- =============================================================
-- SELECT schemaname, tablename, policyname, cmd
-- FROM pg_policies
-- WHERE (schemaname = 'public' AND tablename IN ('categories', 'transactions'))
--    OR (schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%receipts%')
-- ORDER BY schemaname, tablename, policyname;
