// Register Photo Screen - Kayıt Fotoğraf Yükleme Ekranı

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Dimensions,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { AuthStackParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants';
import { LinearGradient } from 'expo-linear-gradient';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'RegisterPhoto'>;
type RegisterPhotoRouteProp = RouteProp<AuthStackParamList, 'RegisterPhoto'>;

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 64) / 3;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

const RegisterPhotoScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RegisterPhotoRouteProp>();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { email, password, fullName, department, classYear, bio, photos: initialPhotos } = route.params;

  // Initialize photos from params (for back navigation) or empty array
  const getInitialPhotos = (): (string | null)[] => {
    if (initialPhotos && initialPhotos.length > 0) {
      const slots: (string | null)[] = [null, null, null, null, null, null];
      initialPhotos.forEach((photo, index) => {
        if (index < 6) slots[index] = photo;
      });
      return slots;
    }
    return [null, null, null, null, null, null];
  };

  const [photos, setPhotos] = useState<(string | null)[]>(getInitialPhotos);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const filledPhotosCount = photos.filter((p) => p !== null).length;
  const isValid = filledPhotosCount >= 2;

  const handleGoBack = () => {
    // Navigate back to basic info with current data preserved
    navigation.navigate('RegisterBasicInfo', {
      email,
      password,
      fullName,
      department,
      classYear,
      bio,
    });
  };

  const isValidFileType = (file: File): boolean => ALLOWED_TYPES.includes(file.type);

  const showInvalidFormatAlert = () => {
    if (Platform.OS === 'web') {
      window.alert('Sadece PNG, JPG ve JPEG formatında fotoğraflar yükleyebilirsiniz.');
    } else {
      Alert.alert('Geçersiz Format', 'Sadece PNG, JPG ve JPEG formatında fotoğraflar yükleyebilirsiniz.', [{ text: 'Tamam' }]);
    }
  };

  const handleFileForSlot = useCallback((file: File, slotIndex: number) => {
    if (!isValidFileType(file)) {
      showInvalidFormatAlert();
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPhotos((prev) => {
        const newPhotos = [...prev];
        newPhotos[slotIndex] = result;
        return newPhotos;
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);
    const files = e.dataTransfer?.files;
    if (files && files[0]) {
      handleFileForSlot(files[0], index);
    }
  }, [handleFileForSlot]);

  const openWebFilePicker = useCallback((index: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.png,.jpg,.jpeg,image/png,image/jpeg';
    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        handleFileForSlot(target.files[0], index);
      }
      input.remove();
    };
    input.click();
  }, [handleFileForSlot]);

  const pickImage = async (index: number) => {
    if (Platform.OS === 'web') {
      openWebFilePicker(index);
      return;
    }
    Alert.alert('Fotoğraf Ekle', 'Nereden fotoğraf eklemek istersiniz?', [
      { text: 'Kamera', onPress: () => takePhoto(index) },
      { text: 'Galeri', onPress: () => pickFromGallery(index) },
      { text: 'İptal', style: 'cancel' },
    ]);
  };

  const takePhoto = async (index: number) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin Gerekli', 'Kamera erişim izni gerekiyor.', [{ text: 'Tamam' }]);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => {
        const newPhotos = [...prev];
        newPhotos[index] = result.assets[0].uri;
        return newPhotos;
      });
    }
  };

  const pickFromGallery = async (index: number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin Gerekli', 'Galeri erişim izni gerekiyor.', [{ text: 'Tamam' }]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => {
        const newPhotos = [...prev];
        newPhotos[index] = result.assets[0].uri;
        return newPhotos;
      });
    }
  };

  const removePhoto = (index: number) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Bu fotoğrafı silmek istediğinizden emin misiniz?')) {
        setPhotos((prev) => {
          const newPhotos = [...prev];
          newPhotos[index] = null;
          return newPhotos;
        });
      }
    } else {
      Alert.alert('Fotoğrafı Sil', 'Bu fotoğrafı silmek istediğinizden emin misiniz?', [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            setPhotos((prev) => {
              const newPhotos = [...prev];
              newPhotos[index] = null;
              return newPhotos;
            });
          },
        },
      ]);
    }
  };

  const handleContinue = () => {
    if (isValid) {
      const filledPhotos = photos.filter((p): p is string => p !== null);
      navigation.navigate('RegisterInterest', { email, password, fullName, department, classYear, bio, photos: filledPhotos });
    }
  };

  const renderPhotoSlot = (index: number) => {
    const photo = photos[index];
    const isMain = index === 0;
    const isDragOver = dragOverIndex === index;

    if (photo) {
      return (
        <View
          key={index}
          style={[styles.photoSlot, styles.filledSlot, isDark && styles.filledSlotDark]}
          // @ts-ignore
          onDragOver={Platform.OS === 'web' ? (e: React.DragEvent) => handleDragOver(e, index) : undefined}
          onDragLeave={Platform.OS === 'web' ? handleDragLeave : undefined}
          onDrop={Platform.OS === 'web' ? (e: React.DragEvent) => handleDrop(e, index) : undefined}
        >
          <Image source={{ uri: photo }} style={styles.photoImage} resizeMode="cover" />
          {isMain && (
            <View style={styles.mainBadge}>
              <Text style={styles.mainBadgeText}>ANA</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => removePhoto(index)} style={styles.deleteButton} activeOpacity={0.7}>
            <Ionicons name="trash" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={index}
        onPress={() => pickImage(index)}
        style={[styles.photoSlot, styles.emptySlot, isDark && styles.emptySlotDark, isDragOver && styles.dragOverSlot]}
        activeOpacity={0.7}
        // @ts-ignore
        onDragOver={Platform.OS === 'web' ? (e: React.DragEvent) => handleDragOver(e, index) : undefined}
        onDragLeave={Platform.OS === 'web' ? handleDragLeave : undefined}
        onDrop={Platform.OS === 'web' ? (e: React.DragEvent) => handleDrop(e, index) : undefined}
      >
        <View style={[styles.addIconContainer, isDragOver && styles.addIconContainerDragOver]}>
          <Ionicons name={isDragOver ? 'cloud-upload' : 'add'} size={24} color={isDragOver ? Colors.primary : isMain ? Colors.primary : '#94a3b8'} />
        </View>
        {Platform.OS === 'web' && (
          <Text style={[styles.dragHint, isDragOver && styles.dragHintActive]}>
            {isDragOver ? 'Bırak' : 'Sürükle veya tıkla'}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#0a0a1a' : '#f0f4ff' }}>
      <LinearGradient
        colors={isDark 
          ? ['#0a0a1a', '#1a1a3a', '#0a0a1a'] 
          : ['#f0f4ff', '#e8f0fe', '#dbeafe']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={[styles.backButton, isDark && styles.backButtonDark]}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#1e293b'} />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={[styles.progressDot, isDark && styles.progressDotDark]} />
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.titleContainer}>
          <Text style={[styles.title, isDark && styles.titleDark]}>Gülümsemeni göster</Text>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
            Devam etmek için en az 2 fotoğraf ekle.
          </Text>
        </View>

        <View style={styles.photoGrid}>
          {[0, 1, 2, 3, 4, 5].map((index) => renderPhotoSlot(index))}
        </View>
      </ScrollView>

      <View style={[
        styles.footer, 
        { 
          backgroundColor: isDark ? 'rgba(10, 10, 26, 0.95)' : 'rgba(240, 244, 255, 0.95)',
        }
      ]}>
        <View style={styles.trustBadge}>
          <MaterialIcons name="verified-user" size={16} color="#94a3b8" />
          <Text style={styles.trustText}>Fotoğraflar güvenli ve doğrulanmış</Text>
        </View>
        <TouchableOpacity onPress={handleContinue} disabled={!isValid} style={[styles.continueButton, !isValid && styles.continueButtonDisabled]} activeOpacity={0.9}>
          <Text style={styles.continueButtonText}>Devam Et {filledPhotosCount < 2 ? '(' + filledPhotosCount + '/2)' : ''}</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
        {/* Şimdilik Atla Butonu */}
        <TouchableOpacity 
          onPress={() => navigation.navigate('RegisterInterest', { 
            email, 
            password, 
            fullName, 
            department, 
            classYear, 
            bio, 
            photos: [] 
          })} 
          style={styles.skipButton}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>Şimdilik atla</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundLight },
  containerDark: { backgroundColor: Colors.backgroundDark },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 160 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  backButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' },
  backButtonDark: { backgroundColor: 'rgba(255,255,255,0.05)' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressDot: { height: 6, width: 32, borderRadius: 3, backgroundColor: '#e2e8f0' },
  progressDotDark: { backgroundColor: '#334155' },
  progressDotActive: { backgroundColor: Colors.primary },
  headerSpacer: { width: 48, height: 48 },
  titleContainer: { marginTop: 24, marginBottom: 32, paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', marginBottom: 12 },
  titleDark: { color: '#fff' },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },
  subtitleDark: { color: '#94a3b8' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 16, gap: 12 },
  photoSlot: { width: PHOTO_SIZE, height: PHOTO_SIZE * 1.25, borderRadius: 16, overflow: 'hidden' },
  filledSlot: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  filledSlotDark: { borderColor: 'rgba(255,255,255,0.1)' },
  emptySlot: { borderWidth: 2, borderStyle: 'dashed', borderColor: '#cbd5e1', backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  emptySlotDark: { borderColor: '#475569', backgroundColor: 'rgba(255,255,255,0.05)' },
  dragOverSlot: { borderColor: Colors.primary, borderWidth: 3, backgroundColor: 'rgba(19, 55, 236, 0.1)' },
  photoImage: { width: '100%', height: '100%' },
  mainBadge: { position: 'absolute', bottom: 12, left: 12, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.4)' },
  mainBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
  deleteButton: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(239, 68, 68, 0.9)', alignItems: 'center', justifyContent: 'center' },
  addIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  addIconContainerDragOver: { backgroundColor: 'rgba(19, 55, 236, 0.2)' },
  dragHint: { fontSize: 10, color: '#94a3b8', marginTop: 8, textAlign: 'center' },
  dragHintActive: { color: Colors.primary },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 32, paddingTop: 48 },
  footerDark: { },
  trustBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  trustText: { fontSize: 12, color: '#94a3b8' },
  continueButton: { width: '100%', height: 56, borderRadius: 12, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  continueButtonDisabled: { opacity: 0.5 },
  continueButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  skipButton: { marginTop: 16, alignItems: 'center', paddingVertical: 8 },
  skipButtonText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
});

export default RegisterPhotoScreen;