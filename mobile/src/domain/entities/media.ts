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

export type ReviewRating = 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5;

export interface Review {
  id: number;
  user_id: number;
  username: string;
  display_name: string | null;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  rating: ReviewRating;
  body: string;
  contains_spoilers: boolean;
  comment_count: number;
  helpful_votes: number;
  has_voted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewWriteRequest {
  rating: ReviewRating;
  body: string;
  contains_spoilers: boolean;
}

export interface CreateReviewRequest extends ReviewWriteRequest {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
}

export interface Comment {
  id: number;
  review_id: number;
  user_id: number;
  username: string;
  display_name: string | null;
  parent_comment_id: number | null;
  body: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  replies: Comment[];
}

export interface CommentWriteRequest {
  body: string;
  parent_comment_id?: number;
}

export interface ReviewVoteResponse {
  review_id: number;
  helpful_votes: number;
  has_voted: boolean;
}

export function toUiRating(value: number): ReviewRating {
  return (value / 2) as ReviewRating;
}

export function toApiRating(value: ReviewRating): number {
  return Math.round(value * 2);
}
