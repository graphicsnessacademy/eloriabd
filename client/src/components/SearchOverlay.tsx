import { X, Search as SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    const trendingTags = ['panjabi', 't-shirt', 'casual shirt', 'jeans', 'hoodie', 'suit'];

    const handleSearch = (e: React.FormEvent | string) => {
        const searchTerm = typeof e === 'string' ? e : query;
        if (e && typeof e !== 'string') e.preventDefault();

        if (searchTerm.trim()) {
            navigate(`/search?q=${searchTerm.trim().toLowerCase()}`);
            onClose(); // Close modal after search
            setQuery('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#FCF9F6] z-[100] p-6 md:p-12 transition-all duration-500 animate-in fade-in">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-12 md:mb-20">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold mb-2">Search ELORIA.COM.BD</p>
                        <h3 className="font-serif text-3xl md:text-4xl tracking-tight text-slate-900">Find your aesthetic</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 flex items-center justify-center rounded-full border border-stone-200 hover:bg-black hover:text-white transition-all duration-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Input Area */}
                <form onSubmit={handleSearch} className="relative mb-16">
                    <input
                        autoFocus
                        type="text"
                        placeholder="TYPE TO SEARCH.."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full border-b border-stone-300 bg-transparent py-6 text-3xl md:text-6xl font-serif outline-none focus:border-black transition-colors placeholder:text-stone-200 uppercase"
                    />
                    <SearchIcon className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 text-stone-300" />
                </form>

                {/* Trending Section */}
                <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-400 mb-8">Trending Searches</p>
                    <div className="flex flex-wrap gap-3">
                        {trendingTags.map((tag) => (
                            <button
                                key={tag}
                                onClick={() => handleSearch(tag)}
                                className="px-5 py-2 border border-stone-200 bg-white rounded-md text-[11px] font-bold uppercase tracking-widest cursor-pointer hover:bg-black hover:text-white hover:border-black transition-all duration-300"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}