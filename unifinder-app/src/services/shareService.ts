// Share Service
// Profil ve Event paylaşım işlemleri

import { Share, Platform } from 'react-native';
import { deepLinkService } from './deepLinkService';

export interface ShareResult {
  success: boolean;
  error?: string;
}

// Web platformunda Share API desteğini kontrol et
const canShareOnWeb = (): boolean => {
  if (Platform.OS !== 'web') return true;
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
};

// Web için fallback paylaşım (clipboard'a kopyala)
const webFallbackShare = async (text: string, url: string): Promise<ShareResult> => {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      return { success: true };
    }
    return { success: false, error: 'Clipboard API desteklenmiyor' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Kopyalama başarısız' };
  }
};

export const shareService = {
  // Profil paylaş
  shareProfile: async (userId: string, userName: string): Promise<ShareResult> => {
    try {
      const profileLink = deepLinkService.createProfileLink(userId);
      
      const message = Platform.select({
        ios: `${userName} adlı kullanıcıya UniFinder'da göz at!`,
        android: `${userName} adlı kullanıcıya UniFinder'da göz at!\n${profileLink}`,
        default: `${userName} adlı kullanıcıya UniFinder'da göz at!`,
      });

      // Web platformunda Share API kontrolü
      if (Platform.OS === 'web') {
        if (canShareOnWeb()) {
          try {
            await navigator.share({
              title: `${userName} - UniFinder`,
              text: message || '',
              url: profileLink,
            });
            return { success: true };
          } catch (error: any) {
            // Kullanıcı iptal ettiyse
            if (error.name === 'AbortError') {
              return { success: false, error: 'Paylaşım iptal edildi' };
            }
            // Fallback: clipboard'a kopyala
            return webFallbackShare(message || '', profileLink);
          }
        } else {
          // Share API yoksa clipboard'a kopyala
          return webFallbackShare(message || '', profileLink);
        }
      }

      const result = await Share.share({
        message,
        url: profileLink, // iOS'ta ayrı URL
        title: `${userName} - UniFinder`,
      });

      if (result.action === Share.sharedAction) {
        return { success: true };
      } else if (result.action === Share.dismissedAction) {
        return { success: false, error: 'Paylaşım iptal edildi' };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Profil paylaşım hatası:', error);
      return { success: false, error: error.message || 'Paylaşım başarısız' };
    }
  },

  // Event paylaş
  shareEvent: async (eventId: string, eventTitle: string, eventDate?: string): Promise<ShareResult> => {
    try {
      const eventLink = deepLinkService.createEventLink(eventId);
      
      let message = `"${eventTitle}" etkinliğine katıl!`;
      if (eventDate) {
        message += `\n📅 ${eventDate}`;
      }
      
      if (Platform.OS === 'android') {
        message += `\n\n${eventLink}`;
      }

      // Web platformunda Share API kontrolü
      if (Platform.OS === 'web') {
        if (canShareOnWeb()) {
          try {
            await navigator.share({
              title: `${eventTitle} - UniFinder Etkinlik`,
              text: message,
              url: eventLink,
            });
            return { success: true };
          } catch (error: any) {
            if (error.name === 'AbortError') {
              return { success: false, error: 'Paylaşım iptal edildi' };
            }
            return webFallbackShare(message, eventLink);
          }
        } else {
          return webFallbackShare(message, eventLink);
        }
      }

      const result = await Share.share({
        message,
        url: eventLink,
        title: `${eventTitle} - UniFinder Etkinlik`,
      });

      if (result.action === Share.sharedAction) {
        return { success: true };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Event paylaşım hatası:', error);
      return { success: false, error: error.message || 'Paylaşım başarısız' };
    }
  },

  // Grup davet linki paylaş
  shareGroupInvite: async (groupId: string, groupName: string): Promise<ShareResult> => {
    try {
      const groupLink = deepLinkService.createGroupLink(groupId);
      
      const message = Platform.select({
        ios: `"${groupName}" grubuna katıl!`,
        android: `"${groupName}" grubuna katıl!\n${groupLink}`,
        default: `"${groupName}" grubuna katıl!`,
      });

      // Web platformunda Share API kontrolü
      if (Platform.OS === 'web') {
        if (canShareOnWeb()) {
          try {
            await navigator.share({
              title: `${groupName} - UniFinder Grup`,
              text: message || '',
              url: groupLink,
            });
            return { success: true };
          } catch (error: any) {
            if (error.name === 'AbortError') {
              return { success: false, error: 'Paylaşım iptal edildi' };
            }
            return webFallbackShare(message || '', groupLink);
          }
        } else {
          return webFallbackShare(message || '', groupLink);
        }
      }

      const result = await Share.share({
        message,
        url: groupLink,
        title: `${groupName} - UniFinder Grup`,
      });

      if (result.action === Share.sharedAction) {
        return { success: true };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Grup paylaşım hatası:', error);
      return { success: false, error: error.message || 'Paylaşım başarısız' };
    }
  },

  // Uygulama paylaş
  shareApp: async (): Promise<ShareResult> => {
    try {
      const appLink = 'https://app.unifinder.com';
      
      const message = Platform.select({
        ios: 'UniFinder - Üniversite öğrencileri için sosyal bağlantı uygulaması! 🎓',
        android: `UniFinder - Üniversite öğrencileri için sosyal bağlantı uygulaması! 🎓\n\n${appLink}`,
        default: 'UniFinder - Üniversite öğrencileri için sosyal bağlantı uygulaması!',
      });

      // Web platformunda Share API kontrolü
      if (Platform.OS === 'web') {
        if (canShareOnWeb()) {
          try {
            await navigator.share({
              title: 'UniFinder',
              text: message || '',
              url: appLink,
            });
            return { success: true };
          } catch (error: any) {
            if (error.name === 'AbortError') {
              return { success: false, error: 'Paylaşım iptal edildi' };
            }
            return webFallbackShare(message || '', appLink);
          }
        } else {
          return webFallbackShare(message || '', appLink);
        }
      }

      const result = await Share.share({
        message,
        url: appLink,
        title: 'UniFinder',
      });

      if (result.action === Share.sharedAction) {
        return { success: true };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Uygulama paylaşım hatası:', error);
      return { success: false, error: error.message || 'Paylaşım başarısız' };
    }
  },

  // Referral kodu paylaş
  shareReferralCode: async (referralCode: string, userName: string): Promise<ShareResult> => {
    try {
      const referralLink = `https://app.unifinder.com/invite/${referralCode}`;
      
      const message = Platform.select({
        ios: `${userName} seni UniFinder'a davet ediyor! Referans kodum: ${referralCode}`,
        android: `${userName} seni UniFinder'a davet ediyor!\n\nReferans kodum: ${referralCode}\n\n${referralLink}`,
        default: `${userName} seni UniFinder'a davet ediyor!`,
      });

      // Web platformunda Share API kontrolü
      if (Platform.OS === 'web') {
        if (canShareOnWeb()) {
          try {
            await navigator.share({
              title: 'UniFinder Davet',
              text: message || '',
              url: referralLink,
            });
            return { success: true };
          } catch (error: any) {
            if (error.name === 'AbortError') {
              return { success: false, error: 'Paylaşım iptal edildi' };
            }
            return webFallbackShare(message || '', referralLink);
          }
        } else {
          return webFallbackShare(message || '', referralLink);
        }
      }

      const result = await Share.share({
        message,
        url: referralLink,
        title: 'UniFinder Davet',
      });

      if (result.action === Share.sharedAction) {
        return { success: true };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Referral paylaşım hatası:', error);
      return { success: false, error: error.message || 'Paylaşım başarısız' };
    }
  },
};

export default shareService;
