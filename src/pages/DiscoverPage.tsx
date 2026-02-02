import { Music } from 'lucide-react';
import { SearchProvider } from '../context/SearchContext';
import { SearchBar } from '../components/SearchBar';
import { RecentArtists } from '../components/RecentArtists';
import { ArtistList } from '../components/ArtistList';

function DiscoverContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Music className="text-red-500" size={28} />
            <h1 className="text-2xl font-bold text-white">Bandwagon</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-6 mb-8">
          <SearchBar />
          <RecentArtists />
        </div>

        <ArtistList />
      </main>

      <footer className="py-6 text-center">
        <a
          href="https://www.last.fm"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          Powered by Last.fm
        </a>
      </footer>
    </div>
  );
}

export function DiscoverPage() {
  return (
    <SearchProvider>
      <DiscoverContent />
    </SearchProvider>
  );
}
