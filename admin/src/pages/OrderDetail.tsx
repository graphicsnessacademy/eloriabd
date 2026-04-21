import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import {
    ArrowLeft, CheckCircle, Clock, MapPin,
    Phone, Mail, ShoppingBag, Truck, AlertCircle,
    FileText, Save, Send, XCircle, RotateCcw
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

const STEPS = ['Pending', 'Confirmed', 'Packaged', 'On Courier', 'Delivered'];
const ALL_STATUSES = [...STEPS, 'Cancelled', 'Returned'];

// Inline Toast Component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [message, onClose]);

    if (!message) return null;

    return (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-50 animate-in slide-in-from-bottom-4 transition-all ${type === 'success' ? 'bg-[#2C2C2A] text-white border border-[#534AB7]/30' : 'bg-red-600 text-white'}`}>
            {type === 'success' ? <CheckCircle size={20} className="text-emerald-400" /> : <AlertCircle size={20} />}
            <span className="text-sm font-bold tracking-wide">{message}</span>
            <button onClick={onClose} className="ml-4 hover:bg-white/10 p-1 rounded-full transition-colors">
                <XCircle size={16} className="opacity-70 hover:opacity-100" />
            </button>
        </div>
    );
};

export default function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Form states
    const [statusNote, setStatusNote] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [courierInfo, setCourierInfo] = useState({ name: '', tracking: '' });
    const [internalNote, setInternalNote] = useState('');

    // Toast state
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
    };

    const fetchOrder = async () => {
        try {
            const { data } = await api.get(`/api/admin/orders/${id}`);
            setOrder(data);
            setSelectedStatus(data.status);
            setCourierInfo({
                name: data.courierName || '',
                tracking: data.trackingNumber || ''
            });
        } catch (err) { 
            console.error("Error loading order:", err); 
            showToast("Failed to load order data", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrder(); }, [id]);

    const handleUpdateStatus = async () => {
        if (!selectedStatus || selectedStatus === order.status) return;
        setUpdating(true);
        // Optimistically record the old state to revert if needed
        const previousOrder = { ...order };
        const updatedTimeline = [...(order.timeline || []), { status: selectedStatus, note: statusNote || `Status updated to ${selectedStatus}`, timestamp: new Date() }];
        
        // Optimistic UI Update
        setOrder({ ...order, status: selectedStatus, timeline: updatedTimeline });

        try {
            const { data } = await api.patch(`/api/admin/orders/${id}/status`, {
                status: selectedStatus,
                note: statusNote || `Status updated to ${selectedStatus}`
            });
            // Finalize with actual server data
            setOrder(data.order);
            setStatusNote('');
            showToast(`Order marked as ${selectedStatus}`);
        } catch (err) { 
            setOrder(previousOrder);
            showToast("Failed to update status", "error"); 
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateCourier = async () => {
        if (!courierInfo.name.trim() && !courierInfo.tracking.trim()) return;
        setUpdating(true);
        const previousOrder = { ...order };

        // Optimistic update
        setOrder({ ...order, courierName: courierInfo.name, trackingNumber: courierInfo.tracking });

        try {
            const { data } = await api.patch(`/api/admin/orders/${id}/courier`, {
                courierName: courierInfo.name,
                trackingNumber: courierInfo.tracking
            });
            setOrder(data);
            showToast("Courier information dispatched!");
        } catch (err) { 
            setOrder(previousOrder);
            showToast("Failed to update courier", "error"); 
        } finally {
            setUpdating(false);
        }
    };

    const handleAddInternalNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!internalNote.trim()) return;

        const previousOrder = { ...order };
        const optimisticNote = { text: internalNote, createdAt: new Date() };

        // Optimistic update
        setOrder({ ...order, internalNotes: [...(order.internalNotes || []), optimisticNote] });

        try {
            const { data } = await api.post(`/api/admin/orders/${id}/notes`, { text: internalNote });
            setOrder({ ...order, internalNotes: data });
            setInternalNote('');
            showToast("Private note saved successfully");
        } catch (err) { 
            setOrder(previousOrder);
            showToast("Failed to add note", "error"); 
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-gray-100 border-t-[#534AB7] rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-[#534AB7] uppercase tracking-[0.2em] animate-pulse">Loading Royalty...</p>
        </div>
    );

    if (!order) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <XCircle size={48} className="text-gray-300" />
            <p className="text-lg font-serif font-black text-gray-500">Order not found</p>
            <button onClick={() => navigate('/admin/orders')} className="text-sm font-bold text-[#534AB7] hover:underline">Return to Orders</button>
        </div>
    );

    const isCancelled = order.status === 'Cancelled';
    const isReturned = order.status === 'Returned';

    return (
        <div className="p-4 md:p-8 bg-[#fafafa] min-h-screen pb-20">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            {/* --- HEADER --- */}
            <div className="max-w-[1400px] mx-auto mb-10 border-b border-gray-100 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <button
                        onClick={() => navigate('/admin/orders')}
                        className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#534AB7] mb-4 transition-colors group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        BACK TO ORDERS
                    </button>
                    <div className="flex flex-wrap items-center gap-4">
                        <h1 className="text-3xl font-serif font-black text-gray-900 tracking-tight">
                            ORDER <span className="font-mono text-[#534AB7]">#{order.orderNumber}</span>
                        </h1>
                        <StatusBadge status={order.status} />
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-3">
                        Recorded on {new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
                    </p>
                </div>
                <div className="flex flex-col md:items-end">
                    <p className="text-[10px] font-black text-[#534AB7] uppercase tracking-widest mb-1">Settlement Total</p>
                    <p className="text-4xl font-mono font-black text-gray-900 tracking-tighter">৳{order.total?.toLocaleString()}</p>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* --- LEFT: PIPELINE & ITEMS (8 cols) --- */}
                <div className="lg:col-span-8 space-y-8">

                    {/* 1. Status Stepper */}
                    <div className="bg-white p-10 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-2 h-full bg-[#534AB7] opacity-10 group-hover:opacity-100 transition-opacity" />
                        {isCancelled || isReturned ? (
                            <div className="flex items-center gap-4 p-6 bg-red-50/50 border border-red-100 rounded-3xl text-red-600">
                                <AlertCircle size={28} className="shrink-0" />
                                <div>
                                    <p className="text-base font-black uppercase tracking-widest text-[#2C2C2A]">Order {order.status}</p>
                                    <p className="text-xs font-medium mt-1 opacity-80 text-red-600">This order path has been terminated or reversed.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between relative px-2 gap-8 sm:gap-0">
                                <div className="hidden sm:block absolute top-1/2 left-0 w-full h-[3px] bg-gray-50 -translate-y-1/2 z-0 rounded-full" />
                                <div className="sm:hidden absolute left-[15px] top-0 w-[3px] h-full bg-gray-50 z-0 rounded-full" />
                                
                                {STEPS.map((step, idx) => {
                                    const currentIdx = STEPS.indexOf(order.status);
                                    const isDone = currentIdx >= idx;
                                    const isCurrent = currentIdx === idx;
                                    return (
                                        <div key={step} className="relative z-10 flex flex-row sm:flex-col items-center gap-4 sm:gap-0">
                                            <div 
                                                className={`w-8 h-8 rounded-full flex items-center justify-center border-4 transition-all shadow-sm ${isDone ? 'text-white' : 'text-gray-300'}`}
                                                style={{ 
                                                    backgroundColor: isDone ? '#534AB7' : '#fff',
                                                    borderColor: isDone ? '#534AB7' : '#f8f9fa',
                                                    transform: isCurrent ? 'scale(1.2)' : 'scale(1)',
                                                    boxShadow: isCurrent ? '0 0 0 4px rgba(83, 74, 183, 0.1)' : 'none'
                                                }}
                                            >
                                                {isDone ? <CheckCircle size={14} strokeWidth={3} /> : <Clock size={14} strokeWidth={3} />}
                                            </div>
                                            <span className={`text-[10px] font-black uppercase sm:mt-5 tracking-[0.1em] ${isDone ? 'text-[#2C2C2A]' : 'text-gray-400'}`}>
                                                {step}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* 2. Items Table */}
                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-50 bg-[#F2F1FA]/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ShoppingBag size={18} className="text-[#534AB7]" />
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#2C2C2A]">Merchandise Allocation</h3>
                            </div>
                            <span className="text-[10px] font-black text-[#534AB7] bg-white border border-[#534AB7]/20 px-3 py-1 rounded-full uppercase tracking-wider">
                                {order.items?.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0)} units
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-[9px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-5">Article</th>
                                        <th className="px-8 py-5">Configuration</th>
                                        <th className="px-8 py-5 text-center">Quantity</th>
                                        <th className="px-8 py-5 text-right">Settlement</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(order.items || []).map((item: any, i: number) => (
                                        <tr key={i} className="group hover:bg-[#F2F1FA]/20 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-16 h-20 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm group-hover:scale-105 group-hover:shadow-md transition-all">
                                                        {item.image ? (
                                                            <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <ShoppingBag className="text-gray-300" size={24} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{item.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium mt-1">Ref: {item.productId?._id?.slice(-8) || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-wrap gap-2">
                                                    {item.size && <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded">SZ: {item.size}</span>}
                                                    {item.color && <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded">CL: {item.color}</span>}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-sm font-black text-gray-900 text-center">
                                                {item.quantity}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <p className="text-sm font-mono font-black text-gray-900 tracking-tight">৳{(item.price * item.quantity).toLocaleString()}</p>
                                                <p className="text-[10px] text-gray-400 font-bold mt-1">৳{item.price.toLocaleString()} each</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Price Calculations */}
                        <div className="bg-[#F2F1FA]/30 p-10 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <div className="p-6 bg-white rounded-3xl border border-[#534AB7]/10 shadow-sm">
                                    <div className="flex items-center gap-3 text-[10px] font-black text-[#534AB7] uppercase tracking-widest mb-3">
                                        <RotateCcw size={14} strokeWidth={3} /> Payment Method
                                    </div>
                                    <p className="text-sm font-black text-[#2C2C2A] uppercase tracking-wide">{order.paymentMethod || 'Cash on Delivery'}</p>
                                </div>
                            </div>
                            <div className="space-y-4 p-4">
                                <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 border-dashed pb-3">
                                    <span>Merchandise Subtotal</span>
                                    <span className="text-gray-900 font-mono tracking-tighter text-sm">৳{order.subtotal?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 border-dashed pb-3">
                                    <span>Standard Courier</span>
                                    <span className="text-gray-900 font-mono tracking-tighter text-sm">৳{order.shippingCost?.toLocaleString()}</span>
                                </div>
                                {order.couponDiscount > 0 && (
                                    <div className="flex justify-between text-[11px] font-bold text-[#534AB7] uppercase tracking-widest border-b border-gray-100 border-dashed pb-3">
                                        <span>Coupon Appreciation</span>
                                        <span className="font-mono tracking-tighter text-sm">-৳{order.couponDiscount?.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="pt-2 flex justify-between items-end">
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#2C2C2A]">Grand Settlement</span>
                                    <span className="text-3xl font-black font-mono text-[#534AB7] tracking-tighter">৳{order.total?.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Customer Profile & Activity Log */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Customer Dossier */}
                        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-8 flex flex-col">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2C2C2A] border-b border-gray-100 pb-4 flex items-center gap-2">
                                <Mail size={14} className="text-[#534AB7]" /> Customer Dossier
                            </h3>
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-[#534AB7]/10 border border-[#534AB7]/20 rounded-full flex items-center justify-center text-[#534AB7] text-2xl font-serif font-black shadow-sm shrink-0">
                                    {order.customer?.name?.[0] || '?'}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-lg font-black text-[#2C2C2A] uppercase tracking-tight truncate">{order.customer?.name}</p>
                                    <p className="text-xs text-gray-500 font-semibold truncate mt-1">{order.customer?.email || 'No email provided'}</p>
                                </div>
                            </div>
                            <div className="space-y-5 pt-4 bg-gray-50/50 rounded-3xl p-6 border border-gray-100 flex-1">
                                <div className="flex items-center gap-4 text-sm text-[#2C2C2A] font-bold">
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                                        <Phone size={14} className="text-[#534AB7]" />
                                    </div>
                                    <span className="truncate">{order.customer?.phone}</span>
                                </div>
                                <div className="flex items-start gap-4 text-sm text-[#2C2C2A] leading-relaxed font-semibold">
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                                        <MapPin size={14} className="text-[#534AB7]" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1 tracking-widest">Destination Address</p>
                                        <span className="line-clamp-3 leading-snug">{order.shippingAddress?.address}, {order.shippingAddress?.area}, {order.shippingAddress?.district}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Timeline / Activity */}
                        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6 flex flex-col max-h-[500px]">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2C2C2A] border-b border-gray-100 pb-4 shrink-0 flex items-center gap-2">
                                <Clock size={14} className="text-[#534AB7]" /> Activity Log
                            </h3>
                            <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100 overflow-y-auto custom-scrollbar pr-4 flex-1">
                                {(order.timeline || []).slice().reverse().map((log: any, i: number) => (
                                    <div key={i} className="flex gap-5 relative animate-in slide-in-from-left duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                                        <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center shrink-0 z-10 transition-colors ${i === 0 ? 'bg-white border-[#534AB7]' : 'bg-white border-gray-200'}`} />
                                        <div>
                                            <p className={`text-xs font-black uppercase tracking-widest ${i === 0 ? 'text-[#534AB7]' : 'text-[#2C2C2A]'}`}>{log.status}</p>
                                            <p className="text-[11px] text-gray-500 font-semibold leading-relaxed mt-1">{log.note}</p>
                                            <p className="text-[9px] text-gray-400 mt-2 font-bold bg-gray-50 inline-block px-2 py-1 rounded-md">{new Date(log.timestamp).toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT: ADMIN CONTROL PANEL (4 cols) --- */}
                <div className="lg:col-span-4 space-y-6">

                    {/* 1. Status Update Panel (Deep Noir Profile) */}
                    <div className="bg-[#2C2C2A] text-white p-8 rounded-[32px] shadow-2xl shadow-black/20 border border-white/5 space-y-8 relative overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#534AB7] rounded-full blur-3xl opacity-20 pointer-events-none" />
                        
                        <div className="relative z-10">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-2 border-b border-white/10 pb-4">Lifecycle Directives</h3>
                            <p className="text-2xl font-black font-serif mt-4">Control Panel</p>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/50 block mb-3">Transition To</label>
                                <select
                                    value={selectedStatus}
                                    onChange={e => setSelectedStatus(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:ring-2 focus:ring-[#534AB7] focus:border-[#534AB7] outline-none appearance-none cursor-pointer hover:bg-white/10 transition-all"
                                >
                                    {ALL_STATUSES.map(s => <option key={s} value={s} className="bg-[#2C2C2A] text-white">{s}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/50 block mb-3">Administrative Note</label>
                                <textarea
                                    value={statusNote}
                                    onChange={e => setStatusNote(e.target.value)}
                                    placeholder="e.g. Verified by warehouse team..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white/90 focus:ring-2 focus:ring-[#534AB7] focus:border-[#534AB7] outline-none h-32 resize-none placeholder:text-white/30 transition-all font-medium"
                                />
                            </div>

                            <button
                                onClick={handleUpdateStatus}
                                disabled={updating || selectedStatus === order.status}
                                className="w-full bg-[#534AB7] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-[#2C2C2A] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-40 disabled:hover:bg-[#534AB7] disabled:hover:text-white disabled:active:scale-100 shadow-lg"
                            >
                                {updating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={16} />} 
                                {updating ? 'Syncing...' : 'Update Status'}
                            </button>
                        </div>
                    </div>

                    {/* 2. Courier Management */}
                    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F2F1FA] rounded-full blur-3xl opacity-50 -z-0 transition-opacity group-hover:opacity-100" />
                        <div className="relative z-10">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#2C2C2A] mb-2 border-b border-gray-100 pb-4">Logistics Dispatch</h3>
                            <p className="text-xl font-serif font-black text-[#2C2C2A] mt-4">Courier Info</p>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div className="relative">
                                <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-[#534AB7]" size={16} />
                                <input
                                    value={courierInfo.name}
                                    onChange={e => setCourierInfo({ ...courierInfo, name: e.target.value })}
                                    placeholder="Courier Partner Name"
                                    className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#534AB7] focus:border-[#534AB7] outline-none transition-all"
                                />
                            </div>
                            <div className="relative">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-[#534AB7]" size={16} />
                                <input
                                    value={courierInfo.tracking}
                                    onChange={e => setCourierInfo({ ...courierInfo, tracking: e.target.value })}
                                    placeholder="Tracking Reference #"
                                    className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#534AB7] focus:border-[#534AB7] outline-none transition-all"
                                />
                            </div>
                            <button
                                onClick={handleUpdateCourier}
                                disabled={updating || (!courierInfo.name && !courierInfo.tracking)}
                                className="w-full bg-[#2C2C2A] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                            >
                                <Send size={14} /> Dispatch Parcel
                            </button>
                        </div>
                    </div>

                    {/* 3. Internal Conversation Drawer */}
                    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6 flex flex-col h-[400px]">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4 shrink-0">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2C2C2A] flex items-center gap-2">
                                Private Notes
                            </h3>
                            <span className="text-[9px] font-black bg-[#534AB7] text-white px-2 py-0.5 rounded uppercase tracking-wider">STAFF</span>
                        </div>

                        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1 flex flex-col-reverse">
                            {(!order.internalNotes || order.internalNotes.length === 0) && (
                                <div className="text-center py-6 opacity-30 select-none m-auto">
                                    <FileText size={32} className="mx-auto mb-3" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#2C2C2A]">No private archives</p>
                                </div>
                            )}
                            {(order.internalNotes || []).slice().reverse().map((n: any, i: number) => (
                                <div key={i} className="bg-[#F2F1FA]/50 p-5 rounded-2xl border border-[#534AB7]/10 group hover:border-[#534AB7]/30 transition-colors">
                                    <p className="text-sm font-semibold text-[#2C2C2A] leading-relaxed">{n.text}</p>
                                    <p className="text-[9px] text-[#534AB7] mt-3 font-black uppercase tracking-widest">
                                        {new Date(n.createdAt).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleAddInternalNote} className="relative shrink-0 pt-4 border-t border-gray-100">
                            <textarea
                                value={internalNote}
                                onChange={e => setInternalNote(e.target.value)}
                                placeholder="Write a secure staff note..."
                                className="w-full px-5 py-4 pr-14 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#534AB7] focus:border-[#534AB7] outline-none h-16 resize-none placeholder:text-gray-400 transition-all leading-relaxed"
                            />
                            <button
                                type="submit"
                                disabled={!internalNote.trim()}
                                className="absolute right-2 top-[30px] p-2 bg-[#534AB7] text-white rounded-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-md"
                            >
                                <Send size={16} className="-ml-0.5 mt-0.5" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}