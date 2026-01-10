# GitHub Copilot Instructions - UniFinder

## Genel Kurallar

- **Süreci pürüzsüz ilerletmek adına sormaktan çekinme. NEYE İHTİYACIN VARSA SOR!**
- Netlik kazanmak için dilediğin kadar soru sorabilirsin.
- Türkçe yanıt ver (kod yorumları İngilizce olabilir).

## ⚠️ ÖNEMLI: Mobil Odaklı Geliştirme

- **Bu proje SADECE MOBİL için geliştirilmektedir (iOS & Android)**
- Web desteği gerekmez, web için ayrı dosya oluşturma
- Tüm özellikler **Expo Go** ile uyumlu olmalı
- Native modül gerektiren paketler yerine Expo SDK veya WebView tabanlı alternatifler kullan
- `react-native-maps` yerine WebView + Leaflet kullan
- Test her zaman Expo Go üzerinde yapılmalı

## Proje Bilgileri

- **Proje:** UniFinder - Üniversite öğrencileri için sosyal ağ uygulaması
- **Tech Stack:** React Native, Expo, TypeScript, NativeWind (Tailwind CSS), Supabase
- **Navigasyon:** React Navigation (Stack + Bottom Tabs)

## Kod Stili

- TypeScript kullan, `any` tipinden kaçın
- Fonksiyonel componentler ve hooks kullan
- NativeWind (Tailwind) class'ları ile stillendirme yap
- Dosya isimleri PascalCase (componentler için), camelCase (utils için)
- Componentleri `src/components/` altında organize et
- Screen'leri `src/screens/` altında kategorize et

## Best Practices

- Her zaman error handling yap
- Loading state'lerini göster
- TypeScript interface'lerini `src/types/` altında tanımla
- Supabase sorgularında RLS (Row Level Security) kurallarını göz önünde bulundur
- Responsive tasarım için Dimensions veya useWindowDimensions kullan

## Dosya Yapısı

```
src/
  components/    → Yeniden kullanılabilir componentler
  screens/       → Ekranlar (Auth, Main, Profile, vb.)
  navigation/    → Navigation yapılandırması
  services/      → API ve servis fonksiyonları
  hooks/         → Custom hooks
  context/       → React Context providers
  types/         → TypeScript tipleri
  utils/         → Yardımcı fonksiyonlar
  constants/     → Sabit değerler
```
