import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { Search, Hash, SlidersHorizontal, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

const TABS = ['All', 'Pending', 'Confirmed', 'Packaged', 'On Courier', 'Delivered', 'Cancelled'];





export function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [counts, setCounts] = useState<any>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/orders', { params: { status: activeTab, search, page } });
      setOrders(data.orders || []);
      setCounts(data.statusCounts || {});
      setTotalPages(data.pages || 1);
    } catch (err) { console.error("Error fetching orders:", err); }
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(fetchOrders, 400);
    return () => clearTimeout(timeout);
  }, [activeTab, search, page]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Order Management</h1>

      <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-gray-100 pb-2">
        {TABS.map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setPage(1); }} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${activeTab === tab ? 'bg-black text-white' : 'text-gray-400 hover:bg-gray-100'}`}>
            {tab} ({counts[tab] || 0})
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text" placeholder="Search by Order #, Name or Phone..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-[#534AB7] outline-none"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm shadow-indigo-100/20">
        <table className="w-full text-left border-collapse">
          {/* --- Table Header --- */}
          <thead className="bg-[#FCFBFE] border-b border-gray-100">
            <tr>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Identity</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Customer</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Amount</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Status</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Details</th>
            </tr>
          </thead>

          {/* --- Table Body --- */}
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-eloria-purple border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Synchronizing Orders...</p>
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-24 text-center">
                  <p className="text-sm font-serif italic text-gray-400 text-xl">No masterpieces ordered yet.</p>
                </td>
              </tr>
            ) : (
              orders.map((o: any) => (
                <tr key={o._id} className="group hover:bg-[#534AB7]/[0.02] transition-colors duration-200">

                  {/* 1. IDENTITY (Order #) */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 group-hover:border-eloria-purple/30 group-hover:bg-white transition-all">
                        <Hash size={14} className="text-gray-400 group-hover:text-eloria-purple" />
                      </div>
                      <span className="font-mono text-[13px] font-black text-gray-900 tracking-tighter bg-gray-50 px-2 py-1 rounded border border-gray-100">
                        {o.orderNumber || "EL-PENDING"}
                      </span>
                    </div>
                  </td>

                  {/* 2. CUSTOMER */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      {/* Letter Avatar */}
                      <div className="w-10 h-10 rounded-full bg-[#534AB7]/10 flex items-center justify-center text-eloria-purple font-serif font-bold text-sm border border-[#534AB7]/5">
                        {o.customer?.name?.[0] || 'G'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-none mb-1">
                          {o.customer?.name || 'Guest User'}
                        </p>
                        <p className="text-[11px] text-gray-400 font-medium tracking-tight">
                          {o.customer?.phone || o.shippingAddress?.contact || 'No contact'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* 3. AMOUNT */}
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900">
                        ৳{(o.total || o.totalAmount || 0).toLocaleString()}
                      </span>
                      <span className="text-[9px] text-green-600 font-black uppercase tracking-widest mt-1 flex items-center gap-1">
                        <CreditCard size={10} /> {o.paymentMethod || 'COD'}
                      </span>
                    </div>
                  </td>

                  {/* 4. STATUS */}
                  <td className="px-6 py-5">
                    <StatusBadge status={o.status || 'Pending'} />
                  </td>

                  {/* 5. ACTION */}
                  <td className="px-6 py-5 text-right">
                    <button
                      onClick={() => navigate(`/admin/orders/${o._id}`)}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-eloria-purple hover:border-eloria-purple/30 hover:shadow-lg hover:shadow-indigo-100/50 transition-all active:scale-95 group/btn"
                    >
                      <SlidersHorizontal size={18} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center items-center gap-4">
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 border rounded-lg disabled:opacity-30"><ChevronLeft size={18} /></button>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Page {page} of {totalPages}</span>
        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 border rounded-lg disabled:opacity-30"><ChevronRight size={18} /></button>
      </div>
    </div>
  );
}