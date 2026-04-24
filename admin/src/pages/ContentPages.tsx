import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { FileText, Edit, ExternalLink, Calendar, RefreshCw } from 'lucide-react';

interface ContentPage {
    _id: string;
    slug: string;
    title: string;
    updatedAt: string;
    updatedBy?: {
        name: string;
        email: string;
    };
}

export const ContentPages: React.FC = () => {
    const navigate = useNavigate();
    const [pages, setPages] = useState<ContentPage[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPages = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/api/pages/admin/list');
            setPages(response.data);
        } catch (error) {
            console.error('Failed to fetch pages', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPages();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Content Pages</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage your storefront's static pages like About Us and Privacy Policy</p>
                </div>
                {/* No 'Create' button needed as requested by requirements (only default pages) unless Super Admin, but we can stick to editing existing for now */}
            </div>

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
                                <th className="px-6 py-4 font-medium">Page Title</th>
                                <th className="px-6 py-4 font-medium">Slug / Path</th>
                                <th className="px-6 py-4 font-medium">Last Updated</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {!isLoading && pages.length === 0 ? (
                                <tr>
                                    <td colSpan={4}>
                                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                            <FileText className="w-12 h-12 mb-3 text-slate-300" />
                                            <p className="text-lg font-medium text-slate-500">No pages found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                pages.map((page) => (
                                    <tr key={page._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-xl bg-[#534AB7]/10 text-[#534AB7] border border-[#534AB7]/20 flex items-center justify-center shrink-0">
                                                    <FileText size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800">{page.title}</div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                                        {page.updatedBy ? `Updated by ${page.updatedBy.name}` : 'Default Page'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                                /{page.slug}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-slate-500 text-xs">
                                                <Calendar className="w-3 h-3 mr-1.5" />
                                                {new Date(page.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <a 
                                                    href={`https://eloriabd.com/pages/${page.slug}`} // Assuming standard frontend URL, or localhost in dev
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                                    title="View Live Page"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                                <button 
                                                    onClick={() => navigate(`/admin/pages/${page.slug}/edit`)}
                                                    className="p-1.5 text-slate-400 hover:text-[#534AB7] hover:bg-[#534AB7]/10 rounded transition"
                                                    title="Edit Content"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
