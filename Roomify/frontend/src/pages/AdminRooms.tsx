import React, { useEffect, useMemo, useState } from 'react';
import { Edit, Plus, Trash2, X, ChevronDown } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { readApiResponse } from '../utils/apiResponse';

interface Room {
  room_id: number;
  room_number: string;
  type: string;
  price_per_night: number;
  status: string;
  title: string;
  capacity: number;
  rating: number;
  popular: boolean;
  image_url: string;
  gallery: string[];
  description: string;
  amenities: string[];
  included: string[];
  policy: string;
}

interface RoomForm {
  room_number: string;
  type: string;
  price_per_night: string;
  status: string;
  title: string;
  capacity: string;
  rating: string;
  popular: boolean;
  image_url: string;
  gallery: string;
  description: string;
  amenities: string;
  included: string;
  policy: string;
}

const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Premium', 'Family', 'Luxury'];
const roomStatuses = ['Available', 'Occupied', 'Maintenance'];

const defaultForm: RoomForm = {
  room_number: '',
  type: 'Standard',
  price_per_night: '',
  status: 'Available',
  title: '',
  capacity: '2',
  rating: '4.8',
  popular: false,
  image_url: '',
  gallery: '',
  description: '',
  amenities: '',
  included: '',
  policy: ''
};

const toMultiline = (values?: string[]) => (values ?? []).join('\n');

const roomToForm = (room: Room): RoomForm => ({
  room_number: room.room_number ?? '',
  type: room.type ?? 'Standard',
  price_per_night: String(room.price_per_night ?? ''),
  status: room.status ?? 'Available',
  title: room.title ?? '',
  capacity: String(room.capacity ?? 2),
  rating: String(room.rating ?? 4.8),
  popular: Boolean(room.popular),
  image_url: room.image_url ?? '',
  gallery: toMultiline(room.gallery),
  description: room.description ?? '',
  amenities: (room.amenities ?? []).join(', '),
  included: (room.included ?? []).join(', '),
  policy: room.policy ?? ''
});

const statusClasses = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === 'available') return 'bg-emerald-100 text-emerald-800';
  if (normalized === 'occupied') return 'bg-red-100 text-red-800';
  return 'bg-yellow-100 text-yellow-800';
};

export const AdminRooms: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [form, setForm] = useState<RoomForm>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // --- Feature 5: Search & Filter state ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const visibleRooms = useMemo(() => {
    let filtered = [...rooms];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        r =>
          r.room_number.toLowerCase().includes(term) ||
          r.title.toLowerCase().includes(term) ||
          r.type.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(r => r.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (typeFilter !== 'All') {
      filtered = filtered.filter(r => r.type === typeFilter);
    }

    return filtered.sort((a, b) =>
      String(a.room_number).localeCompare(String(b.room_number), undefined, { numeric: true })
    );
  }, [rooms, searchTerm, statusFilter, typeFilter]);

  const updateForm = <Key extends keyof RoomForm>(key: Key, value: RoomForm[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const fetchRooms = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readApiResponse<Room[]>(response);

      if (!response.ok || !Array.isArray(data)) {
        throw new Error(data.error || 'Failed to fetch rooms.');
      }

      setRooms(data);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Failed to fetch rooms.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const openNewRoomModal = () => {
    setEditingRoom(null);
    setForm(defaultForm);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setForm(roomToForm(room));
    setError('');
    setIsModalOpen(true);
  };

  const buildPayload = () => ({
    ...form,
    price_per_night: Number(form.price_per_night),
    capacity: Number(form.capacity),
    rating: Number(form.rating),
    gallery: form.gallery
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean),
    amenities: form.amenities
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    included: form.included
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  });

  const handleSaveRoom = async () => {
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const url = editingRoom
        ? `${API_BASE_URL}/api/rooms/${editingRoom.room_id}`
        : `${API_BASE_URL}/api/rooms`;
      const method = editingRoom ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(buildPayload())
      });
      const data = await readApiResponse<{ message?: string }>(response);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save room.');
      }

      setIsModalOpen(false);
      await fetchRooms();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Error saving room.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;

    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/rooms/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readApiResponse<{ message?: string }>(response);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete room.');
      }

      await fetchRooms();
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Failed to delete room.';
      setError(message);
    }
  };

  // --- Feature 4: Quick Status Toggle ---
  const handleQuickStatusToggle = async (room: Room, newStatus: string) => {
    if (newStatus === room.status) return;
    setTogglingId(room.room_id);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/rooms/${room.room_id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          room_number: room.room_number,
          type: room.type,
          price_per_night: room.price_per_night,
          status: newStatus
        })
      });
      const data = await readApiResponse<{ message?: string }>(response);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status.');
      }

      // Optimistic local update
      setRooms(current =>
        current.map(r => (r.room_id === room.room_id ? { ...r, status: newStatus } : r))
      );
    } catch (toggleError) {
      const message = toggleError instanceof Error ? toggleError.message : 'Failed to update status.';
      setError(message);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto rounded-3xl border border-white/60 bg-white/40 p-6 shadow-2xl backdrop-blur-3xl h-[85vh] lg:p-10">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-headline text-3xl font-black text-primary">Room Database</h2>
          <p className="mt-1 max-w-2xl font-medium text-on-surface-variant">
            Manage physical inventory and the room cards shown on the public luxury homepage.
          </p>
        </div>
        <button
          onClick={openNewRoomModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-lg transition-all hover:bg-primary-container active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Add New Room
        </button>
      </div>

      {/* --- Feature 5: Search & Filters --- */}
      <div className="mb-5 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by room number, title, or type..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-primary/10 bg-white/60 pl-4 pr-4 py-3 text-sm font-medium text-primary placeholder:text-primary/40 outline-none focus:ring-2 focus:ring-secondary/30 shadow-sm transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-xl border border-primary/10 bg-white/60 px-4 py-3 text-sm font-bold text-primary outline-none"
        >
          <option value="All">All Statuses</option>
          {roomStatuses.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="rounded-xl border border-primary/10 bg-white/60 px-4 py-3 text-sm font-bold text-primary outline-none"
        >
          <option value="All">All Types</option>
          {roomTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-outline-variant/20 bg-white/70 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-variant/30 text-sm uppercase tracking-wider text-primary/60">
                <th className="p-5 font-bold">Room</th>
                <th className="p-5 font-bold">Public Card</th>
                <th className="p-5 font-bold">Capacity</th>
                <th className="p-5 font-bold">Price</th>
                <th className="p-5 font-bold">Status</th>
                <th className="p-5 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center font-bold text-primary/60">
                    Loading rooms...
                  </td>
                </tr>
              ) : visibleRooms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center font-bold text-primary/60">
                    {rooms.length === 0
                      ? 'No rooms yet. Add one and it will appear on the public homepage.'
                      : 'No rooms match your filters.'}
                  </td>
                </tr>
              ) : (
                visibleRooms.map((room) => (
                  <tr
                    key={room.room_id}
                    className="border-b border-outline-variant/10 transition-colors hover:bg-white"
                  >
                    <td className="p-5">
                      <p className="font-black text-primary">Room {room.room_number}</p>
                      <p className="mt-1 text-sm font-semibold text-on-surface-variant">{room.type}</p>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <img
                          src={room.image_url}
                          alt={room.title}
                          className="h-14 w-20 rounded-xl object-cover"
                          loading="lazy"
                        />
                        <div>
                          <p className="font-black text-primary">{room.title}</p>
                          <p className="mt-1 line-clamp-1 max-w-[280px] text-sm text-on-surface-variant">
                            {room.description}
                          </p>
                          {room.popular && (
                            <span className="mt-2 inline-flex rounded-full bg-secondary/15 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-secondary">
                              Most Popular
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-5 font-bold text-primary">{room.capacity} guests</td>
                    <td className="p-5 font-bold text-secondary">Rs {room.price_per_night.toLocaleString('en-IN')}</td>

                    {/* --- Feature 4: Inline Status Toggle --- */}
                    <td className="p-5">
                      <div className="relative inline-block">
                        <select
                          value={room.status}
                          onChange={e => handleQuickStatusToggle(room, e.target.value)}
                          disabled={togglingId === room.room_id}
                          className={`appearance-none rounded-full pl-3 pr-8 py-1.5 text-xs font-bold cursor-pointer border-0 outline-none transition-all ${statusClasses(room.status)} ${togglingId === room.room_id ? 'opacity-50' : ''}`}
                        >
                          {roomStatuses.map(s => (
                            <option key={s} value={s}>{s.toUpperCase()}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" />
                      </div>
                    </td>

                    <td className="p-5">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => openEditModal(room)}
                          className="rounded-lg bg-surface-variant/50 p-2 text-primary transition-colors hover:bg-primary/10"
                          aria-label={`Edit room ${room.room_number}`}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(room.room_id)}
                          className="rounded-lg bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100"
                          aria-label={`Delete room ${room.room_number}`}
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/40 bg-white p-6 shadow-2xl lg:p-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-6 top-6 text-primary/40 transition-colors hover:text-red-500"
              aria-label="Close room form"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="mb-6 pr-10">
              <h3 className="font-headline text-2xl font-bold text-primary">
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </h3>
              <p className="mt-1 text-sm font-medium text-on-surface-variant">
                These public details feed the room discovery cards, room detail modal, and live booking flow.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Field label="Room Number">
                <input
                  type="text"
                  value={form.room_number}
                  onChange={(event) => updateForm('room_number', event.target.value)}
                  className="room-admin-input"
                  placeholder="e.g., 105"
                />
              </Field>

              <Field label="Room Type">
                <select
                  value={form.type}
                  onChange={(event) => updateForm('type', event.target.value)}
                  className="room-admin-input"
                >
                  {roomTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Price / Night">
                <input
                  type="number"
                  min="0"
                  value={form.price_per_night}
                  onChange={(event) => updateForm('price_per_night', event.target.value)}
                  className="room-admin-input"
                  placeholder="Rs"
                />
              </Field>

              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(event) => updateForm('status', event.target.value)}
                  className="room-admin-input"
                >
                  {roomStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Homepage Card Title">
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => updateForm('title', event.target.value)}
                  className="room-admin-input"
                  placeholder="e.g., Family Residence"
                />
              </Field>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Capacity">
                  <input
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={(event) => updateForm('capacity', event.target.value)}
                    className="room-admin-input"
                  />
                </Field>
                <Field label="Rating">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={form.rating}
                    onChange={(event) => updateForm('rating', event.target.value)}
                    className="room-admin-input"
                  />
                </Field>
                <label className="flex h-full items-end">
                  <span className="flex min-h-[50px] w-full items-center gap-2 rounded-xl border border-primary/10 bg-surface-variant/30 px-4 font-bold text-primary">
                    <input
                      type="checkbox"
                      checked={form.popular}
                      onChange={(event) => updateForm('popular', event.target.checked)}
                      className="h-4 w-4 accent-primary"
                    />
                    Popular
                  </span>
                </label>
              </div>

              <Field label="Main Image URL">
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(event) => updateForm('image_url', event.target.value)}
                  className="room-admin-input"
                  placeholder="https://..."
                />
              </Field>

              <Field label="Gallery Image URLs">
                <textarea
                  value={form.gallery}
                  onChange={(event) => updateForm('gallery', event.target.value)}
                  className="room-admin-textarea min-h-[130px]"
                  placeholder="One image URL per line"
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(event) => updateForm('description', event.target.value)}
                  className="room-admin-textarea min-h-[130px]"
                  placeholder="Short premium description for guests"
                />
              </Field>

              <Field label="Amenities">
                <textarea
                  value={form.amenities}
                  onChange={(event) => updateForm('amenities', event.target.value)}
                  className="room-admin-textarea"
                  placeholder="King bed, Wi-Fi, Smart TV"
                />
              </Field>

              <Field label="Included Services">
                <textarea
                  value={form.included}
                  onChange={(event) => updateForm('included', event.target.value)}
                  className="room-admin-textarea"
                  placeholder="Daily breakfast, Welcome drink, Late checkout"
                />
              </Field>

              <div className="lg:col-span-2">
                <Field label="Policy">
                  <textarea
                    value={form.policy}
                    onChange={(event) => updateForm('policy', event.target.value)}
                    className="room-admin-textarea"
                    placeholder="Cancellation, check-in, and guest policy"
                  />
                </Field>
              </div>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl border border-primary/15 px-6 py-3 font-bold text-primary transition hover:bg-primary/5"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRoom}
                disabled={saving}
                className="rounded-xl bg-primary px-7 py-3 font-bold text-white transition hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving...' : editingRoom ? 'Update Room' : 'Add Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-bold uppercase text-primary/60">{label}</span>
    {children}
  </label>
);
