
export interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  lastActive?: string;
  isOnline?: boolean;
  school?: string;
}

export interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  user?: FriendProfile;
  friend?: FriendProfile;
  status: string; // Changed from 'pending' | 'accepted' | 'rejected' to string
}

export interface FriendProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  school?: string;
}
