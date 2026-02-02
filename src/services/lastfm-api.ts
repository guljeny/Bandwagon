import { LASTFM_CONFIG } from '../config/lastfm';
import { LastFmArtist, ArtistSearchResponse, SimilarArtistsResponse, Artist } from '../types/lastfm';

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 100;
const MAX_RESULTS = 500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeArtist(artist: LastFmArtist): Artist {
  return {
    id: artist.mbid || artist.name.toLowerCase().replace(/\s+/g, '-'),
    name: artist.name,
    url: artist.url,
    match: artist.match ? parseFloat(artist.match) * 100 : undefined,
  };
}

export class LastFmApi {
  private apiKey: string;

  constructor(apiKey: string = LASTFM_CONFIG.apiKey) {
    this.apiKey = apiKey;
  }

  private async fetch<T>(params: Record<string, string | number>): Promise<T> {
    const searchParams = new URLSearchParams({
      ...params,
      api_key: this.apiKey,
      format: 'json',
    });

    const response = await fetch(`${LASTFM_CONFIG.apiBaseUrl}?${searchParams.toString()}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.message || 'Last.fm API error');
    }

    return data;
  }

  async searchArtist(query: string): Promise<Artist[]> {
    const response = await this.fetch<ArtistSearchResponse>({
      method: 'artist.search',
      artist: query,
      limit: '10',
    });

    const artists = response.results?.artistmatches?.artist || [];
    return artists.map(normalizeArtist);
  }

  async getSimilarArtists(artistName: string, limit: number = 50): Promise<Artist[]> {
    try {
      const response = await this.fetch<SimilarArtistsResponse>({
        method: 'artist.getSimilar',
        artist: artistName,
        autocorrect: 1,
        limit: String(limit),
      });

      const artists = response.similarartists?.artist || [];
      return artists.map(normalizeArtist);
    } catch {
      return [];
    }
  }

  async discoverArtists(
    rootArtist: Artist,
    onProgress: (artists: Artist[]) => void,
    signal?: AbortSignal,
    antropy: number = 5
  ): Promise<Artist[]> {
    const seen = new Set<string>([rootArtist.name.toLowerCase()]);
    const allArtists: Artist[] = [];

    // Level 1: Get similar artists for the root artist
    if (signal?.aborted) return allArtists;

    const level1Similar = await this.getSimilarArtists(rootArtist.name, 100);

    // Use antropy to select which subset of Level 1 artists for Level 2 exploration
    // antropy=1 → 0-9, antropy=5 → 40-49, antropy=10 → 90-99
    const startIndex = (antropy - 1) * 10;
    const level1ForNextLevel = level1Similar.slice(startIndex, startIndex + 10);

    // Add only the 10 artists that will be used for Level 2 exploration
    for (const artist of level1ForNextLevel) {
      const key = artist.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        allArtists.push(artist);
      }
    }

    onProgress([...allArtists]);

    // Level 2: For each of the last 10, get 50 more similar artists
    for (let i = 0; i < level1ForNextLevel.length; i += BATCH_SIZE) {
      if (signal?.aborted) break;
      if (allArtists.length >= MAX_RESULTS) break;

      const batch = level1ForNextLevel.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(({ name, match: parentMatch }) =>
          this.getSimilarArtists(name, 50).then(similar =>
            similar.map(s => ({
              artist: s,
              // Cumulative match = parent's match * current match / 100
              cumulativeMatch: ((parentMatch ?? 100) * (s.match ?? 100)) / 100
            }))
          )
        )
      );

      for (const similarWithMatch of batchResults.flat()) {
        const key = similarWithMatch.artist.name.toLowerCase();
        if (!seen.has(key) && allArtists.length < MAX_RESULTS) {
          seen.add(key);
          const artistWithMatch: Artist = {
            ...similarWithMatch.artist,
            match: similarWithMatch.cumulativeMatch
          };
          allArtists.push(artistWithMatch);
        }
      }

      onProgress([...allArtists]);

      if (i + BATCH_SIZE < level1ForNextLevel.length) {
        await delay(BATCH_DELAY_MS);
      }
    }

    return allArtists;
  }
}

export const lastFmApi = new LastFmApi();
