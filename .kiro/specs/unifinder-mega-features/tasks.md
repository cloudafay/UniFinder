# Implementation Plan: UniFinder Mega Features

## Overview

Bu plan, UniFinder uygulamasına 13 yeni özellik eklemek için gereken tüm görevleri içerir. Görevler öncelik sırasına göre düzenlenmiştir.

## Tasks

### Faz 1: Veritabanı Altyapısı

- [x] 1. Veritabanı tablolarını oluştur
  - [x] 1.1 Gamification tabloları (daily_tasks, badges, user_badges, user_progress)
  - [x] 1.2 Event tabloları (events, event_participants)
  - [x] 1.3 Group chat tabloları (group_chats, group_members, group_messages)
  - [x] 1.4 Boost tabloları (boosts, user_boost_inventory)
  - [x] 1.5 Video call tablosu (call_sessions)
  - [x] 1.6 Verification tablosu (verification_requests)
  - [x] 1.7 Spotify tabloları (spotify_connections, user_top_artists)
  - [x] 1.8 Undo tablosu (undo_history)
  - [x] 1.9 Prompt tabloları (profile_prompts, user_prompt_answers, prompt_likes)
  - [x] 1.10 Profiles tablosuna yeni kolonlar ekle
  - _Requirements: Tüm özellikler için veritabanı altyapısı_

- [x] 2. RLS politikalarını oluştur
  - [x] 2.1 Tüm yeni tablolar için SELECT/INSERT/UPDATE/DELETE politikaları
  - _Requirements: Güvenlik_

---

### Faz 2: Kolay Özellikler (Swipe Undo, Filtreler, Prompts)

- [x] 3. Swipe Undo Sistemi
  - [x] 3.1 undoService.ts oluştur
  - [x] 3.2 DiscoverScreen'e undo butonu ekle
  - [x] 3.3 Undo animasyonu ekle
  - [x] 3.4 Premium/Free limit kontrolü
  - _Requirements: 1.1-1.6_

- [x] 4. Gelişmiş Filtreler
  - [x] 4.1 AdvancedFilters tipi güncelle (FilterContext)
  - [x] 4.2 AdvancedFiltersScreen.tsx oluştur
  - [x] 4.3 FilterSearchScreen'i güncelle
  - [x] 4.4 Premium/Free limit kontrolü
  - _Requirements: 4.1-4.8_

- [x] 5. Profil Önizleme
  - [x] 5.1 ProfilePreviewScreen.tsx oluştur
  - [x] 5.2 UserProfileScreen'e önizleme butonu ekle
  - _Requirements: 5.1-5.5_

- [x] 6. Anket/Soru-Cevap Sistemi
  - [x] 6.1 promptService.ts oluştur
  - [x] 6.2 EditPromptsScreen.tsx oluştur
  - [x] 6.3 Profil kartına prompt cevapları ekle
  - [x] 6.4 Prompt beğenme özelliği
  - _Requirements: 6.1-6.6_


---

### Faz 3: Gamification Sistemi

- [x] 7. Günlük Görevler
  - [x] 7.1 gamificationService.ts oluştur
  - [x] 7.2 DailyTasksScreen.tsx oluştur
  - [x] 7.3 Görev tipleri implementasyonu
  - [x] 7.4 XP ödül sistemi
  - [ ] 7.5 Gece yarısı reset mekanizması
  - _Requirements: 2.1-2.6_

- [x] 8. Rozet Sistemi
  - [x] 8.1 Badge tanımları ve seed data
  - [x] 8.2 BadgesScreen.tsx oluştur
  - [x] 8.3 Badge kazanma kontrolü
  - [x] 8.4 Profilde badge gösterimi
  - [x] 8.5 Kutlama animasyonu
  - _Requirements: 3.1-3.6_

- [x] 9. Seviye ve XP Sistemi
  - [x] 9.1 Seviye hesaplama fonksiyonları
  - [x] 9.2 XP progress bar komponenti
  - [x] 9.3 Seviye atlama bildirimi
  - _Requirements: 2.2, 2.3_

---

### Faz 4: Etkinlik Sistemi

- [x] 10. Event Servisi
  - [x] 10.1 eventService.ts oluştur
  - [x] 10.2 CRUD operasyonları
  - [x] 10.3 Katılımcı yönetimi
  - _Requirements: 7.1-7.7_

- [x] 11. Event Ekranları
  - [x] 11.1 EventsScreen.tsx (liste)
  - [x] 11.2 EventDetailScreen.tsx
  - [x] 11.3 CreateEventScreen.tsx
  - [x] 11.4 Event filtreleme (kategori, tarih)
  - _Requirements: 7.2, 7.5_

- [ ] 12. Event Bildirimleri
  - [ ] 12.1 24 saat öncesi hatırlatma
  - [ ] 12.2 1 saat öncesi hatırlatma
  - _Requirements: 7.4_

---

### Faz 5: Grup Sohbetleri

- [x] 13. Group Chat Servisi
  - [x] 13.1 groupChatService.ts oluştur
  - [x] 13.2 Grup CRUD operasyonları
  - [x] 13.3 Üye yönetimi
  - [x] 13.4 Realtime mesajlaşma
  - _Requirements: 8.1-8.7_

- [x] 14. Group Chat Ekranları
  - [x] 14.1 GroupListScreen.tsx
  - [x] 14.2 GroupChatScreen.tsx
  - [x] 14.3 CreateGroupScreen.tsx
  - [x] 14.4 GroupMembersScreen.tsx
  - _Requirements: 8.2, 8.6_

---

### Faz 6: Boost Sistemi

- [x] 15. Boost Servisi
  - [x] 15.1 boostService.ts oluştur
  - [x] 15.2 Boost aktivasyonu
  - [x] 15.3 30 dakika zamanlayıcı
  - [x] 15.4 İstatistik takibi
  - _Requirements: 9.1-9.6_

- [x] 16. Boost Ekranı
  - [x] 16.1 BoostScreen.tsx oluştur
  - [x] 16.2 Boost istatistikleri UI
  - [ ] 16.3 Boost satın alma UI
  - _Requirements: 9.2, 9.5_

- [x] 17. Discover Entegrasyonu
  - [x] 17.1 Boosted profilleri önceliklendir
  - [x] 17.2 Boost badge gösterimi
  - _Requirements: 9.1, 9.6_


---

### Faz 7: Deep Linking

- [x] 18. Deep Link Servisi
  - [x] 18.1 deepLinkService.ts oluştur
  - [x] 18.2 Link oluşturma fonksiyonları
  - [x] 18.3 Link parse etme
  - _Requirements: 10.1-10.3_

- [x] 19. Deep Link Entegrasyonu
  - [x] 19.1 App.tsx'e link handler ekle
  - [x] 19.2 Profil paylaşım butonu
  - [x] 19.3 Event paylaşım butonu
  - [ ] 19.4 Universal links konfigürasyonu
  - _Requirements: 10.4-10.6_

---

### Faz 8: Video/Sesli Arama (WebRTC)

- [ ] 20. WebRTC Altyapısı
  - [ ] 20.1 react-native-webrtc kurulumu
  - [ ] 20.2 Signaling server (Supabase Realtime)
  - [ ] 20.3 STUN/TURN server konfigürasyonu
  - _Requirements: 11.2_

- [x] 21. Video Call Servisi
  - [x] 21.1 videoCallService.ts oluştur
  - [x] 21.2 Arama başlatma/kabul/reddetme
  - [x] 21.3 Mute/video toggle
  - _Requirements: 11.1-11.7_

- [x] 22. Video Call Ekranları
  - [x] 22.1 VideoCallScreen.tsx
  - [x] 22.2 IncomingCallScreen.tsx
  - [x] 22.3 Arama geçmişi
  - _Requirements: 11.3, 11.6_

- [x] 23. Chat Entegrasyonu
  - [x] 23.1 ChatScreen'e arama butonu ekle
  - [ ] 23.2 Cevapsız arama bildirimi
  - _Requirements: 11.1, 11.6_

---

### Faz 9: Fotoğraf Doğrulama

- [x] 24. Verification Servisi
  - [x] 24.1 verificationService.ts oluştur
  - [x] 24.2 Selfie yükleme
  - [x] 24.3 Poz kontrolü (basit versiyon)
  - _Requirements: 12.1-12.6_

- [x] 25. Verification Ekranı
  - [x] 25.1 PhotoVerificationScreen.tsx
  - [x] 25.2 Poz rehberi UI
  - [x] 25.3 Kamera entegrasyonu
  - _Requirements: 12.1, 12.4_

- [x] 26. Verified Badge
  - [x] 26.1 Profil kartına verified badge ekle
  - [x] 26.2 Filtre: sadece doğrulanmış
  - _Requirements: 12.3, 12.6_

---

### Faz 10: Spotify Entegrasyonu

- [ ] 27. Spotify OAuth
  - [ ] 27.1 Spotify Developer hesabı kurulumu
  - [x] 27.2 OAuth flow implementasyonu
  - [x] 27.3 Token yönetimi
  - _Requirements: 13.1, 13.6_

- [x] 28. Spotify Servisi
  - [x] 28.1 spotifyService.ts oluştur
  - [x] 28.2 Top artists çekme
  - [ ] 28.3 Currently playing
  - [x] 28.4 Uyumluluk hesaplama
  - _Requirements: 13.2-13.5_

- [x] 29. Spotify UI
  - [x] 29.1 SpotifyConnectScreen.tsx
  - [x] 29.2 Profilde müzik bölümü
  - [x] 29.3 Uyumluluk yüzdesi gösterimi
  - _Requirements: 13.2, 13.4, 13.5_

---

### Faz 11: Navigation ve Final Entegrasyon

- [x] 30. Navigation Güncellemesi
  - [x] 30.1 types.ts'e yeni ekranları ekle
  - [x] 30.2 RootNavigator'a ekranları ekle
  - [x] 30.3 MainTabs'a yeni tab'lar (Events, Groups)
  - _Requirements: Tüm özellikler_

- [x] 31. Final Checkpoint
  - [x] 31.1 Tüm servislerin çalıştığını doğrula
  - [x] 31.2 Navigation akışlarını test et
  - [x] 31.3 PRD.md güncelle
  - _Requirements: Tüm özellikler_

---

## Notes

- Görevler sırayla yapılmalı (veritabanı önce)
- Her faz tamamlandığında test edilmeli
- WebRTC ve Spotify harici API gerektiriyor
- Fotoğraf doğrulama basit versiyon (ML olmadan)
