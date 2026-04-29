export interface MediaItem {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string | null;
}

export interface MediaDetail extends MediaItem {
  overview: string;
  genres: string[];
  runtime: number | null;
}

export type PersonalMediaStatus = 'watched' | 'watchlist' | null;

export interface MediaStatus {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  status: PersonalMediaStatus;
}

export interface SavedMediaStatus {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  status: Exclude<PersonalMediaStatus, null>;
}

export interface MediaStatusLists {
  watched: SavedMediaStatus[];
  watchlist: SavedMediaStatus[];
}

export interface HomeFeed {
  trending: MediaItem[];
  popular_movies: MediaItem[];
  popular_tv: MediaItem[];
}

export interface WatchLogEntry {
  id: number;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  watched_at: string;
  rating: number | null;
  created_at: string;
}

export interface CreateWatchLogRequest {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  watched_at: string;
  rating: number | null;
}
