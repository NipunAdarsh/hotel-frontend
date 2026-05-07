import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { readApiResponse } from '../utils/apiResponse';

interface DiningShowcase {
  most_ordered_title: string;
  most_ordered_subtitle: string;
  chef_recommendation_title: string;
  chef_recommendation_subtitle: string;
  dessert_week_title: string;
  dessert_week_subtitle: string;
}

const defaultShowcase: DiningShowcase = {
  most_ordered_title: '',
  most_ordered_subtitle: '',
  chef_recommendation_title: '',
  chef_recommendation_subtitle: '',
  dessert_week_title: '',
  dessert_week_subtitle: ''
};

export const ManageDining: React.FC = () => {
  const [form, setForm] = useState<DiningShowcase>(defaultShowcase);
  const [statusMsg, setStatusMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchShowcase = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/public/dining`);
        const data = await readApiResponse<{ showcase?: DiningShowcase; error?: string }>(response);
        if (!response.ok) throw new Error(data.error || 'Failed to load dining showcase.');
        setForm(data.showcase || defaultShowcase);
      } catch (error) {
        setStatusMsg(error instanceof Error ? error.message : 'Failed to load dining showcase.');
      }
    };

    fetchShowcase();
  }, []);

  const handleSave = async () => {
    setStatusMsg('');
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/restaurant/highlights`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });
      const data = await readApiResponse<{ error?: string; message?: string }>(response);
      if (!response.ok) throw new Error(data.error || 'Failed to save dining highlights.');
      setStatusMsg(data.message || 'Dining highlights updated.');
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Failed to save dining highlights.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto rounded-3xl border border-white/60 bg-white/40 p-6 shadow-2xl backdrop-blur-3xl h-[85vh] lg:p-10">
      <div className="mb-8">
        <h2 className="font-headline text-3xl font-black text-primary">Dining Highlights</h2>
        <p className="mt-1 max-w-3xl font-medium text-on-surface-variant">
          Update the preview page cards for Most Ordered Tonight, Chef Recommendation, and Dessert of the Week.
        </p>
      </div>

      {statusMsg && (
        <div className="mb-6 rounded-2xl border border-primary/15 bg-primary/5 px-5 py-4 text-sm font-bold text-primary">
          {statusMsg}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <input
          value={form.most_ordered_title}
          onChange={(e) => setForm((c) => ({ ...c, most_ordered_title: e.target.value }))}
          placeholder="Most Ordered title"
          className="room-admin-input"
        />
        <input
          value={form.most_ordered_subtitle}
          onChange={(e) => setForm((c) => ({ ...c, most_ordered_subtitle: e.target.value }))}
          placeholder="Most Ordered subtitle"
          className="room-admin-input"
        />

        <input
          value={form.chef_recommendation_title}
          onChange={(e) => setForm((c) => ({ ...c, chef_recommendation_title: e.target.value }))}
          placeholder="Chef Recommendation title"
          className="room-admin-input"
        />
        <input
          value={form.chef_recommendation_subtitle}
          onChange={(e) => setForm((c) => ({ ...c, chef_recommendation_subtitle: e.target.value }))}
          placeholder="Chef Recommendation subtitle"
          className="room-admin-input"
        />

        <input
          value={form.dessert_week_title}
          onChange={(e) => setForm((c) => ({ ...c, dessert_week_title: e.target.value }))}
          placeholder="Dessert of week title"
          className="room-admin-input"
        />
        <input
          value={form.dessert_week_subtitle}
          onChange={(e) => setForm((c) => ({ ...c, dessert_week_subtitle: e.target.value }))}
          placeholder="Dessert of week subtitle"
          className="room-admin-input"
        />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Highlights'}
        </button>
      </div>
    </div>
  );
};

