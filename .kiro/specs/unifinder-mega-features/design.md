# Design Document - UniFinder Mega Features

## Overview

Bu tasarım dökümanı, UniFinder uygulamasına eklenecek 13 yeni özelliğin teknik mimarisini tanımlar. Özellikler modüler yapıda tasarlanmış olup, mevcut Supabase altyapısı üzerine inşa edilecektir.

## Architecture

### Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native App                          │
├─────────────────────────────────────────────────────────────┤
│  Screens    │  Components  │  Contexts   │  Services        │
├─────────────────────────────────────────────────────────────┤
│                    Navigation Layer                          │
├─────────────────────────────────────────────────────────────┤
│                    Supabase Client                           │
├─────────────────────────────────────────────────────────────┤
│  Auth  │  Database  │  Storage  │  Realtime  │  Edge Func   │
└─────────────────────────────────────────────────────────────┘
```

### Yeni Modüller

1. **GamificationModule** - Görevler, rozetler, XP sistemi
2. **EventModule** - Etkinlik yönetimi
3. **GroupChatModule** - Grup sohbetleri
4. **BoostModule** - Profil öne çıkarma
5. **DeepLinkModule** - Uygulama içi linkler
6. **VideoCallModule** - WebRTC görüntülü arama
7. **VerificationModule** - Fotoğraf doğrulama
8. **MusicModule** - Spotify entegrasyonu


## Components and Interfaces

### 1. Swipe Undo System

```typescript
// src/services/undoService.ts
interface UndoState {
  lastSwipedProfile: Profile | null;
  swipeTimestamp: number | null;
  undoCountToday: number;
  lastUndoDate: string;
}

interface UndoService {
  storeSwipe(profile: Profile): void;
  canUndo(isPremium: boolean): boolean;
  performUndo(): Profile | null;
  resetDailyCount(): void;
}
```

### 2. Gamification System

```typescript
// src/services/gamificationService.ts
interface DailyTask {
  id: string;
  type: 'swipe_count' | 'message_sent' | 'profile_view' | 'story_post';
  target: number;
  current: number;
  xpReward: number;
  completed: boolean;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'social' | 'activity' | 'achievement';
  earnedAt?: string;
}

interface UserProgress {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  totalXP: number;
  badges: Badge[];
  dailyTasks: DailyTask[];
  streak: number;
}

interface GamificationService {
  getDailyTasks(userId: string): Promise<DailyTask[]>;
  updateTaskProgress(userId: string, taskType: string, increment: number): Promise<void>;
  awardXP(userId: string, amount: number): Promise<void>;
  checkBadgeEligibility(userId: string): Promise<Badge[]>;
  getUserProgress(userId: string): Promise<UserProgress>;
}
```

### 3. Advanced Filters

```typescript
// src/types/filters.ts
interface AdvancedFilters {
  // Mevcut filtreler
  ageMin: number;
  ageMax: number;
  distance: number;
  verifiedOnly: boolean;
  
  // Yeni filtreler
  zodiacSign?: ZodiacSign;
  heightMin?: number;
  heightMax?: number;
  smokingPreference?: 'yes' | 'no' | 'sometimes' | 'any';
  drinkingPreference?: 'yes' | 'no' | 'socially' | 'any';
  relationshipGoal?: 'serious' | 'casual' | 'friendship' | 'any';
}

type ZodiacSign = 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo' | 
                  'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';
```

### 4. Q&A Prompts System

```typescript
// src/services/promptService.ts
interface ProfilePrompt {
  id: string;
  question: string;
  category: 'personality' | 'lifestyle' | 'fun' | 'dating';
}

interface UserPromptAnswer {
  promptId: string;
  answer: string;
  likes: number;
}

interface PromptService {
  getAvailablePrompts(): Promise<ProfilePrompt[]>;
  saveUserAnswers(userId: string, answers: UserPromptAnswer[]): Promise<void>;
  getUserAnswers(userId: string): Promise<UserPromptAnswer[]>;
  likeAnswer(userId: string, targetUserId: string, promptId: string): Promise<void>;
}
```


### 5. Event System

```typescript
// src/services/eventService.ts
interface Event {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  category: 'party' | 'study' | 'sports' | 'social' | 'other';
  date: string;
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  capacity: number;
  participantCount: number;
  imageUrl?: string;
  isPublic: boolean;
  createdAt: string;
}

interface EventParticipant {
  eventId: string;
  userId: string;
  status: 'going' | 'interested' | 'waitlist';
  joinedAt: string;
}

interface EventService {
  createEvent(event: Omit<Event, 'id' | 'createdAt'>): Promise<Event>;
  getEvents(filters?: EventFilters): Promise<Event[]>;
  joinEvent(eventId: string, userId: string): Promise<void>;
  leaveEvent(eventId: string, userId: string): Promise<void>;
  getParticipants(eventId: string): Promise<EventParticipant[]>;
}
```

### 6. Group Chat System

```typescript
// src/services/groupChatService.ts
interface GroupChat {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  creatorId: string;
  memberCount: number;
  maxMembers: number; // default 50
  createdAt: string;
  lastMessageAt?: string;
}

interface GroupMember {
  groupId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
  profile?: Profile;
}

interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'gif';
  createdAt: string;
  sender?: Profile;
}

interface GroupChatService {
  createGroup(data: CreateGroupData): Promise<GroupChat>;
  getMyGroups(userId: string): Promise<GroupChat[]>;
  getGroupMessages(groupId: string, limit?: number): Promise<GroupMessage[]>;
  sendGroupMessage(groupId: string, message: SendMessageData): Promise<GroupMessage>;
  addMember(groupId: string, userId: string): Promise<void>;
  removeMember(groupId: string, userId: string): Promise<void>;
  leaveGroup(groupId: string, userId: string): Promise<void>;
  subscribeToGroupMessages(groupId: string, callback: (msg: GroupMessage) => void): Subscription;
}
```

### 7. Boost System

```typescript
// src/services/boostService.ts
interface BoostStatus {
  isActive: boolean;
  expiresAt?: string;
  remainingBoosts: number;
  monthlyBoosts: number;
  stats?: {
    viewsDuringBoost: number;
    likesDuringBoost: number;
  };
}

interface BoostService {
  getBoostStatus(userId: string): Promise<BoostStatus>;
  activateBoost(userId: string): Promise<BoostStatus>;
  getRemainingBoosts(userId: string, isPremium: boolean): Promise<number>;
  purchaseBoosts(userId: string, quantity: number): Promise<void>;
  getBoostedProfiles(): Promise<Profile[]>;
}
```


### 8. Deep Linking

```typescript
// src/services/deepLinkService.ts
interface DeepLinkConfig {
  scheme: 'unifinder';
  host: 'app.unifinder.com';
}

type DeepLinkType = 'profile' | 'event' | 'group' | 'chat';

interface DeepLinkService {
  generateLink(type: DeepLinkType, id: string): string;
  parseLink(url: string): { type: DeepLinkType; id: string } | null;
  handleIncomingLink(url: string): void;
  generateShareCard(type: DeepLinkType, data: any): ShareCardData;
}
```

### 9. Video Call System (WebRTC)

```typescript
// src/services/videoCallService.ts
interface CallSession {
  id: string;
  callerId: string;
  receiverId: string;
  status: 'ringing' | 'connected' | 'ended' | 'missed';
  type: 'video' | 'audio';
  startedAt?: string;
  endedAt?: string;
  duration?: number;
}

interface VideoCallService {
  initiateCall(receiverId: string, type: 'video' | 'audio'): Promise<CallSession>;
  acceptCall(sessionId: string): Promise<void>;
  rejectCall(sessionId: string): Promise<void>;
  endCall(sessionId: string): Promise<void>;
  toggleMute(): void;
  toggleVideo(): void;
  getCallHistory(userId: string): Promise<CallSession[]>;
}
```

### 10. Photo Verification System

```typescript
// src/services/verificationService.ts
interface VerificationRequest {
  id: string;
  userId: string;
  selfieUrl: string;
  poseType: 'smile' | 'thumbs_up' | 'peace_sign';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
}

interface VerificationService {
  requestVerification(userId: string, selfieUri: string, pose: string): Promise<VerificationRequest>;
  getVerificationStatus(userId: string): Promise<VerificationRequest | null>;
  retryVerification(userId: string): Promise<void>;
}
```

### 11. Spotify Integration

```typescript
// src/services/spotifyService.ts
interface SpotifyProfile {
  connected: boolean;
  displayName?: string;
  topArtists: SpotifyArtist[];
  currentlyPlaying?: SpotifyTrack;
}

interface SpotifyArtist {
  id: string;
  name: string;
  imageUrl: string;
  genres: string[];
}

interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
}

interface SpotifyService {
  connect(): Promise<void>;
  disconnect(userId: string): Promise<void>;
  getProfile(userId: string): Promise<SpotifyProfile>;
  getTopArtists(userId: string): Promise<SpotifyArtist[]>;
  getCurrentlyPlaying(userId: string): Promise<SpotifyTrack | null>;
  calculateCompatibility(userId1: string, userId2: string): Promise<number>;
}
```


## Data Models

### Yeni Veritabanı Tabloları

```sql
-- 1. Günlük Görevler
CREATE TABLE daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL, -- 'swipe_count', 'message_sent', 'profile_view', 'story_post'
  target INTEGER NOT NULL,
  current INTEGER DEFAULT 0,
  xp_reward INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Rozetler
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  category TEXT NOT NULL, -- 'social', 'activity', 'achievement'
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL
);

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- 3. Kullanıcı XP ve Seviye
CREATE TABLE user_progress (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  current_xp INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_active_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Profil Soruları (Prompts)
CREATE TABLE profile_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  category TEXT NOT NULL, -- 'personality', 'lifestyle', 'fun', 'dating'
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE user_prompt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES profile_prompts(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);

CREATE TABLE prompt_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES user_prompt_answers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(liker_id, answer_id)
);
```


```sql
-- 5. Etkinlikler
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'party', 'study', 'sports', 'social', 'other'
  event_date TIMESTAMPTZ NOT NULL,
  location_name TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  capacity INTEGER NOT NULL,
  image_url TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- 'going', 'interested', 'waitlist'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- 6. Grup Sohbetleri
CREATE TABLE group_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  max_members INTEGER DEFAULT 50,
  member_count INTEGER DEFAULT 1,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'admin', 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES group_chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text', 'image', 'gif'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Boost Sistemi
CREATE TABLE boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0
);

CREATE TABLE user_boost_inventory (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  remaining_boosts INTEGER DEFAULT 0,
  monthly_boosts INTEGER DEFAULT 0,
  last_reset_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```


```sql
-- 8. Video Aramalar
CREATE TABLE call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  call_type TEXT NOT NULL, -- 'video', 'audio'
  status TEXT NOT NULL, -- 'ringing', 'connected', 'ended', 'missed', 'rejected'
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration INTEGER, -- seconds
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Fotoğraf Doğrulama
CREATE TABLE verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  selfie_url TEXT NOT NULL,
  pose_type TEXT NOT NULL, -- 'smile', 'thumbs_up', 'peace_sign'
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- 10. Spotify Entegrasyonu
CREATE TABLE spotify_connections (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  spotify_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  display_name TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_top_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  artist_id TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  image_url TEXT,
  genres TEXT[],
  rank INTEGER NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Undo Geçmişi
CREATE TABLE undo_history (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  undo_count_today INTEGER DEFAULT 0,
  last_undo_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Gelişmiş Profil Bilgileri
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zodiac_sign TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height INTEGER; -- cm
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS smoking_preference TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS drinking_preference TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS relationship_goal TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_photo_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS spotify_connected BOOLEAN DEFAULT FALSE;
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Undo stores last swipe correctly
*For any* swipe action (like, nope, superlike), the undo system should store the swiped profile and timestamp correctly, allowing retrieval within the timeout window.
**Validates: Requirements 1.1, 1.2**

### Property 2: Free user undo limit
*For any* free user, the undo count per day should never exceed 1, regardless of how many times they attempt to undo.
**Validates: Requirements 1.3**

### Property 3: Premium user unlimited undo
*For any* premium user, undo actions should always succeed (when a previous swipe exists), with no daily limit.
**Validates: Requirements 1.4**

### Property 4: Daily task generation bounds
*For any* user at midnight, the gamification engine should generate between 3 and 5 daily tasks (inclusive).
**Validates: Requirements 2.1**

### Property 5: Task completion awards XP
*For any* completed task, the user's XP should increase by exactly the task's xpReward amount.
**Validates: Requirements 2.2**

### Property 6: All tasks completed bonus
*For any* user who completes all daily tasks, a bonus reward should be awarded in addition to individual task rewards.
**Validates: Requirements 2.3**

### Property 7: Daily task reset
*For any* user, when a new day starts (midnight local time), all incomplete tasks from the previous day should be removed and new tasks generated.
**Validates: Requirements 2.5**

### Property 8: Badge milestone trigger
*For any* user reaching an achievement milestone (e.g., 10 matches), the corresponding badge should be awarded exactly once.
**Validates: Requirements 3.2**

### Property 9: Top 3 badges display
*For any* user profile view, at most 3 badges should be displayed, prioritized by rarity or recency.
**Validates: Requirements 3.6**

### Property 10: Filter persistence round-trip
*For any* set of filter preferences saved by a user, loading those preferences in a new session should return identical values.
**Validates: Requirements 4.6**


### Property 11: Free user filter limit
*For any* free user, the number of active advanced filters should never exceed 3.
**Validates: Requirements 4.7**

### Property 12: Premium user unlimited filters
*For any* premium user, there should be no limit on the number of active filters.
**Validates: Requirements 4.8**

### Property 13: Prompt selection limit
*For any* user editing their profile, the number of selected prompts should never exceed 3.
**Validates: Requirements 6.2**

### Property 14: Event creation validation
*For any* event creation request, all required fields (title, description, date, location, capacity) must be present and valid.
**Validates: Requirements 7.1**

### Property 15: Event capacity enforcement
*For any* event at capacity, new join requests should be placed on waitlist, not added as participants.
**Validates: Requirements 7.6**

### Property 16: Group member limit
*For any* group chat, the member count should never exceed the maxMembers limit (default 50).
**Validates: Requirements 8.1**

### Property 17: Group message delivery
*For any* message sent to a group, all online members should receive the message via realtime subscription.
**Validates: Requirements 8.4**

### Property 18: Boost duration
*For any* activated boost, the boost should remain active for exactly 30 minutes from activation time.
**Validates: Requirements 9.1**

### Property 19: Free user monthly boost limit
*For any* free user, the number of boosts per month should not exceed 1.
**Validates: Requirements 9.3**

### Property 20: Premium user monthly boost limit
*For any* premium user, the number of boosts per month should not exceed 5 (unless purchased).
**Validates: Requirements 9.4**

### Property 21: Deep link round-trip
*For any* generated deep link, parsing that link should return the original type and ID.
**Validates: Requirements 10.1, 10.3**

---

## Error Handling

### Undo System Errors
- `NO_PREVIOUS_SWIPE`: Geri alınacak swipe yok
- `UNDO_LIMIT_REACHED`: Günlük undo limiti doldu (free users)
- `UNDO_TIMEOUT`: 5 saniyelik süre doldu

### Gamification Errors
- `TASK_ALREADY_COMPLETED`: Görev zaten tamamlanmış
- `INVALID_TASK_TYPE`: Geçersiz görev tipi
- `BADGE_ALREADY_EARNED`: Rozet zaten kazanılmış

### Event System Errors
- `EVENT_FULL`: Etkinlik kapasitesi dolu
- `EVENT_EXPIRED`: Etkinlik tarihi geçmiş
- `NOT_EVENT_CREATOR`: Etkinlik sahibi değil

### Group Chat Errors
- `GROUP_FULL`: Grup kapasitesi dolu
- `NOT_GROUP_MEMBER`: Grup üyesi değil
- `NOT_GROUP_ADMIN`: Grup yöneticisi değil

### Video Call Errors
- `USER_OFFLINE`: Kullanıcı çevrimdışı
- `CALL_REJECTED`: Arama reddedildi
- `WEBRTC_ERROR`: WebRTC bağlantı hatası

### Verification Errors
- `FACE_NOT_DETECTED`: Yüz algılanamadı
- `POSE_MISMATCH`: Poz eşleşmedi
- `VERIFICATION_PENDING`: Doğrulama beklemede

### Spotify Errors
- `SPOTIFY_AUTH_FAILED`: Spotify yetkilendirme başarısız
- `SPOTIFY_NOT_CONNECTED`: Spotify bağlı değil
- `TOKEN_EXPIRED`: Token süresi dolmuş


## Testing Strategy

### Unit Tests
- Her servis fonksiyonu için birim testleri
- Edge case'ler (boş liste, limit aşımı, geçersiz input)
- Mock Supabase client ile izole testler

### Property-Based Tests
- **fast-check** kütüphanesi kullanılacak
- Her property için minimum 100 iterasyon
- Rastgele input üretimi ile kapsamlı test

### Integration Tests
- Supabase ile gerçek veritabanı testleri
- Realtime subscription testleri
- WebRTC bağlantı testleri (mock peer)

### E2E Tests
- Detox ile mobil UI testleri
- Kritik kullanıcı akışları (undo, boost, event join)

---

## New Screens Required

### Gamification
- `DailyTasksScreen.tsx` - Günlük görevler listesi
- `BadgesScreen.tsx` - Tüm rozetler ve ilerleme
- `LeaderboardScreen.tsx` - Haftalık liderlik tablosu

### Events
- `EventsScreen.tsx` - Etkinlik listesi
- `EventDetailScreen.tsx` - Etkinlik detayı
- `CreateEventScreen.tsx` - Etkinlik oluşturma

### Groups
- `GroupListScreen.tsx` - Grup listesi
- `GroupChatScreen.tsx` - Grup sohbet ekranı
- `CreateGroupScreen.tsx` - Grup oluşturma
- `GroupMembersScreen.tsx` - Üye listesi

### Profile Enhancements
- `ProfilePreviewScreen.tsx` - Profil önizleme
- `EditPromptsScreen.tsx` - Soru-cevap düzenleme
- `AdvancedFiltersScreen.tsx` - Gelişmiş filtreler

### Boost
- `BoostScreen.tsx` - Boost aktivasyonu ve istatistikler

### Video Call
- `VideoCallScreen.tsx` - Görüntülü arama ekranı
- `IncomingCallScreen.tsx` - Gelen arama bildirimi

### Verification
- `PhotoVerificationScreen.tsx` - Fotoğraf doğrulama

### Spotify
- `SpotifyConnectScreen.tsx` - Spotify bağlantısı
- `MusicProfileSection.tsx` - Profilde müzik bölümü

---

## Navigation Updates

```typescript
// Yeni ekranlar için navigation types güncellemesi
export type RootStackParamList = {
  // ... mevcut ekranlar ...
  
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
  GroupChat: { groupId: string };
  CreateGroup: undefined;
  GroupMembers: { groupId: string };
  
  // Profile
  ProfilePreview: undefined;
  EditPrompts: undefined;
  AdvancedFilters: undefined;
  
  // Boost
  Boost: undefined;
  
  // Video Call
  VideoCall: { matchId: string; callType: 'video' | 'audio' };
  IncomingCall: { sessionId: string; callerId: string; callerName: string };
  
  // Verification
  PhotoVerification: undefined;
  
  // Spotify
  SpotifyConnect: undefined;
};
```
