export interface PublicUserSummary {
  id: number;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_following: boolean;
}

export interface PublicUserProfile extends PublicUserSummary {
  bio: string | null;
  created_at: string;
  followers_count: number;
  following_count: number;
  reviews_count: number;
  watch_logs_count: number;
}

export interface GenreStat {
  name: string;
  count: number;
}

export interface PublicUserStats {
  watched_count: number;
  estimated_hours: number;
  top_genres: GenreStat[];
  average_rating: number | null;
}

export interface FavoriteMediaItem {
  position: number;
  media: {
    tmdb_id: number;
    media_type: 'movie' | 'tv';
    title: string;
    poster_path: string | null;
    vote_average: number;
    release_date: string | null;
  };
}

export interface FavoriteMediaWriteItem {
  position: number;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
}

export interface ActivityActor {
  id: number;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface ReviewActivity {
  title: string;
  poster_path: string | null;
  id: number;
  activity_type: 'review';
  created_at: string;
  actor: ActivityActor;
  review_id: number;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  rating: number;
  body_preview: string;
  contains_spoilers: boolean;
}

export interface WatchLogActivity {
  title: string;
  poster_path: string | null;
  id: number;
  activity_type: 'watch_log';
  created_at: string;
  actor: ActivityActor;
  watch_log_id: number;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  watched_at: string;
  rating: number | null;
}

export interface FollowActivity {
  id: number;
  activity_type: 'follow';
  created_at: string;
  actor: ActivityActor;
  followed_user: PublicUserSummary;
}

export interface ListCreatedActivity {
  id: number;
  activity_type: 'list_created';
  created_at: string;
  actor: ActivityActor;
  list_id: number | null;
  list_name: string | null;
  items_count: number;
  is_public: boolean;
}

export type ActivityItem = ReviewActivity | WatchLogActivity | FollowActivity | ListCreatedActivity;

export interface FeedPage {
  items: ActivityItem[];
  next_cursor: string | null;
}

export interface VisualFeedParticipant {
  id: number;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  activity_type: 'review' | 'watch_log';
  rating: number | null;
  created_at: string;
}

export interface VisualFeedItem {
  media: {
    tmdb_id: number;
    media_type: 'movie' | 'tv';
    title: string;
    poster_path: string | null;
    vote_average: number;
    release_date: string | null;
  };
  participants: VisualFeedParticipant[];
  recent_activity_count: number;
  latest_activity_at: string;
}
