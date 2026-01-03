// Bildirim Context
// Push bildirim yönetimi için global state

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from './AuthContext';
import pushNotificationService from '../services/pushNotificationService';

// Web'de push notifications desteklenmiyor
const isWeb = Platform.OS === 'web';

// Expo Go'da SDK 53'ten itibaren push notifications desteklenmiyor
const isExpoGo = Constants.appOwnership === 'expo';

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isRegistered: boolean;
  registerForPushNotifications: () => Promise<void>;
  sendTestNotification: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  // Push notification'lara kayıt ol
  const registerForPushNotifications = useCallback(async () => {
    // Web veya Expo Go'da push notifications desteklenmiyor
    if (!user || isWeb || isExpoGo) return;

    try {
      const token = await pushNotificationService.registerForPushNotificationsAsync();
      
      if (token) {
        setExpoPushToken(token);
        
        // Token'ı Supabase'e kaydet
        const saved = await pushNotificationService.savePushToken(user.id, token);
        setIsRegistered(saved);
        
        console.log('Push notification registered:', { token, saved });
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  }, [user]);

  // Bildirime tıklandığında yönlendirme
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    
    console.log('Notification tapped:', data);

    // Bildirim tipine göre yönlendir
    if (data?.type === 'match' && data?.matchId) {
      // Yeni eşleşme - Chat'e git
      navigation.navigate('Chat', {
        matchId: data.matchId,
        userName: data.userName || 'Yeni Eşleşme',
        userPhoto: data.userPhoto || '',
      });
    } else if (data?.type === 'message' && data?.matchId) {
      // Yeni mesaj - Chat'e git
      navigation.navigate('Chat', {
        matchId: data.matchId,
        userName: data.userName || 'Mesaj',
        userPhoto: data.userPhoto || '',
      });
    } else if (data?.type === 'like') {
      // Biri beğendi - Discover'a git
      navigation.navigate('MainTabs', { screen: 'Discover' });
    }
  }, [navigation]);

  // Uygulama açıkken gelen bildirim
  const handleNotificationReceived = useCallback((notification: Notifications.Notification) => {
    console.log('Notification received:', notification);
    setNotification(notification);
  }, []);

  // User değiştiğinde token kaydet
  useEffect(() => {
    if (user) {
      registerForPushNotifications();
    }
  }, [user, registerForPushNotifications]);

  // Notification listener'ları ekle
  useEffect(() => {
    // Web veya Expo Go'da listener ekleme
    if (isWeb || isExpoGo) return () => {};
    
    const cleanup = pushNotificationService.addNotificationListeners(
      handleNotificationReceived,
      handleNotificationResponse
    );

    return cleanup;
  }, [handleNotificationReceived, handleNotificationResponse]);

  // Test bildirimi gönder
  const sendTestNotification = async () => {
    await pushNotificationService.sendLocalNotification(
      '🎉 Test Bildirimi',
      'Push notification sistemi çalışıyor!',
      { type: 'test' }
    );
  };

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        isRegistered,
        registerForPushNotifications,
        sendTestNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
