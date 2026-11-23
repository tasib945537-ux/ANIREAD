import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Maximize2, Download, ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';

interface Props {
  pictures: string[];
  animeTitle: string;
}

export const AnimeGallerySection: React.FC<Props> = ({ pictures = [], animeTitle }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev !== null && prev < pictures.length - 1 ? prev + 1 : 0));
        setIsZoomed(false);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : pictures.length - 1));
        setIsZoomed(false);
      } else if (e.key === 'Escape') {
        setLightboxIndex(null);
        setIsZoomed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, pictures.length]);

  if (pictures.length === 0) {
    return (
      <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-xs space-y-2">
        <ImageIcon className="w-8 h-8 text-slate-600 mx-auto" />
        <p className="font-semibold text-slate-300">Photo gallery pending official broadcast visuals.</p>
        <p className="text-slate-500">Official promotional artwork will be indexed when published by the production committee.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Showing <strong className="text-white font-mono">{pictures.length}</strong> official posters & high-res visuals
        </span>
        <span className="text-[11px] text-slate-500">Tap any photo to view in HD theater mode</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {pictures.map((pic, idx) => (
          <div
            key={idx}
            onClick={() => {
              setLightboxIndex(idx);
              setIsZoomed(false);
            }}
            className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-indigo-500/50 cursor-pointer shadow-md transition-all hover:scale-[1.02]"
          >
            <img
              src={pic}
              alt={`${animeTitle} - visual ${idx + 1}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5">
              <span className="text-[10px] font-mono font-bold text-white">Visual #{idx + 1}</span>
              <Maximize2 className="w-4 h-4 text-white drop-shadow" />
            </div>
          </div>
        ))}
      </div>

      {/* Full-Screen Lightbox Modal */}
      {lightboxIndex !== null && (
        <div
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
        >
          {/* Top Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl flex items-center justify-between py-2 text-white text-xs mb-2 z-10"
          >
            <span className="font-mono font-bold text-slate-300">
              Visual {lightboxIndex + 1} of {pictures.length} · {animeTitle}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsZoomed((prev) => !prev)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
                title={isZoomed ? 'Zoom Out' : 'Zoom In'}
              >
                {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
              </button>

              <a
                href={pictures[lightboxIndex]}
                target="_blank"
                rel="noopener noreferrer"
                download={`anime-visual-${lightboxIndex + 1}.jpg`}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer flex items-center gap-1 text-xs"
                title="Open full resolution"
              >
                <Download className="w-4 h-4" />
              </a>

              <button
                onClick={() => setLightboxIndex(null)}
                className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Central Image with Navigation Arrows */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[82vh] flex items-center justify-center overflow-hidden rounded-2xl"
          >
            <img
              src={pictures[lightboxIndex]}
              alt={animeTitle}
              referrerPolicy="no-referrer"
              className={`max-h-[80vh] w-auto object-contain rounded-xl transition-transform duration-300 ${
                isZoomed ? 'scale-150 cursor-grab' : 'scale-100'
              }`}
            />

            {/* Left / Right Nav Arrows */}
            {pictures.length > 1 && (
              <>
                <button
                  onClick={() => {
                    setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : pictures.length - 1));
                    setIsZoomed(false);
                  }}
                  className="absolute left-2 p-2.5 rounded-full bg-black/60 hover:bg-black/85 text-white transition-colors cursor-pointer shadow-xl"
                  title="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={() => {
                    setLightboxIndex((prev) => (prev !== null && prev < pictures.length - 1 ? prev + 1 : 0));
                    setIsZoomed(false);
                  }}
                  className="absolute right-2 p-2.5 rounded-full bg-black/60 hover:bg-black/85 text-white transition-colors cursor-pointer shadow-xl"
                  title="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
