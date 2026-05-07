import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BedDouble,
  Bookmark,
  CalendarDays,
  Clock,
  CreditCard,
  Download,
  Gift,
  Heart,
  History,
  IndianRupee,
  LogOut,
  Repeat2,
  Sparkles,
  UserRound,
  X
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { readApiResponse } from '../utils/apiResponse';
import { offers } from '../data/luxuryHotel';

interface GuestProfile {
  guest_id: number;
  name: string;
  email: string;
  phone: string;
}

interface Room {
  room_id: number;
  room_number: string;
  type: string;
  price_per_night: string | number;
  status: string;
}

interface Booking {
  booking_id: number;
  room_id: number;
  room_number: string;
  room_type: string;
  price_per_night: string | number;
  check_in: string;
  check_out: string;
  status: string;
  nights: number;
  estimated_total: string | number;
}

interface Invoice {
  invoice_id: number;
  booking_id: number;
  invoice_no: string;
  room_total: string | number;
  restaurant_total: string | number;
  grand_total: string | number;
  payment_status: string;
  check_in: string;
  check_out: string;
  room_number: string;
  room_type: string;
}

interface Membership {
  points: number;
  tier: string;
  nextTier: string | null;
  progress: number;
  lifetimeSpend: number;
  totalBookings: number;
  activeBookings: number;
  benefits: string[];
}

interface GuestPreferences {
  guest_id: number;
  room_view: string;
  bed_type: string;
  special_requests: string;
}

interface SavedOffer {
  offer_code: string;
  offer_title: string;
  created_at?: string;
}

interface PreferencesResponse {
  preferences: GuestPreferences;
  savedRooms: Room[];
  savedOffers: SavedOffer[];
  error?: string;
}

interface ProfileResponse {
  guest?: GuestProfile;
  error?: string;
}

const roomImages = [
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=800&auto=format&fit=crop'
];

const defaultMembership: Membership = {
  points: 0,
  tier: 'Bronze',
  nextTier: 'Silver',
  progress: 0,
  lifetimeSpend: 0,
  totalBookings: 0,
  activeBookings: 0,
  benefits: ['Member-only room rates', 'Priority support']
};

const formatCurrency = (value: string | number) =>
  Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

const getDateInputValue = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

export const UserPortal: React.FC = () => {
  const navigate = useNavigate();
  const [guest, setGuest] = useState<GuestProfile | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [membership, setMembership] = useState<Membership>(defaultMembership);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [preferences, setPreferences] = useState<GuestPreferences>({
    guest_id: 0,
    room_view: 'Garden view',
    bed_type: 'King bed',
    special_requests: ''
  });
  const [savedRooms, setSavedRooms] = useState<Room[]>([]);
  const [savedOffers, setSavedOffers] = useState<SavedOffer[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [rebooking, setRebooking] = useState<Booking | null>(null);
  const [bookingDates, setBookingDates] = useState({
    check_in: getDateInputValue(0),
    check_out: getDateInputValue(1)
  });
  const [loading, setLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem('guestToken');
    return { Authorization: `Bearer ${token}` };
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('guestToken');
    localStorage.removeItem('guestRole');
    localStorage.removeItem('guestName');
    navigate('/user/login', { replace: true });
  }, [navigate]);

  const fetchPortalData = useCallback(async () => {
    setLoading(true);
    setStatusMsg('');

    try {
      const [profileResponse, roomsResponse, bookingsResponse, membershipResponse, invoicesResponse, preferencesResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/api/user/profile`, { headers: authHeaders() }),
          fetch(`${API_BASE_URL}/api/user/rooms/available`, { headers: authHeaders() }),
          fetch(`${API_BASE_URL}/api/user/bookings`, { headers: authHeaders() }),
          fetch(`${API_BASE_URL}/api/user/membership`, { headers: authHeaders() }),
          fetch(`${API_BASE_URL}/api/user/invoices`, { headers: authHeaders() }),
          fetch(`${API_BASE_URL}/api/user/preferences`, { headers: authHeaders() })
        ]);

      if (profileResponse.status === 401 || profileResponse.status === 403) {
        handleLogout();
        return;
      }

      const profileData = await readApiResponse<ProfileResponse>(profileResponse);
      const roomsData = await readApiResponse<Room[] | { error?: string }>(roomsResponse);
      const bookingsData = await readApiResponse<Booking[] | { error?: string }>(bookingsResponse);
      const membershipData = await readApiResponse<Membership | { error?: string }>(membershipResponse);
      const invoicesData = await readApiResponse<Invoice[] | { error?: string }>(invoicesResponse);
      const preferencesData = await readApiResponse<PreferencesResponse>(preferencesResponse);

      if (!profileResponse.ok || !profileData.guest) throw new Error(profileData.error || 'Could not load profile.');
      if (!roomsResponse.ok || !Array.isArray(roomsData)) throw new Error(('error' in roomsData && roomsData.error) || 'Could not load rooms.');
      if (!bookingsResponse.ok || !Array.isArray(bookingsData)) throw new Error(('error' in bookingsData && bookingsData.error) || 'Could not load bookings.');
      if (!membershipResponse.ok || (membershipData as { error?: string }).error) {
        throw new Error((membershipData as { error?: string }).error || 'Could not load membership.');
      }
      if (!invoicesResponse.ok || !Array.isArray(invoicesData)) throw new Error(('error' in invoicesData && invoicesData.error) || 'Could not load invoices.');
      if (!preferencesResponse.ok || preferencesData.error) throw new Error(preferencesData.error || 'Could not load preferences.');

      setGuest(profileData.guest);
      setRooms(roomsData);
      setBookings(bookingsData);
      setMembership(membershipData as Membership);
      setInvoices(invoicesData);
      setPreferences(preferencesData.preferences);
      setSavedRooms(preferencesData.savedRooms);
      setSavedOffers(preferencesData.savedOffers);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load your guest portal.';
      setStatusMsg(message);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, handleLogout]);

  useEffect(() => {
    fetchPortalData();
  }, [fetchPortalData]);

  const activeBookings = useMemo(
    () =>
      bookings.filter((booking) =>
        ['active', 'confirmed', 'checked_in', 'pending'].includes(booking.status.toLowerCase())
      ),
    [bookings]
  );

  const bookingHistory = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          !['active', 'confirmed', 'checked_in', 'pending'].includes(booking.status.toLowerCase())
      ),
    [bookings]
  );

  const savedRoomIds = useMemo(() => new Set(savedRooms.map((room) => room.room_id)), [savedRooms]);
  const savedOfferCodes = useMemo(() => new Set(savedOffers.map((offer) => offer.offer_code)), [savedOffers]);

  const requestJson = async <T,>(path: string, body: Record<string, unknown>) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        ...authHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await readApiResponse<T & { error?: string; message?: string }>(response);
    if (!response.ok) throw new Error(data.error || 'Request failed.');
    return data;
  };

  const handleBookingDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBookingDates((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const handleBookRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    const room = selectedRoom;

    if (!room) {
      setStatusMsg('Please choose a room first.');
      return;
    }

    setIsWorking(true);
    setStatusMsg('');

    try {
      const data = await requestJson<{ message?: string }>('/api/user/bookings', {
        room_id: room.room_id,
        check_in: bookingDates.check_in,
        check_out: bookingDates.check_out
      });
      setStatusMsg(data.message || 'Room booked successfully.');
      setSelectedRoom(null);
      await fetchPortalData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not complete your booking.';
      setStatusMsg(message);
    } finally {
      setIsWorking(false);
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    setIsWorking(true);
    setStatusMsg('');
    try {
      const data = await requestJson<{ message?: string }>(`/api/user/bookings/${booking.booking_id}/cancel`, {});
      setStatusMsg(data.message || 'Booking cancelled.');
      await fetchPortalData();
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Could not cancel booking.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleRebook = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!rebooking) return;

    setIsWorking(true);
    setStatusMsg('');
    try {
      const data = await requestJson<{ message?: string }>(`/api/user/bookings/${rebooking.booking_id}/rebook`, {
        check_in: bookingDates.check_in,
        check_out: bookingDates.check_out
      });
      setStatusMsg(data.message || 'Rebooking created.');
      setRebooking(null);
      await fetchPortalData();
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Could not rebook this stay.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleToggleSavedRoom = async (room: Room) => {
    setIsWorking(true);
    try {
      await requestJson('/api/user/saved-rooms/toggle', { room_id: room.room_id });
      await fetchPortalData();
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Could not update saved rooms.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleToggleSavedOffer = async (offerCode: string, offerTitle: string) => {
    setIsWorking(true);
    try {
      await requestJson('/api/user/saved-offers/toggle', { offer_code: offerCode, offer_title: offerTitle });
      await fetchPortalData();
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Could not update saved offers.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsWorking(true);
    setStatusMsg('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/preferences`, {
        method: 'PUT',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });
      const data = await readApiResponse<{ error?: string; message?: string }>(response);
      if (!response.ok) throw new Error(data.error || 'Could not save preferences.');
      setStatusMsg(data.message || 'Preferences saved.');
      await fetchPortalData();
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Could not save preferences.');
    } finally {
      setIsWorking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070605] flex items-center justify-center text-[#e7c987] font-black text-xl">
        Loading your guest portal...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070605] text-[#f8f1e7]">
      <header className="sticky top-0 z-30 bg-black/75 backdrop-blur-3xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-20 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#e7c987]">Guest Portal</p>
            <h1 className="text-2xl font-luxury font-black text-white">Paramvah Stays</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 text-right">
              <div>
                <p className="font-black text-white">{guest?.name}</p>
                <p className="text-xs text-white/45 font-bold">{guest?.email}</p>
              </div>
              <div className="w-11 h-11 rounded-full bg-[#d6b16a] text-black flex items-center justify-center">
                <UserRound className="w-5 h-5" />
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-3 rounded-2xl bg-white/10 text-white/75 font-bold flex items-center gap-2 hover:bg-white/15 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
        {statusMsg && (
          <div className="mb-8 p-4 rounded-2xl bg-[#d6b16a]/12 border border-[#d6b16a]/25 shadow-sm font-bold text-[#e7c987]">
            {statusMsg}
          </div>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.8fr] gap-8 mb-10">
          <div className="relative overflow-hidden rounded-[28px] min-h-[380px] bg-black text-white p-8 lg:p-10 flex flex-col justify-end border border-white/10">
            <img
              src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1800&auto=format&fit=crop"
              alt="Hotel exterior"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
            <div className="relative z-10 max-w-2xl">
              <p className="uppercase tracking-widest text-[#e7c987] text-xs font-black mb-3">
                Welcome {guest?.name?.split(' ')[0] || 'Guest'}
              </p>
              <h2 className="text-5xl lg:text-6xl font-luxury font-black leading-tight mb-4">
                Your private stay dashboard.
              </h2>
              <p className="text-white/75 text-lg">
                Membership, invoices, saved rooms, favorite offers, preferences, and live booking controls are all synced with your account.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
            <MetricCard icon={Clock} value={activeBookings.length} label="Current bookings" />
            <MetricCard icon={BedDouble} value={rooms.length} label="Rooms available" />
            <MetricCard icon={History} value={bookingHistory.length} label="Past stays" />
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <MembershipCard membership={membership} />
          <PreferencesCard
            preferences={preferences}
            setPreferences={setPreferences}
            savedRooms={savedRooms}
            savedOffers={savedOffers}
            onSave={handleSavePreferences}
            isWorking={isWorking}
          />
          <BillingCard invoices={invoices} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <SavedOffersCard savedOfferCodes={savedOfferCodes} onToggle={handleToggleSavedOffer} isWorking={isWorking} />
        </section>

        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-4xl font-luxury font-black text-white">Available Rooms</h2>
              <p className="text-white/50 font-medium mt-1">Choose a room, save it, or confirm your stay dates.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {rooms.length > 0 ? (
              rooms.map((room, index) => (
                <article
                  key={room.room_id}
                  className="bg-white/[0.06] rounded-[24px] overflow-hidden border border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  <div className="h-48 relative overflow-hidden">
                    <img
                      src={roomImages[index % roomImages.length]}
                      alt={`Room ${room.room_number}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-4 right-4 bg-[#d6b16a] text-black text-xs font-black px-3 py-1 rounded-full">
                      {room.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleSavedRoom(room)}
                      className="absolute top-4 left-4 rounded-full bg-black/55 p-2 text-white backdrop-blur"
                      aria-label={savedRoomIds.has(room.room_id) ? 'Remove saved room' : 'Save room'}
                    >
                      <Heart className={`h-5 w-5 ${savedRoomIds.has(room.room_id) ? 'fill-[#e7c987] text-[#e7c987]' : ''}`} />
                    </button>
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-black uppercase tracking-widest text-[#e7c987] mb-2">{room.type}</p>
                    <h3 className="text-2xl font-luxury font-black text-white mb-4">Room {room.room_number}</h3>
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-white/45 font-bold">Per night</span>
                      <span className="text-xl text-[#e7c987] font-black">Rs {formatCurrency(room.price_per_night)}</span>
                    </div>
                    <button
                      onClick={() => setSelectedRoom(room)}
                      className="w-full py-3 bg-[#d6b16a] text-black rounded-2xl font-black hover:bg-[#f0d28d] transition-all active:scale-[0.98]"
                    >
                      Book This Room
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="md:col-span-2 xl:col-span-4 bg-white/[0.06] rounded-[24px] p-10 text-center border border-white/10">
                <p className="font-black text-white text-lg">No rooms are available right now.</p>
                <p className="text-white/45 font-medium mt-2">Please check again later or contact reception.</p>
              </div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <BookingList
            title="Current Booking"
            emptyText="You do not have an active booking yet."
            bookings={activeBookings}
            onCancel={handleCancelBooking}
            onRebook={setRebooking}
            showCancel
            isWorking={isWorking}
          />
          <BookingList
            title="Booking History"
            emptyText="Completed and cancelled stays will appear here."
            bookings={bookingHistory}
            onRebook={setRebooking}
            isWorking={isWorking}
          />
        </section>
      </main>

      {selectedRoom && (
        <BookingModal
          title={`Room ${selectedRoom.room_number}`}
          subtitle={`${selectedRoom.type} room at Rs ${formatCurrency(selectedRoom.price_per_night)} per night`}
          dates={bookingDates}
          onDateChange={handleBookingDateChange}
          onClose={() => setSelectedRoom(null)}
          onSubmit={handleBookRoom}
          isWorking={isWorking}
          submitLabel="Confirm"
        />
      )}

      {rebooking && (
        <BookingModal
          title={`Rebook Room ${rebooking.room_number}`}
          subtitle={`Create a new stay for ${rebooking.room_type}`}
          dates={bookingDates}
          onDateChange={handleBookingDateChange}
          onClose={() => setRebooking(null)}
          onSubmit={handleRebook}
          isWorking={isWorking}
          submitLabel="Rebook"
        />
      )}
    </div>
  );
};

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon: Icon, value, label }) => (
  <div className="bg-white/[0.06] rounded-[24px] p-6 border border-white/10 shadow-sm">
    <Icon className="w-6 h-6 text-[#e7c987] mb-4" />
    <p className="text-3xl font-luxury font-black text-white">{value}</p>
    <p className="text-sm font-bold text-white/45 mt-1">{label}</p>
  </div>
);

const MembershipCard: React.FC<{ membership: Membership }> = ({ membership }) => (
  <section className="rounded-[28px] border border-[#d6b16a]/20 bg-gradient-to-br from-[#d6b16a]/16 to-white/[0.04] p-6">
    <Sparkles className="mb-5 h-7 w-7 text-[#e7c987]" />
    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#e7c987]">Membership</p>
    <h2 className="mt-2 font-luxury text-4xl text-white">{membership.tier} Tier</h2>
    <p className="mt-3 text-sm font-bold text-white/55">
      {formatCurrency(membership.points)} points
      {membership.nextTier ? `. ${membership.nextTier} unlock progress below.` : '. Highest tier reached.'}
    </p>
    <div className="mt-6 h-2 rounded-full bg-white/10">
      <div className="h-full rounded-full bg-[#d6b16a]" style={{ width: `${membership.progress}%` }} />
    </div>
    <p className="mt-4 text-sm font-bold text-white/45">Lifetime spend: Rs {formatCurrency(membership.lifetimeSpend)}</p>
    <div className="mt-5 grid gap-2 text-sm font-bold text-white/58">
      {membership.benefits.map((benefit) => (
        <span key={benefit}>{benefit}</span>
      ))}
    </div>
  </section>
);

const PreferencesCard: React.FC<{
  preferences: GuestPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<GuestPreferences>>;
  savedRooms: Room[];
  savedOffers: SavedOffer[];
  onSave: () => void;
  isWorking: boolean;
}> = ({ preferences, setPreferences, savedRooms, savedOffers, onSave, isWorking }) => (
  <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6">
    <Bookmark className="mb-5 h-7 w-7 text-[#e7c987]" />
    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#e7c987]">Preferences</p>
    <h2 className="mt-2 font-luxury text-4xl text-white">Saved for you</h2>
    <div className="mt-5 grid gap-3">
      <select
        value={preferences.room_view}
        onChange={(event) => setPreferences((current) => ({ ...current, room_view: event.target.value }))}
        className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-bold text-white outline-none"
      >
        <option>Garden view</option>
        <option>City view</option>
        <option>Pool view</option>
        <option>Quiet floor</option>
      </select>
      <select
        value={preferences.bed_type}
        onChange={(event) => setPreferences((current) => ({ ...current, bed_type: event.target.value }))}
        className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-bold text-white outline-none"
      >
        <option>King bed</option>
        <option>Twin beds</option>
        <option>Extra bed</option>
      </select>
      <textarea
        value={preferences.special_requests || ''}
        onChange={(event) => setPreferences((current) => ({ ...current, special_requests: event.target.value }))}
        placeholder="Special requests"
        className="min-h-20 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-bold text-white outline-none placeholder:text-white/35"
      />
      <button
        type="button"
        onClick={onSave}
        disabled={isWorking}
        className="rounded-2xl bg-[#d6b16a] px-4 py-3 font-black text-black disabled:opacity-60"
      >
        Save Preferences
      </button>
    </div>
    <div className="mt-5 flex flex-wrap gap-2">
      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/65">
        {savedRooms.length} saved rooms
      </span>
      <span className="rounded-full bg-[#d6b16a]/12 px-3 py-1 text-xs font-black text-[#e7c987]">
        <Gift className="mr-1 inline h-3 w-3" />
        {savedOffers.length} favorite offers
      </span>
    </div>
  </section>
);

const BillingCard: React.FC<{ invoices: Invoice[] }> = ({ invoices }) => (
  <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6">
    <CreditCard className="mb-5 h-7 w-7 text-[#e7c987]" />
    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#e7c987]">Billing</p>
    <h2 className="mt-2 font-luxury text-4xl text-white">Invoices</h2>
    <div className="mt-5 space-y-3">
      {invoices.length > 0 ? (
        invoices.slice(0, 3).map((invoice) => (
          <div key={invoice.invoice_id} className="flex items-center justify-between gap-3 rounded-2xl bg-black/25 px-4 py-3">
            <div>
              <p className="font-black text-white">{invoice.invoice_no}</p>
              <p className="text-xs font-bold text-white/42">
                Room {invoice.room_number} - Rs {formatCurrency(invoice.grand_total)} - {invoice.payment_status}
              </p>
            </div>
            <button className="rounded-full bg-white/10 p-2 text-[#e7c987]" aria-label={`Download ${invoice.invoice_no}`}>
              <Download className="h-4 w-4" />
            </button>
          </div>
        ))
      ) : (
        <p className="rounded-2xl bg-black/25 px-4 py-6 text-center font-bold text-white/45">
          Paid invoices will appear after checkout.
        </p>
      )}
    </div>
  </section>
);

const SavedOffersCard: React.FC<{
  savedOfferCodes: Set<string>;
  onToggle: (offerCode: string, offerTitle: string) => void;
  isWorking: boolean;
}> = ({ savedOfferCodes, onToggle, isWorking }) => (
  <section className="lg:col-span-3 rounded-[28px] border border-white/10 bg-white/[0.06] p-6">
    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#e7c987]">Offers</p>
    <h2 className="mt-2 font-luxury text-4xl text-white">Favorite active deals</h2>
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      {offers.map((offer) => {
        const code = offer.title.toLowerCase().replace(/\s+/g, '-');
        const saved = savedOfferCodes.has(code);
        return (
          <button
            key={offer.title}
            type="button"
            onClick={() => onToggle(code, offer.title)}
            disabled={isWorking}
            className={`rounded-3xl border p-5 text-left transition ${
              saved ? 'border-[#d6b16a] bg-[#d6b16a]/15' : 'border-white/10 bg-black/20 hover:bg-white/10'
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-[#d6b16a] px-3 py-1 text-xs font-black text-black">{offer.tag}</span>
              <Heart className={`h-5 w-5 ${saved ? 'fill-[#e7c987] text-[#e7c987]' : 'text-white/45'}`} />
            </div>
            <p className="font-luxury text-2xl text-white">{offer.title}</p>
            <p className="mt-2 font-black text-[#e7c987]">{offer.discount}</p>
          </button>
        );
      })}
    </div>
  </section>
);

interface BookingListProps {
  title: string;
  emptyText: string;
  bookings: Booking[];
  onCancel?: (booking: Booking) => void;
  onRebook?: (booking: Booking) => void;
  showCancel?: boolean;
  isWorking: boolean;
}

const BookingList: React.FC<BookingListProps> = ({ title, emptyText, bookings, onCancel, onRebook, showCancel, isWorking }) => (
  <section className="bg-white/[0.06] rounded-[24px] border border-white/10 shadow-sm overflow-hidden">
    <div className="p-6 border-b border-white/10 flex items-center gap-3">
      <CalendarDays className="w-5 h-5 text-[#e7c987]" />
      <h2 className="text-3xl font-luxury font-black text-white">{title}</h2>
    </div>
    <div className="p-6 space-y-4">
      {bookings.length > 0 ? (
        bookings.map((booking) => (
          <article key={booking.booking_id} className="p-5 rounded-2xl bg-black/25 border border-white/10">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="font-luxury font-black text-white text-2xl">Room {booking.room_number}</p>
                <p className="text-white/45 font-bold text-sm">{booking.room_type}</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#d6b16a]/12 text-[#e7c987] text-xs font-black border border-[#d6b16a]/25">
                {booking.status}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm font-bold text-white/60">
              <span>{formatDate(booking.check_in)}</span>
              <span>{formatDate(booking.check_out)}</span>
              <span className="flex items-center gap-1">
                <IndianRupee className="w-4 h-4" />
                {formatCurrency(booking.estimated_total)}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {showCancel && onCancel && (
                <button
                  type="button"
                  onClick={() => onCancel(booking)}
                  disabled={isWorking}
                  className="rounded-full border border-red-400/30 px-4 py-2 text-sm font-black text-red-200 hover:bg-red-400/10 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              {onRebook && (
                <button
                  type="button"
                  onClick={() => onRebook(booking)}
                  disabled={isWorking}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/15 disabled:opacity-50"
                >
                  <Repeat2 className="h-4 w-4" />
                  Rebook
                </button>
              )}
            </div>
          </article>
        ))
      ) : (
        <p className="text-white/45 font-bold text-center py-8">{emptyText}</p>
      )}
    </div>
  </section>
);

const BookingModal: React.FC<{
  title: string;
  subtitle: string;
  dates: { check_in: string; check_out: string };
  onDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  isWorking: boolean;
  submitLabel: string;
}> = ({ title, subtitle, dates, onDateChange, onClose, onSubmit, isWorking, submitLabel }) => (
  <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4">
    <form onSubmit={onSubmit} className="bg-[#11100e] rounded-[28px] p-8 max-w-md w-full shadow-2xl border border-white/10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#e7c987] mb-2">Confirm Stay</p>
          <h2 className="text-3xl font-luxury font-black text-white mb-2">{title}</h2>
          <p className="text-white/55 font-bold">{subtitle}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close modal">
          <X className="text-white/55" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <label className="block">
          <span className="text-xs font-black uppercase text-white/45">Check-in</span>
          <input
            required
            type="date"
            name="check_in"
            value={dates.check_in}
            onChange={onDateChange}
            className="mt-2 w-full bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 text-white font-bold outline-none focus:ring-2 focus:ring-[#d6b16a]/25"
          />
        </label>
        <label className="block">
          <span className="text-xs font-black uppercase text-white/45">Check-out</span>
          <input
            required
            type="date"
            name="check_out"
            value={dates.check_out}
            onChange={onDateChange}
            className="mt-2 w-full bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 text-white font-bold outline-none focus:ring-2 focus:ring-[#d6b16a]/25"
          />
        </label>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl bg-white/10 text-white font-black hover:bg-white/15">
          Cancel
        </button>
        <button type="submit" disabled={isWorking} className="flex-1 py-4 rounded-2xl bg-[#d6b16a] text-black font-black hover:bg-[#f0d28d] disabled:opacity-60">
          {isWorking ? 'Working...' : submitLabel}
        </button>
      </div>
    </form>
  </div>
);
