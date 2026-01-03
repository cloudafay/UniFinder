// Engellenen Hesaplar Ekranı
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants';

interface BlockedUser {
  id: string;
  name: string;
  avatar: string;
  university: string;
  blockedAt: string;
}

const BlockedUsersScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Mock data - gerçek uygulamada Supabase'den çekilecek
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([
    {
      id: '1',
      name: 'Ahmet Y.',
      avatar: 'https://i.pravatar.cc/150?img=11',
      university: 'İstanbul Üniversitesi',
      blockedAt: '2 gün önce',
    },
    {
      id: '2',
      name: 'Zeynep K.',
      avatar: 'https://i.pravatar.cc/150?img=23',
      university: 'Boğaziçi Üniversitesi',
      blockedAt: '1 hafta önce',
    },
    {
      id: '3',
      name: 'Mehmet S.',
      avatar: 'https://i.pravatar.cc/150?img=33',
      university: 'ODTÜ',
      blockedAt: '2 hafta önce',
    },
  ]);

  const showAlert = (title: string, message: string, buttons?: any[]) => {
    if (Platform.OS === 'web') {
      if (buttons && buttons.length > 1) {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed && buttons[1]?.onPress) {
          buttons[1].onPress();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  const handleUnblock = (user: BlockedUser) => {
    showAlert(
      'Engeli Kaldır',
      `${user.name} adlı kullanıcının engelini kaldırmak istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Engeli Kaldır',
          style: 'destructive',
          onPress: () => {
            setBlockedUsers(prev => prev.filter(u => u.id !== user.id));
          },
        },
      ]
    );
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Engellenen Hesaplar</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="info-outline" size={20} color={Colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Engellediğiniz kişiler size mesaj gönderemez, profilinizi göremez ve sizi keşfedemez.
          </Text>
        </View>

        {blockedUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="block" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              Engellenen hesap yok
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Henüz kimseyi engellemediğiniz görülüyor.
            </Text>
          </View>
        ) : (
          <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {blockedUsers.map((user, index) => (
              <View
                key={user.id}
                style={[
                  styles.userItem,
                  index !== blockedUsers.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                ]}
              >
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: colors.textPrimary }]}>{user.name}</Text>
                  <Text style={[styles.userUniversity, { color: colors.textSecondary }]}>{user.university}</Text>
                  <Text style={[styles.blockedAt, { color: colors.textTertiary }]}>
                    Engellendi: {user.blockedAt}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.unblockButton, { borderColor: Colors.error }]}
                  onPress={() => handleUnblock(user)}
                >
                  <Text style={[styles.unblockText, { color: Colors.error }]}>Engeli Kaldır</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.footerText, { color: colors.textTertiary }]}>
          Engellediğiniz kişiler, engellendiğini bilmez.
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
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userUniversity: {
    fontSize: 13,
    marginBottom: 2,
  },
  blockedAt: {
    fontSize: 12,
  },
  unblockButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  unblockText: {
    fontSize: 13,
    fontWeight: '600',
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

export default BlockedUsersScreen;

