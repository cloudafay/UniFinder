// Sessize Alınanlar Ekranı
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

interface MutedUser {
  id: string;
  name: string;
  avatar: string;
  university: string;
  mutedAt: string;
  muteType: 'messages' | 'stories' | 'both';
}

const MutedUsersScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [mutedUsers, setMutedUsers] = useState<MutedUser[]>([
    {
      id: '1',
      name: 'Elif B.',
      avatar: 'https://i.pravatar.cc/150?img=5',
      university: 'Hacettepe Üniversitesi',
      mutedAt: '3 gün önce',
      muteType: 'messages',
    },
    {
      id: '2',
      name: 'Can D.',
      avatar: 'https://i.pravatar.cc/150?img=12',
      university: 'İTÜ',
      mutedAt: '1 hafta önce',
      muteType: 'both',
    },
  ]);

  const getMuteTypeText = (type: string) => {
    switch (type) {
      case 'messages': return 'Mesajlar sessize alındı';
      case 'stories': return 'Hikayeler sessize alındı';
      case 'both': return 'Mesajlar ve hikayeler sessize alındı';
      default: return '';
    }
  };

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

  const handleUnmute = (user: MutedUser) => {
    showAlert(
      'Sesi Aç',
      `${user.name} adlı kullanıcının sesini açmak istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sesi Aç',
          onPress: () => {
            setMutedUsers(prev => prev.filter(u => u.id !== user.id));
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Sessize Alınanlar</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="volume-off" size={20} color={Colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Sessize aldığınız kişilerden bildirim almaz ve mesajlarını ana listede görmezsiniz. Ancak yine de mesaj gönderebilirler.
          </Text>
        </View>

        {mutedUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="volume-up" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              Sessize alınan hesap yok
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Henüz kimseyi sessize almadığınız görülüyor.
            </Text>
          </View>
        ) : (
          <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {mutedUsers.map((user, index) => (
              <View
                key={user.id}
                style={[
                  styles.userItem,
                  index !== mutedUsers.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                ]}
              >
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: colors.textPrimary }]}>{user.name}</Text>
                  <Text style={[styles.userUniversity, { color: colors.textSecondary }]}>{user.university}</Text>
                  <View style={styles.muteTypeContainer}>
                    <MaterialIcons name="volume-off" size={12} color={Colors.warning} />
                    <Text style={[styles.muteType, { color: Colors.warning }]}>
                      {getMuteTypeText(user.muteType)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.unmuteButton, { borderColor: Colors.primary }]}
                  onPress={() => handleUnmute(user)}
                >
                  <Text style={[styles.unmuteText, { color: Colors.primary }]}>Sesi Aç</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.footerText, { color: colors.textTertiary }]}>
          Sessize aldığınız kişiler bunu bilmez.
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
    marginBottom: 4,
  },
  muteTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  muteType: {
    fontSize: 12,
  },
  unmuteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  unmuteText: {
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

export default MutedUsersScreen;

