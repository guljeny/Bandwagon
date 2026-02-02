const KEYS = {
  RECENT_ARTISTS: 'bandwagon_recent_artists',
  API_KEY: 'bandwagon_api_key',
} as const;

export function getRecentArtists(): string[] {
  const stored = localStorage.getItem(KEYS.RECENT_ARTISTS);
  return stored ? JSON.parse(stored) : [];
}

export function addRecentArtist(artistName: string): void {
  const recent = getRecentArtists().filter((name) => name !== artistName);
  recent.unshift(artistName);
  localStorage.setItem(KEYS.RECENT_ARTISTS, JSON.stringify(recent.slice(0, 10)));
}

export function getStoredApiKey(): string | null {
  return localStorage.getItem(KEYS.API_KEY);
}

export function setStoredApiKey(key: string): void {
  localStorage.setItem(KEYS.API_KEY, key);
}

export function clearStoredApiKey(): void {
  localStorage.removeItem(KEYS.API_KEY);
}
