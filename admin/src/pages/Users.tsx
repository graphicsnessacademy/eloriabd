import React, { useState, useEffect } from 'react';
import { api } from '../api/axios';
import { Search, User as UserIcon, Mail, Phone, Calendar, Loader2 } from 'lucide-react';

export const Users: React.FC = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page] = useState(1);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/api/admin/users', { params: { search, page } });
            setUsers(data.users);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(fetchUsers, 500);
        return () => clearTimeout(timeout);
    }, [search, page]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Customer Management</h1>
                <div className="flex bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 text-sm font-medium text-slate-600">
                    Total Users: {users.length}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search by Name, Email or Phone..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading && page === 1 ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {users.map((user: any) => (
                        <div key={user._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                    <UserIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{user.name}</h3>
                                    <p className="text-xs text-slate-400">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3 pt-4 border-t border-slate-50">
                                <div className="flex items-center text-sm text-slate-600">
                                    <Mail className="w-4 h-4 mr-3 text-slate-400" />
                                    {user.email}
                                </div>
                                <div className="flex items-center text-sm text-slate-600">
                                    <Phone className="w-4 h-4 mr-3 text-slate-400" />
                                    {user.phone || 'No phone provided'}
                                </div>
                                <div className="flex items-center text-sm text-slate-600">
                                    <Calendar className="w-4 h-4 mr-3 text-slate-400" />
                                    {user.addresses?.length || 0} Saved Addresses
                                </div>
                            </div>

                            <button className="w-full mt-6 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
                                View Details
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {!loading && users.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
                    No users found matching your search.
                </div>
            )}
        </div>
    );
};
