// Etkinlik Oluşturma Ekranı
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
  Modal,
  Dimensions,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { MapWrapper } from '../../components/MapWrapper';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { eventService } from '../../services/eventService';

const { width, height } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'party', label: 'Parti', icon: '🎉' },
  { id: 'study', label: 'Çalışma', icon: '📚' },
  { id: 'sports', label: 'Spor', icon: '⚽' },
  { id: 'social', label: 'Sosyal', icon: '☕' },
  { id: 'cultural', label: 'Kültürel', icon: '🎭' },
  { id: 'other', label: 'Diğer', icon: '📌' },
];

const CreateEventScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('social');
  const [locationName, setLocationName] = useState('');
  const [capacity, setCapacity] = useState('20');
  const [eventDate, setEventDate] = useState(new Date(Date.now() + 86400000)); // Yarın
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Harita state'leri
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 41.0082, // İstanbul varsayılan
    longitude: 28.9784,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  
  // Ek özellikler
  const [requireApproval, setRequireApproval] = useState(false);
  const [allowComments, setAllowComments] = useState(true);

  // Mevcut konumu al
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({});
          setMapRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        } catch (error) {
          console.log('Konum alınamadı:', error);
        }
      }
    })();
  }, []);

  const handleCreate = async () => {
    if (!user?.id) {
      Alert.alert('Hata', 'Oturum açmanız gerekiyor');
      return;
    }

    // Validasyon
    if (!title.trim()) {
      Alert.alert('Hata', 'Etkinlik başlığı gerekli');
      return;
    }
    if (!locationName.trim()) {
      Alert.alert('Hata', 'Konum gerekli');
      return;
    }
    if (!capacity || parseInt(capacity) < 2) {
      Alert.alert('Hata', 'Kapasite en az 2 olmalı');
      return;
    }
    if (eventDate <= new Date()) {
      Alert.alert('Hata', 'Etkinlik tarihi gelecekte olmalı');
      return;
    }

    setIsLoading(true);
    console.log('Creating event with user:', user.id);
    try {
      const eventData = {
        title: title.trim(),
        description: description.trim() || undefined,
        category: category as 'party' | 'study' | 'sports' | 'social' | 'cultural' | 'other',
        location: locationName.trim(),
        latitude: selectedLocation?.latitude,
        longitude: selectedLocation?.longitude,
        max_participants: parseInt(capacity),
        event_date: eventDate.toISOString(),
        is_public: isPublic,
      };
      console.log('Event data:', eventData);

      const { data, error } = await eventService.createEvent(user.id, eventData);

      console.log('Event creation result:', { data, error });

      if (error) {
        console.error('Event creation error:', error);
        Alert.alert('Hata', typeof error === 'string' ? error : error.message || 'Etkinlik oluşturulamadı');
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setShowSuccess(true);
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Event creation exception:', error);
      Alert.alert('Hata', 'Bir sorun oluştu');
      setIsLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(eventDate);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setEventDate(newDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(eventDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setEventDate(newDate);
    }
  };

  if (showSuccess) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <View style={styles.successIconContainer}>
          <MaterialIcons name="check-circle" size={120} color={colors.primary} />
        </View>
        <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Harika!</Text>
        <Text style={[styles.successText, { color: colors.textSecondary }]}>Etkinliğin başarıyla oluşturuldu.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Etkinlik Oluştur</Text>
        <TouchableOpacity
          onPress={handleCreate}
          style={[styles.createBtn, { opacity: isLoading ? 0.5 : 1 }]}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.createBtnText, { color: colors.primary }]}>Oluştur</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Başlık *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
            placeholder="Etkinlik başlığı"
            placeholderTextColor={colors.textTertiary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Açıklama</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.textPrimary }]}
            placeholder="Etkinlik hakkında detaylar..."
            placeholderTextColor={colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Kategori</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryItem,
                  { backgroundColor: colors.surface },
                  category === cat.id && styles.categoryItemActive
                ]}
                onPress={() => setCategory(cat.id)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={[
                  styles.categoryLabel,
                  { color: category === cat.id ? colors.primary : colors.textSecondary }
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Tarih ve Saat *</Text>
          {Platform.OS === 'web' ? (
            // Web için native HTML input kullan
            <View style={styles.dateTimeRow}>
              <View style={[styles.dateTimeBtn, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="event" size={20} color={colors.primary} />
                <input
                  type="date"
                  value={eventDate.toISOString().split('T')[0]}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newDate = new Date(eventDate);
                    const [year, month, day] = e.target.value.split('-').map(Number);
                    newDate.setFullYear(year, month - 1, day);
                    setEventDate(newDate);
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: colors.textPrimary,
                    fontSize: 15,
                    outline: 'none',
                    flex: 1,
                  }}
                />
              </View>
              <View style={[styles.dateTimeBtn, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="schedule" size={20} color={colors.primary} />
                <input
                  type="time"
                  value={`${String(eventDate.getHours()).padStart(2, '0')}:${String(eventDate.getMinutes()).padStart(2, '0')}`}
                  onChange={(e) => {
                    const newDate = new Date(eventDate);
                    const [hours, minutes] = e.target.value.split(':').map(Number);
                    newDate.setHours(hours, minutes);
                    setEventDate(newDate);
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: colors.textPrimary,
                    fontSize: 15,
                    outline: 'none',
                    flex: 1,
                  }}
                />
              </View>
            </View>
          ) : (
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={[styles.dateTimeBtn, { backgroundColor: colors.surface }]}
                onPress={() => setShowDatePicker(true)}
              >
                <MaterialIcons name="event" size={20} color={colors.primary} />
                <Text style={[styles.dateTimeText, { color: colors.textPrimary }]}>
                  {eventDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateTimeBtn, { backgroundColor: colors.surface }]}
                onPress={() => setShowTimePicker(true)}
              >
                <MaterialIcons name="schedule" size={20} color={colors.primary} />
                <Text style={[styles.dateTimeText, { color: colors.textPrimary }]}>
                  {eventDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {Platform.OS !== 'web' && showDatePicker && (
          <DateTimePicker
            value={eventDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        {Platform.OS !== 'web' && showTimePicker && (
          <DateTimePicker
            value={eventDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
          />
        )}

        {/* Location */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Konum *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
            placeholder="Örn: Kampüs Kafeterya"
            placeholderTextColor={colors.textTertiary}
            value={locationName}
            onChangeText={setLocationName}
            maxLength={100}
          />
          
          {/* Harita Seçimi Butonu */}
          <TouchableOpacity
            style={[styles.mapSelectButton, { backgroundColor: colors.surface, borderColor: colors.primary }]}
            onPress={() => setShowMapModal(true)}
          >
            <MaterialIcons name="location-on" size={20} color={colors.primary} />
            <Text style={[styles.mapSelectText, { color: colors.primary }]}>
              {selectedLocation ? 'Haritada Seçildi ✓' : 'Haritada Konum Seç'}
            </Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.primary} />
          </TouchableOpacity>
          
          {selectedLocation && (
            <View style={styles.selectedLocationInfo}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <Text style={[styles.selectedLocationText, { color: colors.textSecondary }]}>
                Koordinatlar: {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
              </Text>
            </View>
          )}
        </View>

        {/* Harita Modal */}
        <Modal
          visible={showMapModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={[styles.mapModalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.mapModalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setShowMapModal(false)}>
                <Text style={[styles.mapModalCancel, { color: colors.textSecondary }]}>İptal</Text>
              </TouchableOpacity>
              <Text style={[styles.mapModalTitle, { color: colors.textPrimary }]}>Konum Seç</Text>
              <TouchableOpacity 
                onPress={() => {
                  if (selectedLocation) {
                    setShowMapModal(false);
                  } else {
                    Alert.alert('Uyarı', 'Lütfen haritada bir konum seçin');
                  }
                }}
              >
                <Text style={[styles.mapModalDone, { color: colors.primary }]}>Tamam</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.mapContainer}>
              <MapWrapper
                style={styles.map}
                region={mapRegion}
                onRegionChangeComplete={setMapRegion}
                onPress={(e: any) => {
                  if (e.nativeEvent?.coordinate) {
                    setSelectedLocation(e.nativeEvent.coordinate);
                  }
                }}
                markerCoordinate={selectedLocation}
                markerTitle={locationName || 'Seçilen Konum'}
                colors={colors}
                interactive={true}
              />
            </View>
            
            <View style={[styles.mapTip, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="touch-app" size={20} color={colors.primary} />
              <Text style={[styles.mapTipText, { color: colors.textSecondary }]}>
                Haritaya dokunarak etkinlik konumunu seçin
              </Text>
            </View>
          </View>
        </Modal>

        {/* Capacity */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Kapasite *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
            placeholder="Maksimum katılımcı sayısı"
            placeholderTextColor={colors.textTertiary}
            value={capacity}
            onChangeText={setCapacity}
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>

        {/* Public Toggle */}
        <TouchableOpacity
          style={[styles.toggleRow, { backgroundColor: colors.surface }]}
          onPress={() => setIsPublic(!isPublic)}
        >
          <View style={styles.toggleContent}>
            <MaterialIcons
              name={isPublic ? 'public' : 'lock'}
              size={24}
              color={colors.primary}
            />
            <View style={styles.toggleText}>
              <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>
                {isPublic ? 'Herkese Açık' : 'Özel Etkinlik'}
              </Text>
              <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>
                {isPublic ? 'Herkes görebilir ve katılabilir' : 'Sadece davet edilenler katılabilir'}
              </Text>
            </View>
          </View>
          <View style={[styles.toggle, isPublic && styles.toggleActive]}>
            <View style={[styles.toggleKnob, isPublic && styles.toggleKnobActive]} />
          </View>
        </TouchableOpacity>

        {/* Ek Özellikler */}
        <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Ek Ayarlar</Text>
        
        {/* Katılım Onayı */}
        <TouchableOpacity
          style={[styles.toggleRow, { backgroundColor: colors.surface }]}
          onPress={() => setRequireApproval(!requireApproval)}
        >
          <View style={styles.toggleContent}>
            <MaterialIcons
              name="verified-user"
              size={24}
              color="#f59e0b"
            />
            <View style={styles.toggleText}>
              <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>
                Katılım Onayı
              </Text>
              <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>
                Katılımcıları onaylaman gerekir
              </Text>
            </View>
          </View>
          <View style={[styles.toggle, requireApproval && styles.toggleActive]}>
            <View style={[styles.toggleKnob, requireApproval && styles.toggleKnobActive]} />
          </View>
        </TouchableOpacity>

        {/* Yorumlar */}
        <TouchableOpacity
          style={[styles.toggleRow, { backgroundColor: colors.surface }]}
          onPress={() => setAllowComments(!allowComments)}
        >
          <View style={styles.toggleContent}>
            <MaterialIcons
              name="chat-bubble-outline"
              size={24}
              color="#22c55e"
            />
            <View style={styles.toggleText}>
              <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>
                Yorumlar
              </Text>
              <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>
                Katılımcılar yorum yapabilir
              </Text>
            </View>
          </View>
          <View style={[styles.toggle, allowComments && styles.toggleActive]}>
            <View style={[styles.toggleKnob, allowComments && styles.toggleKnobActive]} />
          </View>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  createBtn: { padding: 8 },
  createBtnText: { fontSize: 16, fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  sectionLabel: { fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 8 },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryItemActive: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  categoryIcon: { fontSize: 18 },
  categoryLabel: { fontSize: 14, fontWeight: '500' },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
  },
  dateTimeText: { fontSize: 15 },
  // Harita stilleri
  mapSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  mapSelectText: { flex: 1, marginLeft: 8, fontSize: 14, fontWeight: '500' },
  selectedLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  selectedLocationText: { fontSize: 12 },
  mapModalContainer: { flex: 1 },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  mapModalCancel: { fontSize: 16 },
  mapModalTitle: { fontSize: 17, fontWeight: '600' },
  mapModalDone: { fontSize: 16, fontWeight: '600' },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: { fontSize: 15, marginTop: 12 },
  mapTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  mapTipText: { fontSize: 13, flex: 1 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  toggleContent: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  toggleText: { flex: 1 },
  toggleTitle: { fontSize: 15, fontWeight: '600' },
  toggleSubtitle: { fontSize: 13, marginTop: 2 },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    padding: 2,
  },
  toggleActive: { backgroundColor: '#6366f1' },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleKnobActive: { marginLeft: 22 },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successIconContainer: {
    marginBottom: 24,
    transform: [{ scale: 1.2 }],
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default CreateEventScreen;
