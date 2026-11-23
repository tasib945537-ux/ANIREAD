import React, { useState } from 'react';
import { User, Volume2, Star, Sparkles, Filter, Image as ImageIcon } from 'lucide-react';
import { CharacterPreview, VoiceActor } from '../../types/anime';

interface Props {
  characters: CharacterPreview[];
  animePictures?: string[];
  onSelectCharacter: (charId: number, name: string, image: string, animePics: string[]) => void;
}

export const AnimeCharactersCast: React.FC<Props> = ({
  characters = [],
  animePictures = [],
  onSelectCharacter,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all available languages from real voice actors
  const availableLanguages = Array.from(
    new Set(
      characters
        .flatMap((c) => c.voiceActors || [])
        .map((va) => va.language)
        .filter(Boolean)
    )
  );

  const langFilterOptions = ['All', 'Japanese', 'English', 'Hindi', 'Bengali', 'Spanish', 'French', 'German'];

  // Filter characters by search and voice actor language
  const filteredCharacters = characters.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.nativeName && c.nativeName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedLanguage === 'All') return true;

    // Check if character has a voice actor in the selected language
    return (c.voiceActors || []).some(
      (va) => va.language.toLowerCase() === selectedLanguage.toLowerCase()
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Search and Language Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
        <input
          type="text"
          placeholder="Search characters by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors w-full sm:w-64"
        />

        {/* Language Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {langFilterOptions.map((lang) => {
            const hasCastInLang =
              lang === 'All' ||
              availableLanguages.some((l) => l.toLowerCase() === lang.toLowerCase());

            return (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedLanguage === lang
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : hasCastInLang
                    ? 'bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/80'
                    : 'bg-slate-900/50 text-slate-500 border border-slate-800/50 cursor-pointer'
                }`}
                title={hasCastInLang ? `Filter ${lang} seiyuu` : `No direct ${lang} voice actor listed`}
              >
                {lang}
              </button>
            );
          })}
        </div>
      </div>

      {/* Characters Count Notice */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Showing <strong className="text-white font-mono">{filteredCharacters.length}</strong> of{' '}
          <strong className="text-white font-mono">{characters.length}</strong> characters
        </span>
        <span className="text-[11px] text-slate-500">
          Tap any character to open gallery & detailed biography
        </span>
      </div>

      {/* Characters Grid */}
      {filteredCharacters.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-xs space-y-2">
          <User className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="font-semibold text-slate-300">No characters matching your filter.</p>
          <p className="text-slate-500">Try switching the language filter to "All" or clearing the search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredCharacters.map((char) => {
            // Find voice actor matching selected language, or default to Japanese, or first available
            const matchingVA =
              selectedLanguage !== 'All'
                ? char.voiceActors?.find(
                    (va) => va.language.toLowerCase() === selectedLanguage.toLowerCase()
                  )
                : char.voiceActors?.find((va) => va.language.toLowerCase() === 'japanese') ||
                  char.voiceActors?.[0];

            return (
              <div
                key={char.id}
                onClick={() =>
                  onSelectCharacter(char.id, char.name, char.image, animePictures)
                }
                className="group p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-md hover:shadow-indigo-950/20"
              >
                {/* Character Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-13 h-17 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800 relative group-hover:scale-105 transition-transform duration-300">
                    {char.image ? (
                      <img
                        src={char.image}
                        alt={char.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[8px] font-mono font-bold text-indigo-300">
                      {char.role === 'Main' ? 'MAIN' : 'SUPP'}
                    </span>
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {char.name}
                    </h4>
                    {char.nativeName && (
                      <span className="text-[10px] text-slate-400 font-serif line-clamp-1 block">
                        {char.nativeName}
                      </span>
                    )}
                    {char.favorites !== undefined && char.favorites > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        <span>{char.favorites.toLocaleString()} favs</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Voice Actor Info (Seiyuu) */}
                {matchingVA ? (
                  <div className="flex items-center gap-2 shrink-0 text-right pl-2 border-l border-slate-800/80">
                    <div className="space-y-0.5 min-w-20">
                      <span className="text-[11px] font-bold text-slate-200 line-clamp-1 block">
                        {matchingVA.name}
                      </span>
                      <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 font-mono font-semibold inline-block">
                        {matchingVA.language}
                      </span>
                    </div>

                    {matchingVA.image ? (
                      <div className="w-10 h-13 rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-slate-800">
                        <img
                          src={matchingVA.image}
                          alt={matchingVA.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-13 rounded-lg bg-slate-800/60 flex items-center justify-center text-slate-600 shrink-0">
                        <Volume2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-500 italic shrink-0">
                    Original Cast
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
