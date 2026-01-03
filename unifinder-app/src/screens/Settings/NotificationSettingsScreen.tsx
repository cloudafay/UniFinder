// Bildirim Ayarları Ekranı
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants';
import pushNotificationService from '../../services/pushNotificationService';

interface NotificationSetting {
  id: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  title: string;
  description: string;
  enabled: boolean;
}

const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Bildirim Ayarları
  const [pushEnabled, setPushEnabled] = useState(true);
  const [matchNotifications, setMatchNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [likeNotifications, setLikeNotifications] = useState(true);
  const [superLikeNotifications, setSuperLikeNotifications] = useState(true);
  const [reminderNotifications, setReminderNotifications] = useState(false);
  const [promotionNotifications, setPromotionNotifications] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleTestNotification = async () => {
    try {
      await pushNotificationService.sendLocalNotification(
        'Test Bildirimi 🔔',
        'Bu bir test bildirimidir. Bildirimleriniz çalışıyor!'
      );
      showAlert('Başarılı', 'Test bildirimi gönderildi!');
    } catch (error) {
      showAlert('Hata', 'Bildirim gönderilemedi. Lütfen bildirim izinlerini kontrol edin.');
    }
  };

  const renderSettingItem = (
    icon: keyof typeof MaterialIcons.glyphMap,
    iconColor: string,
    title: string,
    description: string,
    value: boolean,
    onToggle: (val: boolean) => void,
    disabled?: boolean
  ) => (
    <View style={[styles.settingItem, disabled && styles.settingItemDisabled]}>
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
        <MaterialIcons name={icon} size={22} color={disabled ? colors.textTertiary : iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: disabled ? colors.textTertiary : colors.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: Colors.primary }}
        thumbColor="#fff"
        disabled={disabled}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Bildirim Ayarları</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Ana Bildirim Kontrolü */}
        <View style={[styles.mainToggleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.mainToggleContent}>
            <View style={[styles.mainIconContainer, { backgroundColor: Colors.primary + '20' }]}>
              <MaterialIcons name="notifications" size={28} color={Colors.primary} />
            </View>
            <View style={styles.mainToggleText}>
              <Text style={[styles.mainToggleTitle, { color: colors.textPrimary }]}>
                Push Bildirimleri
              </Text>
              <Text style={[styles.mainToggleDesc, { color: colors.textSecondary }]}>
                Tüm bildirimleri aç/kapat
              </Text>
            </View>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: colors.border, true: Colors.primary }}
            thumbColor="#fff"
          />
        </View>

        {/* Test Butonu */}
        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: Colors.primary }]}
          onPress={handleTestNotification}
        >
          <MaterialIcons name="send" size={20} color="#fff" />
          <Text style={styles.testButtonText}>Test Bildirimi Gönder</Text>
        </TouchableOpacity>

        {/* Etkileşim Bildirimleri */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ETKİLEŞİM BİLDİRİMLERİ</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {renderSettingItem(
            'favorite',
            '#ef4444',
            'Yeni Eşleşmeler',
            'Biriyle eşleştiğinde bildirim al',
            matchNotifications,
            setMatchNotifications,
            !pushEnabled
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem(
            'chat',
            '#3b82f6',
            'Mesajlar',
            'Yeni mesaj geldiğinde bildirim al',
            messageNotifications,
            setMessageNotifications,
            !pushEnabled
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem(
            'thumb-up',
            '#22c55e',
            'Beğeniler',
            'Biri seni beğendiğinde bildirim al',
            likeNotifications,
            setLikeNotifications,
            !pushEnabled
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem(
            'star',
            '#f59e0b',
            'Süper Beğeniler',
            'Biri sana süper beğeni gönderdiğinde',
            superLikeNotifications,
            setSuperLikeNotifications,
            !pushEnabled
          )}
        </View>

        {/* Sistem Bildirimleri */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SİSTEM BİLDİRİMLERİ</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {renderSettingItem(
            'schedule',
            '#8b5cf6',
            'Hatırlatıcılar',
            'Uygulamayı kullanma hatırlatıcıları',
            reminderNotifications,
            setReminderNotifications,
            !pushEnabled
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem(
            'local-offer',
            '#06b6d4',
            'Promosyonlar',
            'Kampanya ve fırsatlar hakkında bildirimler',
            promotionNotifications,
            setPromotionNotifications,
            !pushEnabled
          )}
        </View>

        {/* Bildirim Şekli */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>BİLDİRİM ŞEKLİ</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {renderSettingItem(
            'volume-up',
            '#f59e0b',
            'Ses',
            'Bildirim sesi çalsın',
            soundEnabled,
            setSoundEnabled,
            !pushEnabled
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {renderSettingItem(
            'vibration',
            '#10b981',
            'Titreşim',
            'Bildirimde telefon titresin',
            vibrationEnabled,
            setVibrationEnabled,
            !pushEnabled
          )}
        </View>

        {/* E-posta Bildirimleri */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>E-POSTA BİLDİRİMLERİ</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {renderSettingItem(
            'email',
            '#6366f1',
            'E-posta Bildirimleri',
            'Önemli güncellemeleri e-posta ile al',
            emailNotifications,
            setEmailNotifications
          )}
        </View>

        {/* Bilgi */}
        <View style={styles.infoSection}>
          <MaterialIcons name="info-outline" size={18} color={colors.textTertiary} />
          <Text style={[styles.infoText, { color: colors.textTertiary }]}>
            Bildirim ayarlarını değiştirmek anında etkili olur. Sistem bildirimleri için cihaz ayarlarınızı kontrol etmeniz gerekebilir.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  mainToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  mainToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mainIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  mainToggleText: {
    flex: 1,
  },
  mainToggleTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  mainToggleDesc: {
    fontSize: 13,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 30,
    marginBottom: 24,
    gap: 8,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginLeft: 4,
    marginBottom: 10,
    marginTop: 8,
  },
  settingsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingContent: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  settingDescription: {
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginLeft: 70,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});

export default NotificationSettingsScreen;

