// Navigasyon Tipleri
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// Kayıt veri tipi
export type RegistrationData = {
  email: string;
  password: string;
  fullName: string;
  department: string;
  classYear: string;
  bio: string;
  photos?: string[];
  interests?: string[];
};

// Kimlik Doğrulama Yığını
export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  RegisterBasicInfo: {
    email?: string;
    password?: string;
    fullName?: string;
    department?: string;
    classYear?: string;
    bio?: string;
  } | undefined;
  RegisterPhoto: {
    email: string;
    password: string;
    fullName: string;
    department: string;
    classYear: string;
    bio: string;
    photos?: string[]; // Optional - for returning from RegisterInterest
  };
  RegisterInterest: {
    email: string;
    password: string;
    fullName: string;
    department: string;
    classYear: string;
    bio: string;
    photos: string[];
  };
  EmailVerification: {
    email: string;
  };
  ForgotPassword: undefined;
};

// Ana Sekmeler
export type MainTabParamList = {
  Discover: undefined;
  Events: undefined;
  Messages: undefined;
  Profile: undefined;
};

// Sohbet Yığını
export type ChatStackParamList = {
  MessageList: undefined;
  Chat: { matchId: string; userName: string; userPhoto: string };
};

// Profil Yığını
export type ProfileStackParamList = {
  UserProfile: undefined;
  EditProfile: undefined;
  OtherProfile: { userId: string };
};

// Ayarlar Yığını
export type SettingsStackParamList = {
  Settings: undefined;
  PrivacySettings: undefined;
  NotificationSettings: undefined;
  AccountSettings: undefined;
};

// Ana Yığın
export type RootStackParamList = {
  Onboarding: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Chat: { matchId: string; userName: string; userPhoto: string };
  MatchSuccess: { matchedUserId: string; matchedUserName: string; matchedUserPhoto: string };
  FilterSearch: undefined;
  UserProfile: { userId: string };
  Settings: undefined;
  EditProfile: undefined;
  NotificationCenter: undefined;
  PrivacySettings: undefined;
  Verification: undefined;
  ChangePassword: undefined;
  BlockedUsers: undefined;
  MutedUsers: undefined;
  ReportedUsers: undefined;
  DownloadData: undefined;
  ClearHistory: undefined;
  NotificationSettings: undefined;
  HelpCenter: undefined;
  TermsOfService: undefined;
  LocationSettings: undefined;
  DistanceSettings: undefined;
  AddStory: undefined;
  ViewStory: { storyId: string; userId: string };
  // Yeni eklenen ekranlar (28 Aralık 2025)
  Followers: { userId?: string };
  Following: { userId?: string };
  ProfileViewers: undefined;
  Premium: undefined;
  
  // Mega Features (28 Aralık 2025 - Faz 2)
  // Gamification
  DailyTasks: undefined;
  Badges: { userId?: string };
  Leaderboard: undefined;
  
  // Events
  Events: undefined;
  EventDetail: { eventId: string };
  CreateEvent: undefined;
  
  // Groups
  GroupList: undefined;
  GroupChat: { groupId: string; groupName: string };
  CreateGroup: undefined;
  GroupMembers: { groupId: string; groupName: string };
  
  // Profile Enhancements
  ProfilePreview: undefined;
  EditPrompts: undefined;
  AdvancedFilters: undefined;
  
  // Boost
  Boost: undefined;
  
  // Video Call
  VideoCall: { matchId: string; userName: string; userPhoto: string; callType: 'video' | 'audio' };
  IncomingCall: { sessionId: string; callerId: string; callerName: string; callerPhoto: string; callType: 'video' | 'audio' };
  CallHistory: undefined;
  
  // Verification
  PhotoVerification: undefined;
  
  // Spotify
  SpotifyConnect: undefined;
};

// Ekran Props Tipleri
export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

// Global navigasyon tipi tanımı
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
