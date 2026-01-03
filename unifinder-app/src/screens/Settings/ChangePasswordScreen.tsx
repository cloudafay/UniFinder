// Şifre Değiştirme Ekranı
// Şifre Değiştirme Sayfası

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

const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Şifre güçlülük kontrolü
  const getPasswordStrength = (password: string): { level: number; text: string; color: string } => {
    if (password.length === 0) return { level: 0, text: '', color: 'transparent' };
    if (password.length < 6) return { level: 1, text: 'Çok Zayıf', color: '#ef4444' };
    if (password.length < 8) return { level: 2, text: 'Zayıf', color: '#f59e0b' };
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
    
    if (strength >= 4 && password.length >= 10) return { level: 5, text: 'Çok Güçlü', color: '#22c55e' };
    if (strength >= 3 && password.length >= 8) return { level: 4, text: 'Güçlü', color: '#10b981' };
    if (strength >= 2) return { level: 3, text: 'Orta', color: '#eab308' };
    return { level: 2, text: 'Zayıf', color: '#f59e0b' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handleChangePassword = async () => {
    // Validasyon
    if (!newPassword || !confirmPassword) {
      if (Platform.OS === 'web') {
        window.alert('Hata\n\nLütfen tüm alanları doldurun.');
      }
      return;
    }

    if (newPassword !== confirmPassword) {
      if (Platform.OS === 'web') {
        window.alert('Hata\n\nYeni şifreler eşleşmiyor.');
      }
      return;
    }

    if (newPassword.length < 6) {
      if (Platform.OS === 'web') {
        window.alert('Hata\n\nŞifre en az 6 karakter olmalıdır.');
      }
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      if (Platform.OS === 'web') {
        window.alert('Başarılı\n\nŞifreniz başarıyla güncellendi.');
      }
      
      // Alanları temizle
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      navigation.goBack();
    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert('Hata\n\n' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!user?.email) {
      if (Platform.OS === 'web') {
        window.alert('Hata\n\nE-posta adresi bulunamadı.');
      }
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      if (Platform.OS === 'web') {
        window.alert('Başarılı\n\nŞifre sıfırlama bağlantısı e-postanıza gönderildi.');
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
        <View style={[styles.ambientBlob, styles.blobBottomRight, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]} />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Şifre Değiştir</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }]}>
          <MaterialIcons name="info" size={24} color="#3b82f6" />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Güvenliğiniz için güçlü bir şifre kullanın. En az 8 karakter, büyük/küçük harf, rakam ve özel karakter içermelidir.
          </Text>
        </View>

        {/* Password Form */}
        <View style={styles.formSection}>
          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Yeni Şifre</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons name="lock" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Yeni şifrenizi girin"
                placeholderTextColor={colors.textTertiary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <MaterialIcons 
                  name={showNewPassword ? 'visibility' : 'visibility-off'} 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
            
            {/* Password Strength Indicator */}
            {newPassword.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <View
                      key={level}
                      style={[
                        styles.strengthBar,
                        { backgroundColor: level <= passwordStrength.level ? passwordStrength.color : colors.border }
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.text}
                </Text>
              </View>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Şifreyi Onayla</Text>
            <View style={[
              styles.inputContainer, 
              { backgroundColor: colors.surface, borderColor: colors.border },
              confirmPassword.length > 0 && confirmPassword !== newPassword && { borderColor: '#ef4444' }
            ]}>
              <MaterialIcons name="lock-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Şifrenizi tekrar girin"
                placeholderTextColor={colors.textTertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <MaterialIcons 
                  name={showConfirmPassword ? 'visibility' : 'visibility-off'} 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && confirmPassword !== newPassword && (
              <Text style={styles.errorText}>Şifreler eşleşmiyor</Text>
            )}
            {confirmPassword.length > 0 && confirmPassword === newPassword && (
              <View style={styles.matchContainer}>
                <MaterialIcons name="check-circle" size={16} color="#22c55e" />
                <Text style={styles.matchText}>Şifreler eşleşiyor</Text>
              </View>
            )}
          </View>
        </View>

        {/* Password Requirements */}
        <View style={[styles.requirementsCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <Text style={[styles.requirementsTitle, { color: colors.textPrimary }]}>Şifre Gereksinimleri</Text>
          {[
            { check: newPassword.length >= 8, text: 'En az 8 karakter' },
            { check: /[A-Z]/.test(newPassword), text: 'Bir büyük harf (A-Z)' },
            { check: /[a-z]/.test(newPassword), text: 'Bir küçük harf (a-z)' },
            { check: /\d/.test(newPassword), text: 'Bir rakam (0-9)' },
            { check: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword), text: 'Bir özel karakter (!@#$%...)' },
          ].map((req, index) => (
            <View key={index} style={styles.requirementItem}>
              <MaterialIcons 
                name={req.check ? 'check-circle' : 'radio-button-unchecked'} 
                size={18} 
                color={req.check ? '#22c55e' : colors.textTertiary} 
              />
              <Text style={[
                styles.requirementText, 
                { color: req.check ? colors.textPrimary : colors.textSecondary }
              ]}>
                {req.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton, 
            { backgroundColor: Colors.primary },
            (!newPassword || !confirmPassword || newPassword !== confirmPassword) && styles.submitButtonDisabled
          ]}
          onPress={handleChangePassword}
          disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="lock" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Şifreyi Güncelle</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textTertiary }]}>veya</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Reset via Email */}
        <TouchableOpacity
          style={[styles.emailButton, { borderColor: colors.border }]}
          onPress={handleSendResetEmail}
          disabled={isLoading || emailSent}
        >
          <MaterialIcons name="email" size={20} color={colors.textPrimary} />
          <Text style={[styles.emailButtonText, { color: colors.textPrimary }]}>
            {emailSent ? 'E-posta Gönderildi ✓' : 'E-posta ile Sıfırla'}
          </Text>
        </TouchableOpacity>

        {emailSent && (
          <Text style={[styles.emailSentText, { color: colors.textSecondary }]}>
            Şifre sıfırlama bağlantısı {user?.email} adresine gönderildi.
          </Text>
        )}
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  formSection: {
    gap: 20,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 8,
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
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    width: 32,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginLeft: 4,
  },
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 4,
  },
  matchText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500',
  },
  requirementsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    gap: 10,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  requirementText: {
    fontSize: 13,
  },
  submitButton: {
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
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
  },
  emailButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  emailSentText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ChangePasswordScreen;

