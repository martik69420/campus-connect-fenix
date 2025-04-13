
// Define the profile type used in friends
export interface FriendProfile {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string;
}

// Friend type definition
export interface Friend {
  id: string;
  status: string;
  created_at: string;
  friend_id: string;
  profiles?: FriendProfile;
}

// Friend request type definition
export interface FriendRequest {
  id: string;
  status: string;
  created_at: string;
  user_id?: string;
  friend_id?: string;
  profiles?: FriendProfile;
}
