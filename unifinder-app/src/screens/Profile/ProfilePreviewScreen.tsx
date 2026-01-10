// Profil Önizleme Ekranı
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { promptService } from '../../services/promptService';
import { getClassYearLabel } from '../../utils/helpers';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

const ProfilePreviewScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user?.id) return;

    const { data } = await profileService.getById(user.id);
    if (data) {
      setProfile(data);
    }

    const { data: promptData } = await promptService.getUserAnswers(user.id);
    if (promptData) {
      setPrompts(promptData);
    }
  };

  const photos = profile?.photos || [];
  const currentPhoto = photos[currentPhotoIndex] || profile?.avatar_url;

  const handleNextPhoto = () => {
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(prev => prev + 1);
    }
  };

  const handlePrevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(prev => prev - 1);
    }
  };

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profil Önizleme</Text>
          <View style={styles.placeholder} />
        </View>
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profil Önizleme</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('EditProfile' as never)}
          style={styles.editButton}
        >
          <MaterialIcons name="edit" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: `${colors.primary}10` }]}>
          <MaterialIcons name="info-outline" size={18} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Profilin diğer kullanıcılara böyle görünüyor
          </Text>
        </View>

        {/* Card Preview */}
        <View style={[styles.cardContainer, { backgroundColor: colors.surface }]}>
          {/* Photo */}
          <View style={styles.photoContainer}>
            {currentPhoto ? (
              <Image source={{ uri: currentPhoto }} style={styles.photo} />
            ) : (
              <View style={[styles.photoPlaceholder, { backgroundColor: `${colors.primary}20` }]}>
                <MaterialIcons name="person" size={80} color={colors.primary} />
              </View>
            )}

            {/* Photo Navigation */}
            {photos.length > 1 && (
              <>
                <TouchableOpacity
                  style={[styles.photoNav, styles.photoNavLeft]}
                  onPress={handlePrevPhoto}
                />
                <TouchableOpacity
                  style={[styles.photoNav, styles.photoNavRight]}
                  onPress={handleNextPhoto}
                />
                <View style={styles.photoIndicators}>
                  {photos.map((_: any, index: number) => (
                    <View
                      key={index}
                      style={[
                        styles.photoIndicator,
                        index === currentPhotoIndex && styles.photoIndicatorActive
                      ]}
                    />
                  ))}
                </View>
              </>
            )}

            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.photoGradient}
            />

            {/* Info Overlay */}
            <View style={styles.infoOverlay}>
              <Text style={styles.nameText}>
                {profile.full_name} • {getClassYearLabel(profile.year)}
              </Text>
              <View style={styles.departmentRow}>
                <MaterialIcons name="school" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.departmentText}>
                  {profile.department} • {profile.university}
                </Text>
              </View>
            </View>
          </View>

          {/* Bio */}
          {profile.bio && (
            <View style={styles.bioSection}>
              <Text style={[styles.bioText, { color: colors.textPrimary }]}>
                {profile.bio}
              </Text>
            </View>
          )}

          {/* Prompts */}
          {prompts.length > 0 && (
            <View style={styles.promptsSection}>
              {prompts.slice(0, 3).map((prompt, index) => (
                <View key={index} style={[styles.promptCard, { backgroundColor: `${colors.primary}08` }]}>
                  <Text style={[styles.promptQuestion, { color: colors.textSecondary }]}>
                    {(prompt as any).prompt?.question}
                  </Text>
                  <Text style={[styles.promptAnswer, { color: colors.textPrimary }]}>
                    {prompt.answer}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <View style={styles.interestsSection}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>İlgi Alanları</Text>
              <View style={styles.interestsTags}>
                {profile.interests.map((interest: string, index: number) => (
                  <View key={index} style={[styles.interestTag, { backgroundColor: `${colors.primary}15` }]}>
                    <Text style={[styles.interestText, { color: colors.primary }]}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={[styles.tipsTitle, { color: colors.textPrimary }]}>Profil İpuçları</Text>

          {[
            { icon: 'photo-camera', text: 'En az 3 fotoğraf ekle', done: photos.length >= 3 },
            { icon: 'edit', text: 'Bio ekle', done: !!profile.bio },
            { icon: 'quiz', text: 'Soru-cevap ekle', done: prompts.length > 0 },
            { icon: 'interests', text: 'İlgi alanları seç', done: profile.interests?.length > 0 },
          ].map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <View style={[styles.tipIcon, { backgroundColor: tip.done ? '#22c55e20' : `${colors.primary}15` }]}>
                <MaterialIcons
                  name={tip.done ? 'check' : tip.icon as any}
                  size={18}
                  color={tip.done ? '#22c55e' : colors.primary}
                />
              </View>
              <Text style={[
                styles.tipText,
                { color: tip.done ? colors.textTertiary : colors.textSecondary },
                tip.done && styles.tipTextDone
              ]}>
                {tip.text}
              </Text>
            </View>
          ))}
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
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  editButton: { padding: 8 },
  placeholder: { width: 40 },
  content: { flex: 1, padding: 16 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  infoText: { fontSize: 13, flex: 1 },
  cardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  photoContainer: {
    width: '100%',
    height: CARD_WIDTH * 1.2,
    position: 'relative',
  },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoNav: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '50%',
  },
  photoNavLeft: { left: 0 },
  photoNavRight: { right: 0 },
  photoIndicators: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 4,
  },
  photoIndicator: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  photoIndicatorActive: { backgroundColor: '#fff' },
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  nameText: { color: '#fff', fontSize: 26, fontWeight: '700' },
  departmentRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  departmentText: { color: 'rgba(255,255,255,0.9)', fontSize: 14 },
  bioSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  bioText: { fontSize: 15, lineHeight: 22 },
  promptsSection: { padding: 16 },
  promptCard: { padding: 14, borderRadius: 12, marginBottom: 10 },
  promptQuestion: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  promptAnswer: { fontSize: 15 },
  interestsSection: { padding: 16, paddingTop: 0 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  interestsTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  interestText: { fontSize: 13, fontWeight: '500' },
  tipsSection: { marginBottom: 20 },
  tipsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  tipItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipText: { fontSize: 14 },
  tipTextDone: { textDecorationLine: 'line-through' },
});

export default ProfilePreviewScreen;
