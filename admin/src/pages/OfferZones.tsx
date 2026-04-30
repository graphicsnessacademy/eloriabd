import React, { useState, useEffect } from 'react';
import { api } from '../api/axios';
import {
  Save, Loader2, ChevronDown, ChevronUp, CheckCircle,
  Clock, Zap, Image as ImageIcon, Plus, Trash2
} from 'lucide-react';
import { ImageUpload, type ImageItem } from '../components/ImageUpload';

interface HeroSlide {
  isActive: boolean;
  promoBadge: string;
  yearLabel: string;
  mainTitle: string;
  bgImage: string;
  startDate?: string;
  endDate?: string;
}

const DEFAULT_ZONES = {
  hero: [] as HeroSlide[],
  countdown: { isActive: false, offerName: '', description: '', bgImage: '', expiresAt: '' },
  popup: { isActive: false, title: 'Off Your First Order', targetUrl: '/shop', delay: 3, discount: 15, couponCode: 'ELORIA15' },
};

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#534AB7] focus:ring-1 focus:ring-[#534AB7]/20 transition-all";
const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1";

export const OfferZones = () => {
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [successMsg, setSuccess]  = useState<string | null>(null);
  const [errorMsg, setError]      = useState<string | null>(null);
  const [openCard, setOpenCard]   = useState<string>('hero');
  const [zones, setZones]         = useState(DEFAULT_ZONES);

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    try {
      // Read from authenticated admin endpoint so we always get the real DB state
      const res = await api.get('/api/admin/config');
      const oz = res.data?.offerZones;
      if (oz) {
        setZones({
          hero: (oz.hero || []).map((h: any) => ({
            ...h,
            startDate: h.startDate ? new Date(h.startDate).toISOString().slice(0, 16) : '',
            endDate:   h.endDate   ? new Date(h.endDate).toISOString().slice(0, 16)   : '',
          })),
          countdown: {
            isActive:    oz.countdown?.isActive    ?? false,
            offerName:   oz.countdown?.offerName   ?? '',
            description: oz.countdown?.description ?? '',
            bgImage:     oz.countdown?.bgImage     ?? '',
            expiresAt:   oz.countdown?.expiresAt
              ? new Date(oz.countdown.expiresAt).toISOString().slice(0, 16)
              : '',
          },
          popup: {
            isActive:   oz.popup?.isActive   ?? false,
            title:      oz.popup?.title      ?? 'Off Your First Order',
            targetUrl:  oz.popup?.targetUrl  ?? '/shop',
            delay:      oz.popup?.delay      ?? 3,
            discount:   oz.popup?.discount   ?? 15,
            couponCode: oz.popup?.couponCode ?? 'ELORIA15',
          },
        });
      }
    } catch (err: any) {
      setError('Failed to load configuration.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.patch('/api/admin/config', { offerZones: zones });
      setSuccess('All offer zones saved!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Save failed. Check console.';
      setError(msg);
      console.error('Save error:', err?.response?.data || err);
    } finally {
      setSaving(false);
    }
  };

  // Hero helpers
  const addSlide = () => setZones(z => ({
    ...z,
    hero: [...z.hero, { isActive: false, promoBadge: '', yearLabel: '2026', mainTitle: 'Elegance Redefined', bgImage: '' }]
  }));

  const removeSlide = (i: number) => setZones(z => ({ ...z, hero: z.hero.filter((_, idx) => idx !== i) }));

  const setHeroField = (i: number, field: keyof HeroSlide, val: any) =>
    setZones(z => { const h = [...z.hero]; h[i] = { ...h[i], [field]: val }; return { ...z, hero: h }; });

  const imgItems = (url: string): ImageItem[] => url ? [{ id: url, publicId: url, url, isPrimary: true }] : [];

  const toggle = (card: string) => setOpenCard(o => o === card ? '' : card);

  if (loading) return (
    <div className="flex h-64 items-center justify-center gap-2 text-gray-400">
      <Loader2 className="animate-spin" size={20} /> Loading offer configuration…
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-gray-900">Marketing &amp; Offer Zones</h1>
        <p className="text-xs text-gray-400 mt-1">4 active offer surfaces — hero slideshow, promo badge, countdown banner, popup ad</p>
      </div>

      {successMsg && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-2 text-sm">
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm">
          ⚠ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">

        {/* ── HERO SLIDES ─────────────────────────────────────────────── */}
        <Card
          id="hero"
          open={openCard === 'hero'}
          onToggle={() => toggle('hero')}
          icon={<ImageIcon size={18} className="text-[#534AB7]" />}
          title={`Hero Banner Slides (${zones.hero.length})`}
          badge={zones.hero.filter(s => s.isActive).length + ' active'}
          action={
            <button
              type="button"
              onClick={e => { e.stopPropagation(); addSlide(); }}
              className="p-1.5 bg-[#534AB7] text-white rounded-lg hover:bg-[#3d3599] transition-colors flex items-center gap-1 text-xs font-bold"
            >
              <Plus size={14} /> Add slide
            </button>
          }
        >
          {zones.hero.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No slides yet — click "Add slide" to create your first hero banner.
            </div>
          ) : (
            <div className="space-y-8 divide-y divide-gray-100">
              {zones.hero.map((slide, i) => (
                <div key={i} className="pt-6 first:pt-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`slide-active-${i}`}
                        checked={slide.isActive}
                        onChange={e => setHeroField(i, 'isActive', e.target.checked)}
                        className="accent-[#534AB7] w-4 h-4"
                      />
                      <label htmlFor={`slide-active-${i}`} className="text-xs font-bold uppercase tracking-widest text-gray-600 cursor-pointer">
                        Slide #{String(i + 1).padStart(2, '0')} {slide.isActive ? '— Live' : '— Hidden'}
                      </label>
                    </div>
                    <button type="button" onClick={() => removeSlide(i)} className="text-red-400 hover:text-red-600 transition-colors p-1 rounded">
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Year / sub-label</label>
                      <input className={inputCls} placeholder="2026" value={slide.yearLabel}
                        onChange={e => setHeroField(i, 'yearLabel', e.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Main headline (use \n for line break)</label>
                      <input className={inputCls} placeholder="Elegance Redefined" value={slide.mainTitle}
                        onChange={e => setHeroField(i, 'mainTitle', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>Start date (optional)</label>
                      <input type="datetime-local" className={inputCls} value={slide.startDate || ''}
                        onChange={e => setHeroField(i, 'startDate', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>End date (optional)</label>
                      <input type="datetime-local" className={inputCls} value={slide.endDate || ''}
                        onChange={e => setHeroField(i, 'endDate', e.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Background image</label>
                      <ImageUpload
                        value={imgItems(slide.bgImage)}
                        onChange={imgs => setHeroField(i, 'bgImage', imgs[0]?.url || '')}
                        maxFiles={1}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── COUNTDOWN / FLASH SALE ──────────────────────────────────── */}
        <Card
          id="countdown"
          open={openCard === 'countdown'}
          onToggle={() => toggle('countdown')}
          icon={<Clock size={18} className="text-[#534AB7]" />}
          title="Flash Sale Countdown"
          badge={zones.countdown.isActive ? 'Live' : 'Off'}
          badgeColor={zones.countdown.isActive ? 'green' : 'gray'}
          action={
            <Toggle
              checked={zones.countdown.isActive}
              onChange={v => setZones(z => ({ ...z, countdown: { ...z.countdown, isActive: v } }))}
            />
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Offer name</label>
              <input className={inputCls} placeholder="FLASH DEAL" value={zones.countdown.offerName}
                onChange={e => setZones(z => ({ ...z, countdown: { ...z.countdown, offerName: e.target.value } }))} />
            </div>
            <div>
              <label className={labelCls}>Countdown ends at</label>
              <input type="datetime-local" className={inputCls} value={zones.countdown.expiresAt}
                onChange={e => setZones(z => ({ ...z, countdown: { ...z.countdown, expiresAt: e.target.value } }))} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Description</label>
              <textarea className={inputCls} rows={2} placeholder="Grab these deals before they're gone!"
                value={zones.countdown.description}
                onChange={e => setZones(z => ({ ...z, countdown: { ...z.countdown, description: e.target.value } }))} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Background image (optional — falls back to default)</label>
              <ImageUpload
                value={imgItems(zones.countdown.bgImage)}
                onChange={imgs => setZones(z => ({ ...z, countdown: { ...z.countdown, bgImage: imgs[0]?.url || '' } }))}
                maxFiles={1}
              />
            </div>
          </div>
        </Card>

        {/* ── POPUP AD ────────────────────────────────────────────────── */}
        <Card
          id="popup"
          open={openCard === 'popup'}
          onToggle={() => toggle('popup')}
          icon={<Zap size={18} className="text-[#534AB7]" />}
          title="Popup Ad"
          badge={zones.popup.isActive ? 'Live' : 'Off'}
          badgeColor={zones.popup.isActive ? 'green' : 'gray'}
          action={
            <Toggle
              checked={zones.popup.isActive}
              onChange={v => setZones(z => ({ ...z, popup: { ...z.popup, isActive: v } }))}
            />
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Discount % — shown as the big shimmer number in the popup */}
            <div>
              <label className={labelCls}>Discount % (big number shown on popup)</label>
              <input
                type="number" min={1} max={100} className={inputCls}
                placeholder="15"
                value={zones.popup.discount}
                onChange={e => setZones(z => ({ ...z, popup: { ...z.popup, discount: Number(e.target.value) } }))}
              />
            </div>
            {/* Coupon code — shown in the golden badge */}
            <div>
              <label className={labelCls}>Coupon code (displayed in golden badge)</label>
              <input
                className={inputCls}
                placeholder="ELORIA15"
                value={zones.popup.couponCode}
                onChange={e => setZones(z => ({ ...z, popup: { ...z.popup, couponCode: e.target.value } }))}
              />
            </div>
            {/* Subtitle — shown in italic below the % */}
            <div className="md:col-span-2">
              <label className={labelCls}>Subtitle (italic text below the discount number)</label>
              <input
                className={inputCls}
                placeholder="Off Your First Order"
                value={zones.popup.title}
                onChange={e => setZones(z => ({ ...z, popup: { ...z.popup, title: e.target.value } }))}
              />
            </div>
            {/* CTA link */}
            <div>
              <label className={labelCls}>Button link (target URL)</label>
              <input
                className={inputCls}
                placeholder="/shop"
                value={zones.popup.targetUrl}
                onChange={e => setZones(z => ({ ...z, popup: { ...z.popup, targetUrl: e.target.value } }))}
              />
            </div>
            {/* Delay */}
            <div>
              <label className={labelCls}>Delay before showing (seconds)</label>
              <input
                type="number" min={0} max={60} className={inputCls}
                value={zones.popup.delay}
                onChange={e => setZones(z => ({ ...z, popup: { ...z.popup, delay: Number(e.target.value) } }))}
              />
            </div>
          </div>
        </Card>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#1c1c1c] text-white py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-xs hover:bg-[#534AB7] disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          {saving ? 'Saving…' : 'Save All Offer Zones'}
        </button>
      </form>
    </div>
  );
};

// ── Reusable sub-components ──────────────────────────────────────────────────

interface CardProps {
  id: string; open: boolean; onToggle: () => void;
  icon: React.ReactNode; title: string;
  badge?: string; badgeColor?: 'green' | 'gray';
  action?: React.ReactNode;
  children: React.ReactNode;
}

const Card = ({ open, onToggle, icon, title, badge, badgeColor = 'gray', action, children }: CardProps) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div
      className="p-4 flex items-center justify-between bg-gray-50/60 cursor-pointer select-none"
      onClick={onToggle}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-bold uppercase tracking-widest text-xs text-gray-700">{title}</span>
        {badge && (
          <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
            badgeColor === 'green' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>{badge}</span>
        )}
      </div>
      <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
        {action}
        <span className="text-gray-400">{open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
      </div>
    </div>
    {open && <div className="p-6">{children}</div>}
  </div>
);

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-[#534AB7]' : 'bg-gray-200'}`}
  >
    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
  </button>
);