// UniFinder Type Definitions

// User Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  department: string;
  year: 'freshman' | 'sophomore' | 'junior' | 'senior' | 'grad';
  bio: string;
  photos: string[];
  interests: string[];
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  age: number;
  university: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  discoverySettings: DiscoverySettings;
}

// Auth Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  department: string;
  year: string;
  bio: string;
}

// Discovery Types
export interface DiscoverySettings {
  maxDistance: number;
  ageRange: {
    min: number;
    max: number;
  };
  showMe: 'everyone' | 'men' | 'women';
}

export interface DiscoveryCard {
  user: User;
  distance?: number;
  commonInterests: string[];
}

// Match Types
export interface Match {
  id: string;
  users: [string, string];
  createdAt: Date;
  lastMessage?: Message;
}

// Chat Types
export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'gif';
  isRead: boolean;
  createdAt: Date;
}

export interface Conversation {
  match: Match;
  otherUser: User;
  messages: Message[];
  unreadCount: number;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'match' | 'message' | 'like' | 'superlike' | 'like_request' | 'system';
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

// Navigation Types
export type RootStackParamList = {
  AuthStack: undefined;
  MainStack: undefined;
};

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  RegisterBasicInfo: undefined;
  RegisterPhoto: undefined;
  RegisterInterest: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  DiscoverTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
  NotificationsTab: undefined;
};
