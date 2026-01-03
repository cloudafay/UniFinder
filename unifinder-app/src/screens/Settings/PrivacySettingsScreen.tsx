// Gizlilik ve Güvenlik Ayarları Ekranı
// Instagram/TikTok tarzı modern tasarım

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SettingItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  title: string;
  description?: string;
  value?: string;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  danger?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  iconColor,
  title,
  description,
  value,
  hasSwitch,
  switchValue,
  onToggle,
  onPress,
  danger,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: colors.cardBackground }]}
      onPress={hasSwitch ? undefined : onPress}
      activeOpacity={hasSwitch ? 1 : 0.7}
      disabled={!onPress && !hasSwitch}
    >
      <View style={[styles.settingIcon, { backgroundColor: `${iconColor}20` }]}>
        <MaterialIcons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: danger ? '#ef4444' : colors.textPrimary }]}>
          {title}
        </Text>
        {description && (
          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
      {hasSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: Colors.primary }}
          thumbColor="#fff"
        />
      ) : (
        <View style={styles.settingRight}>
          {value && (
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{value}</Text>
          )}
          <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const PrivacySettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  // Gizlilik Ayarları State'leri
  const [privateAccount, setPrivateAccount] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [showLastSeen, setShowLastSeen] = useState(true);
  const [showDistance, setShowDistance] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);
  const [showReadReceipts, setShowReadReceipts] = useState(true);
  const [hideFromSearch, setHideFromSearch] = useState(false);
  const [showAge, setShowAge] = useState(true);
  const [showDepartment, setShowDepartment] = useState(true);

  // Güvenlik Ayarları
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [blockScreenshots, setBlockScreenshots] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Ambient Background */}
      <View style={[styles.ambientContainer, { pointerEvents: 'none' as const }]}>
        <View style={[styles.ambientBlob, styles.blobTopLeft, { backgroundColor: `${Colors.primary}15` }]} />
        <View style={[styles.ambientBlob, styles.blobBottomRight, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]} />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Gizlilik ve Güvenlik</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hesap Gizliliği */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>HESAP GİZLİLİĞİ</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <SettingItem
              icon="lock"
              iconColor={Colors.primary}
              title="Gizli Hesap"
              description="Sadece onayladığın kişiler profilini görebilir"
              hasSwitch
              switchValue={privateAccount}
              onToggle={setPrivateAccount}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingItem
              icon="visibility-off"
              iconColor="#8b5cf6"
              title="Aramada Gizlen"
              description="Keşfet ekranında görünme"
              hasSwitch
              switchValue={hideFromSearch}
              onToggle={setHideFromSearch}
            />
          </View>
        </View>

        {/* Profil Bilgileri */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PROFİL BİLGİLERİ</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <SettingItem
              icon="cake"
              iconColor="#f59e0b"
              title="Yaşımı Göster"
              description="Profilinde yaşın görünsün"
              hasSwitch
              switchValue={showAge}
              onToggle={setShowAge}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingItem
              icon="school"
              iconColor="#10b981"
              title="Bölümümü Göster"
              description="Okuduğun bölüm görünsün"
              hasSwitch
              switchValue={showDepartment}
              onToggle={setShowDepartment}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingItem
              icon="location-on"
              iconColor="#3b82f6"
              title="Mesafeyi Göster"
              description="Diğer kullanıcılara mesafeni göster"
              hasSwitch
              switchValue={showDistance}
              onToggle={setShowDistance}
            />
          </View>
        </View>

        {/* Aktivite Durumu */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>AKTİVİTE DURUMU</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <SettingItem
              icon="circle"
              iconColor="#22c55e"
              title="Çevrimiçi Durumu"
              description="Aktif olduğunu diğerleri görsün"
              hasSwitch
              switchValue={showOnlineStatus}
              onToggle={setShowOnlineStatus}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingItem
              icon="schedule"
              iconColor="#6366f1"
              title="Son Görülme"
              description="En son ne zaman aktif olduğun görünsün"
              hasSwitch
              switchValue={showLastSeen}
              onToggle={setShowLastSeen}
            />
          </View>
        </View>

        {/* Mesajlaşma */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>MESAJLAŞMA</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <SettingItem
              icon="chat"
              iconColor={Colors.primary}
              title="Mesaj İstekleri"
              description="Sadece eşleşmelerden mesaj al"
              hasSwitch
              switchValue={allowMessages}
              onToggle={setAllowMessages}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingItem
              icon="done-all"
              iconColor="#14b8a6"
              title="Okundu Bilgisi"
              description="Mesajları okuduğunda karşı taraf görsün"
              hasSwitch
              switchValue={showReadReceipts}
              onToggle={setShowReadReceipts}
            />
          </View>
        </View>

        {/* Güvenlik */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>GÜVENLİK</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <SettingItem
              icon="security"
              iconColor="#22c55e"
              title="İki Faktörlü Doğrulama"
              description="Hesabına ekstra güvenlik katmanı ekle"
              hasSwitch
              switchValue={twoFactorAuth}
              onToggle={setTwoFactorAuth}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingItem
              icon="notifications-active"
              iconColor="#f59e0b"
              title="Giriş Uyarıları"
              description="Yeni cihazdan giriş yapıldığında bildirim al"
              hasSwitch
              switchValue={loginAlerts}
              onToggle={setLoginAlerts}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingItem
              icon="no-photography"
              iconColor="#ef4444"
              title="Ekran Görüntüsü Engelle"
              description="Sohbetlerde ekran görüntüsü alınamaz"
              hasSwitch
              switchValue={blockScreenshots}
              onToggle={setBlockScreenshots}
            />
          </View>
        </View>

        {/* Engellenen Hesaplar */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ENGELLEME VE KISITLAMA</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <SettingItem
              icon="block"
              iconColor="#ef4444"
              title="Engellenen Hesaplar"
              description="Engellediğin kullanıcıları yönet"
              value="3"
              onPress={() => navigation.navigate('BlockedUsers')}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingItem
              icon="volume-off"
              iconColor="#f59e0b"
              title="Sessize Alınanlar"
              description="Bildirimleri sessize aldığın hesaplar"
              value="2"
              onPress={() => navigation.navigate('MutedUsers')}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingItem
              icon="report"
              iconColor="#dc2626"
              title="Şikayet Ettiklerim"
              description="Bildirdiğin hesapları gör"
              value="3"
              onPress={() => navigation.navigate('ReportedUsers')}
            />
          </View>
        </View>

        {/* Veri ve Geçmiş */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>VERİ VE GEÇMİŞ</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <SettingItem
              icon="download"
              iconColor="#3b82f6"
              title="Verilerimi İndir"
              description="Tüm verilerinin bir kopyasını al"
              onPress={() => navigation.navigate('DownloadData')}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingItem
              icon="delete-sweep"
              iconColor="#f59e0b"
              title="Arama Geçmişini Temizle"
              description="Tüm arama geçmişini sil"
              onPress={() => navigation.navigate('ClearHistory')}
            />
          </View>
        </View>

        {/* Bilgi */}
        <View style={styles.infoSection}>
          <MaterialIcons name="info-outline" size={20} color={colors.textTertiary} />
          <Text style={[styles.infoText, { color: colors.textTertiary }]}>
            Gizlilik ayarlarınız anında uygulanır. Değişiklikler diğer kullanıcılar tarafından hemen görülür.
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
    ...Platform.select({
      web: {
        filter: 'blur(100px)',
      },
      default: {
        opacity: 0.6,
      },
    }),
  },
  blobTopLeft: {
    top: '-10%',
    left: '-10%',
    width: 400,
    height: 400,
  },
  blobBottomRight: {
    bottom: '-10%',
    right: '-10%',
    width: 350,
    height: 350,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginLeft: 4,
    marginBottom: 10,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
      },
      default: {},
    }),
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 64,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
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
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingValue: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginLeft: 66,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 8,
    marginTop: 8,
    marginBottom: 32,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});

export default PrivacySettingsScreen;

