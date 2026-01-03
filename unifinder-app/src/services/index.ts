// Servisler Toplu Dışa Aktarım
// Tüm servisleri tek bir yerden dışa aktar

// Supabase servisleri
export { default as profileService } from './profileService';
export { default as matchService } from './matchService';
export { default as chatService } from './chatService';
export { default as notificationService } from './notificationService';
export { default as storyService } from './storyService';
export type { Story, StoryView } from './storyService';

// Mega Features Servisleri (28 Aralık 2025)
export { default as undoService } from './undoService';
export { default as gamificationService, TASK_TYPE_LABELS } from './gamificationService';
export type { DailyTask, Badge, UserBadge, UserProgress } from './gamificationService';
export { default as eventService } from './eventService';
export type { Event, EventParticipant } from './eventService';
export { default as groupChatService } from './groupChatService';
export type { GroupChat, GroupMember, GroupMessage } from './groupChatService';
export { default as boostService } from './boostService';
export type { BoostStatus } from './boostService';
export { default as promptService } from './promptService';
export type { ProfilePrompt, UserPromptAnswer } from './promptService';
export { default as deepLinkService } from './deepLinkService';
export { default as videoCallService } from './videoCallService';
export type { CallSession } from './videoCallService';
export { default as verificationService, POSE_INSTRUCTIONS } from './verificationService';
export type { VerificationRequest } from './verificationService';
export { default as spotifyService } from './spotifyService';
export type { SpotifyArtist, SpotifyTrack, SpotifyProfile } from './spotifyService';
export { default as shareService } from './shareService';
export type { ShareResult } from './shareService';

// Supabase istemci ve kimlik doğrulama
export { supabase, auth } from '../lib/supabase';

// Veritabanı tipleri
export type {
  Profile,
  ProfileInsert,
  ProfileUpdate,
  Swipe,
  SwipeInsert,
  Match,
  MatchInsert,
  Message,
  MessageInsert,
  Notification,
  NotificationInsert,
} from '../lib/database.types';

// Legacy exports (eski API yapısı için)
export { API_BASE_URL, API_ENDPOINTS } from './api';
export { authService, default as authServiceDefault } from './authService';
