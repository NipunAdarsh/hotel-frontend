import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { readApiResponse } from '../utils/apiResponse';

interface Promo {
  promo_code: string;
  title: string;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: number;
  created_at: string;
}

const defaultForm = {
  promo_code: '',
  title: '',
  discount_type: 'PERCENT' as const,
  discount_value: 15,
  max_uses: '',
  starts_at: '',
  ends_at: '',
  is_active: true
};

export const ManagePromos: React.FC = () => {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  }, []);

  const fetchPromos = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/promos`, { headers: authHeaders });
      const data = await readApiResponse<Promo[] | { error?: string }>(response);
      if (!response.ok || !Array.isArray(data)) {
        throw new Error(('error' in data && data.error) || 'Failed to fetch promo codes.');
      }
      setPromos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch promo codes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => setForm(defaultForm);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        promo_code: form.promo_code.trim().toUpperCase(),
        title: form.title.trim(),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        max_uses: form.max_uses === '' ? null : Number(form.max_uses),
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        is_active: form.is_active ? 1 : 0
      };

      const response = await fetch(`${API_BASE_URL}/api/promos`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await readApiResponse<{ error?: string; message?: string }>(response);
      if (!response.ok) throw new Error(data.error || 'Failed to save promo code.');
      resetForm();
      await fetchPromos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save promo code.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (promo_code: string) => {
    if (!window.confirm(`Delete promo ${promo_code}?`)) return;
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/promos/${encodeURIComponent(promo_code)}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await readApiResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error || 'Failed to delete promo.');
      await fetchPromos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete promo.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto rounded-3xl border border-white/60 bg-white/40 p-6 shadow-2xl backdrop-blur-3xl h-[85vh] lg:p-10">
      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-headline text-3xl font-black text-primary">Promo Codes</h2>
          <p className="mt-1 max-w-3xl font-medium text-on-surface-variant">
            Create promo codes for the guest booking flow. You can set discount type/value, date windows, and a usage limit.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-3xl border border-outline-variant/20 bg-white/70 p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3 text-primary">
          <div className="rounded-2xl bg-primary/10 p-2">
            <Plus className="h-5 w-5" />
          </div>
          <h3 className="font-headline text-xl font-black">Create / Update Promo</h3>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-primary/60">Promo code</span>
            <input
              value={form.promo_code}
              onChange={(e) => setForm((c) => ({ ...c, promo_code: e.target.value }))}
              className="room-admin-input"
              placeholder="e.g., LUXE15"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-primary/60">Title</span>
            <input
              value={form.title}
              onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
              className="room-admin-input"
              placeholder="e.g., Weekend Saver"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-primary/60">Discount type</span>
            <select
              value={form.discount_type}
              onChange={(e) => setForm((c) => ({ ...c, discount_type: e.target.value as 'PERCENT' | 'FIXED' }))}
              className="room-admin-input"
            >
              <option value="PERCENT">Percent</option>
              <option value="FIXED">Fixed (Rs)</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-primary/60">Discount value</span>
            <input
              type="number"
              min="0"
              value={form.discount_value}
              onChange={(e) => setForm((c) => ({ ...c, discount_value: Number(e.target.value) }))}
              className="room-admin-input"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-primary/60">Max uses</span>
            <input
              type="number"
              min="0"
              value={form.max_uses}
              onChange={(e) => setForm((c) => ({ ...c, max_uses: e.target.value }))}
              className="room-admin-input"
              placeholder="Blank = unlimited"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-primary/60">Active</span>
            <select
              value={form.is_active ? 'yes' : 'no'}
              onChange={(e) => setForm((c) => ({ ...c, is_active: e.target.value === 'yes' }))}
              className="room-admin-input"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-primary/60">Starts at</span>
            <input
              type="date"
              value={form.starts_at}
              onChange={(e) => setForm((c) => ({ ...c, starts_at: e.target.value }))}
              className="room-admin-input"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-primary/60">Ends at</span>
            <input
              type="date"
              value={form.ends_at}
              onChange={(e) => setForm((c) => ({ ...c, ends_at: e.target.value }))}
              className="room-admin-input"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={resetForm}
            className="rounded-xl border border-primary/15 px-6 py-3 font-bold text-primary transition hover:bg-primary/5"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3 font-bold text-white transition hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-5 w-5" />
            {saving ? 'Saving...' : 'Save Promo'}
          </button>
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-3xl border border-outline-variant/20 bg-white/70 shadow-sm">
        <div className="p-6 border-b border-outline-variant/20">
          <h3 className="font-headline text-xl font-black text-primary">Existing promos</h3>
          <p className="mt-1 text-sm font-semibold text-on-surface-variant">
            Usage count updates automatically when guests book with a promo code.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-variant/30 text-sm uppercase tracking-wider text-primary/60">
                <th className="p-5 font-bold">Code</th>
                <th className="p-5 font-bold">Title</th>
                <th className="p-5 font-bold">Discount</th>
                <th className="p-5 font-bold">Usage</th>
                <th className="p-5 font-bold">Window</th>
                <th className="p-5 font-bold">Active</th>
                <th className="p-5 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center font-bold text-primary/60">
                    Loading promos...
                  </td>
                </tr>
              ) : promos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center font-bold text-primary/60">
                    No promo codes yet.
                  </td>
                </tr>
              ) : (
                promos.map((promo) => (
                  <tr key={promo.promo_code} className="border-b border-outline-variant/10 transition-colors hover:bg-white">
                    <td className="p-5 font-black text-primary">{promo.promo_code}</td>
                    <td className="p-5 font-semibold text-on-surface-variant">{promo.title}</td>
                    <td className="p-5 font-bold text-secondary">
                      {promo.discount_type === 'PERCENT'
                        ? `${Number(promo.discount_value)}%`
                        : `Rs ${Number(promo.discount_value).toLocaleString('en-IN')}`}
                    </td>
                    <td className="p-5 font-bold text-primary">
                      {promo.used_count} / {promo.max_uses === null ? '∞' : promo.max_uses}
                    </td>
                    <td className="p-5 text-sm font-semibold text-on-surface-variant">
                      {promo.starts_at || '—'} → {promo.ends_at || '—'}
                    </td>
                    <td className="p-5 font-bold text-primary">{promo.is_active ? 'Yes' : 'No'}</td>
                    <td className="p-5">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() =>
                            setForm({
                              promo_code: promo.promo_code,
                              title: promo.title,
                              discount_type: promo.discount_type,
                              discount_value: Number(promo.discount_value),
                              max_uses: promo.max_uses === null ? '' : String(promo.max_uses),
                              starts_at: promo.starts_at || '',
                              ends_at: promo.ends_at || '',
                              is_active: Boolean(promo.is_active)
                            })
                          }
                          className="rounded-lg bg-surface-variant/50 px-3 py-2 font-bold text-primary transition-colors hover:bg-primary/10"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(promo.promo_code)}
                          className="rounded-lg bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100"
                          aria-label={`Delete promo ${promo.promo_code}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

