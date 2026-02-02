import { useState, useMemo } from 'react';
import { Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Copy, Check } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { Artist } from '../types/lastfm';
import { SortField } from '../context/SearchContext';

export function ArtistList() {
  const { results, isSearching, searchedArtist, error, cancelSearch, discoverFromArtist, sortField, sortOrder, setSort } =
    useSearch();
  const [copiedArtistId, setCopiedArtistId] = useState<string | null>(null);

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'match':
          comparison = (a.match ?? 0) - (b.match ?? 0);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [results, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    setSort(field);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronsUpDown size={16} className="text-gray-500" />;
    }
    return sortOrder === 'desc'
      ? <ChevronDown size={16} className="text-red-500" />
      : <ChevronUp size={16} className="text-red-500" />;
  };

  const handleRowClick = (artist: Artist) => {
    if (!isSearching) {
      discoverFromArtist(artist);
    }
  };

  const handleCopy = async (artist: Artist, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(artist.name);
      setCopiedArtistId(artist.id);
      setTimeout(() => setCopiedArtistId(null), 2000);
    } catch {
      // Clipboard API may fail in some contexts
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!searchedArtist && results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Search for an artist to discover similar music</p>
      </div>
    );
  }

  return (
    <div>
      {searchedArtist && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-xl">
              Artists similar to <span className="text-red-500 font-semibold">{searchedArtist.name}</span>
            </h2>
            {isSearching && (
              <button
                onClick={cancelSearch}
                className="text-gray-400 hover:text-white text-sm"
              >
                Cancel
              </button>
            )}
          </div>

          {isSearching && (
            <div className="flex items-center gap-3 mt-3">
              <Loader2 className="animate-spin text-red-500" size={20} />
              <span className="text-gray-400">Discovering...</span>
              <span className="text-gray-500">({results.length} artists found)</span>
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <p className="text-gray-400 mt-2">{results.length} artists discovered</p>
          )}
        </div>
      )}

      {/* Mobile sort buttons (< 720px) */}
      <div className="flex gap-4 mb-4 mobile-only">
        <button
          onClick={() => handleSort('name')}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
            sortField === 'name'
              ? 'bg-red-500/20 text-red-500'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          Artist
          <SortIcon field="name" />
        </button>
        <button
          onClick={() => handleSort('match')}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
            sortField === 'match'
              ? 'bg-red-500/20 text-red-500'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          Similarity
          <SortIcon field="match" />
        </button>
      </div>

      {/* Mobile list (< 720px) */}
      <div className="mobile-only">
        {sortedResults.map((artist) => (
          <div
            key={artist.id}
            onClick={() => handleRowClick(artist)}
            className={`border-b border-gray-800 py-3 px-2 transition-colors hover:bg-gray-800 ${
              isSearching ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">{artist.name}</span>
              <button
                onClick={(e) => handleCopy(artist, e)}
                className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                title="Copy artist name"
              >
                {copiedArtistId === artist.id ? (
                  <Check size={14} className="text-green-500" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
            {artist.match !== undefined && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-red-500 h-1.5 rounded-full"
                    style={{ width: `${artist.match}%` }}
                  />
                </div>
                <span className="text-gray-500 text-xs w-8 text-right">{Math.round(artist.match)}%</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop table (>= 720px) */}
      <div className="desktop-only">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th
                className="text-left py-3 px-4 text-gray-400 font-medium cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Artist
                  <SortIcon field="name" />
                </div>
              </th>
              <th
                className="text-left py-3 px-4 text-gray-400 font-medium cursor-pointer hover:text-white transition-colors w-48"
                onClick={() => handleSort('match')}
              >
                <div className="flex items-center gap-2">
                  Similarity
                  <SortIcon field="match" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((artist) => (
              <tr
                key={artist.id}
                onClick={() => handleRowClick(artist)}
                className={`border-b border-gray-800 transition-colors hover:bg-gray-800 ${
                  isSearching ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{artist.name}</span>
                    <button
                      onClick={(e) => handleCopy(artist, e)}
                      className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                      title="Copy artist name"
                    >
                      {copiedArtistId === artist.id ? (
                        <Check size={14} className="text-green-500" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {artist.match !== undefined && (
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${artist.match}%` }}
                        />
                      </div>
                      <span className="text-gray-400 text-sm w-12">{Math.round(artist.match)}%</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
