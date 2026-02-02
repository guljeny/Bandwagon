import { createContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { Artist } from '../types/lastfm';
import { LastFmApi } from '../services/lastfm-api';
import { addRecentArtist } from '../services/storage';
import { LASTFM_CONFIG } from '../config/lastfm';

export type SortField = 'match' | 'name';
export type SortOrder = 'asc' | 'desc';

interface SearchState {
  results: Artist[];
  isSearching: boolean;
  searchedArtist: Artist | null;
  error: string | null;
  antropy: number;
  sortField: SortField;
  sortOrder: SortOrder;
}

interface SearchContextType extends SearchState {
  searchArtist: (query: string) => Promise<Artist[]>;
  discoverFromArtist: (artist: Artist, pushHistory?: boolean) => Promise<void>;
  cancelSearch: () => void;
  setAntropy: (value: number) => void;
  setSort: (field: SortField, order?: SortOrder) => void;
}

export const SearchContext = createContext<SearchContextType | null>(null);

function getArtistFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('artist');
}

function getAntropyFromUrl(): number | null {
  const params = new URLSearchParams(window.location.search);
  const value = params.get('antropy');
  if (value !== null) {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
      return parsed;
    }
  }
  return null;
}

function getSortFromUrl(): { field: SortField; order: SortOrder } | null {
  const params = new URLSearchParams(window.location.search);
  const field = params.get('sort');
  const order = params.get('order');

  if (field === 'match' || field === 'name') {
    const validOrder = order === 'asc' || order === 'desc' ? order : (field === 'name' ? 'asc' : 'desc');
    return { field, order: validOrder };
  }
  return null;
}

function updateSortUrl(field: SortField, order: SortOrder) {
  const url = new URL(window.location.href);
  url.searchParams.set('sort', field);
  url.searchParams.set('order', order);
  window.history.replaceState(window.history.state, '', url.toString());
}

function updateAntropyUrl(value: number) {
  const url = new URL(window.location.href);
  url.searchParams.set('antropy', String(value));
  window.history.replaceState(window.history.state, '', url.toString());
}

function updateUrl(artistName: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('artist', artistName);
  window.history.pushState({ artist: artistName }, '', url.toString());
}

const DEFAULT_ANTROPY = 2;

const DEFAULT_SORT_FIELD: SortField = 'match';
const DEFAULT_SORT_ORDER: SortOrder = 'desc';

export function SearchProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SearchState>(() => {
    const sort = getSortFromUrl();
    return {
      results: [],
      isSearching: false,
      searchedArtist: null,
      error: null,
      antropy: getAntropyFromUrl() ?? DEFAULT_ANTROPY,
      sortField: sort?.field ?? DEFAULT_SORT_FIELD,
      sortOrder: sort?.order ?? DEFAULT_SORT_ORDER,
    };
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const apiRef = useRef(new LastFmApi(LASTFM_CONFIG.apiKey));
  const initialLoadRef = useRef(false);

  const abortCurrentSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const cancelSearch = useCallback(() => {
    abortCurrentSearch();
    setState((prev) => ({ ...prev, isSearching: false }));
  }, [abortCurrentSearch]);

  const setAntropy = useCallback((value: number) => {
    const clampedValue = Math.max(1, Math.min(10, value));
    setState((prev) => ({ ...prev, antropy: clampedValue }));
    updateAntropyUrl(clampedValue);
  }, []);

  const setSort = useCallback((field: SortField, order?: SortOrder) => {
    setState((prev) => {
      const newOrder = order ?? (prev.sortField === field
        ? (prev.sortOrder === 'asc' ? 'desc' : 'asc')
        : (field === 'name' ? 'asc' : 'desc'));
      updateSortUrl(field, newOrder);
      return { ...prev, sortField: field, sortOrder: newOrder };
    });
  }, []);

  const searchArtist = useCallback(async (query: string): Promise<Artist[]> => {
    try {
      return await apiRef.current.searchArtist(query);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Search failed',
      }));
      return [];
    }
  }, []);

  const discoverFromArtist = useCallback(
    async (artist: Artist, pushHistory: boolean = true) => {
      abortCurrentSearch();

      const currentController = new AbortController();
      abortControllerRef.current = currentController;

      setState((prev) => ({
        ...prev,
        results: [],
        isSearching: true,
        searchedArtist: artist,
        error: null,
      }));

      addRecentArtist(artist.name);

      if (pushHistory) {
        updateUrl(artist.name);
      }

      try {
        await apiRef.current.discoverArtists(
          artist,
          (artists) => {
            // Only update if this is still the current search
            if (abortControllerRef.current === currentController) {
              setState((prev) => ({
                ...prev,
                results: artists,
              }));
            }
          },
          currentController.signal,
          state.antropy
        );
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setState((prev) => ({
            ...prev,
            error: err.message,
          }));
        }
      } finally {
        // Only update isSearching if this is still the current search
        if (abortControllerRef.current === currentController) {
          setState((prev) => ({ ...prev, isSearching: false }));
          abortControllerRef.current = null;
        }
      }
    },
    [abortCurrentSearch, state.antropy]
  );

  // Handle initial load from URL
  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    const artistName = getArtistFromUrl();
    if (artistName) {
      const artist: Artist = {
        id: artistName.toLowerCase().replace(/\s+/g, '-'),
        name: artistName,
        url: `https://www.last.fm/music/${encodeURIComponent(artistName)}`,
      };
      discoverFromArtist(artist, false);
    }
  }, [discoverFromArtist]);

  // Re-discover when antropy changes (if we already have a searched artist)
  const previousAntropyRef = useRef(state.antropy);
  useEffect(() => {
    if (previousAntropyRef.current !== state.antropy && state.searchedArtist) {
      previousAntropyRef.current = state.antropy;
      discoverFromArtist(state.searchedArtist, false);
    }
  }, [state.antropy, state.searchedArtist, discoverFromArtist]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const artistName = event.state?.artist || getArtistFromUrl();
      const sort = getSortFromUrl();

      if (sort) {
        setState((prev) => ({
          ...prev,
          sortField: sort.field,
          sortOrder: sort.order,
        }));
      }

      if (artistName) {
        const artist: Artist = {
          id: artistName.toLowerCase().replace(/\s+/g, '-'),
          name: artistName,
          url: `https://www.last.fm/music/${encodeURIComponent(artistName)}`,
        };
        discoverFromArtist(artist, false);
      } else {
        // Clear results if no artist in URL
        cancelSearch();
        setState((prev) => ({
          ...prev,
          results: [],
          isSearching: false,
          searchedArtist: null,
          error: null,
        }));
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [discoverFromArtist, cancelSearch]);

  return (
    <SearchContext.Provider
      value={{
        ...state,
        searchArtist,
        discoverFromArtist,
        cancelSearch,
        setAntropy,
        setSort,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}
