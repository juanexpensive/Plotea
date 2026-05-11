export interface ListOwner {
  id: number;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface MediaSummary {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string | null;
  poster_path: string | null;
  release_date: string | null;
}

export interface ListSummary {
  id: number;
  name: string;
  description: string | null;
  is_public: boolean;
  owner: ListOwner;
  items_count: number;
  created_at: string;
  updated_at: string;
}

export interface ListItem {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  position: number;
  added_at: string;
  media_summary: MediaSummary | null;
}

export interface ListDetail extends ListSummary {
  items: ListItem[];
}

export interface ListWriteRequest {
  name: string;
  description: string | null;
  is_public: boolean;
}

export interface AddListItemRequest {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
}

export interface ListItemRef {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
}

export interface ReorderListItemsRequest {
  source: ListItemRef;
  target: ListItemRef;
}
