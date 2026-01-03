// Grup Üyeleri Ekranı
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { groupChatService, GroupMember } from '../../services/groupChatService';
import { RootStackParamList } from '../../navigation/types';

type GroupMembersRouteProp = RouteProp<RootStackParamList, 'GroupMembers'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const GroupMembersScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<GroupMembersRouteProp>();
  const { colors } = useTheme();
  const { user } = useAuth();

  const { groupId, groupName } = route.params;

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadMembers = useCallback(async () => {
    try {
      const { data, error } = await groupChatService.getMembers(groupId);
      if (data) {
        setMembers(data);
        const currentUserMember = data.find(m => m.user_id === user?.id);
        setIsAdmin(currentUserMember?.role === 'admin');
      }
    } catch (error) {
      console.error('Üye yükleme hatası:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [groupId, user?.id]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMembers();
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert(
      'Üyeyi Çıkar',
      `${memberName} adlı üyeyi gruptan çıkarmak istediğine emin misin?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkar',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupChatService.removeMember(groupId, memberId, user?.id || '');
              loadMembers();
            } catch (error) {
              Alert.alert('Hata', 'Üye çıkarılamadı');
            }
          },
        },
      ]
    );
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Gruptan Ayrıl',
      'Bu gruptan ayrılmak istediğine emin misin?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Ayrıl',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;
            try {
              await groupChatService.leaveGroup(groupId, user.id);
              navigation.goBack();
              navigation.goBack();
            } catch (error) {
              Alert.alert('Hata', 'Gruptan ayrılamadı');
            }
          },
        },
      ]
    );
  };

  const renderMember = ({ item }: { item: GroupMember }) => {
    const profile = (item as any).profile;
    const isCurrentUser = item.user_id === user?.id;

    return (
      <TouchableOpacity
        style={[styles.memberCard, { backgroundColor: colors.surface }]}
        onPress={() => !isCurrentUser && navigation.navigate('UserProfile', { userId: item.user_id })}
        activeOpacity={isCurrentUser ? 1 : 0.7}
      >
        <Image
          source={{ uri: profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'U')}` }}
          style={styles.avatar}
        />

        <View style={styles.memberContent}>
          <View style={styles.memberHeader}>
            <Text style={[styles.memberName, { color: colors.textPrimary }]}>
              {profile?.full_name || 'Kullanıcı'}
              {isCurrentUser && ' (Sen)'}
            </Text>
            {item.role === 'admin' && (
              <View style={[styles.adminBadge, { backgroundColor: `${colors.primary}20` }]}>
                <Text style={[styles.adminText, { color: colors.primary }]}>Yönetici</Text>
              </View>
            )}
          </View>
          <Text style={[styles.memberInfo, { color: colors.textSecondary }]}>
            {profile?.department || 'Bölüm belirtilmemiş'}
          </Text>
        </View>

        {isAdmin && !isCurrentUser && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveMember(item.user_id, profile?.full_name || 'Kullanıcı')}
          >
            <MaterialIcons name="remove-circle-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{groupName}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {members.length} üye
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Members List */}
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <TouchableOpacity
            style={[styles.leaveButton, { borderColor: '#ef4444' }]}
            onPress={handleLeaveGroup}
          >
            <MaterialIcons name="exit-to-app" size={20} color="#ef4444" />
            <Text style={styles.leaveButtonText}>Gruptan Ayrıl</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: { padding: 8 },
  headerContent: { flex: 1, marginLeft: 8 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  placeholder: { width: 40 },
  listContent: { padding: 16, paddingBottom: 100 },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  memberContent: {
    flex: 1,
    marginLeft: 12,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: { fontSize: 15, fontWeight: '600' },
  adminBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  adminText: { fontSize: 11, fontWeight: '600' },
  memberInfo: { fontSize: 13, marginTop: 2 },
  removeButton: { padding: 8 },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
  },
  leaveButtonText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
});

export default GroupMembersScreen;
