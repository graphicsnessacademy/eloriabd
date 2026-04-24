import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Mail, Phone, MapPin, Calendar, Clock,
    ShoppingCart, Heart, Activity, ShoppingBag, Eye,
    Search, AlertCircle, Package
} from 'lucide-react';

export const UserDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [user, setUser] = useState<any>(null);
    const [activity, setActivity] = useState<{ orders: any[], events: any[] }>({ orders: [], events: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'behavior'>('orders');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const [userRes, activityRes] = await Promise.all([
                    api.get(`/api/admin/users/${id}`),
                    api.get(`/api/admin/users/${id}/activity`)
                ]);
                setUser(userRes.data);
                setActivity(activityRes.data);
            } catch (error) {
                console.error('Failed to fetch user details', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchUserData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-[#534AB7] rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle size={48} className="text-slate-300" />
                <p className="text-lg font-medium text-slate-500">User not found</p>
                <button onClick={() => navigate('/admin/users')} className="text-sm font-bold text-[#534AB7] hover:underline">Return to Users</button>
            </div>
        );
    }

    const defaultAddress = user.addresses?.find((a: any) => a.isDefault) || user.addresses?.[0];

    const formatEventAction = (event: any) => {
        switch (event.eventType) {
            case 'page_view':
                if (event.payload?.path?.includes('/search')) {
                    return { icon: <Search size={14} />, text: `Searched for "${new URLSearchParams(event.payload.path.split('?')[1]).get('q') || 'products'}"`, color: 'bg-blue-100 text-blue-600' };
                }
                if (event.payload?.path?.includes('/product/')) {
                    return { icon: <Eye size={14} />, text: `Viewed Product`, color: 'bg-purple-100 text-purple-600' };
                }
                return { icon: <Eye size={14} />, text: `Viewed ${event.payload?.path}`, color: 'bg-slate-100 text-slate-600' };
            case 'add_to_cart':
                return { icon: <ShoppingBag size={14} />, text: `Added to Bag: ${event.payload?.name || 'Item'}`, color: 'bg-emerald-100 text-emerald-600' };
            case 'add_to_wishlist':
                return { icon: <Heart size={14} />, text: `Added to Wishlist`, color: 'bg-rose-100 text-rose-600' };
            default:
                return { icon: <Activity size={14} />, text: `Action: ${event.eventType}`, color: 'bg-gray-100 text-gray-600' };
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => navigate('/admin/users')}
                    className="p-2 text-slate-400 hover:text-[#534AB7] hover:bg-[#534AB7]/10 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Customer Profile</h1>
                    <p className="text-sm text-slate-500 mt-1">Detailed view and activity history</p>
                </div>
            </div>

            {/* Profile Summary Card */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-8 flex flex-col md:flex-row items-start md:items-center gap-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#F2F1FA] rounded-full blur-3xl opacity-50 pointer-events-none group-hover:opacity-100 transition-opacity" />
                
                <div className="w-24 h-24 rounded-full bg-[#534AB7]/10 text-[#534AB7] border border-[#534AB7]/20 flex items-center justify-center text-3xl font-black shrink-0 relative z-10 shadow-inner">
                    {user.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 relative z-10 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">{user.name}</h2>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border mt-2 ${
                                user.status === 'active' 
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                    : 'bg-rose-50 text-rose-600 border-rose-100'
                            }`}>
                                {user.status === 'active' ? 'Active Account' : 'Suspended Account'}
                            </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Orders</p>
                                <p className="text-xl font-bold text-slate-800">{activity.orders.length}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Spent</p>
                                <p className="text-xl font-bold text-[#534AB7]">৳{activity.orders.reduce((acc, o) => acc + o.total, 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center"><Mail size={14} className="text-slate-400" /></div>
                            {user.email}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center"><Phone size={14} className="text-slate-400" /></div>
                            {user.phone || 'N/A'}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600 font-medium truncate" title={defaultAddress?.address}>
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0"><MapPin size={14} className="text-slate-400" /></div>
                            <span className="truncate">{defaultAddress ? `${defaultAddress.area}, ${defaultAddress.district}` : 'No Address'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center"><Calendar size={14} className="text-slate-400" /></div>
                            Joined {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs System */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
                <div className="flex border-b border-slate-100 bg-slate-50/50">
                    <button 
                        onClick={() => setActiveTab('orders')}
                        className={`flex items-center gap-2 px-8 py-5 text-sm font-bold tracking-wide uppercase transition-colors relative ${activeTab === 'orders' ? 'text-[#534AB7]' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ShoppingCart size={16} /> Order History
                        {activeTab === 'orders' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 w-full h-0.5 bg-[#534AB7]" />}
                    </button>
                    <button 
                        onClick={() => setActiveTab('wishlist')}
                        className={`flex items-center gap-2 px-8 py-5 text-sm font-bold tracking-wide uppercase transition-colors relative ${activeTab === 'wishlist' ? 'text-[#534AB7]' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Heart size={16} /> Wishlist
                        {activeTab === 'wishlist' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 w-full h-0.5 bg-[#534AB7]" />}
                    </button>
                    <button 
                        onClick={() => setActiveTab('behavior')}
                        className={`flex items-center gap-2 px-8 py-5 text-sm font-bold tracking-wide uppercase transition-colors relative ${activeTab === 'behavior' ? 'text-[#534AB7]' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Activity size={16} /> Behavior Trail
                        {activeTab === 'behavior' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 w-full h-0.5 bg-[#534AB7]" />}
                    </button>
                </div>

                <div className="p-8">
                    <AnimatePresence mode="wait">
                        {activeTab === 'orders' && (
                            <motion.div 
                                key="orders"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="overflow-x-auto"
                            >
                                {activity.orders.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                        <Package className="w-12 h-12 mb-3 text-slate-300" />
                                        <p className="text-sm font-medium">No orders found for this user.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-sm text-slate-600">
                                        <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-4">Order Ref</th>
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4">Items</th>
                                                <th className="px-6 py-4 text-right">Settlement</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {activity.orders.map((order) => (
                                                <tr key={order._id} className="hover:bg-slate-50/50 transition">
                                                    <td className="px-6 py-4 font-mono font-bold text-slate-800">{order.orderNumber}</td>
                                                    <td className="px-6 py-4 font-medium">{new Date(order.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 font-medium">{order.items.length} units</td>
                                                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">৳{order.total.toLocaleString()}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-slate-200">
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button onClick={() => navigate(`/admin/orders/${order._id}`)} className="text-[10px] font-black text-[#534AB7] uppercase tracking-widest hover:underline">
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'wishlist' && (
                            <motion.div 
                                key="wishlist"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {user.wishlist.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                        <Heart className="w-12 h-12 mb-3 text-slate-300" />
                                        <p className="text-sm font-medium">Wishlist is empty.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                        {user.wishlist.map((item: any) => (
                                            <div key={item._id} className="group relative">
                                                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 mb-3 shadow-sm group-hover:shadow-md transition-all">
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                </div>
                                                <h3 className="font-bold text-sm text-slate-800 line-clamp-1">{item.name}</h3>
                                                <p className="font-mono text-xs font-bold text-[#534AB7] mt-1">৳{item.price.toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'behavior' && (
                            <motion.div 
                                key="behavior"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="max-w-3xl"
                            >
                                {activity.events.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                        <Activity className="w-12 h-12 mb-3 text-slate-300" />
                                        <p className="text-sm font-medium">No recent behavior tracked.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 pl-2">
                                        {activity.events.map((event) => {
                                            const action = formatEventAction(event);
                                            return (
                                                <div key={event._id} className="flex gap-6 relative">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-4 border-white ${action.color} shadow-sm`}>
                                                        {action.icon}
                                                    </div>
                                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <p className="text-sm font-bold text-slate-800">{action.text}</p>
                                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                                <Clock size={10} /> {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-2 font-medium">
                                                            {new Date(event.createdAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
