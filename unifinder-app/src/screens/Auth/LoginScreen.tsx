// Giriş Ekranı - Mobile & Web Compatible
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Colors } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import emailValidation from '../../utils/emailValidation';
import { supabase } from '../../lib/supabase';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, isLoading } = useAuth();
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  
  // Responsive width for card
  const cardMaxWidth = Math.min(width - 32, 420);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailWarning, setEmailWarning] = useState('');

  // E-posta değiştiğinde kontrol et
  useEffect(() => {
    if (email.length > 5 && email.includes('@')) {
      const result = emailValidation.validateEmail(email);
      if (result.canGetStudentBadge) {
        setEmailWarning('🎓 Öğrenci rozeti ile giriş yapacaksınız');
      } else {
        setEmailWarning('💡 .edu.tr ile Doğrulanmış Öğrenci rozeti alabilirsiniz');
      }
    } else {
      setEmailWarning('');
    }
  }, [email]);

  const handleLogin = async () => {
    // Trim email
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail || !password) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }
    
    // Basic email validation
    if (!trimmedEmail.includes('@')) {
      setError('Geçerli bir e-posta adresi girin');
      return;
    }
    
    try {
      setError('');
      setIsSubmitting(true);
      await login(trimmedEmail, password);
      // If login successful, navigation will happen automatically
    } catch (err: any) {
      // Show the actual error message from database
      setError(err.message || 'Giriş başarısız');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      Alert.alert(
        'E-posta Gerekli',
        'Şifre sıfırlama için lütfen önce e-posta adresinizi girin.',
        [{ text: 'Tamam' }]
      );
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: Platform.OS === 'web' ? 'http://localhost:8083' : undefined,
      });
      
      if (error) throw error;
      
      Alert.alert(
        'Şifre Sıfırlama',
        'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.',
        [{ text: 'Tamam' }]
      );
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Şifre sıfırlama e-postası gönderilemedi.');
    }
  };

  return (
    <LinearGradient
      colors={isDark 
        ? ['#0f0c29', '#302b63', '#24243e'] 
        : ['#667eea', '#764ba2', '#f093fb']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Glass Card */}
          <View style={[
            styles.glassCard, 
            { 
              backgroundColor: isDark 
                ? 'rgba(30, 30, 60, 0.75)' 
                : 'rgba(255, 255, 255, 0.85)', 
              borderColor: isDark 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(255, 255, 255, 0.5)',
              maxWidth: cardMaxWidth,
              width: '100%',
            }
          ]}>
            {/* Logo / Header */}
            <View style={styles.header}>
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={styles.logoIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="school" size={32} color="#fff" />
              </LinearGradient>
              <Text style={[styles.title, { color: isDark ? '#fff' : '#1e293b' }]}>UniFinder</Text>
              <Text style={[styles.subtitle, { color: isDark ? 'rgba(255,255,255,0.7)' : '#64748b' }]}>Kampüsünle Bağlan</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDark ? 'rgba(255,255,255,0.9)' : '#475569' }]}>Üniversite E-postası</Text>
                <View style={[
                  styles.inputContainer, 
                  { 
                    backgroundColor: isDark 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'rgba(0, 0, 0, 0.05)', 
                    borderColor: isDark 
                      ? 'rgba(255, 255, 255, 0.15)' 
                      : 'rgba(0, 0, 0, 0.1)' 
                  }
                ]}>
                  <MaterialIcons 
                    name="email" 
                    size={20} 
                    color={isDark ? 'rgba(255,255,255,0.5)' : '#94a3b8'} 
                    style={styles.inputIconLeft}
                  />
                  <TextInput
                    style={[styles.input, { color: isDark ? '#fff' : '#1e293b' }]}
                    placeholder="ogrenci@universite.edu.tr"
                    placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8'}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                  {email.includes('@') && email.includes('.edu') && (
                    <MaterialIcons name="check-circle" size={20} color="#22c55e" />
                  )}
                </View>
                {emailWarning ? (
                  <Text style={[styles.warningText, { color: '#f59e0b' }]}>{emailWarning}</Text>
                ) : null}
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDark ? 'rgba(255,255,255,0.9)' : '#475569' }]}>Şifre</Text>
                <View style={[
                  styles.inputContainer, 
                  { 
                    backgroundColor: isDark 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'rgba(0, 0, 0, 0.05)', 
                    borderColor: isDark 
                      ? 'rgba(255, 255, 255, 0.15)' 
                      : 'rgba(0, 0, 0, 0.1)' 
                  }
                ]}>
                  <MaterialIcons 
                    name="lock" 
                    size={20} 
                    color={isDark ? 'rgba(255,255,255,0.5)' : '#94a3b8'} 
                    style={styles.inputIconLeft}
                  />
                  <TextInput
                    style={[styles.input, { color: isDark ? '#fff' : '#1e293b' }]}
                    placeholder="Şifrenizi girin"
                    placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8'}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <MaterialIcons
                      name={showPassword ? 'visibility-off' : 'visibility'}
                      size={20}
                      color={isDark ? 'rgba(255,255,255,0.5)' : '#94a3b8'}
                    />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
                  <Text style={[styles.forgotPasswordText, { color: isDark ? '#a5b4fc' : '#6366f1' }]}>Şifremi Unuttum?</Text>
                </TouchableOpacity>
              </View>

              {/* Error Message */}
              {error ? (
                <View style={[styles.errorContainer, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                  <MaterialIcons name="error-outline" size={16} color="#ef4444" />
                  <Text style={[styles.errorText, { color: '#ef4444' }]}>{error}</Text>
                </View>
              ) : null}

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#6366f1', '#8b5cf6']}
                  style={styles.loginButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Giriş Yap</Text>
                      <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b' }]}>
                UniFinder'da yeni misin?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('RegisterBasicInfo')}>
                <Text style={[styles.footerLink, { color: isDark ? '#a5b4fc' : '#6366f1' }]}>Kayıt Ol</Text>
              </TouchableOpacity>
            </View>

            {/* Trust Badge */}
            <View style={[
              styles.trustBadge, 
              { 
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)' 
              }
            ]}>
              <MaterialIcons name="verified-user" size={14} color={isDark ? '#a5b4fc' : '#6366f1'} />
              <Text style={[styles.trustBadgeText, { color: isDark ? '#a5b4fc' : '#6366f1' }]}>SADECE DOĞRULANMIŞ ÜNİVERSİTE ÖĞRENCİLERİ</Text>
            </View>
          </View>

          {/* Bottom Disclaimer */}
          <Text style={[styles.disclaimer, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.8)' }]}>
            Giriş yaparak Gizlilik Politikası ve{'\n'}Kullanım Şartlarını kabul etmiş olursunuz.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 40,
  },
  glassCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 6,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  inputIconLeft: {
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    paddingHorizontal: 24,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'center',
    borderWidth: 1,
  },
  trustBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '500',
    lineHeight: 18,
  },
});

export default LoginScreen;
