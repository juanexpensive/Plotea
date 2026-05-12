export interface User {
  id: number;
  email: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
