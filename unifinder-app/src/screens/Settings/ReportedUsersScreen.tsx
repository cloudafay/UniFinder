// Şikayet Ettiklerim Ekranı
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants';

interface ReportedUser {
  id: string;
  name: string;
  avatar: string;
  reportReason: string;
  reportedAt: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

const ReportedUsersScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [reportedUsers] = useState<ReportedUser[]>([
    {
      id: '1',
      name: 'Kullanıcı #1842',
      avatar: 'https://i.pravatar.cc/150?img=60',
      reportReason: 'Uygunsuz içerik',
      reportedAt: '5 gün önce',
      status: 'reviewed',
    },
    {
      id: '2',
      name: 'Kullanıcı #2156',
      avatar: 'https://i.pravatar.cc/150?img=61',
      reportReason: 'Spam',
      reportedAt: '2 hafta önce',
      status: 'resolved',
    },
    {
      id: '3',
      name: 'Kullanıcı #3421',
      avatar: 'https://i.pravatar.cc/150?img=62',
      reportReason: 'Taciz',
      reportedAt: '3 hafta önce',
      status: 'pending',
    },
  ]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'İnceleniyor', color: Colors.warning, icon: 'schedule' as const };
      case 'reviewed':
        return { text: 'İncelendi', color: Colors.info, icon: 'visibility' as const };
      case 'resolved':
        return { text: 'Çözüldü', color: Colors.success, icon: 'check-circle' as const };
      default:
        return { text: 'Bilinmiyor', color: colors.textTertiary, icon: 'help' as const };
    }
  };

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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Şikayet Ettiklerim</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="flag" size={20} color={Colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Şikayetleriniz güvenlik ekibimiz tarafından incelenir. Gizlilik nedeniyle alınan aksiyonları paylaşamıyoruz.
          </Text>
        </View>

        {reportedUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="flag" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              Şikayet geçmişi boş
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Henüz bir şikayette bulunmadınız.
            </Text>
          </View>
        ) : (
          <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {reportedUsers.map((user, index) => {
              const statusInfo = getStatusInfo(user.status);
              return (
                <View
                  key={user.id}
                  style={[
                    styles.reportItem,
                    index !== reportedUsers.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                  ]}
                >
                  <View style={styles.reportHeader}>
                    <Image source={{ uri: user.avatar }} style={styles.avatar} />
                    <View style={styles.reportInfo}>
                      <Text style={[styles.userName, { color: colors.textPrimary }]}>{user.name}</Text>
                      <Text style={[styles.reportedAt, { color: colors.textTertiary }]}>
                        {user.reportedAt}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                      <MaterialIcons name={statusInfo.icon} size={14} color={statusInfo.color} />
                      <Text style={[styles.statusText, { color: statusInfo.color }]}>
                        {statusInfo.text}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.reasonContainer}>
                    <Text style={[styles.reasonLabel, { color: colors.textTertiary }]}>Şikayet Sebebi:</Text>
                    <Text style={[styles.reasonText, { color: colors.textSecondary }]}>{user.reportReason}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statsTitle, { color: colors.textPrimary }]}>Şikayet İstatistikleri</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: Colors.warning }]}>1</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>İnceleniyor</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: Colors.info }]}>1</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>İncelendi</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: Colors.success }]}>1</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Çözüldü</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.footerText, { color: colors.textTertiary }]}>
          Şikayetleriniz 90 gün boyunca saklanır.
        </Text>
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  reportItem: {
    padding: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  reportInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  reportedAt: {
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reasonContainer: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 12,
    borderRadius: 8,
  },
  reasonLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginTop: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default ReportedUsersScreen;

