// Edit Profile Screen
// Profil düzenleme ekranı

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// Available interests
const availableInterests = [
  'Fotoğrafçılık', 'Kodlama', 'Tenis', 'Müzik', 'Seyahat',
  'Doğa Yürüyüşü', 'Sinema', 'Kitap', 'Yemek', 'Yoga',
  'Dans', 'Oyun', 'Spor', 'Sanat', 'Podcast'
];

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const { colors, isDark } = useTheme();

  // Form state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [year, setYear] = useState(user?.year || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    user?.interests || []
  );
  const [photos, setPhotos] = useState<string[]>(user?.photos || []);
  // Avatar artık photos'tan bağımsız - sadece avatarUrl kullanılıyor
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl || null);
  const [isSaving, setIsSaving] = useState(false);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  // Avatar seçme
  const handleSelectAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUrl(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Hata', 'Avatar seçilirken bir hata oluştu');
    }
  };

  const handleAddPhoto = async () => {
    if (photos.length >= 6) {
      Alert.alert('Uyarı', 'En fazla 6 fotoğraf ekleyebilirsiniz');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotos(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu');
    }
  };

  const handleRemovePhoto = (index: number) => {
    Alert.alert(
      'Fotoğrafı Sil',
      'Bu fotoğrafı silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => setPhotos(prev => prev.filter((_, i) => i !== index)),
        },
      ]
    );
  };

  const handleSave = async () => {
    // Validate
    if (!fullName.trim()) {
      Alert.alert('Hata', 'Lütfen adınızı girin');
      return;
    }

    setIsSaving(true);
    console.log('🚀 handleSave başladı');
    console.log('📸 Kaydedilecek fotoğraflar:', photos);
    console.log('🖼️ Avatar URL:', avatarUrl);

    try {
      // Photos ve avatar artık tamamen bağımsız
      console.log('📦 Vitrin fotoğrafları:', photos);
      console.log('🖼️ Profil fotoğrafı (avatar):', avatarUrl);

      // Update user with all fields - avatar ve photos ayrı ayrı kaydediliyor
      const result = await updateUser({
        fullName: fullName.trim(),
        bio: bio.trim(),
        department: department.trim(),
        year: year.trim(),
        interests: selectedInterests,
        photos: photos, // Vitrin fotoğrafları
        avatarUrl: avatarUrl || undefined, // Profil fotoğrafı (ayrı)
      });

      console.log('📋 updateUser sonucu:', result);

      if (result?.error) {
        console.error('❌ updateUser hatası:', result.error);
        Alert.alert('Hata', result.error);
        return;
      }

      console.log('✅ Profil başarıyla güncellendi!');
      Alert.alert('Başarılı', 'Profiliniz güncellendi', [
        {
          text: 'Tamam',
          onPress: () => {
            // Web'de goBack bazen güvenilmez olabiliyor, direkt Profile sayfasına yönlendiriyoruz
            navigation.navigate('Main', { screen: 'Profile' } as any);
          }
        }
      ]);
    } catch (error: any) {
      console.error('💥 handleSave exception:', error);
      Alert.alert('Hata', error.message || 'Profil güncellenirken bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  // Avatar için varsayılan görsel - photos'tan bağımsız
  const getAvatarSource = () => {
    if (avatarUrl) {
      return { uri: avatarUrl };
    }
    // Avatar yoksa default avatar göster - photos[0]'a fallback YAPMA
    return { uri: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(fullName || 'U') + '&size=200&background=6366f1&color=fff' };
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Ambient Background */}
      <View style={[styles.ambientContainer, { pointerEvents: 'none' }]}>
        <View style={[styles.ambientBlob, styles.blobTopRight, { opacity: isDark ? 0.5 : 0.3 }]} />
        <View style={[styles.ambientBlob, styles.blobBottomLeft, { opacity: isDark ? 0.4 : 0.2 }]} />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profili Düzenle</Text>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Kaydet</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section - En Üstte */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleSelectAvatar}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.primary, '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              <View style={[styles.avatarInner, { backgroundColor: colors.background }]}>
                <Image
                  source={getAvatarSource()}
                  style={styles.avatarImage}
                />
              </View>
            </LinearGradient>
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>
            Profil fotoğrafını değiştirmek için dokun
          </Text>
        </View>

        {/* Photos Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ÖNE ÇIKAN FOTOĞRAFLAR</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>
            Profilinde görünecek fotoğrafları ekle (max 6)
          </Text>
          <View style={styles.photosGrid}>
            {photos.map((photo, index) => (
              <View key={index} style={[styles.photoWrapper, { borderColor: colors.border }]}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => handleRemovePhoto(index)}
                >
                  <MaterialIcons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 6 && (
              <TouchableOpacity
                style={[styles.addPhotoButton, { borderColor: colors.border, backgroundColor: colors.glass }]}
                onPress={handleAddPhoto}
              >
                <MaterialIcons name="add-photo-alternate" size={28} color={Colors.primary} />
                <Text style={[styles.addPhotoText, { color: Colors.primary }]}>Ekle</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Basic Info Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>TEMEL BİLGİLER</Text>
          <View style={[styles.glassPanel, { backgroundColor: colors.glass, borderColor: colors.border }]}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Ad Soyad</Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Adınızı girin"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Department */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Bölüm</Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                value={department}
                onChangeText={setDepartment}
                placeholder="Bölümünüzü girin"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Year */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Sınıf</Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                value={year}
                onChangeText={setYear}
                placeholder="Sınıfınızı girin"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>
        </View>

        {/* Bio Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>HAKKIMDA</Text>
          <View style={[styles.glassPanel, { backgroundColor: colors.glass, borderColor: colors.border }]}>
            <TextInput
              style={[styles.bioInput, { color: colors.textPrimary }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Kendinizden bahsedin..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              maxLength={300}
            />
            <Text style={[styles.charCount, { color: colors.textTertiary }]}>{bio.length}/300</Text>
          </View>
        </View>

        {/* Interests Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>İLGİ ALANLARI</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>Profilinde görünecek ilgi alanlarını seç</Text>
          <View style={styles.interestsContainer}>
            {availableInterests.map(interest => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <TouchableOpacity
                  key={interest}
                  style={[
                    styles.interestChip,
                    { backgroundColor: colors.glass, borderColor: colors.border },
                    isSelected && styles.interestChipSelected,
                  ]}
                  onPress={() => toggleInterest(interest)}
                >
                  <Text
                    style={[
                      styles.interestText,
                      { color: colors.textSecondary },
                      isSelected && styles.interestTextSelected,
                    ]}
                  >
                    {interest}
                  </Text>
                  {isSelected && (
                    <MaterialIcons name="check" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              );
            })}
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
  ambientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  ambientBlob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  blobTopRight: {
    top: '-10%',
    right: '-10%',
    width: 400,
    height: 400,
    backgroundColor: `${Colors.primary}20`,
    ...Platform.select({
      web: { filter: 'blur(120px)' },
      default: { opacity: 0.5 },
    }),
  },
  blobBottomLeft: {
    bottom: '-10%',
    left: '-20%',
    width: 500,
    height: 500,
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    ...Platform.select({
      web: { filter: 'blur(100px)' },
      default: { opacity: 0.4 },
    }),
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
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(19, 55, 236, 0.4)',
      },
      default: {
        elevation: 4,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
    }),
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarGradient: {
    width: 130,
    height: 130,
    borderRadius: 65,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#101322',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(19, 55, 236, 0.5)',
      },
      default: {
        elevation: 4,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
      },
    }),
  },
  avatarHint: {
    fontSize: 13,
    marginTop: 12,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: -8,
    marginBottom: 12,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoWrapper: {
    position: 'relative',
    width: '30%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPhotoBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  mainPhotoText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  addPhotoButton: {
    width: '30%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  glassPanel: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: { backdropFilter: 'blur(20px)' },
      default: {},
    }),
  },
  inputGroup: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  bioInput: {
    fontSize: 15,
    padding: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  interestChipSelected: {
    backgroundColor: `${Colors.primary}30`,
    borderColor: Colors.primary,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
  },
  interestTextSelected: {
    color: '#fff',
  },
});

export default EditProfileScreen;
