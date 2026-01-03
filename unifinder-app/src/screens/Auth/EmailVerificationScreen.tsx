// Email Verification Screen
// E-posta doğrulama ekranı

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { AuthStackParamList } from '../../navigation/types';

const { width, height } = Dimensions.get('window');

type EmailVerificationRouteProp = RouteProp<AuthStackParamList, 'EmailVerification'>;
type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const EmailVerificationScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EmailVerificationRouteProp>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const email = route.params?.email || '';

  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cooldown sayacı
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // E-posta doğrulama kontrolü (periyodik)
  useEffect(() => {
    const checkVerification = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email_confirmed_at) {
          // E-posta doğrulanmış, ana uygulamaya yönlendir
          setMessage({ type: 'success', text: 'E-posta doğrulandı! Yönlendiriliyorsunuz...' });
          // Auth state change listener otomatik yönlendirecek
        }
      } catch (error) {
        console.error('Doğrulama kontrolü hatası:', error);
      }
    };

    // Her 5 saniyede bir kontrol et
    const interval = setInterval(checkVerification, 5000);
    return () => clearInterval(interval);
  }, []);

  // Doğrulama e-postasını tekrar gönder
  const handleResendEmail = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: 'Doğrulama e-postası tekrar gönderildi!' });
        setResendCooldown(60); // 60 saniye cooldown
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Bir hata oluştu' });
    } finally {
      setIsResending(false);
    }
  };

  // Manuel doğrulama kontrolü
  const handleCheckVerification = async () => {
    setIsChecking(true);
    setMessage(null);

    try {
      // Session'ı yenile
      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error) {
        setMessage({ type: 'error', text: 'Oturum yenilenirken hata oluştu' });
        return;
      }

      if (session?.user?.email_confirmed_at) {
        setMessage({ type: 'success', text: 'E-posta doğrulandı! Yönlendiriliyorsunuz...' });
        // Auth state change listener otomatik yönlendirecek
      } else {
        setMessage({ type: 'error', text: 'E-posta henüz doğrulanmamış. Lütfen gelen kutunuzu kontrol edin.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Bir hata oluştu' });
    } finally {
      setIsChecking(false);
    }
  };

  // Geri dön (giriş ekranına)
  const handleGoBack = async () => {
    // Çıkış yap ve login'e yönlendir
    await supabase.auth.signOut();
    navigation.navigate('Login');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Ambient Background */}
      <View style={[styles.ambientContainer, { pointerEvents: 'none' as const }]}>
        <View style={[styles.ambientBlob, styles.blobTopRight, { backgroundColor: colors.primary }]} />
        <View style={[styles.ambientBlob, styles.blobBottomLeft, { backgroundColor: colors.secondary }]} />
      </View>

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <MaterialIcons name="mark-email-unread" size={80} color={colors.primary} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          E-postanı Doğrula
        </Text>

        {/* Description */}
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          <Text style={{ fontWeight: '600', color: colors.primary }}>{email}</Text>
          {'\n'}adresine doğrulama bağlantısı gönderdik.
        </Text>

        {/* Instructions */}
        <View style={[styles.instructionCard, { backgroundColor: colors.surface }]}>
          <View style={styles.instructionRow}>
            <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <Text style={[styles.instructionText, { color: colors.textPrimary }]}>
              E-posta gelen kutunuzu kontrol edin
            </Text>
          </View>
          <View style={styles.instructionRow}>
            <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <Text style={[styles.instructionText, { color: colors.textPrimary }]}>
              UniFinder'dan gelen e-postayı açın
            </Text>
          </View>
          <View style={styles.instructionRow}>
            <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <Text style={[styles.instructionText, { color: colors.textPrimary }]}>
              "E-postamı Doğrula" bağlantısına tıklayın
            </Text>
          </View>
        </View>

        {/* Message */}
        {message && (
          <View style={[
            styles.messageContainer,
            { backgroundColor: message.type === 'success' ? '#10b981' + '20' : '#ef4444' + '20' }
          ]}>
            <MaterialIcons
              name={message.type === 'success' ? 'check-circle' : 'error'}
              size={20}
              color={message.type === 'success' ? '#10b981' : '#ef4444'}
            />
            <Text style={[
              styles.messageText,
              { color: message.type === 'success' ? '#10b981' : '#ef4444' }
            ]}>
              {message.text}
            </Text>
          </View>
        )}

        {/* Check Button */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={handleCheckVerification}
          disabled={isChecking}
          activeOpacity={0.8}
        >
          {isChecking ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <MaterialIcons name="refresh" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Doğrulamayı Kontrol Et</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Resend Button */}
        <TouchableOpacity
          style={[
            styles.secondaryButton,
            { 
              borderColor: colors.primary,
              opacity: resendCooldown > 0 || isResending ? 0.5 : 1
            }
          ]}
          onPress={handleResendEmail}
          disabled={resendCooldown > 0 || isResending}
          activeOpacity={0.8}
        >
          {isResending ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <>
              <MaterialIcons name="send" size={18} color={colors.primary} />
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                {resendCooldown > 0
                  ? `Tekrar Gönder (${resendCooldown}s)`
                  : 'E-postayı Tekrar Gönder'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Spam Note */}
        <View style={[styles.noteContainer, { backgroundColor: colors.surface }]}>
          <MaterialIcons name="info" size={18} color={colors.textTertiary} />
          <Text style={[styles.noteText, { color: colors.textTertiary }]}>
            E-postayı bulamıyor musunuz? Spam/Gereksiz klasörünüzü kontrol edin.
          </Text>
        </View>

        {/* Back to Login */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={18} color={colors.textSecondary} />
          <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>
            Giriş Ekranına Dön
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  ambientContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  ambientBlob: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    opacity: 0.15,
  },
  blobTopRight: {
    top: -width * 0.3,
    right: -width * 0.3,
  },
  blobBottomLeft: {
    bottom: -width * 0.2,
    left: -width * 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  instructionCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    gap: 16,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  instructionText: {
    fontSize: 14,
    flex: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  messageText: {
    fontSize: 14,
    flex: 1,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 52,
    borderRadius: 16,
    marginBottom: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(19, 55, 236, 0.3)',
      },
      default: {
        shadowColor: '#1337ec',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 52,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: 'transparent',
    marginBottom: 24,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  noteText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default EmailVerificationScreen;

