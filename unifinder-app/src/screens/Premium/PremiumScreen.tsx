/**
 * Premium Üyelik Ekranı
 * Abonelik planlarını göster ve satın alma işlemi
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import {
  PLANS,
  PlanType,
  getCurrentSubscription,
  startSubscription,
  getRemainingDays,
  Subscription,
} from '../../services/premiumService';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

const PLAN_COLORS: Record<PlanType, readonly [string, string]> = {
  free: ['#64748b', '#475569'],
  gold: ['#f59e0b', '#d97706'],
  platinum: ['#a855f7', '#7c3aed'],
  diamond: ['#06b6d4', '#0891b2'],
};

const PremiumScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>('gold');
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [remainingDays, setRemainingDays] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const [sub, days] = await Promise.all([
        getCurrentSubscription(),
        getRemainingDays(),
      ]);
      setCurrentSubscription(sub);
      setRemainingDays(days);
      if (sub && sub.plan_type !== 'free') {
        setSelectedPlan(sub.plan_type);
      }
    } catch (error) {
      console.error('Abonelik yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (selectedPlan === 'free') return;

    const confirmPurchase = async () => {
      setPurchasing(true);
      try {
        const result = await startSubscription(selectedPlan);
        if (result.success) {
          if (Platform.OS === 'web') {
            window.alert('Aboneliğiniz başarıyla aktifleştirildi! 🎉');
          } else {
            Alert.alert('Başarılı', 'Aboneliğiniz başarıyla aktifleştirildi! 🎉');
          }
          loadSubscription();
        } else {
          if (Platform.OS === 'web') {
            window.alert(result.error || 'Bir hata oluştu');
          } else {
            Alert.alert('Hata', result.error || 'Bir hata oluştu');
          }
        }
      } catch (error) {
        console.error('Satın alma hatası:', error);
      } finally {
        setPurchasing(false);
      }
    };

    const plan = PLANS.find(p => p.type === selectedPlan);
    if (!plan) return;

    if (Platform.OS === 'web') {
      if (window.confirm(`${plan.name} planına abone olmak istiyor musunuz?\n\n₺${plan.price}/ay`)) {
        confirmPurchase();
      }
    } else {
      Alert.alert(
        'Satın Al',
        `${plan.name} planına abone olmak istiyor musunuz?\n\n₺${plan.price}/ay`,
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Satın Al', onPress: confirmPurchase },
        ]
      );
    }
  };

  const renderPlanCard = (plan: typeof PLANS[0], index: number) => {
    const isSelected = selectedPlan === plan.type;
    const isCurrent = currentSubscription?.plan_type === plan.type;

    return (
      <TouchableOpacity
        key={plan.type}
        style={[
          styles.planCard,
          {
            backgroundColor: colors.surface,
            borderColor: isSelected ? plan.color : colors.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => setSelectedPlan(plan.type)}
        activeOpacity={0.8}
      >
        {/* Popular badge */}
        {plan.type === 'gold' && (
          <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
            <Text style={styles.popularText}>EN POPÜLER</Text>
          </View>
        )}

        {/* Plan header */}
        <View style={styles.planHeader}>
          <LinearGradient
            colors={PLAN_COLORS[plan.type]}
            style={styles.planIcon}
          >
            <MaterialIcons name={plan.icon as any} size={24} color="#fff" />
          </LinearGradient>
          <View style={styles.planTitleContainer}>
            <Text style={[styles.planName, { color: colors.textPrimary }]}>
              {plan.name}
            </Text>
            {isCurrent && (
              <View style={[styles.currentBadge, { backgroundColor: Colors.success + '20' }]}>
                <Text style={[styles.currentText, { color: Colors.success }]}>AKTİF</Text>
              </View>
            )}
          </View>
        </View>

        {/* Price */}
        <View style={styles.priceContainer}>
          {plan.price > 0 ? (
            <>
              <Text style={[styles.currency, { color: colors.textSecondary }]}>₺</Text>
              <Text style={[styles.price, { color: colors.textPrimary }]}>{plan.price.toFixed(2).replace('.', ',')}</Text>
              <Text style={[styles.period, { color: colors.textSecondary }]}>/ay</Text>
            </>
          ) : (
            <Text style={[styles.freeText, { color: colors.textSecondary }]}>Ücretsiz</Text>
          )}
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {plan.features.slice(0, 4).map((feature, idx) => (
            <View key={idx} style={styles.featureRow}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={plan.color}
              />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                {feature}
              </Text>
            </View>
          ))}
          {plan.features.length > 4 && (
            <Text style={[styles.moreFeatures, { color: plan.color }]}>
              +{plan.features.length - 4} daha fazla özellik
            </Text>
          )}
        </View>

        {/* Selection indicator */}
        <View style={styles.selectionIndicator}>
          {isSelected ? (
            <Ionicons name="checkmark-circle" size={24} color={plan.color} />
          ) : (
            <View style={[styles.unselectedCircle, { borderColor: colors.border }]} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  const selectedPlanData = PLANS.find(p => p.type === selectedPlan);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Premium</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={isDark ? ['#1a1a2e', '#16213e'] : ['#f0f4ff', '#e0e7ff']}
          style={styles.heroSection}
        >
          <MaterialIcons name="workspace-premium" size={56} color={Colors.primary} />
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
            UniFinder Premium
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Daha fazla eşleşme, daha fazla özellik
          </Text>
        </LinearGradient>

        {/* Current subscription info */}
        {currentSubscription && currentSubscription.plan_type !== 'free' && (
          <View style={[styles.currentPlanCard, { backgroundColor: PLAN_COLORS[currentSubscription.plan_type][0] + '15', borderColor: PLAN_COLORS[currentSubscription.plan_type][0] }]}>
            <View style={styles.currentPlanInfo}>
              <Text style={[styles.currentPlanLabel, { color: colors.textSecondary }]}>Mevcut Plan</Text>
              <Text style={[styles.currentPlanName, { color: colors.textPrimary }]}>
                {PLANS.find(p => p.type === currentSubscription.plan_type)?.name}
              </Text>
            </View>
            <View style={styles.remainingDaysContainer}>
              <Text style={[styles.remainingDays, { color: PLAN_COLORS[currentSubscription.plan_type][0] }]}>
                {remainingDays}
              </Text>
              <Text style={[styles.remainingLabel, { color: colors.textSecondary }]}>gün kaldı</Text>
            </View>
          </View>
        )}

        {/* Plan cards */}
        <View style={styles.plansContainer}>
          {PLANS.filter(p => p.type !== 'free').map((plan, index) => renderPlanCard(plan, index))}
        </View>

        {/* Comparison link */}
        <TouchableOpacity style={styles.comparisonLink}>
          <Text style={[styles.comparisonText, { color: Colors.primary }]}>
            Tüm özellikleri karşılaştır
          </Text>
          <MaterialIcons name="chevron-right" size={20} color={Colors.primary} />
        </TouchableOpacity>

        {/* Terms */}
        <Text style={[styles.termsText, { color: colors.textSecondary }]}>
          Satın alarak Kullanım Koşulları'nı ve Gizlilik Politikası'nı kabul etmiş olursunuz.
          Abonelikler otomatik olarak yenilenir.
        </Text>
      </ScrollView>

      {/* Purchase button */}
      {selectedPlan !== 'free' && selectedPlanData && (
        <View style={[styles.purchaseContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={styles.purchaseButton}
            onPress={handlePurchase}
            disabled={purchasing || currentSubscription?.plan_type === selectedPlan}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={PLAN_COLORS[selectedPlan]}
              style={styles.purchaseGradient}
            >
              {purchasing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : currentSubscription?.plan_type === selectedPlan ? (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  <Text style={styles.purchaseButtonText}>Mevcut Planınız</Text>
                </>
              ) : (
                <>
                  <Text style={styles.purchaseButtonText}>
                    {selectedPlanData.name} - ₺{selectedPlanData.price.toFixed(2).replace('.', ',')}/ay
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: 16,
  },
  heroSubtitle: {
    fontSize: 14,
    marginTop: 8,
  },
  currentPlanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  currentPlanInfo: {},
  currentPlanLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  currentPlanName: {
    fontSize: 18,
    fontWeight: '600',
  },
  remainingDaysContainer: {
    alignItems: 'center',
  },
  remainingDays: {
    fontSize: 28,
    fontWeight: '700',
  },
  remainingLabel: {
    fontSize: 11,
  },
  plansContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  planCard: {
    padding: 16,
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planTitleContainer: {
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentText: {
    fontSize: 10,
    fontWeight: '700',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  currency: {
    fontSize: 16,
    fontWeight: '500',
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
  },
  period: {
    fontSize: 14,
    marginLeft: 4,
  },
  freeText: {
    fontSize: 20,
    fontWeight: '600',
  },
  featuresContainer: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    flex: 1,
  },
  moreFeatures: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  selectionIndicator: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  unselectedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  comparisonLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  comparisonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  termsText: {
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 16,
  },
  purchaseContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  purchaseButton: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  purchaseGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default PremiumScreen;

