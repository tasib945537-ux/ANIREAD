import React, { useState, useEffect } from 'react';
import { X, Star, Globe, Download, ChevronLeft, ChevronRight, Maximize2, Sparkles, Image as ImageIcon, User } from 'lucide-react';
import { CharacterDetail } from '../types/anime';
import { getCharacterDetails } from '../services/api';
import { translateText, SUPPORTED_LANGUAGES, getUIText } from '../services/translator';
import { formatCharacterBio } from '../services/characterGallery';
import { AnimeLoadingState } from './AnimeLoadingState';

interface Props {
  characterId: number;
  initialName?: string;
  initialImage?: string;
  animePictures?: string[];
  currentLang: string;
  onClose: () => void;
  onSelectAnime?: (animeId: number) => void;
}

export const CharacterModal: React.FC<Props> = ({
  characterId,
  initialName = 'Character Details',
  initialImage,
  animePictures = [],
  currentLang,
  onClose,
  onSelectAnime,
}) => {
  const [character, setCharacter] = useState<CharacterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active tab: 'gallery' (20+ photos) or 'bio'
  const [activeTab, setActiveTab] = useState<'gallery' | 'bio'>('gallery');

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Translation state for bio
  const [translatedBio, setTranslatedBio] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getCharacterDetails(characterId, animePictures)
      .then((data) => {
        if (isMounted) {
          setCharacter(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load character');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [characterId]);

  // Translate biography
  const handleTranslate = async () => {
    if (!character?.about || isTranslating) return;
    setIsTranslating(true);
    try {
      const translated = await translateText(character.about, currentLang, 'English');
      setTranslatedBio(translated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  const gallery = character?.gallery || (initialImage ? [initialImage] : []);
  const bioParsed = formatCharacterBio(translatedBio || character?.about);

  const activeLangName = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang)?.nativeName || currentLang;

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev !== null && prev < gallery.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : gallery.length - 1));
      } else if (e.key === 'Escape') {
        setLightboxIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, gallery.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-slate-100">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white tracking-tight">
              {character?.name || initialName}
            </h2>
            {character?.nativeName && (
              <span className="text-xs text-slate-400 font-normal">
                {character.nativeName}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Tabs */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-slate-800/80 bg-slate-950/40 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'gallery'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{getUIText('gallery', currentLang)} ({gallery.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('bio')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'bio'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{getUIText('synopsis', currentLang)} & Lore</span>
            </button>
          </div>

          {character?.favorites !== undefined && (
            <div className="flex items-center gap-1 text-slate-400">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="font-mono tabular-nums">{character.favorites.toLocaleString()} favorites</span>
            </div>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && !character ? (
            <AnimeLoadingState
              message="Loading..."
              subMessage="Summoning character lore & 20+ photo gallery..."
              size="lg"
              characterTheme="chibi"
              showThemeToggle={true}
            />
          ) : error ? (
            <div className="text-center py-16 text-rose-400">
              <p>{error}</p>
            </div>
          ) : (
            <>
              {activeTab === 'gallery' ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs text-slate-400">
                      High-resolution official artwork, anime key stills, and character portraits. Click any photo to expand full-screen.
                    </p>
                    <span className="text-xs text-indigo-400 font-mono tabular-nums">
                      {gallery.length} Photos Available
                    </span>
                  </div>

                  {/* 20+ Photos Masonry / Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {gallery.map((photoUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => setLightboxIndex(idx)}
                        className="group relative aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-800 cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
                      >
                        {photoUrl && photoUrl.trim() !== '' ? (
                          <img
                            src={photoUrl}
                            alt={`${character?.name || 'Character'} photo ${idx + 1}`}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <User className="w-8 h-8" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
                        </div>
                        <span className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-xs text-[10px] font-mono text-white/80 px-1.5 py-0.5 rounded">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Translator Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <Globe className="w-4 h-4 text-indigo-400" />
                      <span>
                        {translatedBio ? (
                          <>
                            {getUIText('translatedInto', currentLang)} <strong className="text-white">{activeLangName}</strong>
                          </>
                        ) : (
                          'View character biography in your preferred language'
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {translatedBio && (
                        <button
                          onClick={() => setTranslatedBio(null)}
                          className="px-2.5 py-1 text-xs text-slate-400 hover:text-white transition-colors"
                        >
                          {getUIText('original', currentLang)}
                        </button>
                      )}
                      <button
                        onClick={handleTranslate}
                        disabled={isTranslating}
                        className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isTranslating ? 'Translating...' : `Translate into ${activeLangName}`}</span>
                      </button>
                    </div>
                  </div>

                  {/* Character Overview Prose */}
                  <div className="text-sm text-slate-300 leading-relaxed space-y-4">
                    {bioParsed.overview.split('\n\n').map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>

                  {/* Official Voice Actors Cast */}
                  {character?.voiceActors && character.voiceActors.length > 0 && (
                    <div className="pt-4 border-t border-slate-800">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                        Official Voice Actors & Dub Cast ({character.voiceActors.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {character.voiceActors.map((va, i) => (
                          <div key={i} className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center gap-2.5">
                            {va.image && va.image.trim() !== '' && (
                              <img
                                src={va.image}
                                alt={va.name}
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <span className="text-[10px] text-indigo-400 font-mono block uppercase">{va.language}</span>
                              <span className="font-semibold text-white truncate block">{va.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trivia / Traits */}
                  {bioParsed.trivia.length > 0 && (
                    <div className="pt-4 border-t border-slate-800">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                        Character Profile & Attributes
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {bioParsed.trivia.map((item, i) => (
                          <div key={i} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 text-slate-300">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Appearances */}
                  {character?.animeAppearances && character.animeAppearances.length > 0 && (
                    <div className="pt-4 border-t border-slate-800">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                        Anime Appearances
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {character.animeAppearances.map((anime) => (
                          <button
                            key={anime.id}
                            onClick={() => {
                              if (onSelectAnime) onSelectAnime(anime.id);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700/60 text-xs text-slate-200 hover:text-white transition-colors text-left"
                          >
                            <span className="font-medium">{anime.title}</span>
                            <span className="text-slate-400 ml-1.5">({anime.role})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lightbox Fullscreen Photo Viewer */}
      {lightboxIndex !== null && gallery[lightboxIndex] && (
        <div className="fixed inset-0 z-60 flex flex-col items-center justify-between p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-150">
          {/* Top Bar */}
          <div className="w-full max-w-5xl flex items-center justify-between text-xs text-slate-300 py-2">
            <span className="font-mono tabular-nums">
              Photo {lightboxIndex + 1} of {gallery.length}
            </span>
            <div className="flex items-center gap-3">
              <a
                href={gallery[lightboxIndex]}
                target="_blank"
                rel="noreferrer"
                download={`character_photo_${lightboxIndex + 1}.jpg`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                title="Download high-resolution image"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save</span>
              </a>
              <button
                onClick={() => setLightboxIndex(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                title="Close lightbox (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Photo View */}
          <div className="relative flex-1 w-full max-w-4xl flex items-center justify-center p-2">
            {gallery[lightboxIndex] && gallery[lightboxIndex].trim() !== '' && (
              <img
                src={gallery[lightboxIndex]}
                alt={`Photo ${lightboxIndex + 1}`}
                referrerPolicy="no-referrer"
                className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
              />
            )}

            {/* Prev button */}
            <button
              onClick={() =>
                setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : gallery.length - 1))
              }
              className="absolute left-2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 transition-colors"
              title="Previous photo (Left arrow)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Next button */}
            <button
              onClick={() =>
                setLightboxIndex((prev) => (prev !== null && prev < gallery.length - 1 ? prev + 1 : 0))
              }
              className="absolute right-2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 transition-colors"
              title="Next photo (Right arrow)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Bottom Thumbnail Strip */}
          <div className="w-full max-w-4xl overflow-x-auto flex items-center gap-2 py-3 px-2">
            {gallery.map((thumb, idx) => (
              <button
                key={idx}
                onClick={() => setLightboxIndex(idx)}
                className={`relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                  idx === lightboxIndex ? 'border-indigo-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                {thumb && thumb.trim() !== '' && (
                  <img src={thumb} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
