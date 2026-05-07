import React, { useEffect, useMemo, useState } from 'react';
import { Coffee, Flame, Minus, Plus, Receipt, Search, Sparkles, Utensils, CheckCircle2, Trash2, Save } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { readApiResponse } from '../utils/apiResponse';

type OrderType = 'room' | 'walk-in';
type MenuCategory = 'All' | 'Best Sellers' | 'Starters' | 'Mains' | 'Drinks' | 'Desserts';

interface MenuItem {
  id: number;
  name: string;
  category: Exclude<MenuCategory, 'All' | 'Best Sellers'>;
  price: number;
  image_url?: string | null;
  description?: string | null;
  bestseller?: boolean;
  chefPick?: boolean;
  dessertWeek?: boolean;
}

interface CartItem extends MenuItem {
  qty: number;
}

interface Room {
  room_id: number;
  room_number: string;
  status: string;
}

const MENU_CATEGORIES: MenuCategory[] = ['All', 'Best Sellers', 'Starters', 'Mains', 'Drinks', 'Desserts'];

export const RestaurantPOS: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('room');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [occupiedRooms, setOccupiedRooms] = useState<Room[]>([]);
  const [orderNote, setOrderNote] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [showAdminMenuEditor, setShowAdminMenuEditor] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Mains' as Exclude<MenuCategory, 'All' | 'Best Sellers'>,
    price: '',
    image_url: '',
    description: '',
    is_bestseller: false,
    is_chef_pick: false,
    is_dessert_week: false
  });

  const userRole = (localStorage.getItem('role') || '').toLowerCase();
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/rooms`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await readApiResponse<Room[] | { error?: string }>(response);
        if (!response.ok || !Array.isArray(data)) return;
        setOccupiedRooms(data.filter((room) => String(room.status).toLowerCase() === 'occupied'));
      } catch {
        // Keep UI usable even if rooms fail to load.
      }
    };
    fetchRooms();
  }, []);

  const fetchMenu = async () => {
    setIsLoadingMenu(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/restaurant/menu`);
      const data = await readApiResponse<any[] | { error?: string }>(response);
      if (!response.ok || !Array.isArray(data)) throw new Error(('error' in data && data.error) || 'Failed to fetch menu.');
      setMenuItems(
        data.map((item) => ({
          id: Number(item.menu_item_id),
          name: item.name,
          category: item.category,
          price: Number(item.price),
          image_url: item.image_url,
          description: item.description,
          bestseller: Boolean(item.is_bestseller),
          chefPick: Boolean(item.is_chef_pick),
          dessertWeek: Boolean(item.is_dessert_week)
        }))
      );
    } catch {
      setStatusMsg('Unable to load menu from backend.');
      setMenuItems([]);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart((current) => {
      const existing = current.find((cartItem) => cartItem.id === item.id);
      if (existing) {
        return current.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, qty: cartItem.qty + 1 } : cartItem
        );
      }
      return [...current, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((current) =>
      current
        .map((item) => (item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const clearCart = () => {
    setCart([]);
    setOrderNote('');
  };

  const filteredMenu = useMemo(() => {
    const byCategory = menuItems.filter((item) => {
      if (activeCategory === 'All') return true;
      if (activeCategory === 'Best Sellers') return Boolean(item.bestseller);
      return item.category === activeCategory;
    });

    const query = searchQuery.trim().toLowerCase();
    if (!query) return byCategory;
    return byCategory.filter((item) => item.name.toLowerCase().includes(query));
  }, [activeCategory, searchQuery, menuItems]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);
  const tax = useMemo(() => subtotal * 0.05, [subtotal]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);
  const itemCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);

  const handlePlaceOrder = async () => {
    setStatusMsg('');
    if (cart.length === 0) {
      setStatusMsg('Add at least one item to place an order.');
      return;
    }
    if (orderType === 'room' && !selectedRoom) {
      setStatusMsg('Select an occupied room for room-charge orders.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/restaurant/order`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderType,
          selectedRoom,
          cart,
          total,
          note: orderNote
        })
      });

      const data = await readApiResponse<{ error?: string; message?: string }>(response);
      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order.');
      }

      setIsSuccess(true);
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Cannot connect to the secure server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateMenuItem = async () => {
    if (!isAdmin) return;
    if (!newItem.name.trim() || !newItem.price) {
      setStatusMsg('Item name and price are required.');
      return;
    }

    setIsSavingItem(true);
    setStatusMsg('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/restaurant/menu/admin`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newItem.name.trim(),
          category: newItem.category,
          price: Number(newItem.price),
          image_url: newItem.image_url || null,
          description: newItem.description || null,
          is_bestseller: newItem.is_bestseller,
          is_chef_pick: newItem.is_chef_pick,
          is_dessert_week: newItem.is_dessert_week
        })
      });
      const data = await readApiResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error || 'Failed to create menu item.');
      setNewItem({
        name: '',
        category: 'Mains',
        price: '',
        image_url: '',
        description: '',
        is_bestseller: false,
        is_chef_pick: false,
        is_dessert_week: false
      });
      await fetchMenu();
      setStatusMsg('Menu item created successfully.');
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Failed to create menu item.');
    } finally {
      setIsSavingItem(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white/60 backdrop-blur-xl rounded-3xl p-12 border border-white/40 shadow-xl h-[80vh]">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-headline font-bold text-primary mb-2">Order Confirmed!</h2>
        <p className="text-on-surface-variant font-medium mb-8 text-center max-w-md">
          {orderType === 'room'
            ? `Rs ${total.toFixed(2)} has been added to Room ${selectedRoom}'s tab.`
            : `Walk-in order for Rs ${total.toFixed(2)} has been recorded as paid.`}
        </p>
        <button
          onClick={() => {
            setIsSuccess(false);
            setCart([]);
            setSelectedRoom('');
            setOrderNote('');
            setStatusMsg('');
          }}
          className="px-8 py-4 bg-primary text-white rounded-full font-bold hover:bg-primary-container transition-all"
        >
          Start New Order
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[85vh] gap-6">
      <div className="flex-[2] flex flex-col bg-white/40 backdrop-blur-xl rounded-3xl border border-white/40 shadow-lg overflow-hidden">
        <div className="p-5 bg-white/40 border-b border-white/40">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-2xl font-headline font-black text-primary">Restaurant POS</h2>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-secondary/15 text-secondary text-xs font-black uppercase tracking-wider">
                {itemCount} items
              </span>
              {isAdmin && (
                <button
                  onClick={() => setShowAdminMenuEditor((current) => !current)}
                  className="px-3 py-1 rounded-full bg-primary text-white text-xs font-black uppercase tracking-wider"
                >
                  {showAdminMenuEditor ? 'Close Admin' : 'Add Menu Item'}
                </button>
              )}
            </div>
          </div>

          {isAdmin && showAdminMenuEditor && (
            <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-primary/60 mb-3">Admin Menu Editor</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={newItem.name}
                  onChange={(event) => setNewItem((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Dish name"
                  className="rounded-xl border border-primary/15 bg-white px-3 py-2 text-sm font-semibold text-primary"
                />
                <input
                  value={newItem.price}
                  onChange={(event) => setNewItem((current) => ({ ...current, price: event.target.value }))}
                  placeholder="Price"
                  type="number"
                  min="0"
                  className="rounded-xl border border-primary/15 bg-white px-3 py-2 text-sm font-semibold text-primary"
                />
                <select
                  value={newItem.category}
                  onChange={(event) => setNewItem((current) => ({ ...current, category: event.target.value as Exclude<MenuCategory, 'All' | 'Best Sellers'> }))}
                  className="rounded-xl border border-primary/15 bg-white px-3 py-2 text-sm font-semibold text-primary"
                >
                  <option value="Starters">Starters</option>
                  <option value="Mains">Mains</option>
                  <option value="Drinks">Drinks</option>
                  <option value="Desserts">Desserts</option>
                </select>
                <input
                  value={newItem.image_url}
                  onChange={(event) => setNewItem((current) => ({ ...current, image_url: event.target.value }))}
                  placeholder="Photo URL"
                  className="rounded-xl border border-primary/15 bg-white px-3 py-2 text-sm font-semibold text-primary"
                />
                <textarea
                  value={newItem.description}
                  onChange={(event) => setNewItem((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Short description"
                  className="md:col-span-2 rounded-xl border border-primary/15 bg-white px-3 py-2 text-sm font-semibold text-primary min-h-16"
                />
                <label className="flex items-center gap-2 text-sm font-bold text-primary">
                  <input
                    type="checkbox"
                    checked={newItem.is_bestseller}
                    onChange={(event) => setNewItem((current) => ({ ...current, is_bestseller: event.target.checked }))}
                  />
                  Best Seller
                </label>
                <label className="flex items-center gap-2 text-sm font-bold text-primary">
                  <input
                    type="checkbox"
                    checked={newItem.is_chef_pick}
                    onChange={(event) => setNewItem((current) => ({ ...current, is_chef_pick: event.target.checked }))}
                  />
                  Chef Recommendation
                </label>
                <label className="flex items-center gap-2 text-sm font-bold text-primary">
                  <input
                    type="checkbox"
                    checked={newItem.is_dessert_week}
                    onChange={(event) => setNewItem((current) => ({ ...current, is_dessert_week: event.target.checked }))}
                  />
                  Dessert of Week
                </label>
              </div>
              <button
                onClick={handleCreateMenuItem}
                disabled={isSavingItem}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-white font-bold disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {isSavingItem ? 'Saving...' : 'Save Item'}
              </button>
            </div>
          )}

          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search dishes..."
              className="w-full rounded-xl border border-white/50 bg-white/70 py-3 pl-11 pr-4 font-semibold text-primary outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {MENU_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  activeCategory === category
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white/70 text-primary/60 hover:bg-white hover:text-primary'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar">
          {isLoadingMenu && (
            <div className="col-span-full text-center py-8 text-primary/50 font-bold">Loading menu...</div>
          )}
          {!isLoadingMenu && filteredMenu.map((item) => {
            const visualIcon = item.category === 'Drinks' ? Coffee : item.category === 'Desserts' ? Sparkles : Utensils;
            const Icon = visualIcon;
            return (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="text-left bg-white/70 hover:bg-white p-5 rounded-2xl border border-white hover:border-secondary/30 shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Icon className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    {item.bestseller && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase">
                        <Flame className="w-3 h-3" />
                        Best
                      </span>
                    )}
                    {item.chefPick && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">
                        <Sparkles className="w-3 h-3" />
                        Chef
                      </span>
                    )}
                    {item.dessertWeek && (
                      <span className="px-2 py-1 rounded-full bg-violet-100 text-violet-700 text-[10px] font-black uppercase">
                        Dessert
                      </span>
                    )}
                  </div>
                </div>
                <h4 className="font-black text-primary mb-1">{item.name}</h4>
                <p className="text-xs text-primary/50 font-bold uppercase">{item.category}</p>
                {item.description && <p className="mt-2 text-xs text-primary/60 font-medium line-clamp-2">{item.description}</p>}
                <p className="mt-3 text-secondary font-black text-lg">Rs {item.price}</p>
              </button>
            );
          })}
          {!isLoadingMenu && filteredMenu.length === 0 && (
            <div className="col-span-full text-center py-8 text-primary/50 font-bold">No menu items in this filter.</div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white/70 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-outline-variant/15 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Receipt className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-headline font-bold text-primary">Current Order</h2>
          </div>
          <button
            onClick={clearCart}
            className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-red-600 text-xs font-bold hover:bg-red-100"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-primary/30">
              <Utensils className="w-12 h-12 mb-2 opacity-50" />
              <p className="font-medium">Add dishes from the left menu</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-xl border border-outline-variant/10 shadow-sm">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-primary">{item.name}</h4>
                    <span className="text-xs text-primary/60">Rs {item.price} x {item.qty}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-surface-variant/30 p-1 rounded-lg border border-outline-variant/10">
                    <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-white rounded-md transition-colors">
                      <Minus className="w-4 h-4 text-primary" />
                    </button>
                    <span className="font-bold text-sm w-6 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-white rounded-md transition-colors">
                      <Plus className="w-4 h-4 text-primary" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white p-6 border-t border-outline-variant/15 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="flex bg-surface-variant/50 rounded-xl p-1 mb-4 border border-outline-variant/20">
            <button
              onClick={() => setOrderType('room')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${orderType === 'room' ? 'bg-white text-primary shadow-sm' : 'text-primary/50 hover:text-primary'}`}
            >
              Room Charge
            </button>
            <button
              onClick={() => setOrderType('walk-in')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${orderType === 'walk-in' ? 'bg-white text-primary shadow-sm' : 'text-primary/50 hover:text-primary'}`}
            >
              Walk-in
            </button>
          </div>

          {orderType === 'room' && (
            <div className="mb-4">
              <select
                value={selectedRoom}
                onChange={(event) => setSelectedRoom(event.target.value)}
                className="w-full bg-surface-variant/30 border border-primary/10 rounded-xl py-3 px-4 text-on-surface focus:ring-2 focus:ring-secondary/20 outline-none appearance-none font-medium"
              >
                <option value="">Select Occupied Room...</option>
                {occupiedRooms.map((room) => (
                  <option key={room.room_id} value={room.room_number}>
                    Room {room.room_number}
                  </option>
                ))}
              </select>
            </div>
          )}

          <textarea
            value={orderNote}
            onChange={(event) => setOrderNote(event.target.value)}
            placeholder="Kitchen note (optional): no onion, extra spicy, allergy info..."
            className="w-full mb-4 min-h-16 rounded-xl border border-primary/10 bg-surface-variant/20 px-4 py-3 text-sm font-medium text-primary outline-none"
          />

          {statusMsg && (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {statusMsg}
            </div>
          )}

          <div className="space-y-2 mb-5">
            <div className="flex justify-between text-sm text-primary/60 font-medium">
              <span>Subtotal</span>
              <span>Rs {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-primary/60 font-medium">
              <span>GST (5%)</span>
              <span>Rs {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-headline font-black text-primary pt-2 border-t border-outline-variant/20">
              <span>Total</span>
              <span>Rs {total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
            className={`w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg ${
              cart.length > 0 ? 'bg-secondary text-on-secondary hover:bg-secondary-container hover:scale-[1.01]' : 'bg-surface-variant text-on-surface-variant/50 cursor-not-allowed'
            } disabled:opacity-60`}
          >
            {orderType === 'room' ? 'Send to Room Tab' : 'Process Walk-in Payment'}
            <CheckCircle2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};