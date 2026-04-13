const CATEGORIES = [
    { name: "Saree", id: '1610030469983-98e550d6193c' },
    { name: "Western", id: '1515886657613-9f3515b0c78f' },
    { name: "Kurti", id: '1583391733956-3750e0ff4e8b' },
    { name: "Gown", id: '1595777457583-95e059d581b8' },
    { name: "Party Wear", id: '1566174053879-31528523f8ae' }
];

export default function Hero() {
    return (
        <section className="relative overflow-visible mb-32 md:mb-40">



            {/* 1. SIMPLE SLIDE-IN PROMO BANNER */}
            <div className="absolute top-0 left-1/2 z-[45] animate-banner-slide opacity-0">
                <div className="bg-[#ffffff] px-20 py-3 rounded-b-[2.5rem] shadow-xl text-center border-x border-b border-stone-200/30 backdrop-blur-sm">
                    <h4 className="text-eloria-purple font-bold text-2xl leading-none">Up to 65% off</h4>
                    <p className="text-eloria-dark/60 text-[10px] font-bold uppercase tracking-widest mt-1">Weekly Finds</p>
                </div>
            </div>
            {/* 2. Main Hero Image Container */}
            <div className="relative h-[400px] md:h-[550px] w-full overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1701252068382-fbe79b926cdc?q=80&w=1600&auto=format&fit=crop"
                    className="absolute inset-0 w-full h-full object-cover animate-hero-zoom"
                    alt="Elora Hero"
                    referrerPolicy="no-referrer"
                />

                {/* DARK OVERLAY FIX: Changed from /30 to /50 and used pure black */}
                <div className="absolute inset-0 bg-black/60 z-10"></div>

                {/* Content - Ensured z-20 is above the overlay */}
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 pb-20">
                    <p className="text-white text-lg tracking-[0.5em] font-ebold mb-1 uppercase">
                        The Spring Edit 2025
                    </p>
                    <h2 className="text-[#fdf3e7] text-4xl md:text-8xl font-serif mb-6 leading-tight drop-shadow-2xl">
                        Elegance <br className="md:hidden" /> Redefined
                    </h2>
                    <button className="border border-white text-white px-8 py-2.5 rounded-full text-[14px] font-bold tracking-widest uppercase hover:bg-white hover:text-eloria-dark transition-all duration-300">
                        Shop Collection
                    </button>
                </div>
            </div>

            {/* 3. OVERLAPPING CATEGORY CARDS */}
            <div className="absolute bottom-0 left-0 w-full z-40 translate-y-1/2 flex flex-col items-center">
                <div className="flex gap-3 md:gap-5 overflow-x-auto no-scrollbar px-6 py-10 -my-10 w-full justify-start md:justify-center mb-2">
                    {CATEGORIES.map((cat, i) => (
                        <div
                            key={i}
                            className="w-24 md:w-32 flex-shrink-0 group cursor-pointer"
                        >
                            {/* 
       1. Added shadow-[0_15px_35px_rgba(0,0,0,0.2)] for better depth
       2. Added border border-eloria-purple/20 as the "Stroke"
    */}
                            <div className="relative aspect-[3/4] rounded-2xl md:rounded-[1.5rem] overflow-hidden shadow-[0_10px_15px_rgba(0,0,0,0.3)] border-[0.15rem] border-eloria-purple/20 bg-white">
                                <img
                                    src={`https://images.unsplash.com/photo-${cat.id}?q=80&w=300&auto=format&fit=crop`}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    alt={cat.name}
                                    referrerPolicy="no-referrer"
                                />

                                {/* Darker inner stroke overlay for contrast */}
                                <div className="absolute inset-0 border-[0.5px] border-white/30 rounded-2xl md:rounded-[1.5rem] pointer-events-none"></div>

                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>

                                <div className="absolute bottom-3 left-2 right-2 py-2 bg-black/60 backdrop-blur-md rounded-xl border-[0.1rem] border-white/50 text-center">
                                    <h4 className="text-white text-[9px] font-bold uppercase tracking-widest">{cat.name}</h4>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <h3 className="text-lg md:text-2xl font-serif text-eloria-dark italic font-bold tracking-wide">
                    Find by Category
                </h3>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        /* The Zoom In and Out Animation */
        @keyframes heroZoom {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05); /* Slow zoom to 115% */
          }
          100% {
            transform: scale(1);
          }
        }

        .animate-hero-zoom {
          /* 20 seconds for a full loop to make it very subtle and premium */
          animation: heroZoom 20s ease-in-out infinite;
        }

        @keyframes slideDownCentered {
          0% { transform: translate(-50%, -100%); opacity: 0; }
          100% { transform: translate(-50%, 0); opacity: 1; }
        }
        
        .animate-banner-slide {
          animation: slideDownCentered 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: 0.8s;
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
        </section>
    );
}