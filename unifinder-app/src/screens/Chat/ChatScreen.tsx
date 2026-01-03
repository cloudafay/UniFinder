// Chat Screen - Supabase Entegrasyonu
// Sohbet ekranı

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../services/chatService';
import { Colors } from '../../constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;
type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;

// Message type
interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'location';
}

const ChatScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ChatRouteProp>();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuth();

  const { matchId, userName, userPhoto } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Mesajları yükle
  const loadMessages = useCallback(async () => {
    if (!matchId || !user) return;

    try {
      const { data, error } = await chatService.getMessages(matchId, 100, 0);

      if (error) {
        console.error('Mesajlar yüklenemedi:', error);
        return;
      }

      if (data) {
        const formattedMessages: Message[] = data.map((msg: any) => ({
          id: msg.id,
          text: msg.content,
          senderId: msg.sender_id === user.id ? 'me' : 'other',
          timestamp: new Date(msg.created_at),
          status: msg.is_read ? 'read' : 'delivered',
          type: msg.message_type || 'text',
        }));

        setMessages(formattedMessages);

        // Mesajları okundu olarak işaretle
        await chatService.markAsRead(matchId, user.id);
      }
    } catch (err) {
      console.error('Mesaj yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  }, [matchId, user]);

  // İlk yükleme
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!matchId || !user) return;

    const subscription = chatService.subscribeToMessages(matchId, (newMessage: any) => {
      // Kendi mesajımız değilse ekle
      if (newMessage.sender_id !== user.id) {
        const formattedMessage: Message = {
          id: newMessage.id,
          text: newMessage.content,
          senderId: 'other',
          timestamp: new Date(newMessage.created_at),
          status: 'delivered',
          type: newMessage.message_type || 'text',
        };

        setMessages((prev) => [...prev, formattedMessage]);

        // Okundu olarak işaretle
        chatService.markAsRead(matchId, user.id);
      }
    });

    return () => {
      if (subscription) {
        chatService.unsubscribe(subscription);
      }
    };
  }, [matchId, user]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim() || !matchId || !user || sending) return;

    const tempId = String(Date.now());
    const messageText = inputText.trim();

    // Optimistic update - hemen göster
    const newMessage: Message = {
      id: tempId,
      text: messageText,
      senderId: 'me',
      timestamp: new Date(),
      status: 'sent',
      type: 'text',
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    Keyboard.dismiss();
    setSending(true);

    try {
      // Supabase'e gönder
      const { data, error } = await chatService.sendMessage(matchId, user.id, messageText, 'text');

      if (error) {
        console.error('Mesaj gönderilemedi:', error);
        // Hata durumunda mesajı kaldır
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        return;
      }

      // Gerçek ID ile güncelle
      if (data) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? { ...m, id: data.id, status: 'delivered' }
              : m
          )
        );
      }
    } catch (err) {
      console.error('Mesaj gönderme hatası:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === 'me';
    const showAvatar =
      !isMe &&
      (index === 0 || messages[index - 1]?.senderId === 'me');

    return (
      <View
        className={`flex-row items-end mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}
      >
        {/* Avatar for received messages */}
        {!isMe && (
          <View className="w-8 mr-2">
            {showAvatar ? (
              <Image
                source={{ uri: userPhoto }}
                className="w-8 h-8 rounded-full"
              />
            ) : null}
          </View>
        )}

        {/* Message Bubble */}
        <View className={`max-w-[78%] ${isMe ? 'items-end' : 'items-start'}`}>
          <View
            className={`px-4 py-3 ${isMe
                ? 'bg-primary rounded-2xl rounded-br-sm'
                : isDark
                  ? 'bg-slate-700/60 rounded-2xl rounded-bl-sm'
                  : 'bg-white/70 rounded-2xl rounded-bl-sm'
              }`}
            style={Platform.select({
              web: isMe
                ? { boxShadow: '0 4px 15px rgba(19, 55, 236, 0.25)' }
                : { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)' },
              default: isMe
                ? {
                  shadowColor: '#1337ec',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 15,
                  elevation: 5,
                }
                : {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.02,
                  shadowRadius: 4,
                  elevation: 1,
                },
            }) as any}
          >
            <Text
              className={`text-[15px] leading-relaxed ${isMe ? 'text-white' : isDark ? 'text-gray-100' : 'text-gray-800'
                }`}
            >
              {item.text}
            </Text>
          </View>

          {/* Time & Status */}
          <View className="flex-row items-center mt-1 px-1">
            <Text
              className={`text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
            >
              {isMe
                ? item.status === 'read'
                  ? `Okundu ${formatTime(item.timestamp)}`
                  : item.status === 'delivered'
                    ? 'İletildi'
                    : 'Gönderildi'
                : formatTime(item.timestamp)}
            </Text>
            {isMe && item.status === 'read' && (
              <MaterialIcons
                name="done-all"
                size={12}
                color="#1337ec"
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderDateSeparator = () => (
    <View className="items-center py-4">
      <View
        className={`px-4 py-1.5 rounded-full ${isDark ? 'bg-black/20' : 'bg-white/40'
          }`}
      >
        <Text
          className={`text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'
            }`}
        >
          Bugün {formatTime(new Date())}
        </Text>
      </View>
    </View>
  );

  // Loading durumu
  if (loading) {
    return (
      <SafeAreaView
        className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background-light'}`}
        edges={['top']}
      >
        {/* Header */}
        <View
          className={`px-4 pt-2 pb-4 ${isDark ? 'bg-slate-800/65' : 'bg-white/65'}`}
          style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 items-center justify-center rounded-full"
            >
              <Ionicons name="chevron-back" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
            </TouchableOpacity>
            <Text className={`text-lg font-semibold ml-2 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
              {userName}
            </Text>
          </View>
        </View>

        {/* Loading */}
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Mesajlar yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background-light'}`}
      edges={['top']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View
          className={`px-4 pt-2 pb-4 ${isDark ? 'bg-slate-800/65' : 'bg-white/65'
            }`}
          style={{
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            ...Platform.select({
              web: {
                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.05)',
              } as any,
              default: {
                shadowColor: '#1f2687',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.05,
                shadowRadius: 32,
                elevation: 8,
              },
            }),
          }}
        >
          <View className="flex-row items-center justify-between">
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className={`p-3 rounded-full ${isDark ? 'active:bg-white/10' : 'active:bg-black/5'
                }`}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={isDark ? '#fff' : '#1f2937'}
              />
            </TouchableOpacity>

            {/* User Info */}
            <TouchableOpacity className="flex-1 items-center mx-4">
              <View className="relative">
                <Image
                  source={{ uri: userPhoto }}
                  className="w-11 h-11 rounded-full border-2 border-white/50"
                />
                {/* Online indicator */}
                <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </View>
              <Text
                className={`mt-1.5 text-[15px] font-bold ${isDark ? 'text-white' : 'text-gray-900'
                  }`}
              >
                {userName}
              </Text>
              <Text className="text-[11px] font-medium text-primary/80 uppercase tracking-wide mt-0.5">
                Biyoloji • 2. Sınıf
              </Text>
            </TouchableOpacity>

            {/* More Options */}
            <TouchableOpacity
              onPress={() => navigation.navigate('VideoCall', {
                matchId,
                userName,
                userPhoto,
                callType: 'video'
              })}
              className={`p-3 rounded-full ${isDark ? 'active:bg-white/10' : 'active:bg-black/5'
                }`}
              accessibilityLabel="Görüntülü arama başlat"
            >
              <Ionicons
                name="videocam"
                size={22}
                color={Colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('VideoCall', {
                matchId,
                userName,
                userPhoto,
                callType: 'audio'
              })}
              className={`p-3 rounded-full ${isDark ? 'active:bg-white/10' : 'active:bg-black/5'
                }`}
              accessibilityLabel="Sesli arama başlat"
            >
              <Ionicons
                name="call"
                size={22}
                color={Colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              className={`p-3 rounded-full ${isDark ? 'active:bg-white/10' : 'active:bg-black/5'
                }`}
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={24}
                color={isDark ? '#fff' : '#1f2937'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages List */}
        {messages.length === 0 ? (
          <View className="flex-1 justify-center items-center px-8">
            <MaterialIcons name="chat-bubble-outline" size={64} color={isDark ? '#64748b' : '#94a3b8'} />
            <Text className={`mt-4 text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Henüz mesaj yok
            </Text>
            <Text className={`mt-2 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {userName} ile konuşmaya başla!
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={renderDateSeparator}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <View className="px-4 pb-2">
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {userName} yazıyor...
            </Text>
          </View>
        )}

        {/* Message Input */}
        <View
          className={`px-4 pb-6 pt-3 ${isDark ? 'bg-slate-800/65' : 'bg-white/65'
            }`}
          style={{
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            ...Platform.select({
              web: {
                boxShadow: '0 -8px 20px rgba(0, 0, 0, 0.05)',
              } as any,
              default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -8 },
                shadowOpacity: 0.05,
                shadowRadius: 20,
                elevation: 10,
              },
            }),
          }}
        >
          <View
            className={`flex-row items-center rounded-full px-2 ${isDark ? 'bg-slate-700/50' : 'bg-white/60'
              }`}
            style={Platform.select({
              web: {
                boxShadow: '0 8px 40px rgba(0, 0, 0, 0.1)',
              } as any,
              default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.1,
                shadowRadius: 40,
                elevation: 4,
              },
            })}
          >
            {/* Add attachment */}
            <TouchableOpacity className="w-10 h-10 items-center justify-center">
              <Ionicons
                name="add-circle-outline"
                size={26}
                color="#1337ec"
              />
            </TouchableOpacity>

            {/* Text Input */}
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Mesaj yaz..."
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              className={`flex-1 py-3 text-[15px] ${isDark ? 'text-white' : 'text-gray-800'
                }`}
              multiline
              maxLength={500}
              onKeyPress={(e) => {
                if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !(e.nativeEvent as any).shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
            />

            {/* Emoji */}
            <TouchableOpacity className="w-10 h-10 items-center justify-center">
              <Ionicons
                name="happy-outline"
                size={24}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
            </TouchableOpacity>

            {/* Send Button */}
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!inputText.trim()}
              className={`w-10 h-10 rounded-full items-center justify-center ${inputText.trim() ? 'bg-primary' : 'bg-primary/50'
                }`}
              style={
                inputText.trim()
                  ? Platform.select({
                    web: {
                      boxShadow: '0 4px 8px rgba(19, 55, 236, 0.3)',
                    } as any,
                    default: {
                      shadowColor: '#1337ec',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 5,
                    },
                  })
                  : {}
              }
            >
              <Ionicons name="arrow-up" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;
