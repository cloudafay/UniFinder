// Keşif Mesafesi Ayarları Ekranı
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLocation } from '../../context/LocationContext';
import { Colors } from '../../constants';

interface DistanceOption {
  value: number;
  label: string;
  description: string;
}

const DistanceSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { discoveryRadius, setDiscoveryRadius } = useLocation();
  const [tempDistance, setTempDistance] = useState(discoveryRadius);

  const distanceOptions: DistanceOption[] = [
    { value: 2, label: '2 km', description: 'Yürüme mesafesi' },
    { value: 5, label: '5 km', description: 'Yakın çevre' },
    { value: 10, label: '10 km', description: 'Şehir içi' },
    { value: 25, label: '25 km', description: 'Geniş alan' },
    { value: 50, label: '50 km', description: 'Bölgesel' },
    { value: 100, label: '100 km', description: 'Maksimum' },
  ];

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSave = () => {
    setDiscoveryRadius(tempDistance);
    showAlert('Kaydedildi', `Keşif mesafeniz ${tempDistance} km olarak güncellendi.`);
    navigation.goBack();
  };

  const getDistanceColor = (distance: number) => {
    if (distance <= 5) return Colors.success;
    if (distance <= 25) return Colors.primary;
    if (distance <= 50) return Colors.warning;
    return Colors.error;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Keşif Mesafesi</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.saveButton, { color: Colors.primary }]}>Kaydet</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Distance Display */}
        <View style={[styles.distanceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.distanceDisplay}>
            <Text style={[styles.distanceValue, { color: getDistanceColor(tempDistance) }]}>
              {tempDistance}
            </Text>
            <Text style={[styles.distanceUnit, { color: colors.textSecondary }]}>km</Text>
          </View>
          <Text style={[styles.distanceLabel, { color: colors.textSecondary }]}>
            Bu mesafedeki kullanıcıları keşfedeceksiniz
          </Text>

          {/* Slider */}
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: colors.textTertiary }]}>2</Text>
            <Slider
              style={styles.slider}
              minimumValue={2}
              maximumValue={100}
              step={1}
              value={tempDistance}
              onValueChange={setTempDistance}
              minimumTrackTintColor={getDistanceColor(tempDistance)}
              maximumTrackTintColor={colors.border}
              thumbTintColor={getDistanceColor(tempDistance)}
            />
            <Text style={[styles.sliderLabel, { color: colors.textTertiary }]}>100</Text>
          </View>
        </View>

        {/* Quick Options */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>HIZLI SEÇİM</Text>
        <View style={[styles.optionsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {distanceOptions.map((option, index) => (
            <React.Fragment key={option.value}>
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  tempDistance === option.value && { backgroundColor: Colors.primary + '10' }
                ]}
                onPress={() => setTempDistance(option.value)}
              >
                <View style={styles.optionLeft}>
                  <View style={[
                    styles.optionRadio,
                    { borderColor: tempDistance === option.value ? Colors.primary : colors.border }
                  ]}>
                    {tempDistance === option.value && (
                      <View style={[styles.optionRadioInner, { backgroundColor: Colors.primary }]} />
                    )}
                  </View>
                  <View>
                    <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>{option.label}</Text>
                    <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>{option.description}</Text>
                  </View>
                </View>
                {tempDistance === option.value && (
                  <MaterialIcons name="check" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
              {index !== distanceOptions.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: Colors.info + '10', borderColor: Colors.info + '30' }]}>
          <MaterialIcons name="info" size={22} color={Colors.info} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>Nasıl Çalışır?</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Belirlediğiniz mesafe içindeki kullanıcılar Keşfet ekranında görünür. Daha geniş mesafe, daha fazla potansiyel eşleşme demektir.
            </Text>
          </View>
        </View>

        {/* Tips */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>İPUÇLARI</Text>
        <View style={[styles.tipsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.tipItem}>
            <MaterialIcons name="tips-and-updates" size={20} color={Colors.warning} />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Yoğun olmayan bölgelerde mesafenizi artırmayı deneyin
            </Text>
          </View>
          <View style={styles.tipItem}>
            <MaterialIcons name="tips-and-updates" size={20} color={Colors.warning} />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Kampüs içinde kalık için 2-5 km idealdir
            </Text>
          </View>
          <View style={styles.tipItem}>
            <MaterialIcons name="tips-and-updates" size={20} color={Colors.warning} />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Farklı üniversiteleri keşfetmek için 25+ km deneyin
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  distanceCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  distanceDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  distanceValue: {
    fontSize: 72,
    fontWeight: '700',
    lineHeight: 80,
  },
  distanceUnit: {
    fontSize: 24,
    fontWeight: '500',
    marginBottom: 12,
    marginLeft: 4,
  },
  distanceLabel: {
    fontSize: 14,
    marginBottom: 24,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: 30,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginLeft: 4,
    marginBottom: 12,
  },
  optionsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  optionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginLeft: 52,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    gap: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  tipsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default DistanceSettingsScreen;

