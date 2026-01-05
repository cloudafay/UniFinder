// Message List Screen - Supabase Entegrasyonu
import React, { useState, useEffect, useCallback } from 'react';
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
  Animated,
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
import { notificationService } from '../../services/notificationService';

// Konuşma tipi
type ConversationType = {
  id: string;
  user: {
    name: string;
    photo: string;
    department: string;
  };
  lastMessage: string;
  time: string;
  unread: number;
  isOnline: boolean;
  isNewMatch: boolean; // Henüz mesajlaşılmamış
};

interface ConversationItemProps {
  conversation: ConversationType;
  onPress: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, onPress }) => (
  <TouchableOpacity style={styles.conversationItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.avatarContainer}>
      {conversation.user.photo ? (
        <Image source={{ uri: conversation.user.photo }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
            {conversation.user.name?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
      )}
      {conversation.isOnline && <View style={styles.onlineIndicator} />}
    </View>
    <View style={styles.conversationContent}>
      <View style={styles.conversationHeader}>
        <Text style={styles.userName}>{conversation.user.name}</Text>
        <Text style={[styles.timeText, conversation.unread > 0 && styles.timeTextUnread]}>
          {conversation.time}
        </Text>
      </View>
      <View style={styles.messageRow}>
        <Text
          style={[styles.lastMessage, conversation.unread > 0 && styles.lastMessageUnread]}
          numberOfLines={1}
        >
          {conversation.lastMessage}
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

  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [newMatches, setNewMatches] = useState<ConversationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState<'direct' | 'groups'>('direct');
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

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

  // Eşleşmeleri ve son mesajları yükle
  const loadConversations = useCallback(async () => {
    console.log('📬 loadConversations başladı');
    if (!user) {
      console.log('⚠️ User yok, loadConversations atlanıyor');
      return;
    }

    try {
      console.log('📬 Eşleşmeler ve gruplar yükleniyor - userId:', user.id);
      // Tüm eşleşmeleri al
      const { data: matches, error } = await matchService.getMyMatches(user.id);

      if (error) {
        console.error('Eşleşmeler yüklenemedi:', error);
        // Hata olsa bile grupları yüklemeye devam et
      }

      // Eşleşmeler yoksa bile grupları yükle - ERKEN RETURN YAPMA!
      if (!matches || matches.length === 0) {
        console.log('📬 Eşleşme yok, ama grupları yüklemeye devam ediyorum');
        setConversations([]);
        setNewMatches([]);
        // GRUPLAR İÇİN DEVAM ET - return YAPMA!
      } else {
        // Her eşleşme için son mesajı ve okunmamış sayısını al
        const conversationPromises = matches.map(async (match: any) => {
          // Son mesajı al
          const { data: messages } = await chatService.getMessages(match.id, 1, 0);
          const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;

          // Okunmamış mesaj sayısını al
          const { count: unreadCount } = await chatService.getUnreadCount(match.id, user.id);

          const otherUser = match.otherUser;
          // Supabase URL'leri veya geçerli http/https URL'lerini kullan, geçersiz URL'leri filtrele
          const rawPhoto = otherUser?.photos?.[0] || otherUser?.avatar_url;
          const photoUrl = rawPhoto && (rawPhoto.startsWith('http://') || rawPhoto.startsWith('https://')) ? rawPhoto : undefined;

          return {
            id: match.id,
            user: {
              name: otherUser?.display_name || 'Kullanıcı',
              photo: photoUrl,
              department: otherUser?.department || '',
            },
            lastMessage: lastMessage?.content || '',
            time: formatTime(lastMessage?.created_at || match.created_at),
            unread: unreadCount || 0,
            isOnline: false, // TODO: Online durumu için realtime gerekli
            isNewMatch: !lastMessage, // Mesaj yoksa yeni eşleşme
          } as ConversationType;
        });

        const allConversations = await Promise.all(conversationPromises);

        // Yeni eşleşmeleri ayır (henüz mesajlaşılmamış)
        const newOnes = allConversations.filter(c => c.isNewMatch);
        const withMessages = allConversations.filter(c => !c.isNewMatch);

        setNewMatches(newOnes);
        setConversations(withMessages);
      }

      // Grupları getir
      console.log('🔵 Grupları yüklemeye başlıyorum - userId:', user.id);
      const { data: myGroups, error: groupsError } = await groupChatService.getMyGroups(user.id);
      console.log('🔵 getMyGroups sonucu:', { myGroups, groupsError, count: myGroups?.length });

      if (groupsError) {
        console.error('❌ Grup yükleme hatası:', groupsError);
      }

      if (myGroups && myGroups.length > 0) {
        console.log('🔵 Gruplar bulundu, detayları yükleniyor...');
        const groupPromises = myGroups.map(async (group) => {
          // Grubun son mesajını al
          const { data: messages } = await groupChatService.getMessages(group.id, 1);
          const lastMessage = messages && messages.length > 0 ? messages[0] : undefined;

          return {
            ...group,
            lastMessage
          };
        });

        const groupsWithMessages = await Promise.all(groupPromises);
        setGroups(groupsWithMessages);
      }

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
      loadConversations();
      
      // Okunmamış bildirim sayısını yükle
      const loadUnreadCount = async () => {
        if (user?.id) {
          const { count } = await notificationService.getUnreadCount(user.id);
          setUnreadNotificationCount(count || 0);
        }
      };
      loadUnreadCount();
    }, [loadConversations])
  );

  // Pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const handleConversationPress = (conversation: ConversationType) => {
    navigation.navigate('Chat', {
      matchId: conversation.id,
      userName: conversation.user.name,
      userPhoto: conversation.user.photo,
    });
  };

  const handleGroupPress = (group: GroupChat) => {
    navigation.navigate('GroupChat', {
      groupId: group.id,
      groupName: group.name,
    });
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Mesajlar yükleniyor...</Text>
      </View>
    );
  }

  // Boş state - hiç eşleşme ve grup yok
  if (conversations.length === 0 && newMatches.length === 0 && groups.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={styles.backgroundBlobs}>
          <View style={[styles.blob, styles.blobTop]} />
          <View style={[styles.blob, styles.blobBottom]} />
        </View>
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Mesajlar</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowSearch(true)}
            >
              <MaterialIcons name="search" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate('NotificationCenter')}
            >
              <MaterialIcons name="notifications-none" size={24} color={colors.textSecondary} />
              {unreadNotificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Tabs - Boş durumda da göster */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'direct' && styles.activeTabButton, { borderBottomColor: activeTab === 'direct' ? Colors.primary : 'transparent' }]}
            onPress={() => setActiveTab('direct')}
          >
            <Text style={[styles.tabText, activeTab === 'direct' ? { color: Colors.primary, fontWeight: '600' } : { color: colors.textSecondary }]}>Mesajlar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'groups' && styles.activeTabButton, { borderBottomColor: activeTab === 'groups' ? Colors.primary : 'transparent' }]}
            onPress={() => setActiveTab('groups')}
          >
            <Text style={[styles.tabText, activeTab === 'groups' ? { color: Colors.primary, fontWeight: '600' } : { color: colors.textSecondary }]}>Gruplar</Text>
          </TouchableOpacity>
        </View>
        
        {activeTab === 'direct' ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="chat-bubble-outline" size={80} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Henüz eşleşme yok</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Keşfet sayfasından swipe yaparak eşleşme bulabilirsin!
            </Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="group" size={80} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Henüz grup yok</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Etkinlikler veya kampüs gruplarına katılabilirsin!
            </Text>
            <TouchableOpacity
              style={[styles.createGroupButton, { backgroundColor: Colors.primary }]}
              onPress={() => navigation.navigate('CreateGroup' as never)}
            >
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={styles.createGroupButtonText}>Grup Oluştur</Text>
            </TouchableOpacity>
          </View>
        )}
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
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Konuşmalarda ara..."
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
            <View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Sohbetler</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowSearch(true)}
              >
                <MaterialIcons name="search" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => navigation.navigate('NotificationCenter')}
              >
                <MaterialIcons name="notifications-none" size={24} color={colors.textSecondary} />
                {unreadNotificationCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'direct' && styles.activeTabButton, { borderBottomColor: activeTab === 'direct' ? Colors.primary : 'transparent' }]}
          onPress={() => setActiveTab('direct')}
        >
          <Text style={[styles.tabText, activeTab === 'direct' ? { color: Colors.primary, fontWeight: '600' } : { color: colors.textSecondary }]}>Mesajlar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'groups' && styles.activeTabButton, { borderBottomColor: activeTab === 'groups' ? Colors.primary : 'transparent' }]}
          onPress={() => setActiveTab('groups')}
        >
          <Text style={[styles.tabText, activeTab === 'groups' ? { color: Colors.primary, fontWeight: '600' } : { color: colors.textSecondary }]}>Gruplar</Text>
        </TouchableOpacity>
      </View>

      {/* Conversations List */}

      {activeTab === 'direct' ? (
        <View style={styles.conversationsContainer}>
          {/* New Matches Section - Only in Direct currently */}
          {newMatches.length > 0 && (
            <View style={styles.matchesSection}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Yeni Eşleşmeler</Text>
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
                      {item.user.photo ? (
                        <Image source={{ uri: item.user.photo }} style={styles.matchAvatar} />
                      ) : (
                        <View style={[styles.matchAvatar, { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
                          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                            {item.user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </Text>
                        </View>
                      )}
                      {item.isOnline && <View style={styles.matchOnlineIndicator} />}
                    </View>
                    <Text style={[styles.matchName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {item.user.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          <Text style={styles.sectionTitle}>Konuşmalar</Text>
          {conversations.length === 0 ? (
            <View style={styles.noConversations}>
              <Text style={[styles.noConversationsText, { color: colors.textSecondary }]}>
                Henüz bir konuşma başlatmadın. Yeni eşleşmelerinle mesajlaşmaya başla!
              </Text>
            </View>
          ) : (
            <FlatList
              data={conversations.filter(c =>
                searchQuery === '' ||
                c.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
              )}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.conversationsList}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
              }
              renderItem={({ item }) => (
                <ConversationItem
                  conversation={item}
                  onPress={() => handleConversationPress(item)}
                />
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                searchQuery !== '' ? (
                  <View style={styles.noConversations}>
                    <Text style={[styles.noConversationsText, { color: colors.textSecondary }]}>
                      "{searchQuery}" için sonuç bulunamadı
                    </Text>
                  </View>
                ) : null
              }
            />
          )}
        </View>
      ) : (
        <View style={styles.conversationsContainer}>
          <Text style={styles.sectionTitle}>Grup Sohbetleri</Text>
          {groups.length === 0 ? (
            <View style={styles.noConversations}>
              <Text style={[styles.noConversationsText, { color: colors.textSecondary }]}>
                Henüz bir gruba üye değilsin.
              </Text>
            </View>
          ) : (
            <FlatList
              data={groups.filter(g =>
                searchQuery === '' ||
                g.name.toLowerCase().includes(searchQuery.toLowerCase())
              )}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.conversationsList}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.conversationItem}
                  onPress={() => handleGroupPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatarContainer}>
                    {item.avatar_url && (item.avatar_url.startsWith('http://') || item.avatar_url.startsWith('https://')) ? (
                      <Image
                        source={{ uri: item.avatar_url }}
                        style={[styles.avatar, { borderRadius: 16 }]}
                      />
                    ) : (
                      <View style={[styles.avatar, { borderRadius: 16, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
                          {item.name?.charAt(0)?.toUpperCase() || 'G'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                      <Text style={styles.userName}>{item.name}</Text>
                      <Text style={styles.timeText}>
                        {formatTime(item.last_message_at || item.created_at)}
                      </Text>
                    </View>
                    <View style={styles.messageRow}>
                      <Text
                        style={styles.lastMessage}
                        numberOfLines={1}
                      >
                        {item.lastMessage
                          ? `${item.lastMessage.sender?.full_name?.split(' ')[0] || 'Üye'}: ${item.lastMessage.message_type === 'image' ? '📷 Fotoğraf' :
                            item.lastMessage.message_type === 'gif' ? '👾 GIF' :
                              item.lastMessage.content
                          }`
                          : 'Henüz mesaj yok'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                searchQuery !== '' ? (
                  <View style={styles.noConversations}>
                    <Text style={[styles.noConversationsText, { color: colors.textSecondary }]}>
                      "{searchQuery}" için sonuç bulunamadı
                    </Text>
                  </View>
                ) : null
              }
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
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
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    position: 'relative',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
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
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  matchesSection: {
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    paddingHorizontal: 24,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  matchesList: {
    paddingHorizontal: 20,
  },
  matchItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 70,
  },
  matchAvatarContainer: {
    position: 'relative',
  },
  matchAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    color: '#475569',
    marginTop: 6,
    textAlign: 'center',
  },
  conversationsContainer: {
    flex: 1,
    marginTop: 24,
  },
  conversationsList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
  conversationContent: {
    flex: 1,
    marginLeft: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
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
    color: '#64748b',
  },
  lastMessageUnread: {
    color: '#1e293b',
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
    fontSize: 12,
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
    color: '#64748b',
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
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  createGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
    gap: 8,
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
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    // borderBottomColor set dynamically
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MessageListScreen;
