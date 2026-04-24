import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import {
    Search, Filter, SlidersHorizontal, UserCheck, UserX,
    ChevronLeft, ChevronRight, RefreshCw, Mail, Phone, Calendar, Users
} from 'lucide-react';
import { ExportButton } from '../components/ExportButton';

interface User {
    _id: string;
    name: string;
    email: string;
    phone: string;
    status: 'active' | 'suspended';
    orderCount: number;
    totalSpent: number;
    createdAt: string;
    lastLogin?: string;
}

export const UserList: React.FC = () => {
    const navigate = useNavigate();
    
    const [users, setUsers] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);

    const [suspendModalOpen, setSuspendModalOpen] = useState(false);
    const [targetUser, setTargetUser] = useState<User | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/api/admin/users', {
                params: {
                    search: debouncedSearch,
                    status: statusFilter,
                    page,
                    limit: 10
                }
            });
            setUsers(response.data.users);
            setTotal(response.data.total);
            setPages(response.data.pages);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearch, statusFilter, page]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);



    const toggleStatus = async () => {
        if (!targetUser) return;
        setIsUpdating(true);
        const newStatus = targetUser.status === 'active' ? 'suspended' : 'active';
        try {
            await api.patch(`/api/admin/users/${targetUser._id}/status`, { status: newStatus });
            setSuspendModalOpen(false);
            setTargetUser(null);
            fetchUsers();
        } catch (error) {
            console.error('Failed to update status', error);
            alert('Failed to update user status.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Monitor and manage your customer accounts</p>
                </div>
                <ExportButton 
                    endpoint={`/api/admin/users/export?search=${debouncedSearch}&status=${statusFilter}`}
                    filename={`eloria_users_${new Date().toISOString().split('T')[0]}.csv`}
                    label="Export CSV"
                    className="bg-slate-900 text-white hover:bg-slate-800"
                />
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search by name, email or phone..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#534AB7]/20 focus:border-[#534AB7] text-sm"
                    />
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select 
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-[#534AB7]/20 focus:border-[#534AB7] text-sm"
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px] relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                            <RefreshCw className="w-8 h-8 text-[#534AB7] animate-spin" />
                        </div>
                    )}

                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-medium">Customer</th>
                                <th className="px-6 py-4 font-medium">Contact</th>
                                <th className="px-6 py-4 font-medium text-center">Orders</th>
                                <th className="px-6 py-4 font-medium text-right">Total Spent</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {!isLoading && users.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                            <Users className="w-12 h-12 mb-3 text-slate-300" />
                                            <p className="text-lg font-medium text-slate-500">No users found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-full bg-[#534AB7]/10 text-[#534AB7] border border-[#534AB7]/20 flex items-center justify-center font-bold text-sm shrink-0">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800">{user.name}</div>
                                                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                        <Calendar size={10} /> Joined {new Date(user.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col space-y-1">
                                                <span className="flex items-center text-xs text-slate-600">
                                                    <Mail className="w-3 h-3 mr-1.5 text-slate-400" /> {user.email}
                                                </span>
                                                <span className="flex items-center text-xs text-slate-600">
                                                    <Phone className="w-3 h-3 mr-1.5 text-slate-400" /> {user.phone || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-medium text-slate-800">{user.orderCount || 0}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-mono font-bold text-slate-900">৳{(user.totalSpent || 0).toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                                                user.status === 'active' 
                                                    ? 'bg-[#534AB7]/10 text-[#534AB7] border-[#534AB7]/20' 
                                                    : 'bg-rose-50 text-rose-600 border-rose-100'
                                            }`}>
                                                {user.status === 'active' ? 'Active' : 'Suspended'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button 
                                                    onClick={() => navigate(`/admin/users/${user._id}`)}
                                                    className="p-1.5 text-slate-400 hover:text-[#534AB7] hover:bg-[#534AB7]/10 rounded transition"
                                                    title="View Details"
                                                >
                                                    <SlidersHorizontal className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => { setTargetUser(user); setSuspendModalOpen(true); }}
                                                    className={`p-1.5 rounded transition ${user.status === 'active' ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                                    title={user.status === 'active' ? 'Suspend User' : 'Unsuspend User'}
                                                >
                                                    {user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm">
                        <span className="text-slate-500">
                            Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} users
                        </span>
                        <div className="flex items-center space-x-1">
                            <button 
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="p-1 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                                let pageNum = page - 2 + i;
                                if (page <= 3) pageNum = i + 1;
                                if (page >= pages - 2) pageNum = pages - 4 + i;
                                
                                if (pageNum > 0 && pageNum <= pages) {
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPage(pageNum)}
                                            className={`w-7 h-7 rounded text-xs font-medium transition ${
                                                page === pageNum 
                                                    ? 'bg-[#534AB7] text-white' 
                                                    : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                }
                                return null;
                            })}
                            <button 
                                onClick={() => setPage(Math.min(pages, page + 1))}
                                disabled={page === pages}
                                className="p-1 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Suspend Confirmation Modal */}
            {suspendModalOpen && targetUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className={`flex items-center justify-center w-12 h-12 mx-auto rounded-full mb-4 ${targetUser.status === 'active' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {targetUser.status === 'active' ? <UserX className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
                        </div>
                        <h3 className="text-lg font-bold text-center text-slate-800 mb-2">
                            {targetUser.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                        </h3>
                        <p className="text-center text-slate-500 text-sm mb-6">
                            Are you sure you want to {targetUser.status === 'active' ? 'suspend' : 'reactivate'} <span className="font-semibold text-slate-700">"{targetUser.name}"</span>?
                            {targetUser.status === 'active' ? ' They will no longer be able to log in or make purchases.' : ' They will regain full access to their account.'}
                        </p>
                        <div className="flex space-x-3">
                            <button 
                                onClick={() => { setSuspendModalOpen(false); setTargetUser(null); }}
                                disabled={isUpdating}
                                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={toggleStatus}
                                disabled={isUpdating}
                                className={`flex-1 px-4 py-2 text-white font-medium rounded-lg transition flex justify-center items-center ${targetUser.status === 'active' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                            >
                                {isUpdating ? <RefreshCw className="w-5 h-5 animate-spin" /> : (targetUser.status === 'active' ? 'Suspend' : 'Reactivate')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
