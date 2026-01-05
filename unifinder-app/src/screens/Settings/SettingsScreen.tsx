// Ayarlar Ekranı
// Koyu/Açık Tema Desteği

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLocation } from '../../context/LocationContext';
import pushNotificationService from '../../services/pushNotificationService';
import { supabase } from '../../lib/supabase';
import { Linking } from 'react-native';

interface SettingsItem {
  id: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconBgColor: string;
  iconBorderColor: string;
  title: string;
  value?: string;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onPress?: () => void;
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { theme, isDark, colors, setTheme, toggleTheme } = useTheme();
  const { location, discoveryRadius, setDiscoveryRadius, requestLocation, permissionStatus } = useLocation();

  const handleLocationPermission = async () => {
    const granted = await requestLocation();
    if (granted) {
      if (Platform.OS === 'web') {
        window.alert('Başarılı\n\nKonum izni verildi ve konumunuz güncellendi.');
      } else {
        Alert.alert('Başarılı', 'Konum izni verildi ve konumunuz güncellendi.');
      }
    }
  };

  const handleChangeRadius = () => {
    if (Platform.OS === 'web') {
      const choice = window.prompt(
        'Keşif Mesafesi\n\nYakındaki kullanıcıları hangi mesafeden görmek istersiniz?\n\n1 - 5 km\n2 - 10 km\n3 - 25 km\n4 - 50 km\n\nSeçiminizi girin (1, 2, 3 veya 4):'
      );
      if (choice === '1') setDiscoveryRadius(5);
      else if (choice === '2') setDiscoveryRadius(10);
      else if (choice === '3') setDiscoveryRadius(25);
      else if (choice === '4') setDiscoveryRadius(50);
    } else {
      Alert.alert(
        'Keşif Mesafesi',
        'Yakındaki kullanıcıları hangi mesafeden görmek istersiniz?',
        [
          { text: '5 km', onPress: () => setDiscoveryRadius(5) },
          { text: '10 km', onPress: () => setDiscoveryRadius(10) },
          { text: '25 km', onPress: () => setDiscoveryRadius(25) },
          { text: '50 km', onPress: () => setDiscoveryRadius(50) },
          { text: 'İptal', style: 'cancel' },
        ]
      );
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Çıkış Yap\n\nHesabınızdan çıkış yapmak istediğinize emin misiniz?');
      if (confirmed) {
        logout();
      }
    } else {
      Alert.alert(
        'Çıkış Yap',
        'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
        ]
      );
    }
  };

  const handleDeleteAccount = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Hesabı Sil\n\nBu işlem geri alınamaz. Tüm verileriniz, eşleşmeleriniz ve mesajlarınız silinecektir. Hesabınızı silmek istediğinize emin misiniz?');
      if (confirmed) {
        try {
          if (!user?.id) return;
          
          await supabase.from('matches').delete().or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
          await supabase.from('messages').delete().eq('sender_id', user.id);
          await supabase.from('swipes').delete().or(`swiper_id.eq.${user.id},swiped_id.eq.${user.id}`);
          await supabase.from('push_tokens').delete().eq('user_id', user.id);
          await supabase.from('notifications').delete().eq('user_id', user.id);
          await supabase.from('profiles').delete().eq('id', user.id);
          
          await logout();
          window.alert('Hesap Silindi\n\nHesabınız başarıyla silindi.');
        } catch (error: any) {
          window.alert('Hata\n\nHesap silinirken bir hata oluştu: ' + error.message);
        }
      }
    } else {
      Alert.alert(
        'Hesabı Sil',
        'Bu işlem geri alınamaz. Tüm verileriniz, eşleşmeleriniz ve mesajlarınız silinecektir. Hesabınızı silmek istediğinize emin misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Hesabı Sil',
            style: 'destructive',
            onPress: async () => {
              try {
                if (!user?.id) return;
                
                await supabase.from('matches').delete().or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
                await supabase.from('messages').delete().eq('sender_id', user.id);
                await supabase.from('swipes').delete().or(`swiper_id.eq.${user.id},swiped_id.eq.${user.id}`);
                await supabase.from('push_tokens').delete().eq('user_id', user.id);
                await supabase.from('notifications').delete().eq('user_id', user.id);
                await supabase.from('profiles').delete().eq('id', user.id);
                
                await logout();
                Alert.alert('Hesap Silindi', 'Hesabınız başarıyla silindi.');
              } catch (error: any) {
                Alert.alert('Hata', 'Hesap silinirken bir hata oluştu: ' + error.message);
              }
            },
          },
        ]
      );
    }
  };

  // Sayfa yönlendirmeleri
  const handlePrivacy = () => {
    navigation.navigate('PrivacySettings');
  };

  const handleVerification = () => {
    navigation.navigate('Verification');
  };

  const handlePasswordChange = () => {
    navigation.navigate('ChangePassword');
  };

  const handleNotifications = () => {
    navigation.navigate('NotificationSettings');
  };

  const handleHelp = () => {
    navigation.navigate('HelpCenter');
  };

  const handleTerms = () => {
    navigation.navigate('TermsOfService');
  };

  const handleLocation = () => {
    navigation.navigate('LocationSettings');
  };

  const handleDistance = () => {
    navigation.navigate('DistanceSettings');
  };

  const sections: SettingsSection[] = [
    {
      title: 'Hesap ve Güvenlik',
      items: [
        {
          id: 'privacy',
          icon: 'shield',
          iconBgColor: 'rgba(19, 55, 236, 0.2)',
          iconBorderColor: 'rgba(19, 55, 236, 0.2)',
          title: 'Gizlilik ve Güvenlik',
          onPress: handlePrivacy,
        },
        {
          id: 'verification',
          icon: 'verified-user',
          iconBgColor: 'rgba(59, 130, 246, 0.2)',
          iconBorderColor: 'rgba(59, 130, 246, 0.2)',
          title: 'Kampüs Doğrulama',
          value: user?.isVerified ? 'Doğrulandı' : 'Bekliyor',
          onPress: handleVerification,
        },
        {
          id: 'password',
          icon: 'lock',
          iconBgColor: 'rgba(107, 114, 128, 0.5)',
          iconBorderColor: 'rgba(255, 255, 255, 0.05)',
          title: 'Şifre Değiştir',
          onPress: handlePasswordChange,
        },
      ],
    },
    {
      title: 'Tercihler',
      items: [
        {
          id: 'notifications',
          icon: 'notifications',
          iconBgColor: 'rgba(249, 115, 22, 0.2)',
          iconBorderColor: 'rgba(249, 115, 22, 0.2)',
          title: 'Bildirimler',
          onPress: handleNotifications,
        },
        {
          id: 'test-notification',
          icon: 'send',
          iconBgColor: 'rgba(59, 130, 246, 0.2)',
          iconBorderColor: 'rgba(59, 130, 246, 0.2)',
          title: 'Test Bildirimi Gönder',
          onPress: () => {
            pushNotificationService.sendLocalNotification(
              '🔔 Test Bildirimi',
              'Push notification sistemi çalışıyor!',
              { type: 'test' }
            );
          },
        },
        {
          id: 'location-permission',
          icon: 'my-location',
          iconBgColor: 'rgba(59, 130, 246, 0.2)',
          iconBorderColor: 'rgba(59, 130, 246, 0.2)',
          title: 'Konum İzni',
          value: permissionStatus === 'granted' ? 'Aktif' : 'İzin Ver',
          onPress: handleLocation,
        },
        {
          id: 'discovery',
          icon: 'location-on',
          iconBgColor: 'rgba(34, 197, 94, 0.2)',
          iconBorderColor: 'rgba(34, 197, 94, 0.2)',
          title: 'Keşif Mesafesi',
          value: `${discoveryRadius} km`,
          onPress: handleDistance,
        },
        {
          id: 'appearance',
          icon: 'dark-mode',
          iconBgColor: 'rgba(168, 85, 247, 0.2)',
          iconBorderColor: 'rgba(168, 85, 247, 0.2)',
          title: 'Karanlık Mod',
          value: isDark ? 'Açık' : 'Kapalı',
          hasSwitch: true,
          switchValue: isDark,
          onPress: toggleTheme,
        },
      ],
    },
    {
      title: 'Destek',
      items: [
        {
          id: 'help',
          icon: 'help',
          iconBgColor: 'rgba(20, 184, 166, 0.2)',
          iconBorderColor: 'rgba(20, 184, 166, 0.2)',
          title: 'Yardım Merkezi',
          onPress: handleHelp,
        },
        {
          id: 'terms',
          icon: 'description',
          iconBgColor: 'rgba(236, 72, 153, 0.2)',
          iconBorderColor: 'rgba(236, 72, 153, 0.2)',
          title: 'Kullanım Koşulları',
          onPress: handleTerms,
        },
      ],
    },
  ];

  const renderSettingsItem = (item: SettingsItem, isLast: boolean) => (
    <View key={item.id}>
      <TouchableOpacity
        style={[styles.settingsItem, { backgroundColor: colors.cardBackground }]}
        onPress={item.hasSwitch ? undefined : item.onPress}
        activeOpacity={item.hasSwitch ? 1 : 0.7}
      >
        <View style={styles.itemLeft}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: item.iconBgColor, borderColor: item.iconBorderColor },
            ]}
          >
            <MaterialIcons name={item.icon} size={20} color="#fff" />
          </View>
          <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{item.title}</Text>
        </View>
        <View style={styles.itemRight}>
          {item.hasSwitch ? (
            <Switch
              value={item.switchValue}
              onValueChange={item.onPress}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          ) : (
            <>
              {item.value && (
                <Text style={[
                  styles.itemValue,
                  { color: colors.textSecondary },
                  item.id === 'verification' && styles.itemValuePrimary
                ]}>
                  {item.value}
                </Text>
              )}
              <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
            </>
          )}
        </View>
      </TouchableOpacity>
      {!isLast && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Ambient Background */}
      <View style={[styles.ambientContainer, { pointerEvents: 'none' as const }]}>
        <View style={[styles.ambientBlob, styles.blobTopLeft]} />
        <View style={[styles.ambientBlob, styles.blobBottomRight]} />
        <View style={[styles.ambientBlob, styles.blobCenter]} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity 
              style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarWrapper}>
              <View style={styles.avatarGlow} />
              <Image
                source={{
                  uri: user?.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.fullName || 'U') + '&size=200&background=6366f1&color=fff'
                }}
                style={[styles.avatar, { borderColor: colors.border }]}
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Ayarlar</Text>
        </View>

        {/* Settings Sections */}
        {sections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title.toUpperCase()}</Text>
            <View style={[styles.glassPanel, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              {section.items.map((item, index) =>
                renderSettingsItem(item, index === section.items.length - 1)
              )}
            </View>
          </View>
        ))}

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <View style={[styles.dangerPanel, { backgroundColor: colors.cardBackground }]}>
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Text style={[styles.logoutText, { color: colors.textPrimary }]}>Çıkış Yap</Text>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={handleDeleteAccount}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteText}>Hesabı Sil</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.versionText, { color: colors.textTertiary }]}>UniFinder v1.0.0 (Build 1)</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101322',
  },
  ambientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  ambientBlob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  blobTopLeft: {
    top: '-10%',
    left: '-10%',
    width: 500,
    height: 500,
    backgroundColor: `${Colors.primary}20`,
    ...Platform.select({
      web: {
        filter: 'blur(120px)',
      },
      default: {
        opacity: 0.6,
      },
    }),
  },
  blobBottomRight: {
    bottom: '-10%',
    right: '-10%',
    width: 400,
    height: 400,
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    ...Platform.select({
      web: {
        filter: 'blur(100px)',
      },
      default: {
        opacity: 0.5,
      },
    }),
  },
  blobCenter: {
    top: '40%',
    left: '20%',
    width: 300,
    height: 300,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    ...Platform.select({
      web: {
        filter: 'blur(80px)',
      },
      default: {
        opacity: 0.3,
      },
    }),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    gap: 8,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarGlow: {
    position: 'absolute',
    inset: 0,
    backgroundColor: `${Colors.primary}30`,
    borderRadius: 20,
    ...Platform.select({
      web: {
        filter: 'blur(8px)',
      },
      default: {},
    }),
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1,
    marginLeft: 12,
    marginBottom: 8,
  },
  glassPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
      },
      default: {},
    }),
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 60,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#fff',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemValue: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  itemValuePrimary: {
    color: Colors.primary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 16,
  },
  dangerZone: {
    marginTop: 16,
    marginBottom: 24,
  },
  dangerPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        boxShadow: '0 0 20px rgba(239, 68, 68, 0.05)',
      },
      default: {},
    }),
  },
  dangerButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#fff',
  },
  deleteText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#ef4444',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '500',
    marginTop: 24,
  },
});

export default SettingsScreen;
