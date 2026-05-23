// Categories CRUD helpers. Exposes window.categories.
//
// All queries rely on Supabase RLS — only the current user's rows are
// returned, and inserts must include user_id matching auth.uid().

async function getCategories(type) {
  let query = window.supabaseClient
    .from('categories')
    .select('*')
    .order('name', { ascending: true });
  if (type) query = query.eq('type', type);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function getTransactionCounts() {
  // Single round-trip: fetch every transaction's category_id, tally client-side.
  // Returns { [category_id]: count }. Uncategorised rows (null) are skipped.
  const { data, error } = await window.supabaseClient
    .from('transactions')
    .select('category_id');
  if (error) throw error;
  const counts = {};
  for (const row of data) {
    if (!row.category_id) continue;
    counts[row.category_id] = (counts[row.category_id] || 0) + 1;
  }
  return counts;
}

async function createCategory(name, type) {
  const user = await window.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await window.supabaseClient
    .from('categories')
    .insert({ name: name.trim(), type, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateCategory(id, name) {
  const { data, error } = await window.supabaseClient
    .from('categories')
    .update({ name: name.trim() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteCategory(id) {
  const { error } = await window.supabaseClient
    .from('categories')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

window.categories = {
  getCategories,
  getTransactionCounts,
  createCategory,
  updateCategory,
  deleteCategory,
};
