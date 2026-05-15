export interface ListOwner {
  id: number;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface ListPermissions {
  can_edit: boolean;
  can_delete: boolean;
  can_manage_collaborators: boolean;
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
  relationship: 'owner' | 'collaborator' | 'viewer';
  created_at: string;
  updated_at: string;
}

export interface ListItem {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  position: number;
  added_at: string;
  added_by: ListOwner;
  media_summary: MediaSummary | null;
}

export interface ListInvitation {
  id: number;
  list_id: number;
  list_name: string;
  list_description: string | null;
  list_is_public: boolean;
  owner: ListOwner;
  invited_by: ListOwner;
  created_at: string;
}

export interface MyListsOverview {
  owned_lists: ListSummary[];
  shared_lists: ListSummary[];
  pending_invitations_received: ListInvitation[];
}

export interface ListDetail extends ListSummary {
  collaborators: ListOwner[];
  permissions: ListPermissions;
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

export interface CreateListInvitationRequest {
  invitee_user_id: number;
}
