
export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar: string;
  bio?: string;
  school: string;
  coins: number;
  createdAt: string;
  isAdmin: boolean;
  interests?: string[];
  location?: string; // Add this line to make location optional
  settings: {
    publicLikedPosts: boolean;
    publicSavedPosts: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
    theme: string;
    privacy: {
      profileVisibility: string;
      onlineStatus: boolean;
      friendRequests: boolean;
      showActivity: boolean;
      allowMessages: string;
      allowTags: boolean;
      dataSharing: boolean;
      showEmail: boolean;
    }
  }
}
