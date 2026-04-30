import { useLocation } from 'react-router-dom';

const WHATSAPP_NUMBER = '8801771276083'; // ← Replace with actual BD number (e.g. 8801712345678)
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export default function WhatsAppButton() {
  const location = useLocation();

  // Hide on the checkout page
  if (location.pathname === '/checkout') return null;

  return (
    <>
      {/* Keyframe styles injected once via a <style> tag */}
      <style>{`
        @keyframes wa-ping {
          0%   { transform: scale(1);   opacity: 0.6; }
          70%  { transform: scale(1.6); opacity: 0;   }
          100% { transform: scale(1.6); opacity: 0;   }
        }
        .wa-ping {
          animation: wa-ping 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* Wrapper — positions the button + surfaces the tooltip group */}
      <div
        className="
          group
          fixed z-50
          bottom-20 right-4
          sm:bottom-6  sm:right-6
        "
      >
        {/* Tooltip — desktop only, appears to the left on hover */}
        <span
          className="
            hidden sm:block
            absolute right-16 top-1/2 -translate-y-1/2
            whitespace-nowrap
            bg-gray-900 text-white text-xs font-medium
            px-3 py-1.5 rounded-full shadow-md
            pointer-events-none
            opacity-0 translate-x-2
            transition-all duration-200 ease-out
            group-hover:opacity-100 group-hover:translate-x-0
          "
          role="tooltip"
        >
          Chat with us
          {/* Small right-pointing caret */}
          <span
            className="absolute right-[-4px] top-1/2 -translate-y-1/2
                       border-4 border-transparent border-l-gray-900"
          />
        </span>

        {/* Pulse ring */}
        <span
          aria-hidden="true"
          className="
            wa-ping
            absolute inset-0 rounded-full
            bg-[#25D366]
          "
        />

        {/* The button itself */}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
          className="
            relative flex items-center justify-center
            w-14 h-14 rounded-full
            bg-[#25D366]
            shadow-lg
            transition-transform duration-200 ease-out
            hover:scale-110
            focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/50
          "
        >
          {/* Official WhatsApp phone-in-bubble SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            width="28"
            height="28"
            aria-hidden="true"
          >
            <path
              fill="#ffffff"
              d="M16 .5C7.44.5.5 7.44.5 16c0 2.72.71 5.28 1.95 7.51L.5 31.5l8.23-2.15A15.45 15.45 0 0 0 16 31.5C24.56 31.5 31.5 24.56 31.5 16S24.56.5 16 .5zm0 28.18a13.62 13.62 0 0 1-6.94-1.9l-.5-.3-5.16 1.35 1.38-5.02-.33-.52A13.62 13.62 0 1 1 16 28.68zm7.47-10.2c-.41-.2-2.42-1.19-2.8-1.33-.37-.13-.64-.2-.91.2s-1.05 1.33-1.28 1.6c-.23.27-.47.3-.88.1-.41-.2-1.73-.64-3.3-2.03a12.4 12.4 0 0 1-2.28-2.84c-.24-.41 0-.63.18-.84.17-.18.41-.47.61-.71.2-.23.27-.4.41-.67.13-.27.07-.5-.03-.71-.1-.2-.91-2.2-1.25-3.01-.33-.79-.66-.68-.91-.69h-.77c-.27 0-.71.1-1.08.5-.37.4-1.42 1.39-1.42 3.39 0 2 1.45 3.93 1.65 4.2.2.27 2.85 4.36 6.91 6.12.97.42 1.72.67 2.31.85.97.31 1.85.27 2.55.16.78-.12 2.42-.99 2.76-1.94.34-.95.34-1.77.24-1.94-.1-.17-.37-.27-.78-.47z"
            />
          </svg>
        </a>
      </div>
    </>
  );
}
