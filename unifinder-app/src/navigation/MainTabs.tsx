// Ana Sekme Navigasyonu
import React, { useEffect, useState, useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import { Colors } from '../constants';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/chatService';
import { useTheme } from '../context/ThemeContext';

// Ekranlar
import DiscoverScreen from '../screens/Main/DiscoverScreen';
import MessageListScreen from '../screens/Chat/MessageListScreen';
import UserProfileScreen from '../screens/Profile/UserProfileScreen';
import EventsScreen from '../screens/Events/EventsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabBarIconProps = {
  focused: boolean;
  color: string;
  size: number;
};

const getTabIcon = (routeName: string, focused: boolean): keyof typeof MaterialIcons.glyphMap => {
  switch (routeName) {
    case 'Discover':
      return focused ? 'style' : 'style';
    case 'Events':
      return focused ? 'event' : 'event';
    case 'Messages':
      return focused ? 'forum' : 'forum'; // Mesajlar + Gruplar birleşik
    case 'Profile':
      return focused ? 'person' : 'person-outline';
    default:
      return 'circle';
  }
};

export const MainTabs = () => {
  const { user } = useAuth();
  const { isDark, colors } = useTheme();
  const [unreadCount, setUnreadCount] = useState<number | undefined>(undefined);

  // Okunmamış mesaj sayısını yükle
  const loadUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(undefined);
      return;
    }

    try {
      const { count, error } = await chatService.getTotalUnreadCount(user.id);
      if (!error && count !== null) {
        setUnreadCount(count > 0 ? count : undefined);
      }
    } catch (err) {
      console.error('Okunmamış mesaj sayısı alınamadı:', err);
    }
  }, [user?.id]);

  // İlk yükleme ve periyodik güncelleme
  useEffect(() => {
    loadUnreadCount();
    
    // Her 30 saniyede bir güncelle
    const interval = setInterval(loadUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }: TabBarIconProps) => {
          const iconName = getTabIcon(route.name, focused);
          return <MaterialIcons name={iconName} size={28} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8',
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isDark 
            ? 'rgba(16, 19, 34, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: 0,
          elevation: 0,
          height: 85,
          paddingTop: 10,
          paddingBottom: 25,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          ...Platform.select({
            web: {
              backdropFilter: 'blur(20px)',
            },
            default: {},
          }),
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarAccessibilityLabel: `${route.name} sekmesi`,
      })}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{ 
          tabBarLabel: 'Keşfet',
          tabBarAccessibilityLabel: 'Keşfet sekmesi',
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{ 
          tabBarLabel: 'Etkinlik',
          tabBarAccessibilityLabel: 'Etkinlikler sekmesi',
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessageListScreen}
        options={{
          tabBarLabel: 'Sohbet',
          tabBarBadge: unreadCount,
          tabBarBadgeStyle: {
            backgroundColor: '#ef4444',
            fontSize: 10,
            fontWeight: 'bold',
            minWidth: 18,
            height: 18,
          },
          tabBarAccessibilityLabel: unreadCount 
            ? `Sohbet sekmesi, ${unreadCount} okunmamış mesaj` 
            : 'Sohbet sekmesi',
        }}
        listeners={{
          focus: () => {
            loadUnreadCount();
          },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={UserProfileScreen}
        options={{ 
          tabBarLabel: 'Profil',
          tabBarAccessibilityLabel: 'Profil sekmesi',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabs;
