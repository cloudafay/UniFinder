// Fotoğraf Doğrulama Ekranı
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { verificationService, POSE_INSTRUCTIONS } from '../../services/verificationService';

type PoseType = 'smile' | 'thumbs_up' | 'peace_sign';

const PhotoVerificationScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const cameraRef = useRef<CameraView>(null);
  
  const [permission, requestPermission] = useCameraPermissions();
  const [currentPose, setCurrentPose] = useState<PoseType>('smile');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'pending' | 'approved' | 'rejected'>('idle');

  useEffect(() => {
    checkExistingVerification();
    setCurrentPose(verificationService.getRandomPose());
  }, []);

  const checkExistingVerification = async () => {
    if (!user?.id) return;
    
    const { data } = await verificationService.getVerificationStatus(user.id);
    if (data) {
      setVerificationStatus(data.status as any);
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      
      if (photo?.uri) {
        setCapturedPhoto(photo.uri);
      }
    } catch (error) {
      console.error('Fotoğraf çekme hatası:', error);
      Alert.alert('Hata', 'Fotoğraf çekilemedi');
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const handleSubmit = async () => {
    if (!user?.id || !capturedPhoto) return;
    
    setIsSubmitting(true);
    try {
      const { data, error } = await verificationService.requestVerification(
        user.id,
        capturedPhoto,
        currentPose
      );

      if (error) {
        Alert.alert('Hata', error);
      } else {
        setVerificationStatus('pending');
        Alert.alert(
          'Başarılı',
          'Doğrulama talebiniz alındı. Sonuç en kısa sürede bildirilecek.',
          [{ text: 'Tamam', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      Alert.alert('Hata', 'Bir sorun oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Permission check
  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <MaterialIcons name="camera-alt" size={64} color={colors.textTertiary} />
        <Text style={[styles.permissionTitle, { color: colors.textPrimary }]}>
          Kamera İzni Gerekli
        </Text>
        <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
          Fotoğraf doğrulama için kamera erişimi gerekiyor
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: colors.primary }]}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Already verified or pending
  if (verificationStatus === 'approved') {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.statusIcon, { backgroundColor: '#22c55e20' }]}>
          <MaterialIcons name="verified" size={64} color="#22c55e" />
        </View>
        <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>
          Doğrulanmış Profil ✓
        </Text>
        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
          Profilin zaten doğrulanmış durumda
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (verificationStatus === 'pending') {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.statusIcon, { backgroundColor: '#f59e0b20' }]}>
          <MaterialIcons name="hourglass-empty" size={64} color="#f59e0b" />
        </View>
        <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>
          İnceleme Bekliyor
        </Text>
        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
          Doğrulama talebiniz inceleniyor. Sonuç en kısa sürede bildirilecek.
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const poseInfo = POSE_INSTRUCTIONS[currentPose];

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <MaterialIcons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fotoğraf Doğrulama</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Camera or Preview */}
      <View style={styles.cameraContainer}>
        {capturedPhoto ? (
          <Image source={{ uri: capturedPhoto }} style={styles.preview} />
        ) : (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="front"
          >
            {/* Face Guide */}
            <View style={styles.faceGuide}>
              <View style={styles.faceOval} />
            </View>
          </CameraView>
        )}
      </View>

      {/* Pose Instructions */}
      <View style={styles.instructionsContainer}>
        <View style={styles.poseCard}>
          <Text style={styles.poseEmoji}>{poseInfo.icon}</Text>
          <View style={styles.poseInfo}>
            <Text style={styles.poseTitle}>{poseInfo.title}</Text>
            <Text style={styles.poseDescription}>{poseInfo.description}</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 20 }]}>
        {capturedPhoto ? (
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.retakeButton]}
              onPress={handleRetake}
            >
              <MaterialIcons name="refresh" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Tekrar Çek</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.submitButton]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="check" size={24} color="#fff" />
                  <Text style={styles.actionButtonText}>Gönder</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  closeButton: { padding: 8 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  placeholder: { width: 44 },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  preview: { flex: 1 },
  faceGuide: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceOval: {
    width: 250,
    height: 320,
    borderRadius: 125,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    borderStyle: 'dashed',
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 180,
    left: 20,
    right: 20,
  },
  poseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  poseEmoji: { fontSize: 40 },
  poseInfo: { flex: 1 },
  poseTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  poseDescription: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    padding: 4,
  },
  captureButtonInner: {
    flex: 1,
    borderRadius: 36,
    backgroundColor: '#fff',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
  },
  retakeButton: { backgroundColor: 'rgba(255,255,255,0.2)' },
  submitButton: { backgroundColor: '#22c55e' },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  permissionTitle: { fontSize: 20, fontWeight: '600', marginTop: 20 },
  permissionText: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 24,
  },
  permissionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  statusIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  statusTitle: { fontSize: 22, fontWeight: '700' },
  statusText: { fontSize: 15, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    marginTop: 24,
  },
  backButtonText: { fontSize: 16, fontWeight: '600' },
});

export default PhotoVerificationScreen;
