import React, { useState, useEffect } from 'react';
import { api } from '../api/axios';
import { Plus, Edit, Trash2, Truck, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { districts as allDistricts } from '../utils/districts';

interface ShippingZone {
    _id: string;
    name: string;
    districts: string[];
    rateType: string;
    flatRate: number;
    estimatedDays: string;
    carrier: string;
    isActive: boolean;
}

export const ShippingZones: React.FC = () => {
    const { user } = useAuth();
    const [zones, setZones] = useState<ShippingZone[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        districts: [] as string[],
        flatRate: '',
        estimatedDays: '3-5 days',
        carrier: 'Standard',
        isActive: true
    });

    const isSuperAdmin = user?.role === 'super_admin';

    const fetchZones = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/api/admin/shipping');
            setZones(res.data);
        } catch (error) {
            console.error('Error fetching shipping zones:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchZones();
    }, []);

    const handleOpenModal = (zone?: ShippingZone) => {
        if (zone) {
            setEditingZone(zone);
            setFormData({
                name: zone.name,
                districts: zone.districts,
                flatRate: zone.flatRate.toString(),
                estimatedDays: zone.estimatedDays,
                carrier: zone.carrier,
                isActive: zone.isActive
            });
        } else {
            setEditingZone(null);
            setFormData({
                name: '',
                districts: [],
                flatRate: '',
                estimatedDays: '3-5 days',
                carrier: 'Standard',
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleToggleDistrict = (district: string) => {
        setFormData(prev => ({
            ...prev,
            districts: prev.districts.includes(district)
                ? prev.districts.filter(d => d !== district)
                : [...prev.districts, district]
        }));
    };

    const handleSelectAll = () => {
        setFormData(prev => ({
            ...prev,
            districts: prev.districts.length === allDistricts.length ? [] : [...allDistricts]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                flatRate: Number(formData.flatRate)
            };

            if (editingZone) {
                await api.patch(`/api/admin/shipping/${editingZone._id}`, payload);
            } else {
                await api.post('/api/admin/shipping', payload);
            }
            setIsModalOpen(false);
            fetchZones();
        } catch (error) {
            console.error('Error saving shipping zone:', error);
            alert('Failed to save shipping zone');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this shipping zone?')) return;
        try {
            await api.delete(`/api/admin/shipping/${id}`);
            fetchZones();
        } catch (error) {
            console.error('Error deleting zone:', error);
            alert('Failed to delete zone');
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await api.patch(`/api/admin/shipping/${id}`, { isActive: !currentStatus });
            setZones(prev => prev.map(z => z._id === id ? { ...z, isActive: !currentStatus } : z));
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Truck className="w-6 h-6 text-[#534AB7]" />
                        Shipping Zones
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Manage delivery areas, rates, and carriers.</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#534AB7] text-white rounded-lg hover:bg-[#433b97] transition-colors"
                >
                    <Plus size={18} />
                    <span>Add New Zone</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[300px] relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                            <RefreshCw className="w-8 h-8 text-[#534AB7] animate-spin" />
                        </div>
                    )}
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-medium">Zone Name</th>
                                <th className="px-6 py-4 font-medium">Districts Count</th>
                                <th className="px-6 py-4 font-medium">Rate (৳)</th>
                                <th className="px-6 py-4 font-medium">Carrier</th>
                                <th className="px-6 py-4 font-medium text-center">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {!isLoading && zones.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                            <Truck className="w-12 h-12 mb-3 text-slate-300" />
                                            <p className="text-lg font-medium text-slate-500">No shipping zones found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                zones.map(zone => (
                                    <tr key={zone._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800">
                                            {zone.name}
                                            <div className="text-[10px] text-slate-400 font-normal mt-0.5">{zone.estimatedDays}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">
                                                {zone.districts.length} District(s)
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700">
                                            ৳{zone.flatRate}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {zone.carrier}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => handleToggleStatus(zone._id, zone.isActive)}
                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${zone.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                            >
                                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${zone.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button 
                                                onClick={() => handleOpenModal(zone)}
                                                className="p-1.5 text-slate-400 hover:text-[#534AB7] hover:bg-[#534AB7]/10 rounded transition"
                                                title="Edit Zone"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            {isSuperAdmin && (
                                                <button 
                                                    onClick={() => handleDelete(zone._id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition"
                                                    title="Delete Zone"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
                            <h2 className="text-xl font-bold text-slate-800">
                                {editingZone ? 'Edit Shipping Zone' : 'Add New Shipping Zone'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Zone Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#534AB7]/20 focus:border-[#534AB7] outline-none"
                                        placeholder="e.g. Inside Dhaka"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Flat Rate (৳)</label>
                                    <input 
                                        type="number" 
                                        required
                                        min="0"
                                        value={formData.flatRate}
                                        onChange={e => setFormData({...formData, flatRate: e.target.value})}
                                        className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#534AB7]/20 focus:border-[#534AB7] outline-none"
                                        placeholder="e.g. 60"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Days</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.estimatedDays}
                                        onChange={e => setFormData({...formData, estimatedDays: e.target.value})}
                                        className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#534AB7]/20 focus:border-[#534AB7] outline-none"
                                        placeholder="e.g. 1-2 days"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Carrier Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.carrier}
                                        onChange={e => setFormData({...formData, carrier: e.target.value})}
                                        className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#534AB7]/20 focus:border-[#534AB7] outline-none"
                                        placeholder="e.g. RedX"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-6">
                                <div className="flex justify-between items-end mb-3">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Covered Districts ({formData.districts.length} selected)
                                    </label>
                                    <button 
                                        type="button" 
                                        onClick={handleSelectAll}
                                        className="text-xs font-medium text-[#534AB7] hover:underline"
                                    >
                                        {formData.districts.length === allDistricts.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                                <div className="border border-slate-200 rounded-lg p-4 max-h-60 overflow-y-auto bg-slate-50">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {allDistricts.map(district => (
                                            <label key={district} className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={formData.districts.includes(district)}
                                                    onChange={() => handleToggleDistrict(district)}
                                                    className="rounded border-slate-300 text-[#534AB7] focus:ring-[#534AB7]"
                                                />
                                                <span className="truncate" title={district}>{district}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </form>

                        <div className="border-t border-slate-100 p-6 flex justify-end space-x-3 shrink-0 bg-slate-50">
                            <button 
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSubmit}
                                className="px-5 py-2 bg-[#534AB7] text-white rounded-lg hover:bg-[#433b97] transition-colors font-medium"
                            >
                                Save Zone
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
