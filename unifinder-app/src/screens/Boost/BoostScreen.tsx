// Boost Ekranı
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { boostService, BoostStatus } from '../../services/boostService';

const BoostScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [boostStatus, setBoostStatus] = useState<BoostStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const loadBoostStatus = useCallback(async () => {
    if (!user?.id) return;

    try {
      const data = await boostService.getBoostStatus(user.id, false);
      if (data) {
        setBoostStatus(data);
        if (data.isActive && data.expiresAt) {
          const remaining = new Date(data.expiresAt).getTime() - Date.now();
          setTimeRemaining(Math.max(0, remaining));
        }
      }
    } catch (error) {
      console.error('Boost durumu yükleme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadBoostStatus();
  }, [loadBoostStatus]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1000) {
            loadBoostStatus();
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining, loadBoostStatus]);

  const handleActivateBoost = async () => {
    if (!user?.id || !boostStatus || boostStatus.remainingBoosts <= 0) return;

    setIsActivating(true);
    try {
      const result = await boostService.activateBoost(user.id, false);

      if (result.error) {
        Alert.alert('Hata', result.error);
      } else if (result.success && result.boost) {
        // Refresh boost status after activation
        const newStatus = await boostService.getBoostStatus(user.id, false);
        setBoostStatus(newStatus);
        if (newStatus.expiresAt) {
          const remaining = new Date(newStatus.expiresAt).getTime() - Date.now();
          setTimeRemaining(Math.max(0, remaining));
        }
        Alert.alert('🚀 Boost Aktif!', 'Profilin 30 dakika boyunca öne çıkarılacak!');
      }
    } catch (error) {
      Alert.alert('Hata', 'Bir sorun oluştu');
    } finally {
      setIsActivating(false);
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Boost</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Boost Card */}
        <LinearGradient
          colors={boostStatus?.isActive ? ['#f59e0b', '#f97316'] : ['#6366f1', '#8b5cf6']}
          style={styles.boostCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.boostIconContainer}>
            <MaterialIcons
              name={boostStatus?.isActive ? 'flash-on' : 'rocket-launch'}
              size={48}
              color="#fff"
            />
          </View>

          {boostStatus?.isActive ? (
            <>
              <Text style={styles.boostActiveTitle}>Boost Aktif! 🔥</Text>
              <Text style={styles.boostTimer}>{formatTime(timeRemaining)}</Text>
              <Text style={styles.boostActiveSubtitle}>
                Profilin şu an öne çıkarılıyor
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.boostTitle}>Profilini Öne Çıkar</Text>
              <Text style={styles.boostSubtitle}>
                30 dakika boyunca daha fazla kişiye görün
              </Text>
            </>
          )}
        </LinearGradient>

        {/* Stats */}
        {boostStatus?.stats && (
          <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statsTitle, { color: colors.textPrimary }]}>
              Son Boost İstatistikleri
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {boostStatus.stats.viewsDuringBoost}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Görüntülenme
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#22c55e' }]}>
                  {boostStatus.stats.likesDuringBoost}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Beğeni
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Remaining Boosts */}
        <View style={[styles.remainingCard, { backgroundColor: colors.surface }]}>
          <View style={styles.remainingHeader}>
            <MaterialIcons name="bolt" size={24} color="#f59e0b" />
            <Text style={[styles.remainingTitle, { color: colors.textPrimary }]}>
              Kalan Boost
            </Text>
          </View>
          <Text style={[styles.remainingCount, { color: colors.primary }]}>
            {boostStatus?.remainingBoosts || 0}
          </Text>
          <Text style={[styles.remainingSubtitle, { color: colors.textSecondary }]}>
            Bu ay {boostStatus?.monthlyBoosts || 0} boost hakkın var
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsSection}>
          <Text style={[styles.benefitsTitle, { color: colors.textPrimary }]}>
            Boost Avantajları
          </Text>

          {[
            { icon: 'visibility', text: '10x daha fazla görüntülenme' },
            { icon: 'favorite', text: 'Daha fazla beğeni al' },
            { icon: 'star', text: 'Keşfet\'te öne çık' },
            { icon: 'schedule', text: '30 dakika süre' },
          ].map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <View style={[styles.benefitIcon, { backgroundColor: `${colors.primary}15` }]}>
                <MaterialIcons name={benefit.icon as any} size={20} color={colors.primary} />
              </View>
              <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
                {benefit.text}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Action */}
      {!boostStatus?.isActive && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16, backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[
              styles.activateButton,
              {
                backgroundColor: (boostStatus?.remainingBoosts || 0) > 0 ? colors.primary : colors.textTertiary,
              }
            ]}
            onPress={handleActivateBoost}
            disabled={isActivating || (boostStatus?.remainingBoosts || 0) <= 0}
          >
            {isActivating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="rocket-launch" size={24} color="#fff" />
                <Text style={styles.activateButtonText}>
                  {(boostStatus?.remainingBoosts || 0) > 0 ? 'Boost Aktifleştir' : 'Boost Hakkın Yok'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
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
  content: { flex: 1, padding: 16 },
  boostCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  boostIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  boostTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  boostSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 8, textAlign: 'center' },
  boostActiveTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  boostTimer: { color: '#fff', fontSize: 48, fontWeight: '700', marginVertical: 8 },
  boostActiveSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 14 },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: '700' },
  statLabel: { fontSize: 13, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
  remainingCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  remainingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  remainingTitle: { fontSize: 16, fontWeight: '600' },
  remainingCount: { fontSize: 48, fontWeight: '700' },
  remainingSubtitle: { fontSize: 13, marginTop: 4 },
  benefitsSection: { marginBottom: 20 },
  benefitsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  benefitText: { fontSize: 15 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  activateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  activateButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});

export default BoostScreen;
