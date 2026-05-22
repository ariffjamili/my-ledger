// Shared helpers used across pages. Exposes window.utils.

const DEFAULT_CATEGORIES = [
  { name: 'Salary',             type: 'income' },
  { name: 'Freelance',          type: 'income' },
  { name: 'Rental Income',      type: 'income' },
  { name: 'Business Income',    type: 'income' },
  { name: 'Investment Returns', type: 'income' },
  { name: 'Other Income',       type: 'income' },
  { name: 'Food & Dining',      type: 'expense' },
  { name: 'Groceries',          type: 'expense' },
  { name: 'Transport',          type: 'expense' },
  { name: 'Petrol',             type: 'expense' },
  { name: 'Utilities',          type: 'expense' },
  { name: 'Telco & Internet',   type: 'expense' },
  { name: 'Housing & Rent',     type: 'expense' },
  { name: 'Loan Repayment',     type: 'expense' },
  { name: 'Medical & Health',   type: 'expense' },
  { name: 'Education',          type: 'expense' },
  { name: 'Shopping',           type: 'expense' },
  { name: 'Entertainment',      type: 'expense' },
  { name: 'Travel',             type: 'expense' },
  { name: 'Insurance',          type: 'expense' },
  { name: 'Other Expense',      type: 'expense' },
];

function getToastRegion() {
  let region = document.getElementById('toast-region');
  if (!region) {
    region = document.createElement('div');
    region.id = 'toast-region';
    region.className = 'fixed top-4 right-4 z-50 flex w-full max-w-xs flex-col gap-2';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    document.body.appendChild(region);
  }
  return region;
}

function toast(message, type = 'info') {
  const styles = {
    success: 'bg-emerald-600 text-white',
    error:   'bg-rose-600 text-white',
    info:    'bg-slate-800 text-white',
  };
  const el = document.createElement('div');
  el.className = `rounded-md px-4 py-2 text-sm shadow-lg transition-opacity duration-200 ${styles[type] || styles.info}`;
  el.textContent = message;
  getToastRegion().appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 200);
  }, 3800);
}

function formatMYR(amount) {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

window.utils = { toast, formatMYR, DEFAULT_CATEGORIES };
