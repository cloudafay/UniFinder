// Grup Oluşturma Ekranı
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Share,
  Platform,
  Image,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { groupChatService } from '../../services/groupChatService';
import { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CreateGroupScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState('50');
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<{ id: string; name: string } | null>(null);
  const [groupImage, setGroupImage] = useState<string | null>(null);

  const handlePickImage = async () => {
    try {
      // İzin iste
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri izni gerekli');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setGroupImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu');
    }
  };

  const handleCreate = async () => {
    if (!user?.id) {
      Alert.alert('Hata', 'Oturum açmanız gerekiyor');
      return;
    }
    
    if (!name.trim()) {
      Alert.alert('Hata', 'Grup adı gerekli');
      return;
    }
    if (name.trim().length < 3) {
      Alert.alert('Hata', 'Grup adı en az 3 karakter olmalı');
      return;
    }

    setIsLoading(true);
    console.log('Creating group with user:', user.id);
    try {
      const { data, error } = await groupChatService.createGroup(user.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        max_members: parseInt(maxMembers) || 50,
        is_public: isPublic,
        image_url: groupImage || undefined,
      });

      console.log('Group creation result:', { data, error });

      if (error) {
        console.error('Group creation error:', error);
        Alert.alert('Hata', typeof error === 'string' ? error : 'Grup oluşturulamadı');
      } else if (data) {
        setCreatedGroup({ id: data.id, name: data.name });
      }
    } catch (error) {
      console.error('Group creation exception:', error);
      Alert.alert('Hata', 'Bir sorun oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const getGroupLink = () => {
    if (!createdGroup) return '';
    return `unifinder://group/${createdGroup.id}`;
  };

  const handleShareLink = async () => {
    const link = getGroupLink();
    try {
      await Share.share({
        message: `"${createdGroup?.name}" grubuna katıl!\n\n${link}`,
        title: 'Gruba Davet',
      });
    } catch (error) {
      console.error('Paylaşım hatası:', error);
    }
  };

  const handleCopyLink = () => {
    const link = getGroupLink();
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(link);
      Alert.alert('Kopyalandı', 'Link panoya kopyalandı');
    } else {
      // React Native Clipboard kullanılabilir
      Alert.alert('Link', link);
    }
  };

  const handleGoToGroup = () => {
    if (createdGroup) {
      navigation.replace('GroupChat', { 
        groupId: createdGroup.id, 
        groupName: createdGroup.name 
      });
    }
  };

  // Grup oluşturulduysa başarı ekranını göster
  if (createdGroup) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.successContent}>
          {/* Success Icon */}
          <View style={styles.successIconContainer}>
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.successIconGradient}
            >
              <Ionicons name="checkmark" size={48} color="#fff" />
            </LinearGradient>
          </View>

          <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
            Grup Oluşturuldu! 🎉
          </Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            "{createdGroup.name}" grubu başarıyla oluşturuldu
          </Text>

          {/* QR Code */}
          <View style={[styles.qrContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.qrTitle, { color: colors.textPrimary }]}>
              QR Kod ile Davet Et
            </Text>
            <View style={styles.qrWrapper}>
              <QRCode
                value={getGroupLink()}
                size={180}
                backgroundColor="transparent"
                color={isDark ? '#fff' : '#1e293b'}
              />
            </View>
            <Text style={[styles.qrHint, { color: colors.textSecondary }]}>
              Arkadaşların bu kodu tarayarak gruba katılabilir
            </Text>
          </View>

          {/* Share Options */}
          <View style={styles.shareOptions}>
            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: colors.primary }]}
              onPress={handleShareLink}
            >
              <Ionicons name="share-social" size={20} color="#fff" />
              <Text style={styles.shareButtonText}>Linki Paylaş</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.copyButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleCopyLink}
            >
              <Ionicons name="copy-outline" size={20} color={colors.textPrimary} />
              <Text style={[styles.copyButtonText, { color: colors.textPrimary }]}>Kopyala</Text>
            </TouchableOpacity>
          </View>

          {/* Go to Group Button */}
          <TouchableOpacity
            style={styles.goToGroupButton}
            onPress={handleGoToGroup}
          >
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={styles.goToGroupGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.goToGroupText}>Gruba Git</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Grup Oluştur</Text>
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
        {/* Group Icon */}
        <TouchableOpacity 
          style={[styles.iconPicker, { backgroundColor: colors.surface }]}
          onPress={handlePickImage}
        >
          {groupImage ? (
            <Image source={{ uri: groupImage }} style={styles.groupImagePreview} />
          ) : (
            <View style={[styles.iconPlaceholder, { backgroundColor: `${colors.primary}20` }]}>
              <MaterialIcons name="group" size={40} color={colors.primary} />
            </View>
          )}
          <View style={styles.iconEditBadge}>
            <MaterialIcons name="camera-alt" size={14} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={[styles.iconHint, { color: colors.textSecondary }]}>
          Grup fotoğrafı ekle
        </Text>

        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Grup Adı *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
            placeholder="Örn: Bilgisayar Mühendisliği 2024"
            placeholderTextColor={colors.textTertiary}
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
          <Text style={[styles.charCount, { color: colors.textTertiary }]}>
            {name.length}/50
          </Text>
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Açıklama</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.textPrimary }]}
            placeholder="Grup hakkında kısa bir açıklama..."
            placeholderTextColor={colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            maxLength={200}
          />
          <Text style={[styles.charCount, { color: colors.textTertiary }]}>
            {description.length}/200
          </Text>
        </View>

        {/* Max Members */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Maksimum Üye Sayısı</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
            placeholder="50"
            placeholderTextColor={colors.textTertiary}
            value={maxMembers}
            onChangeText={setMaxMembers}
            keyboardType="number-pad"
            maxLength={3}
          />
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Maksimum 100 üye eklenebilir
          </Text>
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
                {isPublic ? 'Herkese Açık' : 'Özel Grup'}
              </Text>
              <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>
                {isPublic ? 'Herkes bulabilir ve katılabilir' : 'Sadece davet ile katılım'}
              </Text>
            </View>
          </View>
          <View style={[styles.toggle, isPublic && styles.toggleActive]}>
            <View style={[styles.toggleKnob, isPublic && styles.toggleKnobActive]} />
          </View>
        </TouchableOpacity>

        {/* Info */}
        <View style={[styles.infoCard, { backgroundColor: `${colors.primary}10` }]}>
          <MaterialIcons name="info-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Grup oluşturulduktan sonra QR kod ve link ile arkadaşlarını davet edebilirsin.
          </Text>
        </View>

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
  iconPicker: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  iconPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupImagePreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  iconEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  iconHint: { textAlign: 'center', fontSize: 13, marginTop: 12, marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: 12, textAlign: 'right', marginTop: 4 },
  hint: { fontSize: 12, marginTop: 4 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
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
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 20,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20 },
  // Success Screen Styles
  successContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successIconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  qrContainer: {
    width: '100%',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
  },
  qrHint: {
    fontSize: 13,
    textAlign: 'center',
  },
  shareOptions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 24,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  copyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  copyButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  goToGroupButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  goToGroupGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  goToGroupText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default CreateGroupScreen;
