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

export interface ActivityActor {
  id: number;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface ReviewActivity {
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
