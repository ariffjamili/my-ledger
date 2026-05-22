-- MyLedger — Auth triggers
--
-- Run this ONCE in Supabase Dashboard → SQL Editor → New query.
-- Safe to re-run.
--
-- Seeds the 21 default categories (PRD §12.1) for every new user.
-- Runs as SECURITY DEFINER so it bypasses RLS — this is required
-- because at the moment of auth.users INSERT there is no session yet
-- (when email confirmation is enabled). Without this trigger, the
-- JS-side seed call would fail with an RLS error.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, type) VALUES
    (NEW.id, 'Salary',             'income'),
    (NEW.id, 'Freelance',          'income'),
    (NEW.id, 'Rental Income',      'income'),
    (NEW.id, 'Business Income',    'income'),
    (NEW.id, 'Investment Returns', 'income'),
    (NEW.id, 'Other Income',       'income'),
    (NEW.id, 'Food & Dining',      'expense'),
    (NEW.id, 'Groceries',          'expense'),
    (NEW.id, 'Transport',          'expense'),
    (NEW.id, 'Petrol',             'expense'),
    (NEW.id, 'Utilities',          'expense'),
    (NEW.id, 'Telco & Internet',   'expense'),
    (NEW.id, 'Housing & Rent',     'expense'),
    (NEW.id, 'Loan Repayment',     'expense'),
    (NEW.id, 'Medical & Health',   'expense'),
    (NEW.id, 'Education',          'expense'),
    (NEW.id, 'Shopping',           'expense'),
    (NEW.id, 'Entertainment',      'expense'),
    (NEW.id, 'Travel',             'expense'),
    (NEW.id, 'Insurance',          'expense'),
    (NEW.id, 'Other Expense',      'expense');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify (paste separately):
-- SELECT tgname, tgrelid::regclass
-- FROM pg_trigger
-- WHERE tgname = 'on_auth_user_created';
