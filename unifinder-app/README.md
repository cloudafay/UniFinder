# UniFinder - Üniversite Sosyal Bağlantı Uygulaması

## 📱 Proje Hakkında
UniFinder, üniversite öğrencilerinin kampüste bağlantı kurmalarını sağlayan modern bir sosyal uygulamadır.

## 🚀 Teknolojiler
- **React Native** + **Expo** (SDK 52)
- **TypeScript**
- **NativeWind** (Tailwind CSS for React Native)
- **React Navigation** (Native Stack + Bottom Tabs)
- **Expo Blur** (Glassmorphism efektleri)
- **Expo Linear Gradient**
- **React Native Gesture Handler** (Swipe kartları)
- **React Native Reanimated** (Animasyonlar)

## 🎨 Tasarım Özellikleri
- **Glassmorphism UI** - Modern cam efektli arayüz
- **Dark/Light Mode** - Karanlık ve aydınlık tema desteği
- **Material Icons** - Google Material Symbols
- **Inter Font** - Modern tipografi

### Renk Paleti
- Primary: `#1337ec`
- Background Light: `#f6f6f8`
- Background Dark: `#101322`

## � Kurulum

```bash
# Proje dizinine git
cd unifinder-app

# Bağımlılıkları yükle
npm install

# Expo uygulamasını başlat
npx expo start

# iOS için
npx expo start --ios

# Android için
npx expo start --android
```

## �📂 Proje Yapısı

```
unifinder-app/
├── App.tsx                     # Ana giriş noktası
├── app.json                    # Expo yapılandırması
├── package.json                # Bağımlılıklar
├── tsconfig.json               # TypeScript yapılandırması
├── tailwind.config.js          # NativeWind/Tailwind yapılandırması
├── babel.config.js             # Babel yapılandırması
├── metro.config.js             # Metro bundler yapılandırması
│
└── src/
    ├── assets/                 # Statik dosyalar
    │   ├── animations/         # Lottie animasyonları
    │   ├── fonts/              # Inter font dosyaları
    │   ├── icons/              # İkon dosyaları
    │   └── images/             # Görsel dosyaları (icon, splash, vb.)
    │
    ├── components/             # Yeniden kullanılabilir bileşenler
    │   ├── cards/              # ProfileCard, MessageCard
    │   ├── forms/              # Form bileşenleri
    │   ├── modals/             # MatchSuccessModal
    │   ├── navigation/         # BottomTabBar, Header
    │   └── ui/                 # GlassButton, GlassInput, GlassPanel
    │
    ├── constants/              # Sabit değerler
    │   ├── colors.ts           # Renk paleti
    │   ├── screens.ts          # Ekran isimleri
    │   └── theme.ts            # Tema ayarları
    │
    ├── context/                # React Context
    │   ├── AuthContext.tsx     # Kimlik doğrulama durumu
    │   └── ThemeContext.tsx    # Tema durumu
    │
    ├── hooks/                  # Custom Hooks
    │   ├── useAuth.ts
    │   └── useTheme.ts
    │
    ├── navigation/             # React Navigation
    │   ├── AuthStack.tsx       # Kimlik doğrulama navigasyonu
    │   ├── MainTabs.tsx        # Ana tab navigasyonu
    │   ├── RootNavigator.tsx   # Kök navigasyon
    │   └── types.ts            # Navigasyon tipleri
    │
    ├── screens/                # Uygulama ekranları
    │   ├── Auth/               # Kimlik doğrulama ekranları
    │   │   ├── SplashScreen.tsx
    │   │   ├── LoginScreen.tsx
    │   │   ├── RegisterBasicInfoScreen.tsx
    │   │   ├── RegisterPhotoScreen.tsx
    │   │   └── RegisterInterestScreen.tsx
    │   │
    │   ├── Main/               # Ana ekranlar
    │   │   ├── DiscoverScreen.tsx
    │   │   ├── FilterSearchScreen.tsx
    │   │   └── MatchSuccessScreen.tsx
    │   │
    │   ├── Chat/               # Sohbet ekranları
    │   │   ├── MessageListScreen.tsx
    │   │   └── ChatScreen.tsx
    │   │
    │   ├── Profile/            # Profil ekranları
    │   │   ├── UserProfileScreen.tsx
    │   │   └── EditProfileScreen.tsx
    │   │
    │   ├── Notifications/      # Bildirim ekranları
    │   │   └── NotificationCenterScreen.tsx
    │   │
    │   └── Settings/           # Ayar ekranları
    │       └── SettingsScreen.tsx
    │
    ├── services/               # API servisleri
    │   ├── api.ts              # API endpoint'leri
    │   └── authService.ts      # Auth servisi
    │
    ├── store/                  # State yönetimi (Zustand/Redux)
    │
    ├── styles/                 # Global stiller
    │   └── global.css          # Tailwind CSS
    │
    ├── types/                  # TypeScript tipleri
    │   └── index.ts
    │
    └── utils/                  # Yardımcı fonksiyonlar
        ├── helpers.ts
        └── storage.ts
```

## 📱 Ekranlar

### Kimlik Doğrulama (Auth)
1. **SplashScreen** - Açılış ekranı ✅
2. **LoginScreen** - Giriş ekranı ✅
3. **RegisterBasicInfoScreen** - Temel bilgiler
4. **RegisterPhotoScreen** - Fotoğraf yükleme
5. **RegisterInterestScreen** - İlgi alanları

### Ana Ekranlar (Main)
6. **DiscoverScreen** - Keşif/Swipe ekranı ✅
7. **FilterSearchScreen** - Filtre ve arama
8. **MatchSuccessScreen** - Eşleşme başarı

### Sohbet (Chat)
9. **MessageListScreen** - Mesaj listesi ✅
10. **ChatScreen** - Sohbet ekranı

### Bildirimler (Notifications)
11. **NotificationCenterScreen** - Bildirim merkezi

### Profil (Profile)
12. **UserProfileScreen** - Kullanıcı profili
13. **EditProfileScreen** - Profil düzenleme

### Ayarlar (Settings)
14. **SettingsScreen** - Ayarlar

## 🎯 Tasarım Dosyaları
Tasarım dosyaları `extracted_temp/` klasöründe HTML ve PNG formatında bulunmaktadır.

## 📝 Yapılacaklar
- [ ] Font dosyalarını ekle (Inter)
- [ ] Splash ve icon görsellerini ekle
- [ ] Kalan ekranları tamamla
- [ ] API entegrasyonu
- [ ] Real-time chat (Socket.io/Firebase)
- [ ] Push notifications

---

**UniFinder** - Connect with your Campus 🎓
