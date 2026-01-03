// Grup Sohbet Ekranı
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { groupChatService, GroupMessage } from '../../services/groupChatService';
import { RootStackParamList } from '../../navigation/types';

type GroupChatRouteProp = RouteProp<RootStackParamList, 'GroupChat'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const GroupChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<GroupChatRouteProp>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  
  const { groupId, groupName } = route.params;
  
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const loadMessages = useCallback(async () => {
    try {
      const { data, error } = await groupChatService.getMessages(groupId, 50);
      if (data) {
        setMessages(data);
      }
    } catch (error) {
      console.error('Mesaj yükleme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadMessages();
    
    // Realtime subscription
    const subscription = groupChatService.subscribeToMessages(groupId, (newMsg) => {
      setMessages(prev => [...prev, newMsg]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [groupId, loadMessages]);

  const handleSend = async () => {
    if (!user?.id || !newMessage.trim() || isSending) return;
    
    setIsSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');
    
    try {
      await groupChatService.sendMessage(groupId, user.id, messageText, 'text');
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item, index }: { item: GroupMessage; index: number }) => {
    const isOwn = item.sender_id === user?.id;
    const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.sender_id !== item.sender_id);
    const sender = (item as any).sender;
    
    return (
      <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
        {!isOwn && (
          <View style={styles.avatarContainer}>
            {showAvatar ? (
              <Image 
                source={{ uri: sender?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender?.full_name || 'U')}` }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder} />
            )}
          </View>
        )}
        
        <View style={[styles.messageBubble, isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther]}>
          {!isOwn && showAvatar && (
            <Text style={[styles.senderName, { color: colors.primary }]}>
              {sender?.full_name || 'Kullanıcı'}
            </Text>
          )}
          <Text style={[styles.messageText, { color: isOwn ? '#fff' : colors.textPrimary }]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, { color: isOwn ? 'rgba(255,255,255,0.7)' : colors.textTertiary }]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.headerContent}
          onPress={() => navigation.navigate('GroupMembers', { groupId, groupName })}
        >
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {groupName}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Üyeleri görmek için dokun
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => navigation.navigate('GroupMembers', { groupId, groupName })}
        >
          <MaterialIcons name="people" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="chat-bubble-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Henüz mesaj yok. İlk mesajı sen gönder!
              </Text>
            </View>
          ) : null
        }
      />

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8, backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary }]}
          placeholder="Mesaj yaz..."
          placeholderTextColor={colors.textTertiary}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={1000}
          onKeyPress={(e) => {
            if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !(e.nativeEvent as any).shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity 
          style={[styles.sendButton, { backgroundColor: colors.primary, opacity: newMessage.trim() ? 1 : 0.5 }]}
          onPress={handleSend}
          disabled={!newMessage.trim() || isSending}
        >
          <MaterialIcons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: { padding: 8 },
  headerContent: { flex: 1, marginLeft: 8 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  menuButton: { padding: 8 },
  messagesList: { padding: 16, paddingBottom: 8 },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  avatarContainer: { width: 32, marginRight: 8 },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  avatarPlaceholder: { width: 28, height: 28 },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  messageBubbleOwn: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderBottomLeftRadius: 4,
  },
  senderName: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  messageText: { fontSize: 15, lineHeight: 20 },
  messageTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, marginTop: 12, textAlign: 'center' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GroupChatScreen;
