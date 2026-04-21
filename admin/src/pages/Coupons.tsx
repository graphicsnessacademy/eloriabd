import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/axios';
import {
  Plus, Edit, Trash2, RefreshCw, X, Zap, CheckCircle,
  ToggleLeft, ToggleRight, Tag, AlertCircle, Copy
} from 'lucide-react';

interface Coupon {
  _id: string;
  code: string;
  discountType: 'flat' | 'percent';
  discountValue: number;
  minOrderValue: number;
  usageLimit: number;
  usageCount: number;
  perUserLimit: number;
  expiryDate: string;
  isActive: boolean;
}

const EMPTY_FORM = {
  code: '',
  discountType: 'flat' as 'flat' | 'percent',
  discountValue: 100,
  minOrderValue: 0,
  usageLimit: 100,
  perUserLimit: 1,
  expiryDate: '',
  isActive: true,
};

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all';
const labelCls = 'block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1';

export const Coupons: React.FC = () => {
  const [coupons, setCoupons]   = useState<Coupon[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modalOpen, setModal]   = useState(false);
  const [editing, setEditing]   = useState<Coupon | null>(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [copiedCode, setCopied] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/coupons');
      setCoupons(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setModal(true);
  };
  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderValue: c.minOrderValue,
      usageLimit: c.usageLimit,
      perUserLimit: c.perUserLimit,
      expiryDate: c.expiryDate ? c.expiryDate.slice(0, 10) : '',
      isActive: c.isActive,
    });
    setError('');
    setModal(true);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setForm(f => ({ ...f, code }));
  };

  const handleSave = async () => {
    if (!form.expiryDate) { setError('Expiry date is required.'); return; }
    setSaving(true); setError('');
    try {
      if (editing) {
        await api.patch(`/api/admin/coupons/${editing._id}`, form);
        setSuccess('Coupon updated!');
      } else {
        await api.post('/api/admin/coupons', form);
        setSuccess('Coupon created!');
      }
      setTimeout(() => setSuccess(''), 3000);
      setModal(false);
      fetch();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  const handleToggle = async (coupon: Coupon) => {
    try {
      await api.patch(`/api/admin/coupons/${coupon._id}`, { isActive: !coupon.isActive });
      fetch();
    } catch { /* silent */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon permanently?')) return;
    try {
      await api.delete(`/api/admin/coupons/${id}`);
      fetch();
    } catch { /* silent */ }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  };

  const isExpired = (date: string) => new Date(date) < new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Coupon Codes</h1>
          <p className="text-sm text-slate-500 mt-1">Manage discount coupons for the store</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#534AB7] text-white rounded-lg text-sm font-bold hover:bg-[#3d3599] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          <CheckCircle className="w-4 h-4" /> {success}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto min-h-[300px] relative">
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">
              <RefreshCw className="w-7 h-7 text-[#534AB7] animate-spin" />
            </div>
          )}
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4 font-semibold">Code</th>
                <th className="px-5 py-4 font-semibold">Discount</th>
                <th className="px-5 py-4 font-semibold">Min Order</th>
                <th className="px-5 py-4 font-semibold">Usage</th>
                <th className="px-5 py-4 font-semibold">Expires</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && coupons.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                      <Tag className="w-10 h-10 mb-3 text-slate-300" />
                      <p className="font-medium text-slate-500">No coupons yet</p>
                      <p className="text-xs mt-1">Click "Create Coupon" to add your first one.</p>
                    </div>
                  </td>
                </tr>
              )}
              {coupons.map(c => (
                <tr key={c._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                  {/* Code */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#534AB7] bg-[#534AB7]/8 px-2.5 py-1 rounded-md text-xs tracking-widest">
                        {c.code}
                      </span>
                      <button onClick={() => copyCode(c.code)} className="text-slate-300 hover:text-slate-600 transition" title="Copy">
                        {copiedCode === c.code ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                  {/* Discount */}
                  <td className="px-5 py-3">
                    <span className={`text-sm font-bold ${c.discountType === 'percent' ? 'text-blue-600' : 'text-emerald-600'}`}>
                      {c.discountType === 'percent' ? `${c.discountValue}%` : `৳${c.discountValue}`}
                    </span>
                  </td>
                  {/* Min Order */}
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {c.minOrderValue > 0 ? `৳${c.minOrderValue.toLocaleString()}` : '—'}
                  </td>
                  {/* Usage */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#534AB7] rounded-full transition-all"
                          style={{ width: `${Math.min(100, (c.usageCount / c.usageLimit) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{c.usageCount}/{c.usageLimit}</span>
                    </div>
                  </td>
                  {/* Expiry */}
                  <td className="px-5 py-3 text-xs">
                    <span className={isExpired(c.expiryDate) ? 'text-red-500 font-semibold' : 'text-slate-500'}>
                      {new Date(c.expiryDate).toLocaleDateString('en-GB')}
                    </span>
                  </td>
                  {/* Status Toggle */}
                  <td className="px-5 py-3">
                    <button onClick={() => handleToggle(c)} className="flex items-center gap-1.5 text-xs font-bold">
                      {c.isActive && !isExpired(c.expiryDate)
                        ? <><ToggleRight className="w-5 h-5 text-[#534AB7]" /><span className="text-[#534AB7]">Active</span></>
                        : <><ToggleLeft className="w-5 h-5 text-slate-300" /><span className="text-slate-400">Off</span></>
                      }
                    </button>
                  </td>
                  {/* Actions */}
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-slate-400 hover:text-[#534AB7] hover:bg-[#534AB7]/10 rounded transition">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(c._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#534AB7]/10 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-[#534AB7]" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editing ? 'Edit Coupon' : 'Create Coupon'}
                </h3>
              </div>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
                </div>
              )}

              {/* Code + Generate */}
              <div>
                <label className={labelCls}>Coupon Code</label>
                <div className="flex gap-2">
                  <input
                    className={inputCls}
                    placeholder="e.g. SAVE50"
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#534AB7] text-white rounded-lg text-xs font-bold hover:bg-[#3d3599] transition whitespace-nowrap"
                  >
                    <Zap className="w-3.5 h-3.5" /> Generate
                  </button>
                </div>
              </div>

              {/* Discount Type */}
              <div>
                <label className={labelCls}>Discount Type</label>
                <div className="flex gap-2">
                  {(['flat', 'percent'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, discountType: t }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${form.discountType === t ? 'bg-[#534AB7] text-white border-[#534AB7]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#534AB7]/40'}`}
                    >
                      {t === 'flat' ? '৳ Flat Amount' : '% Percentage'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Values Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>
                    Discount Value {form.discountType === 'percent' ? '(%)' : '(৳)'}
                  </label>
                  <input
                    type="number" min={0}
                    className={inputCls}
                    value={form.discountValue}
                    onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>Min Order Value (৳)</label>
                  <input
                    type="number" min={0}
                    className={inputCls}
                    value={form.minOrderValue}
                    onChange={e => setForm(f => ({ ...f, minOrderValue: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>Usage Limit (total)</label>
                  <input
                    type="number" min={1}
                    className={inputCls}
                    value={form.usageLimit}
                    onChange={e => setForm(f => ({ ...f, usageLimit: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>Per User Limit</label>
                  <input
                    type="number" min={1}
                    className={inputCls}
                    value={form.perUserLimit}
                    onChange={e => setForm(f => ({ ...f, perUserLimit: Number(e.target.value) }))}
                  />
                </div>
              </div>

              {/* Expiry + Active */}
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className={labelCls}>Expiry Date *</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={form.expiryDate}
                    onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>Active</label>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${form.isActive ? 'bg-[#534AB7]' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setModal(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-[#534AB7] text-white text-sm font-bold rounded-lg hover:bg-[#3d3599] transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Saving…' : editing ? 'Update Coupon' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
