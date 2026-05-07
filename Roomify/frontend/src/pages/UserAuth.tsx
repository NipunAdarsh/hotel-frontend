import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BedDouble, LogIn, UserPlus } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { readApiResponse } from '../utils/apiResponse';

interface GuestUser {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface GuestAuthResponse {
  token?: string;
  role?: string;
  guest?: GuestUser;
  error?: string;
}

export const UserAuth: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isRegisterMode = location.pathname.endsWith('/register');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [statusMsg, setStatusMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusMsg('');
    setIsSubmitting(true);

    try {
      const endpoint = isRegisterMode ? '/api/guest-auth/register' : '/api/guest-auth/login';
      const payload = isRegisterMode
        ? formData
        : { email: formData.email, password: formData.password };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await readApiResponse<GuestAuthResponse>(response);

      if (!response.ok || !data.token || !data.guest) {
        throw new Error(data.error || 'Unable to continue. Please try again.');
      }

      localStorage.setItem('guestToken', data.token);
      localStorage.setItem('guestRole', data.role || 'Guest');
      localStorage.setItem('guestName', data.guest.name);

      // If they started booking from the public preview page, finish inside the guest portal.
      const hasPendingBooking = Boolean(localStorage.getItem('pendingPublicBooking'));
      navigate('/user', { replace: true, state: { openBooking: hasPendingBooking } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to connect to the server.';
      setStatusMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2200&auto=format&fit=crop"
          alt="Hotel lobby"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/70" />
      </div>

      <main className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] bg-white/85 backdrop-blur-3xl rounded-[28px] overflow-hidden shadow-2xl border border-white/50">
        <section className="p-10 lg:p-14 bg-primary text-white flex flex-col justify-between min-h-[560px]">
          <div>
            <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mb-8">
              <BedDouble className="w-8 h-8" />
            </div>
            <p className="uppercase tracking-widest text-white/60 text-xs font-black mb-4">
              Guest Portal
            </p>
            <h1 className="text-4xl lg:text-5xl font-headline font-black leading-tight mb-5">
              Reserve your stay and manage every booking in one place.
            </h1>
            <p className="text-white/75 text-lg leading-8 max-w-xl">
              Create a guest account, book available rooms, track active stays, and review your hotel history.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-12">
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-2xl font-black">24/7</p>
              <p className="text-xs text-white/60 font-bold uppercase mt-1">Access</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-2xl font-black">Live</p>
              <p className="text-xs text-white/60 font-bold uppercase mt-1">Rooms</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-2xl font-black">Self</p>
              <p className="text-xs text-white/60 font-bold uppercase mt-1">Booking</p>
            </div>
          </div>
        </section>

        <section className="p-8 lg:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <p className="text-secondary font-black uppercase tracking-widest text-xs mb-3">
              {isRegisterMode ? 'Create Account' : 'Welcome Back'}
            </p>
            <h2 className="text-3xl font-headline font-black text-primary">
              {isRegisterMode ? 'Guest Registration' : 'Guest Login'}
            </h2>
          </div>

          {statusMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 font-bold text-sm">
              {statusMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  type="text"
                  placeholder="Full name"
                  className="w-full bg-surface-variant/40 border border-primary/10 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-secondary/25 font-medium text-primary"
                />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  type="tel"
                  placeholder="Phone number"
                  className="w-full bg-surface-variant/40 border border-primary/10 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-secondary/25 font-medium text-primary"
                />
              </>
            )}

            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              type="email"
              placeholder="Email address"
              className="w-full bg-surface-variant/40 border border-primary/10 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-secondary/25 font-medium text-primary"
            />
            <input
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              type="password"
              placeholder="Password"
              className="w-full bg-surface-variant/40 border border-primary/10 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-secondary/25 font-medium text-primary"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-primary-container transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {isRegisterMode ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
              {isSubmitting ? 'Please wait...' : isRegisterMode ? 'Create Guest Account' : 'Login as Guest'}
            </button>
          </form>

          <div className="mt-8 flex flex-col gap-3 text-sm font-bold text-primary/70">
            {isRegisterMode ? (
              <span>
                Already have a guest account?{' '}
                <Link to="/user/login" className="text-secondary hover:underline">
                  Login here
                </Link>
              </span>
            ) : (
              <span>
                New guest?{' '}
                <Link to="/user/register" className="text-secondary hover:underline">
                  Create an account
                </Link>
              </span>
            )}
            <Link to="/login" className="text-primary/50 hover:text-primary">
              Staff member login
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};
