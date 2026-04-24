import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

export const StaticPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [page, setPage] = useState<{ title: string; body: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchPage = async () => {
            setIsLoading(true);
            setError(false);
            try {
                // Using relative path for the API call, relies on proxy or configured base URL
                // If using Vite proxy in dev, this works. In prod, it should point to backend URL.
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                const response = await axios.get(`${backendUrl}/api/pages/${slug}`);
                setPage(response.data);
                document.title = `${response.data.title} - Eloria BD`;
            } catch (err) {
                console.error('Failed to fetch static page:', err);
                setError(true);
            } finally {
                setIsLoading(false);
            }
        };

        if (slug) {
            fetchPage();
        }
    }, [slug]);

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center bg-gray-50/50">
                <Loader2 className="w-10 h-10 text-[#534AB7] animate-spin" />
            </div>
        );
    }

    if (error || !page) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50/50 px-4">
                <AlertCircle className="w-16 h-16 text-slate-300 mb-4" />
                <h1 className="text-3xl font-serif text-slate-800 mb-2 text-center">Page Not Found</h1>
                <p className="text-slate-500 mb-8 text-center max-w-md">
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>
                <Link 
                    to="/"
                    className="flex items-center space-x-2 px-6 py-3 bg-[#534AB7] text-white rounded-lg hover:bg-[#433b97] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Return to Homepage</span>
                </Link>
            </div>
        );
    }

    // Sanitize HTML before rendering to prevent XSS
    const sanitizedHtml = DOMPurify.sanitize(page.body);

    return (
        <div className="min-h-screen bg-white">
            {/* Minimal Header */}
            <div className="bg-slate-50 py-16 border-b border-slate-100">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-serif text-slate-900 tracking-tight">
                        {page.title}
                    </h1>
                </div>
            </div>

            {/* Page Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div 
                    className="prose prose-lg prose-slate mx-auto
                               prose-headings:font-serif prose-headings:text-slate-900
                               prose-a:text-[#534AB7] hover:prose-a:text-[#433b97]
                               prose-img:rounded-xl prose-img:shadow-sm"
                    dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                />
            </div>
        </div>
    );
};
