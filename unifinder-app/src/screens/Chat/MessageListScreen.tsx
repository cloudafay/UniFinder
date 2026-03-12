// Message List Screen - Özel Mesajlar + Grup Sohbetleri Birleşik
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import matchService from '../../services/matchService';
import { chatService } from '../../services/chatService';
import { groupChatService, GroupChat } from '../../services/groupChatService';

// Birleşik konuşma tipi
type ConversationType = {
  id: string;
  type: 'private' | 'group';
  name: string;
  photo: string;
  lastMessage: string;
  time: string;
  timestamp: number; // Sıralama için
  unread: number;
  isOnline: boolean;
  isNewMatch: boolean;
  memberCount?: number; // Grup için
};

interface ConversationItemProps {
  conversation: ConversationType;
  onPress: () => void;
  colors: any;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, onPress, colors }) => (
  <TouchableOpacity 
    style={[styles.conversationItem, { backgroundColor: colors.surface }]} 
    onPress={onPress} 
    activeOpacity={0.7}
  >
    <View style={styles.avatarContainer}>
      {conversation.type === 'group' ? (
        conversation.photo ? (
          <Image source={{ uri: conversation.photo }} style={styles.avatar} />
        ) : (
          <View style={[styles.groupAvatarPlaceholder, { backgroundColor: `${colors.primary}20` }]}>
            <MaterialIcons name="group" size={24} color={colors.primary} />
          </View>
        )
      ) : (
        <Image source={{ uri: conversation.photo }} style={styles.avatar} />
      )}
      {conversation.type === 'private' && conversation.isOnline && (
        <View style={styles.onlineIndicator} />
      )}
      {conversation.type === 'group' && (
        <View style={[styles.groupBadge, { backgroundColor: colors.primary }]}>
          <MaterialIcons name="group" size={10} color="#fff" />
        </View>
      )}
    </View>
    <View style={styles.conversationContent}>
      <View style={styles.conversationHeader}>
        <View style={styles.nameContainer}>
          <Text style={[styles.userName, { color: colors.textPrimary }]} numberOfLines={1}>
            {conversation.name}
          </Text>
          {conversation.type === 'group' && conversation.memberCount && (
            <Text style={[styles.memberCount, { color: colors.textTertiary }]}>
              {conversation.memberCount} üye
            </Text>
          )}
        </View>
        <Text style={[styles.timeText, conversation.unread > 0 && styles.timeTextUnread]}>
          {conversation.time}
        </Text>
      </View>
      <View style={styles.messageRow}>
        <Text
          style={[styles.lastMessage, { color: colors.textSecondary }, conversation.unread > 0 && styles.lastMessageUnread]}
          numberOfLines={1}
        >
          {conversation.lastMessage || (conversation.type === 'group' ? 'Gruba katıldın' : 'Mesaj yok')}
        </Text>
        {conversation.unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{conversation.unread}</Text>
          </View>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

type MessageListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;

const MessageListScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MessageListNavigationProp>();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [privateConversations, setPrivateConversations] = useState<ConversationType[]>([]);
  const [groupConversations, setGroupConversations] = useState<ConversationType[]>([]);
  const [newMatches, setNewMatches] = useState<ConversationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'private' | 'groups'>('all');

  // Zaman formatla
  const formatTime = (dateString: string | null): string => {
    if (!dateString) return 'Yeni';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins} dk`;
    if (diffHours < 24) return `${diffHours} sa`;
    if (diffDays === 1) return 'Dün';
    if (diffDays < 7) return `${diffDays} gün`;
    return date.toLocaleDateString('tr-TR');
  };

  // Tüm konuşmaları yükle (özel + grup)
  const loadAllConversations = useCallback(async () => {
    if (!user) return;

    try {
      const privateList: ConversationType[] = [];
      const groupList: ConversationType[] = [];
      const newMatchesList: ConversationType[] = [];

      // 1. Özel mesajları yükle
      const { data: matches, error: matchError } = await matchService.getMyMatches(user.id);
      
      if (!matchError && matches && matches.length > 0) {
        const privateConvs = await Promise.all(
          matches.map(async (match: any) => {
            const { data: messages } = await chatService.getMessages(match.id, 1, 0);
            const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;
            const { count: unreadCount } = await chatService.getUnreadCount(match.id, user.id);

            const otherUser = match.otherUser;
            const photoUrl = otherUser?.photos?.[0] || otherUser?.avatar_url || 'https://via.placeholder.com/100';
            const lastMessageTime = lastMessage?.created_at || match.created_at;

            return {
              id: match.id,
              type: 'private' as const,
              name: otherUser?.display_name || otherUser?.full_name || 'Kullanıcı',
              photo: photoUrl,
              lastMessage: lastMessage?.content || '',
              time: formatTime(lastMessageTime),
              timestamp: new Date(lastMessageTime).getTime(),
              unread: unreadCount || 0,
              isOnline: false,
              isNewMatch: !lastMessage,
            };
          })
        );

        // Yeni eşleşmeleri ayır
        privateConvs.forEach(conv => {
          if (conv.isNewMatch) {
            newMatchesList.push(conv);
          } else {
            privateList.push(conv);
          }
        });
      }

      // 2. Grup sohbetlerini yükle
      console.log('Loading groups for user:', user.id);
      const { data: groups, error: groupError } = await groupChatService.getMyGroups(user.id);
      console.log('Groups loaded:', groups, 'Error:', groupError);
      
      if (!groupError && groups && groups.length > 0) {
        const groupConvs = groups.map((group: GroupChat) => ({
          id: group.id,
          type: 'group' as const,
          name: group.name,
          photo: group.avatar_url || '',
          lastMessage: group.description || 'Gruba katıldın',
          time: formatTime(group.last_message_at || group.created_at),
          timestamp: new Date(group.last_message_at || group.created_at || Date.now()).getTime(),
          unread: 0,
          isOnline: false,
          isNewMatch: false,
          memberCount: group.member_count,
        }));

        groupList.push(...groupConvs);
      }

      // Sırala
      privateList.sort((a, b) => b.timestamp - a.timestamp);
      groupList.sort((a, b) => b.timestamp - a.timestamp);

      setPrivateConversations(privateList);
      setGroupConversations(groupList);
      setNewMatches(newMatchesList);

    } catch (err) {
      console.error('Konuşmalar yüklenirken hata:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Sayfa açıldığında yükle
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadAllConversations();
    }, [loadAllConversations])
  );

  // Pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadAllConversations();
  };

  const handleConversationPress = (conversation: ConversationType) => {
    if (conversation.type === 'group') {
      navigation.navigate('GroupChat', {
        groupId: conversation.id,
        groupName: conversation.name,
      });
    } else {
      navigation.navigate('Chat', {
        matchId: conversation.id,
        userName: conversation.name,
        userPhoto: conversation.photo,
      });
    }
  };

  // Filtrelenmiş konuşmalar
  const getFilteredConversations = () => {
    let list: ConversationType[] = [];
    
    if (activeTab === 'all') {
      list = [...privateConversations, ...groupConversations].sort((a, b) => b.timestamp - a.timestamp);
    } else if (activeTab === 'private') {
      list = privateConversations;
    } else {
      list = groupConversations;
    }

    if (searchQuery) {
      list = list.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return list;
  };

  const filteredConversations = getFilteredConversations();

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Mesajlar yükleniyor...</Text>
      </View>
    );
  }



  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Background Blobs */}
      <View style={styles.backgroundBlobs}>
        <View style={[styles.blob, styles.blobTop]} />
        <View style={[styles.blob, styles.blobBottom]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        {showSearch ? (
          <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Mesajlarda ara..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(''); }}>
              <MaterialIcons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Mesajlar</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowSearch(true)}
              >
                <MaterialIcons name="search" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => navigation.navigate('CreateGroup' as never)}
              >
                <MaterialIcons name="group-add" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => navigation.navigate('NotificationCenter')}
              >
                <MaterialIcons name="notifications-none" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* New Matches Section */}
      {newMatches.length > 0 && !showSearch && (
        <View style={styles.matchesSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>YENİ EŞLEŞMELER</Text>
          <FlatList
            horizontal
            data={newMatches}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.matchesList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.matchItem}
                onPress={() => handleConversationPress(item)}
              >
                <View style={styles.matchAvatarContainer}>
                  <Image source={{ uri: item.photo }} style={styles.matchAvatar} />
                  {item.isOnline && <View style={styles.matchOnlineIndicator} />}
                </View>
                <Text style={[styles.matchName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {item.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Tab Selector - HER ZAMAN GÖRÜNSÜN */}
      {!showSearch && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'all' && styles.tabActive,
              { borderColor: activeTab === 'all' ? Colors.primary : colors.border }
            ]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'all' ? Colors.primary : colors.textSecondary }
            ]}>
              Tümü
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'private' && styles.tabActive,
              { borderColor: activeTab === 'private' ? Colors.primary : colors.border }
            ]}
            onPress={() => setActiveTab('private')}
          >
            <MaterialIcons 
              name="person" 
              size={16} 
              color={activeTab === 'private' ? Colors.primary : colors.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'private' ? Colors.primary : colors.textSecondary }
            ]}>
              Özel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'groups' && styles.tabActive,
              { borderColor: activeTab === 'groups' ? Colors.primary : colors.border }
            ]}
            onPress={() => setActiveTab('groups')}
          >
            <MaterialIcons 
              name="group" 
              size={16} 
              color={activeTab === 'groups' ? Colors.primary : colors.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'groups' ? Colors.primary : colors.textSecondary }
            ]}>
              Gruplar
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* All Conversations List */}
      <View style={styles.conversationsContainer}>
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.conversationsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          renderItem={({ item }) => (
            <ConversationItem
              conversation={item}
              onPress={() => handleConversationPress(item)}
              colors={colors}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="chat-bubble-outline" size={60} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {activeTab === 'groups' ? 'Henüz grup yok' : activeTab === 'private' ? 'Henüz mesaj yok' : 'Henüz konuşma yok'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {activeTab === 'groups' 
                  ? 'Yeni bir grup oluşturabilirsin!' 
                  : 'Keşfet sayfasından eşleşme bul!'}
              </Text>
              {activeTab !== 'private' && (
                <TouchableOpacity
                  style={[styles.createGroupButton, { backgroundColor: Colors.primary }]}
                  onPress={() => navigation.navigate('CreateGroup' as never)}
                >
                  <MaterialIcons name="group-add" size={20} color="#fff" />
                  <Text style={styles.createGroupButtonText}>Grup Oluştur</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundBlobs: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  blobTop: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
    backgroundColor: 'rgba(19, 55, 236, 0.08)',
  },
  blobBottom: {
    width: 250,
    height: 250,
    bottom: 100,
    left: -100,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingHorizontal: 16,
    height: 44,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  matchesSection: {
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 12,
    letterSpacing: 1,
  },
  matchesList: {
    paddingHorizontal: 16,
  },
  matchItem: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: 68,
  },
  matchAvatarContainer: {
    position: 'relative',
  },
  matchAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  matchOnlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#fff',
  },
  matchName: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  conversationsContainer: {
    flex: 1,
    marginTop: 16,
  },
  conversationsList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  groupAvatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#fff',
  },
  groupBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  memberCount: {
    fontSize: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  timeTextUnread: {
    color: Colors.primary,
    fontWeight: '600',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
  },
  lastMessageUnread: {
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  separator: {
    height: 8,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  createGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 24,
  },
  createGroupButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  noConversations: {
    padding: 24,
    alignItems: 'center',
  },
  noConversationsText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabActive: {
    backgroundColor: `${Colors.primary}15`,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default MessageListScreen;
