import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Artist } from '../types/lastfm';
import { useSearch } from '../hooks/useSearch';

export function SearchBar() {
  const { searchArtist, discoverFromArtist, isSearching, antropy, setAntropy } = useSearch();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Artist[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  const fetchSuggestions = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const results = await searchArtist(searchQuery);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } finally {
        setIsLoadingSuggestions(false);
      }
    },
    [searchArtist]
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      fetchSuggestions(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (artist: Artist) => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    discoverFromArtist(artist);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder="Search for an artist..."
          disabled={isSearching}
          className="w-full pl-12 pr-12 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 disabled:opacity-50"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            {isLoadingSuggestions ? <Loader2 className="animate-spin" size={20} /> : <X size={20} />}
          </button>
        )}
      </div>

      {/* Antropy Slider */}
      <div className="mt-3 px-1">
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="antropy-slider" className="text-sm text-gray-400">
            Antropy
          </label>
          <span className="text-sm text-gray-300 font-medium">{antropy}</span>
        </div>
        <input
          id="antropy-slider"
          type="range"
          min="1"
          max="10"
          value={antropy}
          onChange={(e) => setAntropy(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Similar</span>
          <span>Diverse</span>
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          {suggestions.map((artist) => (
            <button
              key={artist.id}
              onClick={() => handleSelect(artist)}
              className="w-full p-3 hover:bg-gray-700 transition-colors text-left"
            >
              <p className="text-white font-medium">{artist.name}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
