// Gelişmiş Filtreler Ekranı
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { useTheme } from '../../context/ThemeContext';
import { useFilters } from '../../context/FilterContext';

const ZODIAC_SIGNS = [
  { id: 'aries', label: 'Koç', icon: '♈' },
  { id: 'taurus', label: 'Boğa', icon: '♉' },
  { id: 'gemini', label: 'İkizler', icon: '♊' },
  { id: 'cancer', label: 'Yengeç', icon: '♋' },
  { id: 'leo', label: 'Aslan', icon: '♌' },
  { id: 'virgo', label: 'Başak', icon: '♍' },
  { id: 'libra', label: 'Terazi', icon: '♎' },
  { id: 'scorpio', label: 'Akrep', icon: '♏' },
  { id: 'sagittarius', label: 'Yay', icon: '♐' },
  { id: 'capricorn', label: 'Oğlak', icon: '♑' },
  { id: 'aquarius', label: 'Kova', icon: '♒' },
  { id: 'pisces', label: 'Balık', icon: '♓' },
];

const SMOKING_OPTIONS = [
  { id: 'any', label: 'Farketmez' },
  { id: 'no', label: 'İçmiyor' },
  { id: 'sometimes', label: 'Bazen' },
  { id: 'yes', label: 'İçiyor' },
];

const DRINKING_OPTIONS = [
  { id: 'any', label: 'Farketmez' },
  { id: 'no', label: 'İçmiyor' },
  { id: 'socially', label: 'Sosyal ortamlarda' },
  { id: 'yes', label: 'İçiyor' },
];

const RELATIONSHIP_GOALS = [
  { id: 'any', label: 'Farketmez', icon: '🤷' },
  { id: 'serious', label: 'Ciddi İlişki', icon: '💍' },
  { id: 'casual', label: 'Rahat Takılmak', icon: '😎' },
  { id: 'friendship', label: 'Arkadaşlık', icon: '🤝' },
];

const AdvancedFiltersScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { filters, updateFilters, resetFilters } = useFilters();
  
  // Local state for advanced filters
  const [zodiacSign, setZodiacSign] = useState<string | null>(null);
  const [heightMin, setHeightMin] = useState(150);
  const [heightMax, setHeightMax] = useState(200);
  const [smokingPreference, setSmokingPreference] = useState('any');
  const [drinkingPreference, setDrinkingPreference] = useState('any');
  const [relationshipGoal, setRelationshipGoal] = useState('any');

  const isPremium = false; // TODO: Premium kontrolü

  const activeFilterCount = [
    zodiacSign,
    heightMin !== 150 || heightMax !== 200,
    smokingPreference !== 'any',
    drinkingPreference !== 'any',
    relationshipGoal !== 'any',
  ].filter(Boolean).length;

  const handleApply = () => {
    if (!isPremium && activeFilterCount > 3) {
      Alert.alert(
        'Premium Gerekli',
        '3\'ten fazla gelişmiş filtre kullanmak için Premium\'a yükselt.',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Premium\'a Yükselt', onPress: () => navigation.navigate('Premium' as never) },
        ]
      );
      return;
    }

    // Save to context (extend FilterContext for advanced filters)
    navigation.goBack();
  };

  const handleReset = () => {
    setZodiacSign(null);
    setHeightMin(150);
    setHeightMax(200);
    setSmokingPreference('any');
    setDrinkingPreference('any');
    setRelationshipGoal('any');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Gelişmiş Filtreler</Text>
        <TouchableOpacity onPress={handleReset}>
          <Text style={[styles.resetText, { color: colors.primary }]}>Sıfırla</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Premium Banner */}
        {!isPremium && (
          <TouchableOpacity 
            style={[styles.premiumBanner, { backgroundColor: '#f59e0b20' }]}
            onPress={() => navigation.navigate('Premium' as never)}
          >
            <MaterialIcons name="workspace-premium" size={24} color="#f59e0b" />
            <View style={styles.premiumContent}>
              <Text style={[styles.premiumTitle, { color: '#f59e0b' }]}>Premium ile Sınırsız Filtre</Text>
              <Text style={[styles.premiumText, { color: colors.textSecondary }]}>
                Free: 3 filtre • Premium: Sınırsız
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#f59e0b" />
          </TouchableOpacity>
        )}

        {/* Active Filters Count */}
        <View style={styles.filterCountRow}>
          <Text style={[styles.filterCountText, { color: colors.textSecondary }]}>
            Aktif filtre: {activeFilterCount}
            {!isPremium && '/3'}
          </Text>
        </View>

        {/* Zodiac Sign */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Burç</Text>
          <View style={styles.zodiacGrid}>
            {ZODIAC_SIGNS.map((sign) => (
              <TouchableOpacity
                key={sign.id}
                style={[
                  styles.zodiacItem,
                  { backgroundColor: colors.surface },
                  zodiacSign === sign.id && styles.zodiacItemActive
                ]}
                onPress={() => setZodiacSign(zodiacSign === sign.id ? null : sign.id)}
              >
                <Text style={styles.zodiacIcon}>{sign.icon}</Text>
                <Text style={[
                  styles.zodiacLabel,
                  { color: zodiacSign === sign.id ? colors.primary : colors.textSecondary }
                ]}>
                  {sign.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Height */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Boy</Text>
            <Text style={[styles.sectionValue, { color: colors.primary }]}>
              {heightMin} - {heightMax} cm
            </Text>
          </View>
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: colors.textTertiary }]}>Min</Text>
            <Slider
              style={styles.slider}
              minimumValue={140}
              maximumValue={220}
              step={5}
              value={heightMin}
              onValueChange={setHeightMin}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={`${colors.primary}30`}
              thumbTintColor={colors.primary}
            />
          </View>
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: colors.textTertiary }]}>Max</Text>
            <Slider
              style={styles.slider}
              minimumValue={140}
              maximumValue={220}
              step={5}
              value={heightMax}
              onValueChange={setHeightMax}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={`${colors.primary}30`}
              thumbTintColor={colors.primary}
            />
          </View>
        </View>

        {/* Smoking */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Sigara</Text>
          <View style={styles.optionsRow}>
            {SMOKING_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionChip,
                  { backgroundColor: colors.surface },
                  smokingPreference === option.id && styles.optionChipActive
                ]}
                onPress={() => setSmokingPreference(option.id)}
              >
                <Text style={[
                  styles.optionText,
                  { color: smokingPreference === option.id ? colors.primary : colors.textSecondary }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Drinking */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Alkol</Text>
          <View style={styles.optionsRow}>
            {DRINKING_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionChip,
                  { backgroundColor: colors.surface },
                  drinkingPreference === option.id && styles.optionChipActive
                ]}
                onPress={() => setDrinkingPreference(option.id)}
              >
                <Text style={[
                  styles.optionText,
                  { color: drinkingPreference === option.id ? colors.primary : colors.textSecondary }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Relationship Goal */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>İlişki Hedefi</Text>
          <View style={styles.goalsGrid}>
            {RELATIONSHIP_GOALS.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalItem,
                  { backgroundColor: colors.surface },
                  relationshipGoal === goal.id && styles.goalItemActive
                ]}
                onPress={() => setRelationshipGoal(goal.id)}
              >
                <Text style={styles.goalIcon}>{goal.icon}</Text>
                <Text style={[
                  styles.goalLabel,
                  { color: relationshipGoal === goal.id ? colors.primary : colors.textSecondary }
                ]}>
                  {goal.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.applyButton, { backgroundColor: colors.primary }]}
          onPress={handleApply}
        >
          <Text style={styles.applyButtonText}>Filtreleri Uygula</Text>
        </TouchableOpacity>
      </View>
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
  resetText: { fontSize: 15, fontWeight: '500' },
  content: { flex: 1, padding: 16 },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  premiumContent: { flex: 1, marginLeft: 12 },
  premiumTitle: { fontSize: 14, fontWeight: '600' },
  premiumText: { fontSize: 12, marginTop: 2 },
  filterCountRow: { marginBottom: 16 },
  filterCountText: { fontSize: 13 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  sectionValue: { fontSize: 14, fontWeight: '600' },
  zodiacGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  zodiacItem: {
    width: '23%',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  zodiacItemActive: { borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)' },
  zodiacIcon: { fontSize: 20, marginBottom: 4 },
  zodiacLabel: { fontSize: 11, fontWeight: '500' },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: { width: 35, fontSize: 12 },
  slider: { flex: 1, height: 40 },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionChipActive: { borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)' },
  optionText: { fontSize: 14, fontWeight: '500' },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  goalItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  goalItemActive: { borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)' },
  goalIcon: { fontSize: 20 },
  goalLabel: { fontSize: 14, fontWeight: '500' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  applyButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  applyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default AdvancedFiltersScreen;
