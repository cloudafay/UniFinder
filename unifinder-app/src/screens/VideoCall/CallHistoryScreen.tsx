// Arama Geçmişi Ekranı
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface CallRecord {
  id: string;
  caller_id: string;
  callee_id: string;
  call_type: 'video' | 'audio';
  status: 'completed' | 'missed' | 'declined' | 'cancelled';
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  caller?: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  callee?: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

const CallHistoryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCallHistory = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('call_sessions')
        .select(`
          *,
          caller:profiles!call_sessions_caller_id_fkey(id, full_name, avatar_url),
          callee:profiles!call_sessions_callee_id_fkey(id, full_name, avatar_url)
        `)
        .or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`)
        .order('started_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setCalls(data as CallRecord[]);
      }
    } catch (error) {
      console.error('Arama geçmişi yükleme hatası:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadCallHistory();
  }, [loadCallHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCallHistory();
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Dün';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('tr-TR', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    }
  };

  const getCallIcon = (call: CallRecord) => {
    const isOutgoing = call.caller_id === user?.id;
    const isMissed = call.status === 'missed' || call.status === 'declined';
    
    if (isMissed) {
      return { name: 'call-missed', color: '#ef4444' };
    }
    if (isOutgoing) {
      return { name: 'call-made', color: '#22c55e' };
    }
    return { name: 'call-received', color: '#3b82f6' };
  };

  const getOtherUser = (call: CallRecord) => {
    const isOutgoing = call.caller_id === user?.id;
    return isOutgoing ? call.callee : call.caller;
  };

  const handleCallPress = (call: CallRecord) => {
    const otherUser = getOtherUser(call);
    if (!otherUser) return;

    Alert.alert(
      otherUser.full_name,
      'Ne yapmak istersin?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sesli Ara',
          onPress: () => {
            navigation.navigate('VideoCall', {
              matchId: call.caller_id === user?.id ? call.callee_id : call.caller_id,
              userName: otherUser.full_name,
              userPhoto: otherUser.avatar_url,
              callType: 'audio',
            });
          },
        },
        {
          text: 'Görüntülü Ara',
          onPress: () => {
            navigation.navigate('VideoCall', {
              matchId: call.caller_id === user?.id ? call.callee_id : call.caller_id,
              userName: otherUser.full_name,
              userPhoto: otherUser.avatar_url,
              callType: 'video',
            });
          },
        },
      ]
    );
  };

  const renderCallItem = ({ item }: { item: CallRecord }) => {
    const otherUser = getOtherUser(item);
    const callIcon = getCallIcon(item);
    const isMissed = item.status === 'missed' || item.status === 'declined';
    
    if (!otherUser) return null;

    return (
      <TouchableOpacity
        style={[styles.callItem, { backgroundColor: colors.surface }]}
        onPress={() => handleCallPress(item)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Image
            source={{ 
              uri: otherUser.avatar_url || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.full_name)}&background=6366f1&color=fff`
            }}
            style={styles.avatar}
          />
          <View style={[styles.callTypeBadge, { backgroundColor: item.call_type === 'video' ? '#8b5cf6' : '#3b82f6' }]}>
            <MaterialIcons 
              name={item.call_type === 'video' ? 'videocam' : 'call'} 
              size={10} 
              color="#fff" 
            />
          </View>
        </View>

        {/* Info */}
        <View style={styles.callInfo}>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>
            {otherUser.full_name}
          </Text>
          <View style={styles.callDetails}>
            <MaterialIcons name={callIcon.name as any} size={16} color={callIcon.color} />
            <Text style={[styles.callStatus, { color: isMissed ? '#ef4444' : colors.textSecondary }]}>
              {item.status === 'completed' && `${formatDuration(item.duration_seconds)}`}
              {item.status === 'missed' && 'Cevapsız'}
              {item.status === 'declined' && 'Reddedildi'}
              {item.status === 'cancelled' && 'İptal edildi'}
            </Text>
          </View>
        </View>

        {/* Time & Actions */}
        <View style={styles.rightSection}>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            {formatDate(item.started_at)}
          </Text>
          <TouchableOpacity
            style={[styles.callButton, { backgroundColor: `${colors.primary}15` }]}
            onPress={() => handleCallPress(item)}
          >
            <Ionicons name="call" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}15` }]}>
        <MaterialIcons name="call" size={48} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        Henüz arama yok
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Eşleşmelerinle görüntülü veya sesli arama yapabilirsin
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Arama Geçmişi</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <MaterialIcons name="videocam" size={20} color="#8b5cf6" />
          <Text style={[styles.statNumber, { color: colors.textPrimary }]}>
            {calls.filter(c => c.call_type === 'video' && c.status === 'completed').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Görüntülü</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <MaterialIcons name="call" size={20} color="#3b82f6" />
          <Text style={[styles.statNumber, { color: colors.textPrimary }]}>
            {calls.filter(c => c.call_type === 'audio' && c.status === 'completed').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sesli</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <MaterialIcons name="call-missed" size={20} color="#ef4444" />
          <Text style={[styles.statNumber, { color: colors.textPrimary }]}>
            {calls.filter(c => c.status === 'missed').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Cevapsız</Text>
        </View>
      </View>

      {/* Call List */}
      <FlatList
        data={calls}
        keyExtractor={(item) => item.id}
        renderItem={renderCallItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
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
  placeholder: { width: 40 },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  callTypeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  callInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  callDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  callStatus: {
    fontSize: 13,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 8,
  },
  timeText: {
    fontSize: 12,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default CallHistoryScreen;
