import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Package
} from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';
import StatusBadge from '../components/StatusBadge';
import { ExportButton } from '../components/ExportButton';

const MobileOrderCard = ({ order, onAction }: { order: any, onAction: () => void }) => {
  const controls = useAnimation();

  return (
    <div className="relative mb-4 rounded-2xl overflow-hidden bg-[#534AB7]/10 touch-pan-y shadow-sm">
      <div className="absolute right-0 top-0 bottom-0 w-[100px] flex items-center justify-center">
        <button onClick={onAction} className="text-[#534AB7] font-bold text-xs uppercase tracking-wider w-full h-full flex flex-col items-center justify-center gap-1">
          <SlidersHorizontal className="w-5 h-5" /> Action
        </button>
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_e, info) => {
          if (info.offset.x < -50) {
            controls.start({ x: -100 });
          } else {
            controls.start({ x: 0 });
          }
        }}
        animate={controls}
        className="relative z-10 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm min-h-[120px] flex flex-col justify-between"
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="font-mono text-xs font-black text-gray-900 tracking-tighter bg-gray-50 px-2 py-1 rounded inline-block border border-gray-100">
              {order.orderNumber || order._id.slice(-8).toUpperCase()}
            </span>
            <p className="text-sm font-bold text-gray-900 mt-2">{order.customer?.name || 'Guest User'}</p>
          </div>
          <div className="min-h-[44px] flex items-center shrink-0">
            <StatusBadge status={order.status} />
          </div>
        </div>
        <div className="flex justify-between items-end border-t border-gray-50 pt-3">
          <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
            {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
          <span className="text-sm font-black text-[#534AB7]">৳{(order.total || 0).toLocaleString()}</span>
        </div>
      </motion.div>
    </div>
  );
};

const STATUS_TABS = [
  'All',
  'Pending',
  'Confirmed',
  'Packaged',
  'On Courier',
  'Delivered',
  'Cancelled'
];

export const OrderList: React.FC = () => {
  const navigate = useNavigate();

  // Data States
  const [orders, setOrders] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Filter States
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dates, setDates] = useState({ start: '', end: '' });
  const [page, setPage] = useState(1);

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Debounce Search - 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/orders', {
        params: {
          status: activeTab,
          search: debouncedSearch,
          startDate: dates.start,
          endDate: dates.end,
          page,
          limit: 15
        }
      });
      setOrders(data.orders || []);
      setCounts(data.statusCounts || {});
      setTotalPages(data.pages || 1);
      setTotalOrders(data.total || 0);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab, debouncedSearch, dates, page]);

  const toggleSelectAll = () => {
    if (selectedIds.length === orders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map(o => o._id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selectedIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      await api.patch('/api/admin/orders/bulk-status', {
        orderIds: selectedIds,
        status: bulkStatus
      });
      setSelectedIds([]);
      setBulkStatus('');
      fetchOrders();
    } catch (err) {
      alert("Failed to update orders");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight font-serif">Order Management</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Fulfill customer orders and track logistics</p>
        </div>
        <ExportButton 
          endpoint={`/api/admin/orders/export?search=${debouncedSearch}&status=${activeTab}&startDate=${dates.start}&endDate=${dates.end}`}
          filename={`eloria_orders_${new Date().toISOString().split('T')[0]}.csv`}
          label="Export Orders CSV"
          className="bg-[#534AB7] text-white hover:bg-[#3d3599]"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-gray-100">
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab;
          const count = counts[tab] || 0;

          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${isActive
                ? 'bg-[#534AB7] text-white border-[#534AB7] shadow-md'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                }`}
            >
              {tab}
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white font-black' : 'bg-gray-100 text-gray-500 font-bold'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters & Bulk Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search Input */}
          <div className="relative max-w-sm w-full group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#534AB7] transition-colors" />
            <input
              type="text"
              placeholder="Search Order #, Name or Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#534AB7] focus:ring-4 focus:ring-[#534AB7]/10 outline-none transition-all placeholder:text-gray-400 font-medium"
            />
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl transition-all focus-within:border-[#534AB7]">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dates.start}
                onChange={e => setDates(prev => ({ ...prev, start: e.target.value }))}
                className="bg-transparent text-xs font-semibold text-gray-700 outline-none w-full"
              />
            </div>
            <span className="text-gray-300 font-bold">→</span>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl transition-all focus-within:border-[#534AB7]">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dates.end}
                onChange={e => setDates(prev => ({ ...prev, end: e.target.value }))}
                className="bg-transparent text-xs font-semibold text-gray-700 outline-none w-full"
              />
            </div>
          </div>
        </div>

        {/* Floating Bulk Action Bar (Shows when items selected) */}
        {selectedIds.length > 0 && (
          <div className="absolute right-4 bg-[#F2F1FA] border border-[#534AB7]/30 px-3 py-2 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-right-4 z-10 shadow-lg shadow-[#534AB7]/10">
            <span className="text-xs font-black text-[#534AB7] uppercase tracking-wider bg-white px-2 py-1 rounded-md border border-[#534AB7]/20">
              {selectedIds.length} Selected
            </span>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="bg-white border border-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg outline-none focus:border-[#534AB7] cursor-pointer"
            >
              <option value="">Update Status</option>
              {STATUS_TABS.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={handleBulkUpdate}
              disabled={!bulkStatus || isBulkUpdating}
              className="px-4 py-1.5 bg-[#2C2C2A] hover:bg-black disabled:opacity-50 text-white text-xs rounded-lg shadow-md transition-all font-bold tracking-wide"
            >
              {isBulkUpdating ? 'Applying...' : 'Apply Format'}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="py-32 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-gray-100 border-t-[#534AB7] rounded-full animate-spin"></div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Loading Royalty...</span>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <Package className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-gray-900 font-bold font-serif text-lg">No orders found</h3>
            <p className="text-gray-500 text-sm mt-1">Adjust your filters.</p>
          </div>
        ) : (
          orders.map((order) => (
            <MobileOrderCard key={order._id} order={order} onAction={() => navigate(`/admin/orders/${order._id}`)} />
          ))
        )}
      </div>

      {/* Advanced Data Table (Desktop only) */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[500px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-5 w-12">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      onChange={toggleSelectAll}
                      checked={orders.length > 0 && selectedIds.length === orders.length}
                      className="w-4 h-4 rounded text-[#534AB7] border-gray-300 focus:ring-[#534AB7] cursor-pointer accent-[#534AB7]"
                    />
                  </div>
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Order #</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Customer</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Items</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Total Amount</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Status</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Date</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-gray-100 border-t-[#534AB7] rounded-full animate-spin"></div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Loading Royalty...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-32 text-center">
                    <div className="max-w-xs mx-auto">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                        <Package className="w-8 h-8 text-gray-300" />
                      </div>
                      <h3 className="text-gray-900 font-bold font-serif text-lg">No orders found</h3>
                      <p className="text-gray-500 text-sm mt-1">Adjust your filters or prepare for new arrivals.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="group hover:bg-[#534AB7]/[0.02] transition-colors duration-300">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(order._id)}
                        onChange={() => toggleSelect(order._id)}
                        className="w-4 h-4 rounded text-[#534AB7] border-gray-300 focus:ring-[#534AB7] cursor-pointer accent-[#534AB7]"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-black text-gray-900 tracking-tighter bg-gray-50 px-2 py-1 rounded inline-block w-max border border-gray-100 group-hover:border-[#534AB7]/30 transition-colors">
                          {order.orderNumber || order._id.slice(-8).toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#534AB7]/10 flex items-center justify-center text-[#534AB7] font-serif font-bold text-sm border border-[#534AB7]/20">
                          {order.customer?.name?.[0] || 'E'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900 leading-none mb-1">{order.customer?.name || 'Guest User'}</span>
                          <span className="text-[11px] text-gray-500 font-medium tracking-tight bg-gray-50 px-1.5 py-0.5 rounded w-max border border-gray-100">{order.customer?.phone || 'No Phone'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center justify-center min-w-[32px] h-8 bg-gray-50 text-gray-700 text-xs font-black rounded-lg border border-gray-200 px-2">
                        {order.items?.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0) || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900 font-mono tracking-tight">৳{(order.total || 0).toLocaleString()}</span>
                        <span className="text-[9px] text-[#534AB7] font-black uppercase tracking-widest mt-1">
                          {order.paymentMethod === 'Cash on Delivery' ? 'COD' : 'PAID'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                        {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/admin/orders/${order._id}`)}
                        className="inline-flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-[#534AB7] hover:border-[#534AB7]/40 hover:shadow-lg hover:shadow-[#534AB7]/20 transition-all active:scale-95 group/btn relative"
                        title="View Action"
                      >
                        <SlidersHorizontal className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Integration */}
        {orders.length > 0 && (
          <div className="px-6 py-5 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-black text-gray-400 uppercase tracking-[0.1em]">
              Showing <span className="text-gray-900 mx-1">{(page - 1) * 15 + 1} - {Math.min(page * 15, totalOrders)}</span> of <span className="text-gray-900 ml-1">{totalOrders}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:border-[#534AB7] hover:text-[#534AB7] disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-all flex items-center gap-1 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <div className="flex items-center bg-white border border-gray-200 rounded-xl max-h-9 overflow-hidden shadow-sm">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pg = page - 2 + i;
                  if (page <= 2) pg = i + 1;
                  if (page >= totalPages - 1) pg = totalPages - 4 + i;
                  if (pg > 0 && pg <= totalPages) {
                    return (
                      <button
                        key={pg}
                        onClick={() => setPage(pg)}
                        className={`w-9 h-9 text-xs font-black transition-all border-r border-gray-100 last:border-r-0 ${page === pg
                          ? 'bg-[#534AB7] text-white'
                          : 'text-gray-600 hover:bg-gray-50'
                          }`}
                      >
                        {pg}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:border-[#534AB7] hover:text-[#534AB7] disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-all flex items-center gap-1 shadow-sm"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};