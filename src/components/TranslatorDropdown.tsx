import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Sparkles } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../services/translator';

interface Props {
  currentLang: string;
  onLanguageChange: (code: string) => void;
  onOpenTranslator?: () => void;
}

export const TranslatorDropdown: React.FC<Props> = ({
  currentLang,
  onLanguageChange,
  onOpenTranslator,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeLang = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
        aria-label="Select translation language"
      >
        <Globe className="w-3.5 h-3.5 text-indigo-400" />
        <span className="px-1.5 py-0.5 rounded bg-slate-900/90 text-indigo-300 font-mono text-[10px] font-bold border border-slate-700/60">
          {activeLang.code.toUpperCase()}
        </span>
        <span className="hidden sm:inline">{activeLang.nativeName}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-56 max-h-80 overflow-y-auto rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-50">
          {onOpenTranslator && (
            <div className="p-1.5 border-b border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenTranslator();
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-gradient-to-r from-indigo-600/30 to-purple-600/20 hover:from-indigo-600/40 hover:to-purple-600/30 text-indigo-200 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Google AI Translator</span>
                </div>
                <span className="text-[10px] font-mono text-indigo-300 uppercase">Live</span>
              </button>
            </div>
          )}
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 flex items-center justify-between">
            <span>Translate Interface</span>
            <span className="text-[10px] text-slate-400 font-mono">{SUPPORTED_LANGUAGES.length} Langs</span>
          </div>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                onLanguageChange(lang.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                currentLang === lang.code
                  ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[10px] font-bold border border-slate-700/60 shrink-0">
                  {lang.code.toUpperCase()}
                </span>
                <span>{lang.nativeName}</span>
              </div>
              <span className="text-[11px] text-slate-400">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
