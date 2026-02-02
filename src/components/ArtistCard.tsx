import { ExternalLink, Copy } from 'lucide-react';
import { useState } from 'react';
import { Artist } from '../types/lastfm';
import { useSearch } from '../hooks/useSearch';

interface ArtistCardProps {
  artist: Artist;
}

export function ArtistCard({ artist }: ArtistCardProps) {
  const { discoverFromArtist, isSearching } = useSearch();
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    if (!isSearching) {
      discoverFromArtist(artist);
    }
  };

  const handleLastFmClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(artist.url, '_blank');
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(artist.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative bg-gray-800 rounded-lg p-4 transition-all hover:bg-gray-700 ${
        isSearching ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-white font-semibold truncate">{artist.name}</h3>
          <button
            onClick={handleCopy}
            className="p-1 text-gray-500 hover:text-green-500 transition-colors flex-shrink-0"
            title={copied ? "Скопировано!" : "Копировать"}
          >
            <Copy size={14} />
          </button>
        </div>
        <button
          onClick={handleLastFmClick}
          className="p-2 text-gray-500 hover:text-red-500 transition-colors flex-shrink-0"
          title="Open in Last.fm"
        >
          <ExternalLink size={16} />
        </button>
      </div>

      {artist.match !== undefined && (
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-red-500 h-1.5 rounded-full"
              style={{ width: `${artist.match}%` }}
            />
          </div>
          <span className="text-gray-500 text-xs">{Math.round(artist.match)}%</span>
        </div>
      )}
    </div>
  );
}
