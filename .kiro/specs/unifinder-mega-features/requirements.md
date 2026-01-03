# Requirements Document - UniFinder Mega Features

## Introduction

UniFinder uygulamasına kapsamlı yeni özellikler eklenmesi. Bu döküman, uygulamayı Tinder/Bumble/Hinge seviyesine çıkaracak 12 ana özelliği kapsar.

## Glossary

- **Swipe_System**: Kullanıcıların profilleri beğenme/geçme sistemi
- **Gamification_Engine**: Oyunlaştırma motoru (görevler, rozetler, seviyeler)
- **Event_System**: Etkinlik oluşturma ve katılım sistemi
- **Group_Chat_System**: Grup sohbet yönetim sistemi
- **Boost_System**: Profil öne çıkarma sistemi
- **Deep_Link_Handler**: Uygulama içi link yönetimi
- **Video_Call_System**: Görüntülü arama sistemi (WebRTC)
- **Verification_System**: Fotoğraf doğrulama sistemi
- **Music_Integration**: Spotify müzik entegrasyonu
- **Filter_System**: Gelişmiş filtreleme sistemi
- **Profile_Preview**: Profil önizleme sistemi
- **QA_System**: Soru-cevap/anket sistemi

---

## Requirements

### Requirement 1: Swipe Geri Alma (Undo)

**User Story:** As a user, I want to undo my last swipe, so that I can reconsider profiles I accidentally passed.

#### Acceptance Criteria

1. WHEN a user swipes left (nope) on a profile, THE Swipe_System SHALL store the last swiped profile in memory
2. WHEN a user taps the undo button within 5 seconds, THE Swipe_System SHALL restore the previous profile to the card stack
3. WHILE the user is a free member, THE Swipe_System SHALL limit undo to 1 per day
4. WHILE the user is a premium member, THE Swipe_System SHALL allow unlimited undo actions
5. WHEN undo is used, THE Swipe_System SHALL animate the card returning from the left side
6. IF no previous swipe exists, THEN THE Swipe_System SHALL disable the undo button

---

### Requirement 2: Günlük Görevler Sistemi

**User Story:** As a user, I want to complete daily tasks, so that I can earn rewards and stay engaged with the app.

#### Acceptance Criteria

1. THE Gamification_Engine SHALL generate 3-5 daily tasks at midnight (local time)
2. WHEN a user completes a task, THE Gamification_Engine SHALL award XP points
3. WHEN all daily tasks are completed, THE Gamification_Engine SHALL award a bonus reward
4. THE Gamification_Engine SHALL display task progress in a dedicated screen
5. WHEN a new day starts, THE Gamification_Engine SHALL reset incomplete tasks
6. THE Gamification_Engine SHALL include task types: swipe_count, message_sent, profile_view, story_post

---

### Requirement 3: Rozet ve Başarım Sistemi

**User Story:** As a user, I want to earn badges for achievements, so that I can showcase my activity on my profile.

#### Acceptance Criteria

1. THE Gamification_Engine SHALL track user achievements across categories
2. WHEN a user reaches an achievement milestone, THE Gamification_Engine SHALL award a badge
3. THE Gamification_Engine SHALL display earned badges on user profiles
4. WHEN a badge is earned, THE Gamification_Engine SHALL show a celebration animation
5. THE Gamification_Engine SHALL include badges: first_match, 10_matches, 100_likes, verified_student, story_master, chat_champion
6. WHEN viewing another user's profile, THE Profile_System SHALL display their top 3 badges

---

### Requirement 4: Gelişmiş Filtreler

**User Story:** As a user, I want advanced filtering options, so that I can find more compatible matches.

#### Acceptance Criteria

1. THE Filter_System SHALL allow filtering by zodiac sign (burç)
2. THE Filter_System SHALL allow filtering by height range
3. THE Filter_System SHALL allow filtering by smoking preference
4. THE Filter_System SHALL allow filtering by drinking preference
5. THE Filter_System SHALL allow filtering by relationship goal (serious, casual, friendship)
6. THE Filter_System SHALL persist filter preferences across sessions
7. WHILE the user is a free member, THE Filter_System SHALL limit to 3 active filters
8. WHILE the user is a premium member, THE Filter_System SHALL allow unlimited filters

---

### Requirement 5: Profil Önizleme

**User Story:** As a user, I want to preview how my profile looks to others, so that I can optimize my presentation.

#### Acceptance Criteria

1. WHEN a user taps "Preview Profile", THE Profile_Preview SHALL display their profile as a swipe card
2. THE Profile_Preview SHALL show exactly what other users see
3. THE Profile_Preview SHALL allow swiping through own photos
4. THE Profile_Preview SHALL display all visible information (bio, interests, badges)
5. WHEN in preview mode, THE Profile_Preview SHALL show tips for profile improvement

---

### Requirement 6: Anket/Soru-Cevap Sistemi (Hinge Tarzı)

**User Story:** As a user, I want to answer fun prompts on my profile, so that I can express my personality and start conversations.

#### Acceptance Criteria

1. THE QA_System SHALL provide 20+ pre-defined prompts/questions
2. WHEN editing profile, THE QA_System SHALL allow selecting up to 3 prompts
3. THE QA_System SHALL display prompt answers on the profile card
4. WHEN viewing a profile, THE QA_System SHALL allow liking specific answers
5. THE QA_System SHALL include prompts like: "En sevdiğim film", "Hayalimdeki tatil", "Beni güldüren şey"
6. WHEN a prompt answer is liked, THE Notification_System SHALL notify the profile owner

---

### Requirement 7: Etkinlik Oluşturma Sistemi

**User Story:** As a user, I want to create and join campus events, so that I can meet people with similar interests in person.

#### Acceptance Criteria

1. THE Event_System SHALL allow creating events with title, description, date, location, and capacity
2. THE Event_System SHALL display events on a dedicated screen
3. WHEN a user joins an event, THE Event_System SHALL add them to the participant list
4. THE Event_System SHALL send reminders 24 hours and 1 hour before events
5. THE Event_System SHALL allow filtering events by category (party, study, sports, social)
6. WHEN an event is full, THE Event_System SHALL show a waitlist option
7. THE Event_System SHALL allow event creators to manage participants

---

### Requirement 8: Grup Sohbetleri

**User Story:** As a user, I want to participate in group chats, so that I can connect with multiple people who share my interests.

#### Acceptance Criteria

1. THE Group_Chat_System SHALL allow creating groups with up to 50 members
2. THE Group_Chat_System SHALL require a group name and optional description
3. WHEN a message is sent, THE Group_Chat_System SHALL deliver to all members in real-time
4. THE Group_Chat_System SHALL support text, image, and GIF messages
5. THE Group_Chat_System SHALL allow group admins to add/remove members
6. THE Group_Chat_System SHALL show member list and online status
7. WHEN a user leaves a group, THE Group_Chat_System SHALL notify remaining members

---

### Requirement 9: Boost/Öne Çıkarma Sistemi

**User Story:** As a user, I want to boost my profile visibility, so that I can get more matches.

#### Acceptance Criteria

1. WHEN a user activates boost, THE Boost_System SHALL prioritize their profile in the swipe stack for 30 minutes
2. THE Boost_System SHALL show boost statistics (views, likes received during boost)
3. WHILE the user is a free member, THE Boost_System SHALL provide 1 free boost per month
4. WHILE the user is a premium member, THE Boost_System SHALL provide 5 boosts per month
5. THE Boost_System SHALL allow purchasing additional boosts
6. WHEN boost is active, THE Boost_System SHALL display a visual indicator on the profile

---

### Requirement 10: Deep Linking

**User Story:** As a user, I want to share profile and chat links, so that I can invite friends to the app.

#### Acceptance Criteria

1. THE Deep_Link_Handler SHALL generate shareable profile links (unifinder://profile/{userId})
2. THE Deep_Link_Handler SHALL generate shareable event links (unifinder://event/{eventId})
3. WHEN a deep link is opened, THE Deep_Link_Handler SHALL navigate to the correct screen
4. IF the app is not installed, THEN THE Deep_Link_Handler SHALL redirect to app store
5. THE Deep_Link_Handler SHALL support universal links for web fallback
6. WHEN sharing a profile, THE Deep_Link_Handler SHALL generate a preview card for social media

---

### Requirement 11: Sesli/Video Arama

**User Story:** As a user, I want to make video calls with my matches, so that I can connect more personally before meeting.

#### Acceptance Criteria

1. WHEN both users are matched, THE Video_Call_System SHALL enable the call button
2. THE Video_Call_System SHALL support 1-on-1 video calls using WebRTC
3. WHEN a call is initiated, THE Video_Call_System SHALL send a push notification to the recipient
4. THE Video_Call_System SHALL allow muting audio and disabling video during calls
5. THE Video_Call_System SHALL display call duration
6. IF a call is missed, THEN THE Video_Call_System SHALL show a missed call notification
7. THE Video_Call_System SHALL support voice-only calls as an option

---

### Requirement 12: Fotoğraf Doğrulama

**User Story:** As a user, I want to verify my photos, so that others can trust my profile is authentic.

#### Acceptance Criteria

1. THE Verification_System SHALL prompt users to take a selfie matching a specific pose
2. THE Verification_System SHALL compare the selfie with profile photos using face recognition
3. WHEN verification succeeds, THE Verification_System SHALL add a verified badge to the profile
4. IF verification fails, THEN THE Verification_System SHALL allow retry with a different pose
5. THE Verification_System SHALL store verification status securely
6. WHEN viewing profiles, THE Verification_System SHALL prominently display verified badges

---

### Requirement 13: Spotify Entegrasyonu

**User Story:** As a user, I want to connect my Spotify account, so that I can show my music taste on my profile.

#### Acceptance Criteria

1. THE Music_Integration SHALL allow connecting Spotify account via OAuth
2. WHEN connected, THE Music_Integration SHALL display top 5 artists on profile
3. THE Music_Integration SHALL show currently playing song (if enabled)
4. THE Music_Integration SHALL calculate music compatibility percentage between users
5. WHEN viewing a profile, THE Music_Integration SHALL highlight shared artists
6. THE Music_Integration SHALL allow disconnecting Spotify at any time

---

## Summary

Bu döküman 13 ana gereksinimi kapsar:
1. Swipe Geri Alma (Undo)
2. Günlük Görevler
3. Rozet/Başarım Sistemi
4. Gelişmiş Filtreler
5. Profil Önizleme
6. Anket/Soru-Cevap
7. Etkinlik Oluşturma
8. Grup Sohbetleri
9. Boost/Öne Çıkarma
10. Deep Linking
11. Sesli/Video Arama
12. Fotoğraf Doğrulama
13. Spotify Entegrasyonu

Toplam: ~60 acceptance criteria
