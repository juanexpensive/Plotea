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

export interface HomeFeed {
  trending: MediaItem[];
  popular_movies: MediaItem[];
  popular_tv: MediaItem[];
}
