export interface LastFmArtist {
  name: string;
  mbid?: string;
  url: string;
  match?: string;
}

export interface ArtistSearchResponse {
  results: {
    artistmatches: {
      artist: LastFmArtist[];
    };
    'opensearch:totalResults': string;
  };
}

export interface SimilarArtistsResponse {
  similarartists: {
    artist: LastFmArtist[];
  };
}

export interface Artist {
  id: string;
  name: string;
  url: string;
  match?: number;
}
