import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    User, MapPin, ShoppingCart, Heart, LogOut, Edit3,
    Trash2, Plus, Package, ChevronRight, X, Minus, AlertCircle,
    CheckCircle, Home, Briefcase, ShieldCheck
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Tab = 'dashboard' | 'orders' | 'address' | 'cart' | 'wishlist';

interface Address {
    id: string;
    label: 'Home' | 'Office';
    recipientName: string;
    contact: string;
    country: string;
    district: string;
    area: string;
    postCode: string;
    address: string;
    isDefault?: boolean;
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

// ── Avatar initials ──
function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const sz = { sm: 'w-8 h-8 text-xs', md: 'w-11 h-11 text-sm', lg: 'w-20 h-20 text-2xl' };
    return (
        <div className={`${sz[size]} rounded-full bg-[#534AB7] text-white flex items-center justify-center font-bold font-serif shrink-0`}>
            {initials}
        </div>
    );
}

// ── Section header ──
function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xs font-extrabold uppercase tracking-[0.35em] text-gray-800">{children}</h2>
            <div className="flex-1 h-px bg-gray-100" />
        </div>
    );
}

// ─────────────────────────────────────────────
// TAB: Dashboard
// ─────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DashboardTab({ user, onTabChange }: { user: any; onTabChange: (t: Tab) => void }) {
    const { cart, wishlist, logout, updateUserProfile } = useStore();
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
    const [isSaving, setIsSaving] = useState(false);

    const stats = [
        { label: 'Cart Items', value: cart.length, tab: 'cart' as Tab, icon: ShoppingCart, color: 'bg-[#f0eeff] text-[#534AB7]' },
        { label: 'Wishlist', value: wishlist.length, tab: 'wishlist' as Tab, icon: Heart, color: 'bg-[#fff0f5] text-[#D4537E]' },
        { label: 'Orders', value: '...', tab: 'orders' as Tab, icon: Package, color: 'bg-[#f0f7ff] text-[#3b82f6]' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('eloria_token');
            const API_URL = 'https://eloriabd.vercel.app';
            const res = await fetch(`${API_URL}/api/user/update`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(editForm)
            });
            const data = await res.json();
            if (res.ok) {
                updateUserProfile({ name: editForm.name, phone: editForm.phone });
                setIsEditing(false);
            } else {
                alert(data.message || 'Failed to update profile');
            }
        } catch {
            alert('Network error while updating profile');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Profile card */}
            <div className="bg-gradient-to-br from-[#534AB7]/5 via-white to-[#D4537E]/5 border border-gray-100 rounded-sm p-6 flex items-start justify-between gap-4 transition-all">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full">
                    {/* Avatar naturally updates since user?.name changes */}
                    <Avatar name={user?.name || 'Guest User'} size="lg" />
                    
                    {isEditing ? (
                        <div className="flex flex-col gap-3 w-full max-w-xs transition-all animate-in slide-in-from-left-4">
                            <input 
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Full Name"
                                className="w-full text-sm font-semibold border-b border-gray-300 py-1.5 focus:border-[#534AB7] outline-none transition-colors bg-transparent"
                            />
                            <input 
                                type="tel"
                                value={editForm.phone}
                                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="Phone Number"
                                className="w-full text-xs border-b border-gray-300 py-1.5 focus:border-[#534AB7] outline-none transition-colors bg-transparent"
                            />
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={isSaving}
                                    className="bg-[#534AB7] text-white px-5 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-[#3d3599] transition-colors disabled:opacity-70 active:scale-95"
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditForm({ name: user?.name || '', phone: user?.phone || '' });
                                    }}
                                    className="border border-gray-200 bg-white text-gray-500 px-5 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in zoom-in-95">
                            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400 mb-1">Welcome back</p>
                            <h3 className="text-xl font-serif font-bold text-gray-900 truncate max-w-[200px] sm:max-w-xs">{user?.name || 'Guest User'}</h3>
                            <p className="text-xs text-gray-500 mt-1">{user?.email || 'Not signed in'}</p>
                            {user?.phone && <p className="text-xs text-gray-500">{user.phone}</p>}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                    {!isEditing && user && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#534AB7] bg-white border border-[#534AB7]/30 px-3 py-2 rounded-sm hover:bg-[#534AB7] hover:text-white hover:border-[#534AB7] transition-all"
                        >
                            <Edit3 className="w-3 h-3" /> Edit
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-white border border-gray-200 px-3 py-2 rounded-sm hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                    >
                        <LogOut className="w-3 h-3" /> Logout
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div>
                <SectionTitle>My Activity</SectionTitle>
                <div className="grid grid-cols-3 gap-3">
                    {stats.map(({ label, value, tab, icon: Icon, color }) => (
                        <button
                            key={label}
                            onClick={() => tab && onTabChange(tab)}
                            className={`${tab ? 'cursor-pointer hover:shadow-md' : 'cursor-default'} border border-gray-100 rounded-sm p-4 text-center transition-all duration-200 bg-white group`}
                        >
                            <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <p className="text-2xl font-bold font-serif text-gray-900">{value}</p>
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 mt-1">{label}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick links */}
            <div>
                <SectionTitle>Quick Access</SectionTitle>
                <div className="space-y-1">
                    {[
                        { label: 'My Cart', tab: 'cart' as Tab, icon: ShoppingCart, desc: `${cart.length} items` },
                        { label: 'My Wishlist', tab: 'wishlist' as Tab, icon: Heart, desc: `${wishlist.length} saved` },
                        { label: 'Saved Addresses', tab: 'address' as Tab, icon: MapPin, desc: 'Manage delivery addresses' },
                    ].map(({ label, tab, icon: Icon, desc }) => (
                        <button
                            key={tab}
                            onClick={() => onTabChange(tab)}
                            className="w-full flex items-center justify-between px-4 py-3 border border-gray-100 rounded-sm hover:border-[#534AB7]/30 hover:bg-[#534AB7]/3 transition-all group bg-white"
                        >
                            <div className="flex items-center gap-3">
                                <Icon className="w-4 h-4 text-gray-400 group-hover:text-[#534AB7] transition-colors" />
                                <div className="text-left">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-700 group-hover:text-[#534AB7]">{label}</p>
                                    <p className="text-[10px] text-gray-400">{desc}</p>
                                </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#534AB7] group-hover:translate-x-1 transition-all" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// TAB: Address
// ─────────────────────────────────────────────
function AddressTab() {
    const [addresses, setAddresses] = useState<Address[]>([
        {
            id: '1',
            label: 'Home',
            recipientName: '',
            contact: '',
            country: 'Bangladesh',
            district: '',
            area: '',
            postCode: '',
            address: '',
            isDefault: true,
        }
    ]);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    const emptyForm: Omit<Address, 'id'> = {
        label: 'Home', recipientName: '', contact: '',
        country: 'Bangladesh', district: '', area: '', postCode: '', address: ''
    };
    const [form, setForm] = useState<Omit<Address, 'id'>>(emptyForm);

    const handleSave = () => {
        if (!form.recipientName || !form.contact || !form.district || !form.area || !form.address) return;
        if (editId) {
            setAddresses(prev => prev.map(a => a.id === editId ? { ...form, id: editId } : a));
        } else {
            setAddresses(prev => [...prev, { ...form, id: Date.now().toString() }]);
        }
        setShowForm(false);
        setEditId(null);
        setForm(emptyForm);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const handleEdit = (a: Address) => {
        setForm({ label: a.label, recipientName: a.recipientName, contact: a.contact, country: a.country, district: a.district, area: a.area, postCode: a.postCode, address: a.address });
        setEditId(a.id);
        setShowForm(true);
    };

    const handleDelete = (id: string) => setAddresses(prev => prev.filter(a => a.id !== id));

    const setDefault = (id: string) => setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));

    const inputCls = "w-full border border-gray-200 rounded-sm px-3 py-2.5 text-xs text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#534AB7] transition-colors bg-white";
    const labelCls = "block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1.5";

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <SectionTitle>Saved Addresses</SectionTitle>
            </div>

            {saved && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-sm px-4 py-3 text-xs font-bold">
                    <CheckCircle className="w-4 h-4" /> Address saved successfully!
                </div>
            )}

            {/* Address cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {addresses.map(addr => (
                    <div key={addr.id} className={`relative border rounded-sm p-4 transition-all ${addr.isDefault ? 'border-[#534AB7]/40 bg-[#534AB7]/3' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                        {addr.isDefault && (
                            <span className="absolute top-3 right-3 text-[8px] font-extrabold uppercase tracking-widest bg-[#534AB7] text-white px-2 py-0.5 rounded-sm">Default</span>
                        )}
                        <div className="flex items-center gap-2 mb-3">
                            {addr.label === 'Home'
                                ? <Home className="w-3.5 h-3.5 text-[#534AB7]" />
                                : <Briefcase className="w-3.5 h-3.5 text-[#534AB7]" />
                            }
                            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#534AB7]">{addr.label}</span>
                        </div>
                        {addr.recipientName ? (
                            <>
                                <p className="text-xs font-bold text-gray-800">{addr.recipientName}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{addr.contact}</p>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{addr.address}, {addr.area}, {addr.district}, {addr.country} {addr.postCode}</p>
                            </>
                        ) : (
                            <p className="text-xs text-gray-400 italic">No details yet — click edit to fill in.</p>
                        )}
                        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100">
                            <button onClick={() => handleEdit(addr)} className="text-[9px] font-bold uppercase tracking-widest text-[#534AB7] hover:underline">Edit</button>
                            {!addr.isDefault && (
                                <>
                                    <button onClick={() => setDefault(addr.id)} className="text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-700">Set Default</button>
                                    <button onClick={() => handleDelete(addr.id)} className="ml-auto text-[9px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {/* Add new card */}
                <button
                    onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }}
                    className="border-2 border-dashed border-gray-200 rounded-sm p-4 flex flex-col items-center justify-center gap-2 hover:border-[#534AB7]/40 hover:bg-[#534AB7]/3 transition-all group min-h-[140px]"
                >
                    <div className="w-9 h-9 rounded-full bg-gray-100 group-hover:bg-[#534AB7]/10 flex items-center justify-center transition-colors">
                        <Plus className="w-4 h-4 text-gray-400 group-hover:text-[#534AB7]" />
                    </div>
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.25em] text-gray-400 group-hover:text-[#534AB7]">Add New Address</span>
                </button>
            </div>

            {/* Form drawer */}
            {showForm && (
                <div className="border border-[#534AB7]/20 rounded-sm bg-[#534AB7]/3 p-5 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-extrabold uppercase tracking-[0.3em] text-gray-700">
                            {editId ? 'Edit Address' : 'New Address'}
                        </h3>
                        <button onClick={() => { setShowForm(false); setEditId(null); }}>
                            <X className="w-4 h-4 text-gray-400 hover:text-gray-700" />
                        </button>
                    </div>

                    {/* Label toggle */}
                    <div>
                        <label className={labelCls}>Address Type</label>
                        <div className="flex gap-2">
                            {(['Home', 'Office'] as const).map(l => (
                                <button key={l}
                                    onClick={() => setForm(f => ({ ...f, label: l }))}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest border transition-all ${form.label === l ? 'bg-[#534AB7] text-white border-[#534AB7]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#534AB7]/40'}`}
                                >
                                    {l === 'Home' ? <Home className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />} {l}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Recipient Name *</label>
                            <input className={inputCls} placeholder="Full Name" value={form.recipientName} onChange={e => setForm(f => ({ ...f, recipientName: e.target.value }))} />
                        </div>
                        <div>
                            <label className={labelCls}>Contact Number *</label>
                            <input className={inputCls} placeholder="Mobile Number" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
                        </div>
                        <div>
                            <label className={labelCls}>Country</label>
                            <select className={inputCls} value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}>
                                <option>Bangladesh</option>
                                <option>India</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>District / City *</label>
                            <input className={inputCls} placeholder="e.g. Dhaka" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} />
                        </div>
                        <div>
                            <label className={labelCls}>Area / Thana / Upazilla *</label>
                            <input className={inputCls} placeholder="e.g. Gulshan" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} />
                        </div>
                        <div>
                            <label className={labelCls}>Post Code</label>
                            <input className={inputCls} placeholder="1212" value={form.postCode} onChange={e => setForm(f => ({ ...f, postCode: e.target.value }))} />
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>Full Address *</label>
                        <textarea className={`${inputCls} resize-none`} rows={3} placeholder="House / Building / Street" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button onClick={handleSave} className="flex-1 bg-[#534AB7] text-white text-[10px] font-bold uppercase tracking-widest py-3 rounded-sm hover:bg-[#3d3599] transition-colors active:scale-[0.98]">
                            Save Address
                        </button>
                        <button onClick={() => { setShowForm(false); setEditId(null); }} className="px-6 border border-gray-200 text-[10px] font-bold uppercase tracking-widest text-gray-500 rounded-sm hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// TAB: Cart
// ─────────────────────────────────────────────
function CartTab() {
    const { cart, removeFromCart, updateCartQuantity, clearCart } = useStore();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subtotal = cart.reduce((sum: number, item: any) => sum + item.price * (item.quantity || 1), 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalItems = cart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);

    if (cart.length === 0) {
        return (
            <div className="py-20 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-6 h-6 text-gray-300" />
                </div>
                <h3 className="text-lg font-serif text-gray-700 mb-2">Your cart is empty</h3>
                <p className="text-xs text-gray-400 mb-6">Add products from the shop to see them here.</p>
                <Link to="/shop" className="inline-flex items-center gap-2 bg-[#534AB7] text-white text-[10px] font-bold uppercase tracking-widest px-6 py-3 rounded-sm hover:bg-[#3d3599] transition-colors">
                    Browse Shop <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <SectionTitle>My Cart</SectionTitle>
            </div>

            <div className="flex items-center justify-between -mt-2 mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{totalItems} items</p>
                <button onClick={clearCart} className="text-[9px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Clear All
                </button>
            </div>

            {/* Items */}
            <div className="space-y-3">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {cart.map((item: any, idx: number) => {
                    const id = item._id || item.id;
                    return (
                        <div key={`${id}-${item.size}-${item.color}-${idx}`} className="flex gap-3 p-3 border border-gray-100 rounded-sm hover:border-gray-200 transition-all bg-white">
                            <Link to={`/product/${id}`} className="w-16 h-16 shrink-0 rounded-sm overflow-hidden bg-gray-50">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                            </Link>
                            <div className="flex-1 min-w-0">
                                <Link to={`/product/${id}`} className="block">
                                    <h4 className="text-[11px] font-bold uppercase tracking-tight text-gray-800 truncate hover:text-[#534AB7] transition-colors">{item.name}</h4>
                                </Link>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {item.size && item.size !== 'Standard' && (
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded-sm">{item.size}</span>
                                    )}
                                    {item.color && item.color !== 'Default' && (
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded-sm">{item.color}</span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs font-bold text-gray-900">₹{(item.price * (item.quantity || 1)).toLocaleString()}</span>
                                    {/* Qty controls */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => updateCartQuantity(id, item.size, item.color, (item.quantity || 1) - 1)}
                                            className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded-sm hover:border-[#534AB7] hover:text-[#534AB7] transition-colors text-gray-500"
                                        >
                                            <Minus className="w-2.5 h-2.5" />
                                        </button>
                                        <span className="w-6 text-center text-[11px] font-bold text-gray-800">{item.quantity || 1}</span>
                                        <button
                                            onClick={() => updateCartQuantity(id, item.size, item.color, (item.quantity || 1) + 1)}
                                            className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded-sm hover:border-[#534AB7] hover:text-[#534AB7] transition-colors text-gray-500"
                                        >
                                            <Plus className="w-2.5 h-2.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => removeFromCart(id, item.size, item.color)}
                                className="shrink-0 self-start mt-1 text-gray-300 hover:text-red-400 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Order summary */}
            <div className="border border-gray-100 rounded-sm p-5 bg-gray-50 space-y-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-gray-500 mb-4">Order Summary</p>
                <div className="flex justify-between text-xs text-gray-600">
                    <span>Subtotal ({totalItems} items)</span>
                    <span className="font-bold">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                    <span>Shipping</span>
                    <span className="text-green-600 font-bold">Calculated at checkout</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-sm font-bold text-gray-900">
                    <span>Total</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <Link
                    to="/checkout"
                    className="block w-full text-center bg-[#534AB7] text-white text-[10px] font-bold uppercase tracking-widest py-3.5 rounded-sm mt-2 hover:bg-[#3d3599] transition-colors active:scale-[0.99]"
                >
                    Proceed to Checkout
                </Link>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// TAB: Wishlist
// ─────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function WishlistTab({ products }: { products: any[] }) {
    const { wishlist, toggleWishlist, addToCart } = useStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wishlisted = products.filter((p: any) => wishlist.includes(p._id?.toString() || p.id?.toString()));

    if (wishlisted.length === 0) {
        return (
            <div className="py-20 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-6 h-6 text-gray-300" />
                </div>
                <h3 className="text-lg font-serif text-gray-700 mb-2">Nothing saved yet</h3>
                <p className="text-xs text-gray-400 mb-6">Tap the heart icon on any product to save it here.</p>
                <Link to="/shop" className="inline-flex items-center gap-2 bg-[#D4537E] text-white text-[10px] font-bold uppercase tracking-widest px-6 py-3 rounded-sm hover:bg-[#b83a65] transition-colors">
                    Explore Products <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SectionTitle>My Wishlist</SectionTitle>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 -mt-4">{wishlisted.length} saved items</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {wishlisted.map((product: any) => {
                    const pid = product._id || product.id;
                    const isOut = product.inStock === false || product.stock === 0;
                    const isSale = !isOut && product.originalPrice && product.originalPrice > product.price;
                    return (
                        <div key={pid} className="group border border-gray-100 rounded-sm overflow-hidden hover:shadow-sm transition-all bg-white">
                            <div className="relative aspect-square overflow-hidden bg-gray-50">
                                <Link to={`/product/${pid}`} className="block w-full h-full">
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                                </Link>
                                {isSale && (
                                    <span className="absolute top-2 left-2 bg-[#D4537E] text-white text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-sm">Sale</span>
                                )}
                                <button
                                    onClick={() => toggleWishlist(pid)}
                                    className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm text-[#D4537E] hover:bg-[#D4537E] hover:text-white transition-all"
                                    title="Remove from wishlist"
                                >
                                    <Heart className="w-3.5 h-3.5 fill-current" />
                                </button>
                            </div>
                            <div className="p-2.5">
                                <Link to={`/product/${pid}`} className="block">
                                    <h4 className="text-[10px] font-bold uppercase tracking-tight text-gray-700 truncate hover:text-[#534AB7] transition-colors mb-1">{product.name}</h4>
                                </Link>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                                        {isSale && product.originalPrice && (
                                            <span className="text-[10px] text-gray-400 line-through ml-1.5">₹{product.originalPrice.toLocaleString()}</span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    disabled={isOut}
                                    onClick={() => !isOut && addToCart(product)}
                                    className={`mt-2 w-full py-2 text-[9px] font-bold uppercase tracking-widest rounded-sm transition-all active:scale-[0.98] ${isOut
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-[#534AB7] text-white hover:bg-[#3d3599]'
                                        }`}
                                >
                                    {isOut ? 'Out of Stock' : 'Add to Cart'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// TAB: Orders
// ─────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function OrdersTab({ user }: { user: any }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || (!user._id && !user.id)) return;
        
        const fetchOrders = async () => {
            try {
                const token = localStorage.getItem('eloria_token');
                const userId = user._id || user.id;
                const API_URL = 'https://eloriabd.vercel.app';
                const res = await fetch(`${API_URL}/api/orders/user/${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setOrders(data);
                }
            } catch {
                console.error("Failed to fetch orders");
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [user]);

    if (loading) {
        return <div className="py-20 text-center"><p className="text-xs text-gray-400 font-bold uppercase tracking-widest animate-pulse">Loading orders...</p></div>;
    }

    if (orders.length === 0) {
        return (
            <div className="py-20 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-6 h-6 text-gray-300" />
                </div>
                <h3 className="text-lg font-serif text-gray-700 mb-2">No orders found</h3>
                <p className="text-xs text-gray-400 mb-6 max-w-sm mx-auto">You haven't placed any orders yet. Discover our latest collections and find something you love.</p>
                <Link to="/shop" className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white text-[10px] font-bold uppercase tracking-widest px-6 py-3 rounded-sm hover:bg-[#534AB7] transition-colors">
                    Shop Collection <ChevronRight className="w-3 h-3" />
                </Link>
            </div>
        );
    }

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-green-50 text-green-700 border-green-200';
            case 'Cancelled': return 'bg-[#D4537E]/10 text-[#D4537E] border-[#D4537E]/20';
            default: return 'bg-blue-50 text-blue-700 border-blue-200'; // Ongoing
        }
    };
    
    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'Completed': return 'Delivered';
            case 'Cancelled': return 'Cancelled';
            default: return 'In Progress'; // Ongoing
        }
    };

    return (
        <div className="space-y-6">
            <SectionTitle>My Orders</SectionTitle>
            <div className="space-y-4">
                {orders.map((order) => (
                    <div key={order._id} className="border border-gray-100 rounded-sm bg-white overflow-hidden hover:shadow-sm transition-all">
                        {/* Order Header */}
                        <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between">
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Order ID</p>
                                <p className="text-xs font-mono text-gray-800">{order._id.slice(-8).toUpperCase()}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Date Placed</p>
                                <p className="text-xs text-gray-800">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Total</p>
                                <p className="text-xs font-bold text-gray-900">₹{order.totalAmount?.toLocaleString()}</p>
                            </div>
                            <div className="ml-auto flex items-center">
                                <span className={`px-2.5 py-1 rounded-sm border text-[9px] font-extrabold uppercase tracking-widest ${getStatusStyles(order.status)}`}>
                                    {getStatusLabel(order.status)}
                                </span>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="p-4 space-y-3">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {order.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-4 py-2">
                                    <div className="w-14 h-14 bg-gray-50 rounded-sm overflow-hidden shrink-0 border border-gray-100">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Link to={`/product/${item.productId}`} className="text-[11px] font-bold uppercase tracking-tight text-gray-800 truncate block hover:text-[#534AB7] transition-colors">{item.name}</Link>
                                        <div className="flex items-center gap-2 mt-1">
                                            {item.size && item.size !== 'Standard' && <span className="text-[9px] font-bold text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-sm">Size: {item.size}</span>}
                                            {item.color && item.color !== 'Default' && <span className="text-[9px] font-bold text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-sm">Color: {item.color}</span>}
                                            <span className="text-[10px] text-gray-500 ml-auto font-bold text-gray-800">Qty: {item.quantity || 1}</span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs font-bold text-gray-900">₹{item.price.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Main AccountPage
// ─────────────────────────────────────────────
interface AccountPageProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    products?: any[];
}

export default function AccountPage({ products = [] }: AccountPageProps) {
    const { user, cart, wishlist, setIsAuthOpen } = useStore();
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const navigate = useNavigate();

    // 1. Strict Account Access Route Guard
    useEffect(() => {
        const verifyAccess = () => {
             if (!user && !localStorage.getItem('eloria_token')) {
                 navigate('/');
                 setIsAuthOpen(true);
             }
        };
        verifyAccess();
        const timer = setInterval(verifyAccess, 500); // Guard check while evaluating promises
        if (user) clearInterval(timer);
        return () => clearInterval(timer);
    }, [user, navigate, setIsAuthOpen]);

    if (!user) return <div className="min-h-screen bg-[#fafafa]" />; // Clean empty fallback while protected

    const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: User },
        { id: 'orders', label: 'Orders', icon: Package },
        { id: 'address', label: 'Address', icon: MapPin },
        { id: 'cart', label: 'Cart', icon: ShoppingCart, badge: cart.length },
        { id: 'wishlist', label: 'Wishlist', icon: Heart, badge: wishlist.length },
    ];

    return (
        <div className="pt-[72px] min-h-screen bg-[#fafafa]">
            {/* Page header */}
            <div className="bg-white border-b border-gray-100 py-8 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-3">
                        <Link to="/" className="hover:text-gray-700 transition-colors">Home</Link>
                        <span>/</span>
                        <span className="text-[#534AB7]">My Account</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {user && <Avatar name={user.name || 'Member'} size="sm" />}
                        <div>
                            <h1 className="text-2xl font-serif font-bold text-gray-900 leading-tight">
                                {user ? `Hello, ${(user.name || 'Member').split(' ')[0]}` : 'My Account'}
                            </h1>
                            {!user && (
                                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                                    <AlertCircle className="w-3 h-3" />
                                    Guest mode — <Link to="/" className="text-[#534AB7] underline">sign in</Link> to sync across devices
                                </p>
                            )}
                            {user && (
                                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                                    <ShieldCheck className="w-3 h-3 text-green-500" /> Cloud-synced account
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-6">

                {/* ── Sidebar Nav ── */}
                <aside className="lg:w-52 shrink-0">
                    <nav className="bg-white border border-gray-100 rounded-sm overflow-hidden">
                        {tabs.map(({ id, label, icon: Icon, badge }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-all border-l-2 ${activeTab === id
                                        ? 'border-l-[#534AB7] bg-[#534AB7]/5 text-[#534AB7]'
                                        : 'border-l-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{label}</span>
                                </div>
                                {badge !== undefined && badge > 0 && (
                                    <span className={`text-[9px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center ${activeTab === id ? 'bg-[#534AB7] text-white' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>

                    {/* Guest nudge */}
                    {!user && (
                        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-sm p-3">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-amber-700 mb-1.5">Guest Mode</p>
                            <p className="text-[10px] text-amber-600 leading-relaxed">Your cart & wishlist are saved locally. Sign in to sync to the cloud.</p>
                        </div>
                    )}
                </aside>

                {/* ── Content Panel ── */}
                <main className="flex-1 bg-white border border-gray-100 rounded-sm p-5 md:p-7 min-h-[500px]">
                    {activeTab === 'dashboard' && <DashboardTab user={user} onTabChange={setActiveTab} />}
                    {activeTab === 'orders' && <OrdersTab user={user} />}
                    {activeTab === 'address' && <AddressTab />}
                    {activeTab === 'cart' && <CartTab />}
                    {activeTab === 'wishlist' && <WishlistPage products={products} />}
                </main>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Inline WishlistPage (reused inside AccountPage)
// ─────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function WishlistPage({ products }: { products: any[] }) {
    return <WishlistTab products={products} />;
}
