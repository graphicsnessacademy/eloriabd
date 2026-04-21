import React, { useState, useEffect } from 'react';
import { api } from '../api/axios';
import { 
    Save, Megaphone, Truck, Store, Link as LinkIcon, 
    Search, CheckCircle, AlertCircle, XCircle 
} from 'lucide-react';
import { ImageUpload } from '../components/ImageUpload';
import type { ImageItem } from '../components/ImageUpload';

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

interface SiteConfig {
    announcementBar: { text: string; color: string; isActive: boolean };
    freeShippingThreshold: number;
    returnPolicyDays: number;
    storeName: string;
    storePhone: string;
    storeEmail: string;
    socialLinks: { instagram: string; facebook: string; whatsapp: string };
    defaultMeta: { title: string; description: string; ogImage: string };
}

export const SiteConfigPage: React.FC = () => {
    const [config, setConfig] = useState<SiteConfig>({
        announcementBar: { text: '', color: '#534AB7', isActive: true },
        freeShippingThreshold: 5000,
        returnPolicyDays: 7,
        storeName: '',
        storePhone: '',
        storeEmail: '',
        socialLinks: { instagram: '', facebook: '', whatsapp: '' },
        defaultMeta: { title: '', description: '', ogImage: '' }
    });

    const [ogImages, setOgImages] = useState<ImageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const { data } = await api.get('/api/config');
                setConfig(data);
                if (data.defaultMeta?.ogImage) {
                    setOgImages([{ url: data.defaultMeta.ogImage, isPrimary: true, id: 'og-image', publicId: 'og-image' }]);
                }
            } catch (err) {
                console.error("Failed to load site config", err);
                setToast({ message: "Failed to load settings", type: "error" });
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleChange = (section: keyof SiteConfig, field: string, value: any) => {
        setConfig((prev) => ({
            ...prev,
            [section]: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...(prev[section] as any),
                [field]: value
            }
        }));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleBaseChange = (field: keyof SiteConfig, value: any) => {
        setConfig((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { ...config };
            if (ogImages.length > 0) {
                payload.defaultMeta.ogImage = ogImages[0].url;
            } else {
                payload.defaultMeta.ogImage = '';
            }

            await api.patch('/api/admin/config', payload);
            setToast({ message: "Configuration upgraded successfully!", type: "success" });
        } catch (err) {
            console.error("Save error", err);
            setToast({ message: "Failed to update configuration", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-gray-100 border-t-[#534AB7] rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-[#534AB7] uppercase tracking-[0.2em] animate-pulse">Loading Configurations...</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-20 max-w-[1200px] mx-auto">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight font-serif">Site Settings</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">Manage global storefront configuration</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3.5 bg-[#534AB7] hover:bg-[#43399c] text-white text-xs font-bold rounded-2xl shadow-lg shadow-[#534AB7]/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 tracking-[0.2em] uppercase"
                >
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                    {saving ? 'Syncing...' : 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Store Info */}
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2C2C2A] flex items-center gap-2 border-b border-gray-50 pb-4">
                        <Store size={14} className="text-[#534AB7]" /> Identity & Contact
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Store Name</label>
                            <input
                                value={config.storeName}
                                onChange={e => handleBaseChange('storeName', e.target.value)}
                                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#534AB7] focus:border-[#534AB7] outline-none transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Phone Number</label>
                                <input
                                    value={config.storePhone}
                                    onChange={e => handleBaseChange('storePhone', e.target.value)}
                                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#534AB7] focus:border-[#534AB7] outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Contact Email</label>
                                <input
                                    value={config.storeEmail}
                                    onChange={e => handleBaseChange('storeEmail', e.target.value)}
                                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#534AB7] focus:border-[#534AB7] outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Announcement Bar */}
                <div className="bg-[#2C2C2A] p-8 rounded-[32px] shadow-2xl shadow-black/20 border border-white/5 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#534AB7] rounded-full blur-3xl opacity-20 pointer-events-none" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 flex items-center gap-2 border-b border-white/10 pb-4 relative z-10">
                        <Megaphone size={14} className="text-white" /> Announcement Banner
                    </h3>
                    <div className="space-y-4 relative z-10">
                        <div>
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">Announcement Text</label>
                            <input
                                value={config.announcementBar.text}
                                onChange={e => handleChange('announcementBar', 'text', e.target.value)}
                                className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white focus:ring-2 focus:ring-[#534AB7] outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">Background Color</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={config.announcementBar.color}
                                        onChange={e => handleChange('announcementBar', 'color', e.target.value)}
                                        className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0"
                                    />
                                    <span className="text-xs font-mono text-white/80 uppercase">{config.announcementBar.color}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 pt-4">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={config.announcementBar.isActive}
                                        onChange={e => handleChange('announcementBar', 'isActive', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#534AB7]"></div>
                                    <span className="ml-3 text-xs font-bold text-white/80 uppercase tracking-wider">Visible Flag</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Operations & Shipping */}
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2C2C2A] flex items-center gap-2 border-b border-gray-50 pb-4">
                        <Truck size={14} className="text-[#534AB7]" /> Operations Directives
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Free Shipping Threshold</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">৳</span>
                                <input
                                    type="number"
                                    value={config.freeShippingThreshold}
                                    onChange={e => handleBaseChange('freeShippingThreshold', Number(e.target.value))}
                                    className="w-full pl-10 pr-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#534AB7] focus:border-[#534AB7] outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Return Policy (Days)</label>
                            <input
                                type="number"
                                value={config.returnPolicyDays}
                                onChange={e => handleBaseChange('returnPolicyDays', Number(e.target.value))}
                                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#534AB7] focus:border-[#534AB7] outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Social Integration */}
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2C2C2A] flex items-center gap-2 border-b border-gray-50 pb-4">
                        <LinkIcon size={14} className="text-[#534AB7]" /> Public Outreach Links
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Instagram URI</label>
                            <input
                                value={config.socialLinks.instagram}
                                onChange={e => handleChange('socialLinks', 'instagram', e.target.value)}
                                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#534AB7] focus:border-[#534AB7] outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Facebook URI</label>
                            <input
                                value={config.socialLinks.facebook}
                                onChange={e => handleChange('socialLinks', 'facebook', e.target.value)}
                                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#534AB7] focus:border-[#534AB7] outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">WhatsApp Link</label>
                            <input
                                value={config.socialLinks.whatsapp}
                                onChange={e => handleChange('socialLinks', 'whatsapp', e.target.value)}
                                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#534AB7] focus:border-[#534AB7] outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* SEO Globals */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2C2C2A] flex items-center gap-2 border-b border-gray-50 pb-4">
                        <Search size={14} className="text-[#534AB7]" /> Global Search Indexing
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Default Meta Title</label>
                                <input
                                    value={config.defaultMeta.title}
                                    onChange={e => handleChange('defaultMeta', 'title', e.target.value)}
                                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#534AB7] focus:border-[#534AB7] outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Default Meta Description</label>
                                <textarea
                                    value={config.defaultMeta.description}
                                    onChange={e => handleChange('defaultMeta', 'description', e.target.value)}
                                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#534AB7] focus:border-[#534AB7] outline-none transition-all h-32 resize-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Global OpenGraph (OG) Cover Image</label>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                                <ImageUpload value={ogImages} onChange={setOgImages} maxFiles={1} />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
