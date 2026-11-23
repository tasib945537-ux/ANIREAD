import React, { useState, useEffect } from 'react';
import { Mic, MicOff, AlertCircle, X, Volume2, Globe } from 'lucide-react';
import { useVoiceSearch } from '../hooks/useVoiceSearch';

interface Props {
  onSpeechResult: (transcript: string) => void;
  currentLang?: string;
  activeTab?: 'anime' | 'manga' | string;
  className?: string;
}

export const VoiceSearchButton: React.FC<Props> = ({
  onSpeechResult,
  currentLang = 'en',
  activeTab = 'anime',
  className = '',
}) => {
  const [selectedLocale, setSelectedLocale] = useState<'en' | 'current'>('en');
  const [showToast, setShowToast] = useState(false);

  const {
    isSupported,
    isListening,
    interimTranscript,
    errorMessage,
    startListening,
    stopListening,
    reset,
  } = useVoiceSearch({
    currentLang: selectedLocale === 'en' ? 'en' : currentLang,
    onResult: (finalText) => {
      onSpeechResult(finalText);
      setShowToast(false);
    },
    onError: () => {
      setShowToast(true);
    },
  });

  // Handle escape key to cancel voice search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isListening) {
        stopListening();
        setShowToast(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening, stopListening]);

  const handleToggle = () => {
    if (isListening) {
      stopListening();
      setShowToast(false);
    } else {
      setShowToast(false);
      startListening(selectedLocale === 'en' ? 'en-US' : undefined);
    }
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {/* Microphone Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
          isListening
            ? 'bg-rose-500/25 text-rose-400 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse'
            : isSupported
            ? 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800/80 active:scale-95'
            : 'text-slate-600 hover:text-slate-500 cursor-not-allowed opacity-60'
        }`}
        title={
          isListening
            ? 'Listening... Click to stop voice search'
            : isSupported
            ? 'Search by voice (Web Speech API)'
            : 'Voice search not supported in this browser'
        }
        aria-label={isListening ? 'Stop voice search' : 'Start voice search'}
      >
        {isListening ? (
          <div className="relative flex items-center justify-center">
            <Mic className="w-4 h-4 text-rose-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </div>
        ) : isSupported ? (
          <Mic className="w-4 h-4" />
        ) : (
          <MicOff className="w-4 h-4" />
        )}
      </button>

      {/* Floating Active Voice Listening HUD */}
      {isListening && (
        <div className="absolute right-0 top-full mt-2.5 z-50 w-72 sm:w-80 p-3.5 rounded-2xl bg-[#090d16]/95 border border-indigo-500/40 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 text-slate-100">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Listening...
              </span>
            </div>

            {/* Language toggle pill */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px]">
              <button
                type="button"
                onClick={() => {
                  setSelectedLocale('en');
                  startListening('en-US');
                }}
                className={`px-1.5 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                  selectedLocale === 'en'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Speak in English"
              >
                EN
              </button>
              {currentLang !== 'en' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLocale('current');
                    startListening();
                  }}
                  className={`px-1.5 py-0.5 rounded font-semibold uppercase transition-colors cursor-pointer ${
                    selectedLocale === 'current'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={`Speak in ${currentLang}`}
                >
                  {currentLang}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleToggle}
              className="p-1 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Cancel Voice Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sound Wave Animation Visualizer */}
          <div className="flex items-center justify-center gap-1 py-3">
            <span className="w-1 h-3 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-6 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-4 bg-rose-500 rounded-full animate-bounce" />
            <span className="w-1 h-7 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.25s]" />
            <span className="w-1 h-3 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.1s]" />
          </div>

          {/* Live transcript or speech prompt */}
          <div className="min-h-[2.5rem] flex items-center justify-center text-center px-1">
            {interimTranscript ? (
              <p className="text-sm font-semibold text-indigo-300 italic">
                "{interimTranscript}..."
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Speak {activeTab === 'manga' ? 'manga' : 'anime'} title, e.g.{' '}
                <span className="text-indigo-300 font-medium">"Solo Leveling"</span> or{' '}
                <span className="text-indigo-300 font-medium">"Assassination Classroom"</span>
              </p>
            )}
          </div>

          {/* Stop Button */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Tap mic or press Esc to stop</span>
            <button
              type="button"
              onClick={handleToggle}
              className="px-2.5 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white font-semibold transition-colors cursor-pointer text-[10px]"
            >
              Stop
            </button>
          </div>
        </div>
      )}

      {/* Error / Not Supported Toast */}
      {showToast && errorMessage && (
        <div className="absolute right-0 top-full mt-2.5 z-50 w-72 p-3 rounded-xl bg-slate-900 border border-rose-500/50 shadow-2xl text-xs text-rose-300 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-rose-200">Voice Search Notice</p>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowToast(false);
                reset();
              }}
              className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
