// Filter Search Screen
// Filtre ve arama ekranı

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Colors } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { useFilters } from '../../context/FilterContext';
import { RootStackParamList } from '../../navigation/types';
import { Alert } from 'react-native';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Looking for options
const lookingForOptions = [
  { id: 'study', label: 'Çalışma Arkadaşı', icon: 'school' as const },
  { id: 'dating', label: 'Tanışma', icon: 'favorite' as const },
  { id: 'friendship', label: 'Arkadaşlık', icon: 'group' as const },
  { id: 'gaming', label: 'Oyun', icon: 'sports-esports' as const },
];

const FilterSearchScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { filters, updateFilters, resetFilters } = useFilters();

  // Local filter states (başlangıçta global değerler)
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery);
  const [selectedLookingFor, setSelectedLookingFor] = useState<string[]>(filters.lookingFor);
  const [ageMin, setAgeMin] = useState(filters.ageMin);
  const [ageMax, setAgeMax] = useState(filters.ageMax);
  const [distance, setDistance] = useState(filters.distance);
  const [verifiedOnly, setVerifiedOnly] = useState(filters.verifiedOnly);
  const [onlineOnly, setOnlineOnly] = useState(filters.onlineOnly);

  // Yaş aralığı değiştiğinde min < max olduğundan emin ol
  const handleAgeMinChange = useCallback((value: number) => {
    const newValue = Math.round(value);
    if (newValue < ageMax) {
      setAgeMin(newValue);
    }
  }, [ageMax]);

  const handleAgeMaxChange = useCallback((value: number) => {
    const newValue = Math.round(value);
    if (newValue > ageMin) {
      setAgeMax(newValue);
    }
  }, [ageMin]);

  const toggleLookingFor = (id: string) => {
    setSelectedLookingFor(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedLookingFor(['study']);
    setAgeMin(18);
    setAgeMax(25);
    setDistance(5);
    setVerifiedOnly(true);
    setOnlineOnly(false);
    resetFilters();
    Alert.alert('Sıfırlandı', 'Filtreler varsayılan değerlere döndürüldü.');
  };

  const handleApply = () => {
    // Filtreleri global state'e kaydet
    updateFilters({
      searchQuery,
      lookingFor: selectedLookingFor,
      ageMin,
      ageMax,
      distance,
      verifiedOnly,
      onlineOnly,
    });
    
    Alert.alert('Filtreler Uygulandı', 'Keşif ekranı yeni filtrelere göre güncellenecek.');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {/* Handle */}
        <View style={styles.handle} />
        
        {/* Title Row */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>Filtrele</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>Sıfırla</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={24} color={Colors.primary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="İsim veya bölüm ara..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Looking For Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ne Arıyorsun?</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {lookingForOptions.map(option => {
              const isSelected = selectedLookingFor.includes(option.id);
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => toggleLookingFor(option.id)}
                >
                  <MaterialIcons
                    name={option.icon}
                    size={18}
                    color={isSelected ? '#fff' : '#64748b'}
                  />
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Age Range Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.textPrimary : '#1e293b' }]}>Yaş Aralığı</Text>
            <View style={styles.valueTag}>
              <Text style={styles.valueTagText}>{ageMin} - {ageMax}</Text>
            </View>
          </View>
          
          {/* Min Age Slider */}
          <View style={styles.sliderRow}>
            <Text style={[styles.sliderLabel, { color: isDark ? colors.textSecondary : '#64748b' }]}>Min: {ageMin}</Text>
            <Slider
              style={styles.slider}
              minimumValue={18}
              maximumValue={35}
              value={ageMin}
              onValueChange={handleAgeMinChange}
              step={1}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={isDark ? '#475569' : '#e2e8f0'}
              thumbTintColor={Colors.primary}
            />
          </View>
          
          {/* Max Age Slider */}
          <View style={styles.sliderRow}>
            <Text style={[styles.sliderLabel, { color: isDark ? colors.textSecondary : '#64748b' }]}>Max: {ageMax}</Text>
            <Slider
              style={styles.slider}
              minimumValue={18}
              maximumValue={40}
              value={ageMax}
              onValueChange={handleAgeMaxChange}
              step={1}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={isDark ? '#475569' : '#e2e8f0'}
              thumbTintColor={Colors.primary}
            />
          </View>
        </View>

        {/* Distance Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.textPrimary : '#1e293b' }]}>Mesafe</Text>
            <Text style={[styles.valueText, { color: isDark ? colors.textSecondary : '#64748b' }]}>{distance} km içinde</Text>
          </View>
          <Slider
            style={styles.distanceSlider}
            minimumValue={1}
            maximumValue={50}
            value={distance}
            onValueChange={(value) => setDistance(Math.round(value))}
            step={1}
            minimumTrackTintColor={Colors.primary}
            maximumTrackTintColor={isDark ? '#475569' : '#e2e8f0'}
            thumbTintColor={Colors.primary}
          />
          <View style={styles.sliderLabels}>
            <Text style={[styles.distanceLabel, { color: isDark ? colors.textTertiary : '#94a3b8' }]}>Kampüs</Text>
            <Text style={[styles.distanceLabel, { color: isDark ? colors.textTertiary : '#94a3b8' }]}>50km</Text>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tercihler</Text>
          
          {/* Advanced Filters Link */}
          <TouchableOpacity
            style={styles.toggleCard}
            onPress={() => navigation.navigate('AdvancedFilters')}
          >
            <View style={styles.toggleLeft}>
              <View style={[styles.toggleIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <MaterialIcons name="tune" size={24} color="#8b5cf6" />
              </View>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Gelişmiş Filtreler</Text>
                <Text style={styles.toggleSubtitle}>Daha fazla filtreleme seçeneği</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
          </TouchableOpacity>
          
          {/* Verified Only */}
          <View style={styles.toggleCard}>
            <View style={styles.toggleLeft}>
              <View style={[styles.toggleIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <MaterialIcons name="verified-user" size={24} color={Colors.primary} />
              </View>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Sadece Doğrulanmış</Text>
                <Text style={styles.toggleSubtitle}>Güvenlik için önerilir</Text>
              </View>
            </View>
            <Switch
              value={verifiedOnly}
              onValueChange={setVerifiedOnly}
              trackColor={{ false: 'rgba(0,0,0,0.1)', true: `${Colors.primary}60` }}
              thumbColor={verifiedOnly ? Colors.primary : '#f4f4f5'}
            />
          </View>

          {/* Online Only */}
          <View style={styles.toggleCard}>
            <View style={styles.toggleLeft}>
              <View style={[styles.toggleIcon, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                <MaterialIcons name="circle" size={24} color="#22c55e" />
              </View>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Şu An Çevrimiçi</Text>
                <Text style={styles.toggleSubtitle}>Aktif kullanıcıları göster</Text>
              </View>
            </View>
            <Switch
              value={onlineOnly}
              onValueChange={setOnlineOnly}
              trackColor={{ false: 'rgba(0,0,0,0.1)', true: `${Colors.primary}60` }}
              thumbColor={onlineOnly ? Colors.primary : '#f4f4f5'}
            />
          </View>
        </View>
      </ScrollView>

      {/* Apply Button */}
      <View style={[styles.applyContainer, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={handleApply}
          activeOpacity={0.9}
        >
          <Text style={styles.applyButtonText}>Filtreleri Uygula</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f8',
  },
  header: {
    alignItems: 'center',
    paddingBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px)',
      },
      default: {},
    }),
  },
  handle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    marginBottom: 16,
  },
  titleRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 24,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      },
      default: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
      },
      default: {},
    }),
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Platform.select({
      web: {
        boxShadow: '0 0 15px rgba(19, 55, 236, 0.5)',
      },
      default: {
        elevation: 4,
      },
    }),
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  chipTextSelected: {
    color: '#fff',
  },
  valueTag: {
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  valueTagText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#64748b',
    width: 60,
    fontWeight: '500',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  distanceSlider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  distanceLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 12,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
      },
      default: {},
    }),
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTextContainer: {
    gap: 2,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
  },
  toggleSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  applyContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: 'rgba(246, 246, 248, 0.9)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
      },
      default: {},
    }),
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    ...Platform.select({
      web: {
        boxShadow: '0 0 15px rgba(19, 55, 236, 0.5)',
      },
      default: {
        elevation: 8,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
    }),
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default FilterSearchScreen;
