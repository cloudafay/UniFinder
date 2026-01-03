// Deep Link Service
// Uygulama içi link oluşturma ve yönetimi

import { Linking, Platform, Share } from 'react-native';

// Tipler
export type DeepLinkType = 'profile' | 'event' | 'group' | 'chat' | 'match';

export interface DeepLinkData {
  type: DeepLinkType;
  id: string;
  params?: Record<string, string>;
}

export interface ShareCardData {
  title: string;
  description: string;
  imageUrl?: string;
  url: string;
}

// Konfigürasyon
const CONFIG = {
  scheme: 'unifinder',
  host: 'app.unifinder.com',
  webFallback: 'https://unifinder.com',
  appStoreUrl: 'https://apps.apple.com/app/unifinder/id123456789',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.unifinder.app',
};

export const deepLinkService = {
  // Deep link oluştur
  generateLink: (type: DeepLinkType, id: string, params?: Record<string, string>): string => {
    let path = '';
    
    switch (type) {
      case 'profile':
        path = `profile/${id}`;
        break;
      case 'event':
        path = `event/${id}`;
        break;
      case 'group':
        path = `group/${id}`;
        break;
      case 'chat':
        path = `chat/${id}`;
        break;
      case 'match':
        path = `match/${id}`;
        break;
      default:
        path = id;
    }

    // Query params ekle
    let queryString = '';
    if (params && Object.keys(params).length > 0) {
      queryString = '?' + Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
    }

    // Platform'a göre link formatı
    if (Platform.OS === 'web') {
      return `${CONFIG.webFallback}/${path}${queryString}`;
    }

    return `${CONFIG.scheme}://${path}${queryString}`;
  },

  // Universal link oluştur (web fallback ile)
  generateUniversalLink: (type: DeepLinkType, id: string): string => {
    const path = `${type}/${id}`;
    return `https://${CONFIG.host}/${path}`;
  },

  // Deep link'i parse et
  parseLink: (url: string): DeepLinkData | null => {
    try {
      // Scheme kontrolü
      const schemePattern = new RegExp(`^${CONFIG.scheme}://`);
      const webPattern = new RegExp(`^https?://(${CONFIG.host}|${CONFIG.webFallback.replace('https://', '')})/`);

      let path = '';

      if (schemePattern.test(url)) {
        path = url.replace(schemePattern, '');
      } else if (webPattern.test(url)) {
        path = url.replace(webPattern, '');
      } else {
        return null;
      }

      // Query params ayır
      const [pathPart, queryPart] = path.split('?');
      const params: Record<string, string> = {};

      if (queryPart) {
        queryPart.split('&').forEach(param => {
          const [key, value] = param.split('=');
          if (key && value) {
            params[decodeURIComponent(key)] = decodeURIComponent(value);
          }
        });
      }

      // Path'i parse et
      const segments = pathPart.split('/').filter(Boolean);
      
      if (segments.length < 2) {
        return null;
      }

      const type = segments[0] as DeepLinkType;
      const id = segments[1];

      // Geçerli tip kontrolü
      const validTypes: DeepLinkType[] = ['profile', 'event', 'group', 'chat', 'match'];
      if (!validTypes.includes(type)) {
        return null;
      }

      return { type, id, params: Object.keys(params).length > 0 ? params : undefined };
    } catch (error) {
      console.error('Deep link parse hatası:', error);
      return null;
    }
  },

  // Gelen link'i işle ve yönlendir
  handleIncomingLink: (url: string, navigation: any): boolean => {
    const linkData = deepLinkService.parseLink(url);
    
    if (!linkData) {
      return false;
    }

    const { type, id, params } = linkData;

    switch (type) {
      case 'profile':
        navigation.navigate('UserProfile', { userId: id });
        break;
      case 'event':
        navigation.navigate('EventDetail', { eventId: id });
        break;
      case 'group':
        navigation.navigate('GroupChat', { groupId: id });
        break;
      case 'chat':
        navigation.navigate('Chat', { 
          matchId: id,
          userName: params?.userName || 'Kullanıcı',
          userPhoto: params?.userPhoto || '',
        });
        break;
      case 'match':
        navigation.navigate('MatchSuccess', {
          matchedUserId: id,
          matchedUserName: params?.userName || 'Kullanıcı',
          matchedUserPhoto: params?.userPhoto || '',
        });
        break;
      default:
        return false;
    }

    return true;
  },

  // Paylaşım kartı oluştur
  generateShareCard: (type: DeepLinkType, data: {
    id: string;
    title: string;
    description?: string;
    imageUrl?: string;
  }): ShareCardData => {
    const url = deepLinkService.generateUniversalLink(type, data.id);

    return {
      title: data.title,
      description: data.description || getDefaultDescription(type),
      imageUrl: data.imageUrl,
      url,
    };
  },

  // Link paylaş
  shareLink: async (shareData: ShareCardData): Promise<boolean> => {
    try {
      const message = `${shareData.title}\n${shareData.description}\n\n${shareData.url}`;

      if (Platform.OS === 'web') {
        // Web'de navigator.share kullan
        if (navigator.share) {
          await navigator.share({
            title: shareData.title,
            text: shareData.description,
            url: shareData.url,
          });
          return true;
        } else {
          // Clipboard'a kopyala
          await navigator.clipboard.writeText(shareData.url);
          return true;
        }
      } else {
        // Native share
        const { Share } = await import('react-native');
        await Share.share({
          message,
          url: shareData.url,
          title: shareData.title,
        });
        return true;
      }
    } catch (error) {
      console.error('Paylaşım hatası:', error);
      return false;
    }
  },

  // Uygulama yüklü mü kontrol et
  canOpenLink: async (url: string): Promise<boolean> => {
    try {
      return await Linking.canOpenURL(url);
    } catch {
      return false;
    }
  },

  // Link aç (uygulama veya store)
  openLink: async (url: string): Promise<void> => {
    const canOpen = await deepLinkService.canOpenLink(url);

    if (canOpen) {
      await Linking.openURL(url);
    } else {
      // Uygulama yüklü değil, store'a yönlendir
      const storeUrl = Platform.OS === 'ios' ? CONFIG.appStoreUrl : CONFIG.playStoreUrl;
      await Linking.openURL(storeUrl);
    }
  },

  // Link dinleyici ekle
  addLinkListener: (callback: (url: string) => void): (() => void) => {
    const subscription = Linking.addEventListener('url', (event) => {
      callback(event.url);
    });

    return () => subscription.remove();
  },

  // Başlangıç link'ini al
  getInitialLink: async (): Promise<string | null> => {
    try {
      const url = await Linking.getInitialURL();
      return url;
    } catch {
      return null;
    }
  },

  // QR kod için link oluştur
  generateQRLink: (type: DeepLinkType, id: string): string => {
    return deepLinkService.generateUniversalLink(type, id);
  },

  // Profil linki oluştur (kısa yol)
  createProfileLink: (userId: string): string => {
    return deepLinkService.generateUniversalLink('profile', userId);
  },

  // Event linki oluştur (kısa yol)
  createEventLink: (eventId: string): string => {
    return deepLinkService.generateUniversalLink('event', eventId);
  },

  // Grup linki oluştur (kısa yol)
  createGroupLink: (groupId: string): string => {
    return deepLinkService.generateUniversalLink('group', groupId);
  },
};

// Yardımcı fonksiyonlar
function getDefaultDescription(type: DeepLinkType): string {
  const descriptions: Record<DeepLinkType, string> = {
    profile: 'UniFinder\'da bu profili görüntüle',
    event: 'UniFinder\'da bu etkinliğe katıl',
    group: 'UniFinder\'da bu gruba katıl',
    chat: 'UniFinder\'da sohbete başla',
    match: 'UniFinder\'da eşleşmeyi gör',
  };
  return descriptions[type] || 'UniFinder\'da görüntüle';
}

export default deepLinkService;
