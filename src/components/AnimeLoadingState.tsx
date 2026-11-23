import React, { useState, useEffect } from 'react';
import { Sparkles, Star, Flame, Zap, Shield, Wand2 } from 'lucide-react';

interface Props {
  message?: string;
  subMessage?: string;
  size?: 'full' | 'lg' | 'sm';
  characterTheme?: 'monarch' | 'chibi' | 'cyber';
  showThemeToggle?: boolean;
}

export const AnimeLoadingState: React.FC<Props> = ({
  message = 'Loading...',
  subMessage = 'Summoning verified anime catalog & official streaming details...',
  size = 'lg',
  characterTheme = 'monarch',
  showThemeToggle = false,
}) => {
  const [currentTheme, setCurrentTheme] = useState<'monarch' | 'chibi' | 'cyber'>(characterTheme);
  const [dotCount, setDotCount] = useState(3);

  // Smooth animated ellipsis dots
  useEffect(() => {
    const timer = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 450);
    return () => clearInterval(timer);
  }, []);

  const isFull = size === 'full';
  const isSm = size === 'sm';

  // Format display message to ensure clean "Loading..." styling
  const cleanMessage = message.replace(/\.+$/, '');
  const displayDots = '.'.repeat(dotCount);

  return (
    <div
      className={`flex flex-col items-center justify-center text-center select-none animate-in fade-in duration-300 ${
        isFull
          ? 'fixed inset-0 z-50 p-6 bg-black/92 backdrop-blur-xl'
          : isSm
          ? 'py-6 px-3'
          : 'py-16 sm:py-20 px-4'
      }`}
    >
      {/* Anime Magic Summoning Portal with Anime Hero Character Silhouette */}
      <div className="relative flex items-center justify-center mb-6">
        {/* Ambient AMOLED Radial Glow */}
        <div
          className={`absolute rounded-full blur-3xl pointer-events-none transition-all duration-700 animate-anime-pulse-glow ${
            isSm ? 'w-32 h-32' : 'w-52 h-52 sm:w-64 sm:h-64'
          } ${
            currentTheme === 'monarch'
              ? 'bg-gradient-to-tr from-indigo-600/30 via-purple-600/35 to-cyan-500/25'
              : currentTheme === 'chibi'
              ? 'bg-gradient-to-tr from-pink-500/30 via-rose-500/35 to-amber-400/25'
              : 'bg-gradient-to-tr from-emerald-500/30 via-cyan-500/35 to-indigo-500/25'
          }`}
        />

        {/* Outer Rotating Summoning Rune Ring */}
        <svg
          className={`${
            isSm ? 'w-28 h-28' : 'w-40 h-40 sm:w-48 sm:h-48'
          } text-indigo-500/30 animate-[spin_14s_linear_infinite]`}
          viewBox="0 0 160 160"
          fill="none"
        >
          <circle
            cx="80"
            cy="80"
            r="74"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 8 12 8"
          />
          <circle
            cx="80"
            cy="80"
            r="66"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="2 4"
            className="opacity-60"
          />
          {/* Summoning Rune Nodes */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x = 80 + 74 * Math.cos(rad);
            const y = 80 + 74 * Math.sin(rad);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="2.5"
                fill={currentTheme === 'chibi' ? '#ec4899' : '#a855f7'}
                className="animate-pulse"
              />
            );
          })}
        </svg>

        {/* Inner Counter-Rotating Hexagram / Magic Circle */}
        <svg
          className={`absolute ${
            isSm ? 'w-20 h-20' : 'w-32 h-32 sm:w-36 sm:h-36'
          } ${
            currentTheme === 'chibi' ? 'text-pink-400/40' : 'text-purple-400/40'
          } animate-[spin_9s_linear_infinite_reverse]`}
          viewBox="0 0 120 120"
          fill="none"
        >
          <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="1" />
          <polygon
            points="60,10 103,85 17,85"
            stroke="currentColor"
            strokeWidth="1.2"
            className="opacity-75"
          />
          <polygon
            points="60,110 103,35 17,35"
            stroke="currentColor"
            strokeWidth="1.2"
            className="opacity-75"
          />
        </svg>

        {/* Center Animated Anime Character Figure */}
        <div className="absolute flex flex-col items-center justify-center animate-anime-float">
          <div
            className={`relative flex items-center justify-center ${
              isSm ? 'w-16 h-16' : 'w-24 h-24 sm:w-28 sm:h-28'
            }`}
          >
            {/* THEME 1: SHADOW MONARCH / SOLO LEVELING HUNTER */}
            {currentTheme === 'monarch' && (
              <svg
                className={`${
                  isSm ? 'w-14 h-14' : 'w-20 h-20 sm:w-24 sm:h-24'
                } drop-shadow-[0_0_18px_rgba(168,85,247,0.8)]`}
                viewBox="0 0 100 100"
                fill="none"
              >
                {/* Billowing Shadow Cape */}
                <path
                  d="M28 58 C14 66, 6 78, 4 94 C14 86, 26 82, 36 80 Z"
                  fill="url(#monarchCape)"
                  className="opacity-95"
                />
                <path
                  d="M72 58 C86 66, 94 78, 96 94 C86 86, 74 82, 64 80 Z"
                  fill="url(#monarchCape)"
                  className="opacity-95"
                />

                {/* Hunter Trenchcoat & Armor */}
                <path
                  d="M34 54 L66 54 L74 90 L26 90 Z"
                  fill="#090d16"
                  stroke="#4f46e5"
                  strokeWidth="2.5"
                />
                <path
                  d="M50 54 L50 90"
                  stroke="#6366f1"
                  strokeWidth="1.5"
                  strokeDasharray="2 3"
                />

                {/* Hunter Head & Neck */}
                <circle cx="50" cy="38" r="15" fill="#0f172a" stroke="#818cf8" strokeWidth="2" />

                {/* Spiky Anime Hair (Monarch Style) */}
                <path
                  d="M33 36 C30 22, 42 12, 50 10 C58 12, 70 22, 67 36 C61 28, 56 30, 50 26 C44 30, 39 28, 33 36 Z"
                  fill="#1e1b4b"
                />
                <path d="M28 38 L36 32 L34 42 Z" fill="#312e81" />
                <path d="M72 38 L64 32 L66 42 Z" fill="#312e81" />
                <path d="M50 10 L46 18 L54 18 Z" fill="#4338ca" />
                <path d="M42 16 L38 24 L44 24 Z" fill="#6366f1" />
                <path d="M58 16 L62 24 L56 24 Z" fill="#6366f1" />

                {/* Monarch Glowing Violet / Cyan Eyes */}
                <ellipse cx="43" cy="38" rx="3" ry="3.5" fill="#38bdf8" />
                <circle cx="44" cy="37" r="1.2" fill="#ffffff" />
                <ellipse cx="57" cy="38" rx="3" ry="3.5" fill="#38bdf8" />
                <circle cx="58" cy="37" r="1.2" fill="#ffffff" />

                {/* Dual Shadow Daggers on Back */}
                <line x1="20" y1="20" x2="80" y2="80" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="18" y1="18" x2="26" y2="26" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
                <line x1="80" y1="20" x2="20" y2="80" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="82" y1="18" x2="74" y2="26" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />

                <defs>
                  <linearGradient id="monarchCape" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4338ca" />
                    <stop offset="50%" stopColor="#7e22ce" />
                    <stop offset="100%" stopColor="#090d16" />
                  </linearGradient>
                </defs>
              </svg>
            )}

            {/* THEME 2: CUTE CHIBI ANIME HEROINE WITH CAT EARS & WAND */}
            {currentTheme === 'chibi' && (
              <svg
                className={`${
                  isSm ? 'w-14 h-14' : 'w-20 h-20 sm:w-24 sm:h-24'
                } drop-shadow-[0_0_18px_rgba(244,63,94,0.8)]`}
                viewBox="0 0 100 100"
                fill="none"
              >
                {/* Flowing Ribbon Dress */}
                <path
                  d="M32 58 L68 58 L78 92 L22 92 Z"
                  fill="#831843"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                />
                <circle cx="50" cy="66" r="3" fill="#fbbf24" />

                {/* Big Chibi Head */}
                <circle cx="50" cy="36" r="18" fill="#ffe4e6" stroke="#f43f5e" strokeWidth="2" />

                {/* Soft Fluffy Hair */}
                <path
                  d="M30 36 C28 20, 40 12, 50 12 C60 12, 72 20, 70 36 C64 26, 58 30, 50 26 C42 30, 36 26, 30 36 Z"
                  fill="#fb7185"
                />
                {/* Twin Tails */}
                <path d="M26 34 C16 44, 18 64, 14 74 C22 66, 26 50, 30 42 Z" fill="#f43f5e" />
                <path d="M74 34 C84 44, 82 64, 86 74 C78 66, 74 50, 70 42 Z" fill="#f43f5e" />

                {/* Cat Ears */}
                <polygon points="34,22 40,8 48,18" fill="#fda4af" stroke="#f43f5e" strokeWidth="1.5" />
                <polygon points="37,18 41,12 45,17" fill="#fb7185" />
                <polygon points="66,22 60,8 52,18" fill="#fda4af" stroke="#f43f5e" strokeWidth="1.5" />
                <polygon points="63,18 59,12 55,17" fill="#fb7185" />

                {/* Giant Sparkling Anime Eyes */}
                <ellipse cx="42" cy="36" rx="4" ry="5.5" fill="#9d174d" />
                <circle cx="43.5" cy="34" r="2" fill="#ffffff" />
                <circle cx="41" cy="38" r="1" fill="#f472b6" />

                <ellipse cx="58" cy="36" rx="4" ry="5.5" fill="#9d174d" />
                <circle cx="59.5" cy="34" r="2" fill="#ffffff" />
                <circle cx="57" cy="38" r="1" fill="#f472b6" />

                {/* Cute Rosy Blushes */}
                <ellipse cx="36" cy="41" rx="2.5" ry="1.2" fill="#fda4af" />
                <ellipse cx="64" cy="41" rx="2.5" ry="1.2" fill="#fda4af" />

                {/* Cute Smiling Mouth */}
                <path d="M48 41 Q50 44 52 41" stroke="#e11d48" strokeWidth="1.8" strokeLinecap="round" />

                {/* Magic Star Wand */}
                <line x1="68" y1="46" x2="88" y2="26" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
                <polygon points="88,26 85,20 91,22 95,17 94,24 99,28 92,28 89,33 87,27" fill="#f59e0b" />
              </svg>
            )}

            {/* THEME 3: CYBER MECHA ANIME HERO */}
            {currentTheme === 'cyber' && (
              <svg
                className={`${
                  isSm ? 'w-14 h-14' : 'w-20 h-20 sm:w-24 sm:h-24'
                } drop-shadow-[0_0_18px_rgba(6,182,212,0.8)]`}
                viewBox="0 0 100 100"
                fill="none"
              >
                {/* Cyber Armor Frame */}
                <path d="M30 55 L70 55 L76 90 L24 90 Z" fill="#082f49" stroke="#06b6d4" strokeWidth="2.5" />
                <line x1="50" y1="55" x2="50" y2="90" stroke="#38bdf8" strokeWidth="2" />
                <circle cx="50" cy="72" r="5" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />

                {/* Cyber Helmet & Visor */}
                <circle cx="50" cy="38" r="16" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="2" />
                {/* Glowing Neon Visor */}
                <path d="M36 36 L64 36 L62 43 L38 43 Z" fill="#22d3ee" className="animate-pulse" />
                <line x1="38" y1="39" x2="62" y2="39" stroke="#ffffff" strokeWidth="1.5" />

                {/* Cyber Headset Antennas */}
                <rect x="28" y="32" width="4" height="12" rx="2" fill="#06b6d4" />
                <rect x="68" y="32" width="4" height="12" rx="2" fill="#06b6d4" />
                <line x1="30" y1="32" x2="26" y2="20" stroke="#22d3ee" strokeWidth="2" />
                <circle cx="26" cy="20" r="2.5" fill="#38bdf8" />
                <line x1="70" y1="32" x2="74" y2="20" stroke="#22d3ee" strokeWidth="2" />
                <circle cx="74" cy="20" r="2.5" fill="#38bdf8" />

                {/* Energy Wings */}
                <path d="M26 60 L10 70 L24 76 Z" fill="#06b6d4" opacity="0.8" />
                <path d="M74 60 L90 70 L76 76 Z" fill="#06b6d4" opacity="0.8" />
              </svg>
            )}

            {/* Orbiting Sparkles & Particles */}
            <div
              className="absolute -top-1 -right-1 text-amber-300 animate-spin"
              style={{ animationDuration: '4.5s' }}
            >
              <Sparkles className="w-4 h-4 fill-amber-300 drop-shadow-[0_0_10px_#facc15]" />
            </div>
            <div className="absolute -bottom-1 -left-1 text-cyan-300 animate-pulse">
              <Zap className="w-3.5 h-3.5 fill-cyan-300 drop-shadow-[0_0_10px_#38bdf8]" />
            </div>
          </div>
        </div>
      </div>

      {/* Primary Anime Loading Text with Glowing Shimmer */}
      <div className="space-y-2 max-w-md w-full">
        <div className="flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
          <h3 className="text-base sm:text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-purple-200 to-rose-200 drop-shadow-sm font-sans uppercase">
            {cleanMessage}
            <span className="text-indigo-400 font-mono tracking-widest">{displayDots}</span>
          </h3>
          <span
            className="w-2 h-2 rounded-full bg-purple-400 animate-ping"
            style={{ animationDelay: '300ms' }}
          />
        </div>

        {subMessage && (
          <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
            {subMessage}
          </p>
        )}

        {/* High-Tech Animated Laser Charging Mana Bar */}
        <div className="w-44 sm:w-56 h-1.5 mx-auto rounded-full bg-slate-900 border border-slate-800/90 overflow-hidden mt-3 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-500 to-rose-500 opacity-70" />
          <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-anime-laser" />
        </div>

        {/* Character Theme Switcher (Optional or subtle quick toggle) */}
        {showThemeToggle && (
          <div className="flex items-center justify-center gap-1.5 pt-3">
            <button
              onClick={() => setCurrentTheme('monarch')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                currentTheme === 'monarch'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              ⚔️ Monarch
            </button>
            <button
              onClick={() => setCurrentTheme('chibi')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                currentTheme === 'chibi'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              ✨ Chibi Cat
            </button>
            <button
              onClick={() => setCurrentTheme('cyber')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                currentTheme === 'cyber'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              🤖 Cyber Mecha
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
