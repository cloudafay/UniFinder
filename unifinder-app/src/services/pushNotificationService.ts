// Push Bildirim Servisi
// Expo Push Bildirimleri entegrasyonu

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Web'de push notifications desteklenmiyor
const isWeb = Platform.OS === 'web';

// Expo Go'da push notifications desteklenmiyor mu kontrol et
const isExpoGo = Constants.appOwnership === 'expo';

// Bildirim işleyici ayarları - sadece destekleniyorsa (web hariç)
if (!isWeb) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    console.log('Notification handler setup skipped (Expo Go limitation)');
  }
}

export const pushNotificationService = {
  // Push token al
  registerForPushNotificationsAsync: async (): Promise<string | null> => {
    // Web'de push notifications desteklenmiyor
    if (isWeb) {
      console.log('Push notifications not supported on web');
      return null;
    }

    // Expo Go'da push notifications desteklenmiyor
    if (isExpoGo) {
      console.log('Push notifications not supported in Expo Go');
      return null;
    }

    let token: string | null = null;

    // Fiziksel cihaz kontrolü (emülatörde çalışmaz)
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    try {
      // Android için notification channel oluştur
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1337ec',
        });

        // Match bildirimleri için ayrı kanal
        await Notifications.setNotificationChannelAsync('matches', {
          name: 'Eşleşmeler',
          description: 'Yeni eşleşme bildirimleri',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 500, 200, 500],
          lightColor: '#FF6B6B',
        });

        // Mesaj bildirimleri için ayrı kanal
        await Notifications.setNotificationChannelAsync('messages', {
          name: 'Mesajlar',
          description: 'Yeni mesaj bildirimleri',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1337ec',
        });
      }

      // Mevcut izinleri kontrol et
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // İzin yoksa iste
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted');
        return null;
      }

      // Expo Push Token al
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      if (!projectId) {
        console.log('Project ID not found for push notifications');
        return null;
      }

      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      token = pushTokenData.data;
      console.log('Push token:', token);
    } catch (error) {
      console.log('Push notification registration skipped:', error);
    }

    return token;
  },

  // Token'ı Supabase'e kaydet
  savePushToken: async (userId: string, token: string): Promise<boolean> => {
    if (!token || isExpoGo || isWeb) return false;

    try {
      // Önce mevcut token var mı kontrol et
      const { data: existing } = await supabase
        .from('push_tokens')
        .select('id')
        .eq('user_id', userId)
        .eq('token', token)
        .single();

      if (existing) {
        // Token zaten kayıtlı, güncelle
        const { error } = await supabase
          .from('push_tokens')
          .update({
            updated_at: new Date().toISOString(),
            is_active: true
          })
          .eq('id', existing.id);

        return !error;
      }

      // Yeni token kaydet
      const { error } = await supabase
        .from('push_tokens')
        .insert({
          user_id: userId,
          token,
          platform: Platform.OS,
          is_active: true,
        });

      return !error;
    } catch (error) {
      console.error('Error saving push token:', error);
      return false;
    }
  },

  // Token'ı deaktif et (çıkış yaparken)
  deactivateToken: async (userId: string, token: string): Promise<void> => {
    if (!token || isExpoGo || isWeb) return;

    try {
      await supabase
        .from('push_tokens')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('token', token);
    } catch (error) {
      console.error('Error deactivating token:', error);
    }
  },

  // Local notification gönder (test için)
  sendLocalNotification: async (title: string, body: string, data?: any): Promise<void> => {
    if (isExpoGo || isWeb) {
      console.log('Local notification (skipped on web/Expo Go):', title, body);
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
        },
        trigger: null, // Hemen gönder
      });
    } catch (error) {
      console.log('Local notification failed:', error);
    }
  },

  // Badge sayısını güncelle
  setBadgeCount: async (count: number): Promise<void> => {
    if (isExpoGo || isWeb) return;

    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.log('Set badge count failed:', error);
    }
  },

  // Tüm bildirimleri temizle
  clearAllNotifications: async (): Promise<void> => {
    if (isExpoGo || isWeb) return;

    try {
      await Notifications.dismissAllNotificationsAsync();
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.log('Clear notifications failed:', error);
    }
  },

  // Notification listener'ları ekle
  addNotificationListeners: (
    onNotificationReceived: (notification: Notifications.Notification) => void,
    onNotificationResponse: (response: Notifications.NotificationResponse) => void
  ) => {
    if (isExpoGo || isWeb) {
      // Web/Expo Go'da listener ekleme, boş cleanup döndür
      return () => { };
    }

    try {
      // Uygulama açıkken gelen bildirimler
      const notificationListener = Notifications.addNotificationReceivedListener(onNotificationReceived);

      // Bildirime tıklandığında
      const responseListener = Notifications.addNotificationResponseReceivedListener(onNotificationResponse);

      // Cleanup fonksiyonu döndür
      return () => {
        notificationListener.remove();
        responseListener.remove();
      };
    } catch (error) {
      console.log('Notification listeners setup failed:', error);
      return () => { };
    }
  },
};

export default pushNotificationService;
