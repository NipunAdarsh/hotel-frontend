import React, { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, Phone, Mail } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const bookingStatuses = ['Active', 'Completed', 'Cancelled', 'Pending', 'Confirmed'];

export const GuestDirectory: React.FC = () => {
  const [guests, setGuests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuests = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/guests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setGuests(data);
      } catch (err) {
        console.error("Failed to fetch guests", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGuests();
  }, []);

  const filteredGuests = useMemo(() => {
    let filtered = [...guests];

    // Text search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(guest =>
        guest.guest_name.toLowerCase().includes(term) ||
        guest.phone.includes(term) ||
        guest.room_number.toString().includes(term) ||
        (guest.email && guest.email.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(guest => guest.status === statusFilter);
    }

    return filtered;
  }, [guests, searchTerm, statusFilter]);

  if (loading) return <div className="p-10 font-bold text-primary">Loading guest ledger...</div>;

  return (
    <div className="flex-1 bg-white/40 backdrop-blur-3xl rounded-3xl p-10 border border-white/60 shadow-2xl overflow-y-auto h-[85vh]">
      
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-headline font-black text-primary">Guest Directory</h2>
          <p className="text-on-surface-variant font-medium mt-1">Search and manage all past and present reservations.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-primary/40" />
            </div>
            <input
              type="text"
              placeholder="Search by name, phone, or room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/60 border border-white rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/30 shadow-sm font-medium text-primary placeholder:text-primary/40 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-white/60 border border-white rounded-xl font-bold text-primary text-sm outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            {bookingStatuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="mb-4 text-sm font-bold text-primary/50">
        Showing {filteredGuests.length} of {guests.length} records
      </p>

      {/* Directory Table */}
      <div className="bg-white/70 rounded-2xl border border-outline-variant/20 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-variant/30 text-primary/60 text-sm uppercase tracking-wider border-b border-outline-variant/20">
              <th className="p-5 font-bold">Guest Details</th>
              <th className="p-5 font-bold">Room</th>
              <th className="p-5 font-bold">Dates</th>
              <th className="p-5 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredGuests.length > 0 ? (
              filteredGuests.map((guest) => {
                // Format dates for display
                const checkInDate = new Date(guest.check_in).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                const checkOutDate = new Date(guest.check_out).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

                return (
                  <tr key={guest.booking_id} className="border-b border-outline-variant/10 hover:bg-white transition-colors">
                    
                    {/* Name & Contact */}
                    <td className="p-5">
                      <div className="font-black text-primary mb-1">{guest.guest_name}</div>
                      <div className="flex items-center gap-3 text-xs text-on-surface-variant font-medium">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {guest.phone}</span>
                        {guest.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {guest.email}</span>}
                      </div>
                    </td>

                    {/* Room Info */}
                    <td className="p-5">
                      <div className="font-bold text-primary">Room {guest.room_number}</div>
                      <div className="text-xs text-primary/60 font-medium">{guest.room_type}</div>
                    </td>

                    {/* Dates */}
                    <td className="p-5">
                      <div className="flex items-center gap-2 text-sm text-primary font-medium">
                        <Calendar className="w-4 h-4 text-secondary" />
                        {checkInDate} <span className="text-primary/40">→</span> {checkOutDate}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                        ${guest.status === 'Active' ? 'bg-blue-100 text-blue-800' : 
                          guest.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 
                          guest.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'}`}>
                        {guest.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="p-10 text-center text-primary/50 font-medium">
                  No guests found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};