// Grup Listesi Ekranı
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { groupChatService, GroupChat } from '../../services/groupChatService';
import { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const GroupListScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGroups = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await groupChatService.getMyGroups(user.id);
      if (data) {
        setGroups(data);
      }
    } catch (error) {
      console.error('Grup yükleme hatası:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const onRefresh = () => {
    setRefreshing(true);
    loadGroups();
  };

  const formatLastMessage = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins}dk`;
    if (diffHours < 24) return `${diffHours}sa`;
    if (diffDays < 7) return `${diffDays}g`;
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const renderGroup = ({ item }: { item: GroupChat }) => (
    <TouchableOpacity
      style={[styles.groupCard, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('GroupChat', { groupId: item.id, groupName: item.name })}
      activeOpacity={0.7}
    >
      {(item.image_url || item.avatar_url) ? (
        <Image source={{ uri: item.image_url || item.avatar_url || '' }} style={styles.groupImage} />
      ) : (
        <View style={[styles.groupImagePlaceholder, { backgroundColor: `${colors.primary}20` }]}>
          <MaterialIcons name="group" size={28} color={colors.primary} />
        </View>
      )}
      
      <View style={styles.groupContent}>
        <View style={styles.groupHeader}>
          <Text style={[styles.groupName, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.last_message_at && (
            <Text style={[styles.lastTime, { color: colors.textTertiary }]}>
              {formatLastMessage(item.last_message_at)}
            </Text>
          )}
        </View>
        
        <View style={styles.groupMeta}>
          <MaterialIcons name="people" size={14} color={colors.textSecondary} />
          <Text style={[styles.memberCount, { color: colors.textSecondary }]}>
            {item.member_count} üye
          </Text>
          {item.description && (
            <Text style={[styles.groupDescription, { color: colors.textTertiary }]} numberOfLines={1}>
              • {item.description}
            </Text>
          )}
        </View>
      </View>
      
      <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Gruplar</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('CreateGroup' as never)} 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Groups List */}
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={renderGroup}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="group" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                Henüz Grup Yok
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Arkadaşlarınla grup oluştur ve sohbet et!
              </Text>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('CreateGroup' as never)}
              >
                <MaterialIcons name="add" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Grup Oluştur</Text>
              </TouchableOpacity>
            </View>
          ) : null
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { padding: 16, paddingBottom: 100 },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  groupImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  groupImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupContent: {
    flex: 1,
    marginLeft: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupName: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  lastTime: { fontSize: 12 },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCount: { fontSize: 13 },
  groupDescription: { fontSize: 13, flex: 1 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptyText: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  createButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

export default GroupListScreen;
