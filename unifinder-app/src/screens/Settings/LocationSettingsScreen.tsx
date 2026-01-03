// Konum Ayarları Ekranı
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLocation } from '../../context/LocationContext';
import { Colors } from '../../constants';

const LocationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { location, permissionStatus, requestLocation } = useLocation();

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestLocation();
    if (granted) {
      showAlert('Başarılı', 'Konum izni verildi ve konumunuz güncellendi.');
    } else {
      showAlert('İzin Verilmedi', 'Konum izni reddedildi. Ayarlardan manuel olarak izin verebilirsiniz.');
    }
  };

  const handleOpenSettings = () => {
    if (Platform.OS === 'web') {
      showAlert('Tarayıcı Ayarları', 'Konum izni için tarayıcınızın adres çubuğundaki kilit ikonuna tıklayın.');
    } else {
      Linking.openSettings();
    }
  };

  const getStatusInfo = () => {
    switch (permissionStatus) {
      case 'granted':
        return {
          icon: 'check-circle' as const,
          color: Colors.success,
          title: 'Konum İzni Verildi',
          description: 'Konumunuz paylaşılıyor ve yakındaki kullanıcıları görebilirsiniz.',
        };
      case 'denied':
        return {
          icon: 'cancel' as const,
          color: Colors.error,
          title: 'Konum İzni Reddedildi',
          description: 'Konum izni olmadan yakındaki kullanıcıları göremezsiniz.',
        };
      default:
        return {
          icon: 'help' as const,
          color: Colors.warning,
          title: 'Konum İzni Bekleniyor',
          description: 'Yakındaki kullanıcıları görmek için konum izni verin.',
        };
    }
  };

  const statusInfo = getStatusInfo();

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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Konum Ayarları</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: statusInfo.color + '10', borderColor: statusInfo.color + '30' }]}>
          <View style={[styles.statusIcon, { backgroundColor: statusInfo.color + '20' }]}>
            <MaterialIcons name={statusInfo.icon} size={40} color={statusInfo.color} />
          </View>
          <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>
            {statusInfo.title}
          </Text>
          <Text style={[styles.statusDescription, { color: colors.textSecondary }]}>
            {statusInfo.description}
          </Text>
          
          {permissionStatus !== 'granted' && (
            <TouchableOpacity
              style={[styles.permissionButton, { backgroundColor: Colors.primary }]}
              onPress={handleRequestPermission}
            >
              <MaterialIcons name="my-location" size={20} color="#fff" />
              <Text style={styles.permissionButtonText}>Konum İzni Ver</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Current Location */}
        {location && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>MEVCUT KONUM</Text>
            <View style={[styles.locationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.locationRow}>
                <MaterialIcons name="location-on" size={22} color={Colors.primary} />
                <View style={styles.locationInfo}>
                  <Text style={[styles.locationLabel, { color: colors.textSecondary }]}>Koordinatlar</Text>
                  <Text style={[styles.locationValue, { color: colors.textPrimary }]}>
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </Text>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.locationRow}>
                <MaterialIcons name="update" size={22} color={Colors.info} />
                <View style={styles.locationInfo}>
                  <Text style={[styles.locationLabel, { color: colors.textSecondary }]}>Son Güncelleme</Text>
                  <Text style={[styles.locationValue, { color: colors.textPrimary }]}>
                    Şimdi
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.refreshButton, { borderColor: Colors.primary }]}
                  onPress={handleRequestPermission}
                >
                  <MaterialIcons name="refresh" size={18} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* Why We Need Location */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>KONUMUNUZU NEDEN İSTİYORUZ?</Text>
        <View style={[styles.reasonsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.reasonItem}>
            <View style={[styles.reasonIcon, { backgroundColor: Colors.primary + '15' }]}>
              <MaterialIcons name="explore" size={22} color={Colors.primary} />
            </View>
            <View style={styles.reasonContent}>
              <Text style={[styles.reasonTitle, { color: colors.textPrimary }]}>Yakındaki Kullanıcılar</Text>
              <Text style={[styles.reasonDesc, { color: colors.textSecondary }]}>
                Size yakın üniversite öğrencilerini keşfedin
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.reasonItem}>
            <View style={[styles.reasonIcon, { backgroundColor: '#22c55e15' }]}>
              <MaterialIcons name="school" size={22} color="#22c55e" />
            </View>
            <View style={styles.reasonContent}>
              <Text style={[styles.reasonTitle, { color: colors.textPrimary }]}>Kampüs Etkinlikleri</Text>
              <Text style={[styles.reasonDesc, { color: colors.textSecondary }]}>
                Yakınınızdaki etkinliklerden haberdar olun
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.reasonItem}>
            <View style={[styles.reasonIcon, { backgroundColor: '#f59e0b15' }]}>
              <MaterialIcons name="place" size={22} color="#f59e0b" />
            </View>
            <View style={styles.reasonContent}>
              <Text style={[styles.reasonTitle, { color: colors.textPrimary }]}>Mesafe Gösterimi</Text>
              <Text style={[styles.reasonDesc, { color: colors.textSecondary }]}>
                Eşleşmelerin ne kadar uzakta olduğunu görün
              </Text>
            </View>
          </View>
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <MaterialIcons name="lock" size={18} color={colors.textTertiary} />
          <Text style={[styles.privacyText, { color: colors.textTertiary }]}>
            Konumunuz sadece eşleşme amacıyla kullanılır ve üçüncü taraflarla paylaşılmaz.
          </Text>
        </View>

        {/* Open Settings */}
        <TouchableOpacity
          style={[styles.settingsButton, { borderColor: colors.border }]}
          onPress={handleOpenSettings}
        >
          <MaterialIcons name="settings" size={20} color={colors.textSecondary} />
          <Text style={[styles.settingsButtonText, { color: colors.textSecondary }]}>
            Cihaz Ayarlarını Aç
          </Text>
        </TouchableOpacity>
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
  statusCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 10,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginLeft: 4,
    marginBottom: 12,
  },
  locationCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  locationValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  reasonsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  reasonIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonContent: {
    flex: 1,
  },
  reasonTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  reasonDesc: {
    fontSize: 13,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 20,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
    gap: 10,
  },
  settingsButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});

export default LocationSettingsScreen;

