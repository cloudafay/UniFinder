// Kampüs Doğrulama Ekranı
// Kampüs Doğrulama Sayfası

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface StepProps {
  number: number;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
}

const Step: React.FC<StepProps> = ({ number, title, description, isCompleted, isActive }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.stepContainer}>
      <View style={[
        styles.stepNumber,
        isCompleted && styles.stepCompleted,
        isActive && styles.stepActive,
      ]}>
        {isCompleted ? (
          <MaterialIcons name="check" size={18} color="#fff" />
        ) : (
          <Text style={[styles.stepNumberText, isActive && { color: '#fff' }]}>{number}</Text>
        )}
      </View>
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>{description}</Text>
      </View>
    </View>
  );
};

const VerificationScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [studentId, setStudentId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const isVerified = user?.isVerified || false;
  const userEmail = user?.email || '';
  const isEduEmail = userEmail.endsWith('.edu.tr') || userEmail.endsWith('.edu');

  const handleResendVerification = async () => {
    if (!userEmail) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      });
      
      if (error) throw error;
      
      setVerificationSent(true);
      if (Platform.OS === 'web') {
        window.alert('Başarılı\n\nDoğrulama e-postası tekrar gönderildi. Lütfen gelen kutunuzu kontrol edin.');
      }
    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert('Hata\n\n' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitStudentId = async () => {
    if (!studentId.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Hata\n\nLütfen öğrenci numaranızı girin.');
      }
      return;
    }
    
    setIsLoading(true);
    try {
      // Öğrenci numarasını kaydet
      const { error } = await supabase
        .from('profiles')
        .update({ student_id: studentId.trim() })
        .eq('id', user?.id);
      
      if (error) throw error;
      
      if (Platform.OS === 'web') {
        window.alert('Başarılı\n\nÖğrenci numaranız kaydedildi. Doğrulama işlemi 24 saat içinde tamamlanacak.');
      }
    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert('Hata\n\n' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Ambient Background */}
      <View style={[styles.ambientContainer, { pointerEvents: 'none' as const }]}>
        <View style={[styles.ambientBlob, styles.blobTopLeft, { backgroundColor: `${Colors.primary}15` }]} />
        <View style={[styles.ambientBlob, styles.blobBottomRight, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]} />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Kampüs Doğrulama</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={[
          styles.statusCard,
          { 
            backgroundColor: isVerified ? 'rgba(34, 197, 94, 0.1)' : 'rgba(249, 115, 22, 0.1)',
            borderColor: isVerified ? 'rgba(34, 197, 94, 0.3)' : 'rgba(249, 115, 22, 0.3)',
          }
        ]}>
          <View style={[
            styles.statusIcon,
            { backgroundColor: isVerified ? '#22c55e' : '#f59e0b' }
          ]}>
            <MaterialIcons 
              name={isVerified ? 'verified' : 'pending'} 
              size={32} 
              color="#fff" 
            />
          </View>
          <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>
            {isVerified ? 'Hesap Doğrulandı' : 'Doğrulama Bekliyor'}
          </Text>
          <Text style={[styles.statusDescription, { color: colors.textSecondary }]}>
            {isVerified 
              ? 'E-posta adresiniz başarıyla doğrulandı. Tüm özelliklere erişebilirsiniz.'
              : 'Hesabınızı doğrulamak için aşağıdaki adımları tamamlayın.'}
          </Text>
        </View>

        {/* User Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <View style={styles.infoRow}>
            <MaterialIcons name="email" size={20} color={colors.textSecondary} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>E-posta</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{userEmail}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <MaterialIcons name="school" size={20} color={colors.textSecondary} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Durum</Text>
            <View style={[
              styles.badge,
              { backgroundColor: isEduEmail ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)' }
            ]}>
              <Text style={[
                styles.badgeText,
                { color: isEduEmail ? '#22c55e' : '#ef4444' }
              ]}>
                {isEduEmail ? '✓ Üniversite E-postası' : '✗ Standart E-posta'}
              </Text>
            </View>
          </View>
        </View>

        {/* Verification Steps */}
        {!isVerified && (
          <View style={styles.stepsSection}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DOĞRULAMA ADIMLARI</Text>
            
            <View style={[styles.stepsCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <Step
                number={1}
                title="E-posta Doğrulama"
                description="Kayıt olurken kullandığınız e-postaya gönderilen bağlantıya tıklayın"
                isCompleted={isVerified}
                isActive={!isVerified}
              />
              <View style={[styles.stepDivider, { backgroundColor: colors.border }]} />
              <Step
                number={2}
                title="Öğrenci Numarası"
                description="Üniversite öğrenci numaranızı girin (opsiyonel)"
                isCompleted={false}
                isActive={false}
              />
              <View style={[styles.stepDivider, { backgroundColor: colors.border }]} />
              <Step
                number={3}
                title="Kampüs Onayı"
                description="Üniversiteniz tarafından onaylanma (otomatik)"
                isCompleted={false}
                isActive={false}
              />
            </View>
          </View>
        )}

        {/* Actions */}
        {!isVerified && (
          <View style={styles.actionsSection}>
            {/* Resend Email */}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: Colors.primary }]}
              onPress={handleResendVerification}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="email" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Doğrulama E-postası Gönder</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Student ID Input */}
            <View style={styles.studentIdSection}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Öğrenci Numarası (Opsiyonel)</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <MaterialIcons name="badge" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Örn: 2021123456"
                  placeholderTextColor={colors.textTertiary}
                  value={studentId}
                  onChangeText={setStudentId}
                  keyboardType="number-pad"
                />
              </View>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={handleSubmitStudentId}
                disabled={isLoading || !studentId.trim()}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Verified Benefits */}
        {isVerified && (
          <View style={styles.benefitsSection}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DOĞRULANMIŞ HESAP AVANTAJLARI</Text>
            <View style={[styles.benefitsCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              {[
                { icon: 'verified', text: 'Doğrulanmış rozeti' },
                { icon: 'visibility', text: 'Tüm profilleri görüntüleme' },
                { icon: 'chat', text: 'Sınırsız mesajlaşma' },
                { icon: 'favorite', text: 'Sınırsız beğeni' },
                { icon: 'star', text: 'Süper beğeni özelliği' },
              ].map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <View style={[styles.benefitIcon, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                    <MaterialIcons name={benefit.icon as any} size={18} color="#22c55e" />
                  </View>
                  <Text style={[styles.benefitText, { color: colors.textPrimary }]}>{benefit.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Help Section */}
        <View style={styles.helpSection}>
          <MaterialIcons name="help-outline" size={20} color={colors.textTertiary} />
          <Text style={[styles.helpText, { color: colors.textTertiary }]}>
            Doğrulama ile ilgili sorun mu yaşıyorsunuz? support@unifinder.app adresinden bize ulaşabilirsiniz.
          </Text>
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
    ...Platform.select({
      web: {
        filter: 'blur(100px)',
      },
      default: {
        opacity: 0.6,
      },
    }),
  },
  blobTopLeft: {
    top: '-10%',
    left: '-10%',
    width: 400,
    height: 400,
  },
  blobBottomRight: {
    bottom: '-10%',
    right: '-10%',
    width: 350,
    height: 350,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  statusCard: {
    alignItems: 'center',
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  stepsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginLeft: 4,
    marginBottom: 12,
  },
  stepsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 8,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCompleted: {
    backgroundColor: '#22c55e',
  },
  stepActive: {
    backgroundColor: Colors.primary,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  stepDivider: {
    width: 2,
    height: 16,
    marginLeft: 15,
    marginVertical: 4,
    borderRadius: 1,
  },
  actionsSection: {
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 26,
    marginBottom: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(19, 55, 236, 0.3)',
      } as any,
      default: {
        elevation: 4,
      },
    }),
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  studentIdSection: {
    gap: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  secondaryButton: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  benefitsSection: {
    marginBottom: 24,
  },
  benefitsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    fontSize: 14,
    fontWeight: '500',
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 8,
    marginBottom: 32,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});

export default VerificationScreen;

