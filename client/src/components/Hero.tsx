import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../constants/categories';
import { useSiteConfig } from '../context/SiteConfigContext';
import TrustBar from '../components/TrustBar';

const CATEGORY_IMAGES: Record<string, string> = {
  "Traditional wear": "1515886657613-9f3515b0c78f",
  "T-shirts": "1521572163474-6864f9cf17ab",
  "Shirts": "1596755095609-ed37ac3ce56f",
  "Pants & bottom wear": "1541099649105-f69ad21f3246",
  "Winter wear": "1556821876-1b58532f8087",
  "Sports & active wear": "1517438476312-10d79c077509",
  "Home & comfort wear": "1583391733956-3750e0ff4e8b",
  "Formal & office wear": "1595777457583-95e059d581b8",
  "Kids boys wear": "1519238263530-9b458cbd0a52",
  "Accessories": "1566174053879-31528523f8ae"
};

const FALLBACK_SLIDE = {
  isActive: true,
  promoBadge: 'New Collection 2026',
  yearLabel: '2026',
  mainTitle: 'Elegance\nRedefined',
  bgImage: 'https://images.unsplash.com/photo-1701252068382-fbe79b926cdc?q=80&w=1600&auto=format&fit=crop',
};

export default function Hero() {
  const { config } = useSiteConfig();
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rawSlides = config?.offerZones?.hero ?? [];
  const activeSlides = rawSlides.filter((s: any) => s.isActive);
  const slides = activeSlides.length > 0 ? activeSlides : [FALLBACK_SLIDE];

  const goTo = (idx: number) => {
    if (animating || idx === current) return;
    setAnimating(true);
    setCurrent(idx);
    setTimeout(() => setAnimating(false), 700);
  };

  const next = () => goTo((current + 1) % slides.length);

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setTimeout(next, 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, slides.length]);

  const slide = slides[current];
  const nextSlide = slides[(current + 1) % slides.length];

  const getSlideUrl = (s: any) =>
    s.bgImage?.startsWith('http')
      ? s.bgImage
      : 'https://images.unsplash.com/photo-1701252068382-fbe79b926cdc?q=80&w=1600&auto=format&fit=crop';

  return (
    <section className="relative overflow-visible mb-16 md:mb-24">

      {/* 1. PROMO BADGE - Shrunk for mobile */}
      {slide.promoBadge && (
        <div className="absolute top-0 left-1/2 z-[45] animate-banner-slide opacity-0">
          <div className="bg-white px-8 md:px-16 py-2 md:py-3 rounded-b-[1.5rem] md:rounded-b-[2.5rem] shadow-xl text-center border-x border-b border-stone-200/30 backdrop-blur-sm">
            <h4 className="text-eloria-purple font-bold text-sm md:text-xl leading-none">{slide.promoBadge}</h4>
            {slide.yearLabel && (
              <p className="text-eloria-dark/60 text-[8px] md:text-[10px] font-bold uppercase tracking-widest mt-0.5 md:mt-1">{slide.yearLabel}</p>
            )}
          </div>
        </div>
      )}

      {/* 2. MAIN HERO IMAGE — Height: 260px on Mobile/Tab, 550px on Desktop */}
      <div className="relative h-[260px] md:h-[550px] w-full overflow-hidden">
        <img
          key={current}
          src={getSlideUrl(slide)}
          alt=""
          fetchPriority="high"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover animate-hero-zoom"
          style={{ zIndex: 1 }}
        />

        {slides.length > 1 && (
          <link rel="preload" as="image" href={getSlideUrl(nextSlide)} />
        )}

        <div className="absolute inset-0 z-10 bg-black/10" />

        {/* SLIDE CONTENT - Font sized for 260px height */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 pb-12 md:pb-20">
          <h2
            className="text-[#fdf3e7] text-2xl md:text-8xl font-serif mb-4 md:mb-6 leading-tight drop-shadow-2xl transition-all duration-500"
            style={{ whiteSpace: 'pre-line' }}
          >
            {slide.mainTitle || 'Elegance\nRedefined'}
          </h2>
          <Link
            to="/shop"
            className="border border-white bg-black/20 backdrop-blur-sm text-white px-6 md:px-8 py-2 md:py-2.5 rounded-full text-[12px] md:text-[14px] font-bold tracking-widest uppercase hover:bg-white hover:text-eloria-dark transition-all duration-300"
          >
            Shop Collection
          </Link>
        </div>

        {/* SLIDE DOTS */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
            {slides.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`transition-all duration-300 rounded-full ${i === current ? 'w-4 md:w-6 h-1.5 md:h-2 bg-white' : 'w-1.5 md:w-2 h-1.5 md:h-2 bg-white/40 hover:bg-white/70'
                  }`}
              />
            ))}
          </div>
        )}

        {/* PREV/NEXT ARROWS - Hidden on small mobile for cleaner look */}
        {slides.length > 1 && (
          <div className="hidden md:block">
            <button
              onClick={() => goTo((current - 1 + slides.length) % slides.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/50 transition-colors"
            >‹</button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/50 transition-colors"
            >›</button>
          </div>
        )}
      </div>

      {/* 3. OVERLAPPING CATEGORY CARDS — Shrunk width for mobile (w-20) */}
      <div className="absolute bottom-0 left-0 w-full z-40 translate-y-1/2 flex flex-col items-center">
        <div className="flex gap-2.5 md:gap-5 overflow-x-auto no-scrollbar px-6 py-4 -my-8 w-full justify-start md:justify-center mb-1">
          {CATEGORIES.map((cat, i) => (
            <Link
              key={i} 
              to={`/shop/${cat.slug}`}
              className="w-20 md:w-32 flex-shrink-0 group cursor-pointer"
            >
              <div className="relative aspect-[3/4] rounded-xl md:rounded-[1.5rem] overflow-hidden shadow-[0_8px_12px_rgba(0,0,0,0.25)] border-[0.12rem] border-eloria-purple/20 bg-white">
                <img
                  src={`https://images.unsplash.com/photo-${CATEGORY_IMAGES[cat.name] || "1610030469983-98e550d6193c"}?q=60&w=250&auto=format&fit=crop`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  alt={cat.name}
                  loading="lazy"
                  width={80}
                  height={106}
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300" />
                <div className="absolute bottom-2 left-1.5 right-1.5 py-1.5 bg-black/70 backdrop-blur-md rounded-lg border border-white/20 text-center">
                  <h4 className="text-white text-[7px] md:text-[8px] font-bold uppercase tracking-widest px-1">{cat.name}</h4>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes heroZoom {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .animate-hero-zoom { animation: heroZoom 20s ease-in-out infinite; }

        @keyframes slideDownCentered {
          0% { transform: translate(-50%, -100%); opacity: 0; }
          100% { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-banner-slide {
          animation: slideDownCentered 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: 0.5s;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </section>
    
  );

}
