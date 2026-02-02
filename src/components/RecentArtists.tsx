import { Clock } from 'lucide-react';
import { getRecentArtists } from '../services/storage';
import { useSearch } from '../hooks/useSearch';
import { useState, useEffect } from 'react';

export function RecentArtists() {
  const { searchArtist, discoverFromArtist, isSearching, searchedArtist } = useSearch();
  const [recentArtists, setRecentArtists] = useState<string[]>([]);

  useEffect(() => {
    setRecentArtists(getRecentArtists());
  }, [searchedArtist]);

  if (recentArtists.length === 0) {
    return null;
  }

  const handleClick = async (name: string) => {
    if (isSearching) return;

    const results = await searchArtist(name);
    if (results.length > 0) {
      discoverFromArtist(results[0]);
    }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-gray-500">
        <Clock size={16} />
        <span className="text-sm">Recent:</span>
      </div>
      {recentArtists.map((name) => (
        <button
          key={name}
          onClick={() => handleClick(name)}
          disabled={isSearching}
          className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {name}
        </button>
      ))}
    </div>
  );
}
