// Register Basic Info Screen - Mobile First Design
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthStackParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import emailValidation, { EmailValidationResult } from '../../utils/emailValidation';
import { searchDepartments, searchFaculties } from '../../data/turkeyUniversityData';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'RegisterBasicInfo'>;
type RegisterBasicInfoRouteProp = RouteProp<AuthStackParamList, 'RegisterBasicInfo'>;

const CLASS_YEARS = [
  { id: 'prep', label: 'Hazırlık' },
  { id: 'freshman', label: '1. Sınıf' },
  { id: 'sophomore', label: '2. Sınıf' },
  { id: 'junior', label: '3. Sınıf' },
  { id: 'senior', label: '4. Sınıf' },
  { id: 'grad', label: 'Y. Lisans' },
];

const RegisterBasicInfoScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RegisterBasicInfoRouteProp>();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { width } = useWindowDimensions();

  // Form States
  const [email, setEmail] = useState(route.params?.email || '');
  const [password, setPassword] = useState(route.params?.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState(route.params?.department || '');
  const [faculty, setFaculty] = useState('');
  const [classYear, setClassYear] = useState(route.params?.classYear || 'freshman');
  const [bio, setBio] = useState(route.params?.bio || '');
  
  // Validation & Autocomplete States
  const [emailValidationResult, setEmailValidationResult] = useState<EmailValidationResult | null>(null);
  const [departmentSuggestions, setDepartmentSuggestions] = useState<string[]>([]);
  const [facultySuggestions, setFacultySuggestions] = useState<string[]>([]);
  const [showDepartmentSuggestions, setShowDepartmentSuggestions] = useState(false);
  const [showFacultySuggestions, setShowFacultySuggestions] = useState(false);

  // Colors based on theme
  const colors = {
    background: isDark ? ['#0f0c29', '#302b63', '#24243e'] : ['#667eea', '#764ba2'],
    card: isDark ? 'rgba(20, 20, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    text: isDark ? '#ffffff' : '#1a1a2e',
    textSecondary: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b',
    textMuted: isDark ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8',
    inputBg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    inputBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
    primary: '#6366f1',
    primaryLight: isDark ? '#818cf8' : '#6366f1',
    chipBg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    chipActiveBg: '#6366f1',
    suggestionBg: isDark ? 'rgba(30, 30, 50, 0.98)' : 'rgba(255, 255, 255, 0.98)',
  };

  // Email validation
  useEffect(() => {
    if (email.length > 0) {
      const result = emailValidation.validateEmail(email);
      setEmailValidationResult(result);
    } else {
      setEmailValidationResult(null);
    }
  }, [email]);

  // Department search
  useEffect(() => {
    if (department.length >= 2) {
      const results = searchDepartments(department);
      setDepartmentSuggestions(results.slice(0, 5));
      setShowDepartmentSuggestions(results.length > 0);
    } else {
      setDepartmentSuggestions([]);
      setShowDepartmentSuggestions(false);
    }
  }, [department]);

  // Faculty search
  useEffect(() => {
    if (faculty.length >= 2) {
      const results = searchFaculties(faculty);
      setFacultySuggestions(results.slice(0, 5));
      setShowFacultySuggestions(results.length > 0);
    } else {
      setFacultySuggestions([]);
      setShowFacultySuggestions(false);
    }
  }, [faculty]);

  // Validation
  const isEmailValid = emailValidationResult?.isValid === true;
  const isPasswordValid = password.length >= 6;
  const isFormValid = isEmailValid && isPasswordValid && firstName.trim() && lastName.trim() && department.trim();

  const handleNext = useCallback(() => {
    if (!isFormValid) return;
    
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    
    navigation.navigate('RegisterPhoto', {
      email: email.trim().toLowerCase(),
      password,
      fullName,
      department: department.trim(),
      classYear,
      bio: bio.trim(),
    });
  }, [isFormValid, email, password, firstName, lastName, department, classYear, bio, navigation]);

  const selectDepartment = (value: string) => {
    setDepartment(value);
    setShowDepartmentSuggestions(false);
  };

  const selectFaculty = (value: string) => {
    setFaculty(value);
    setShowFacultySuggestions(false);
  };

  const cardMaxWidth = Math.min(width - 32, 440);

  return (
    <LinearGradient
      colors={colors.background as any}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={[styles.header, { maxWidth: cardMaxWidth }]}>
            <Text style={[styles.title, { color: '#fff' }]}>Hesap Oluştur</Text>
            <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.8)' }]}>
              Kampüsünle bağlantı kurmak için kayıt ol
            </Text>
          </View>

          {/* Form Card */}
          <View style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              maxWidth: cardMaxWidth,
              width: '100%',
            }
          ]}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Üniversite E-postası</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <MaterialIcons name="email" size={20} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="ornek@uni.edu.tr"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                {isEmailValid && (
                  <MaterialIcons name="check-circle" size={20} color="#22c55e" />
                )}
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Şifre</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <MaterialIcons name="lock" size={20} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="En az 6 karakter"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Name Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Ad</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Adınız"
                    placeholderTextColor={colors.textMuted}
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Soyad</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Soyadınız"
                    placeholderTextColor={colors.textMuted}
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </View>

            {/* Department */}
            <View style={[styles.inputGroup, { zIndex: 20 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Bölüm</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <MaterialIcons name="school" size={20} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Bölümünüzü yazın"
                  placeholderTextColor={colors.textMuted}
                  value={department}
                  onChangeText={setDepartment}
                  onFocus={() => department.length >= 2 && setShowDepartmentSuggestions(true)}
                />
              </View>
              {showDepartmentSuggestions && departmentSuggestions.length > 0 && (
                <View style={[styles.suggestions, { backgroundColor: colors.suggestionBg, borderColor: colors.inputBorder }]}>
                  {departmentSuggestions.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.suggestionItem, index < departmentSuggestions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.inputBorder }]}
                      onPress={() => selectDepartment(item)}
                    >
                      <Text style={[styles.suggestionText, { color: colors.text }]}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Faculty */}
            <View style={[styles.inputGroup, { zIndex: 10 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Fakülte</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <MaterialIcons name="account-balance" size={20} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Fakültenizi yazın"
                  placeholderTextColor={colors.textMuted}
                  value={faculty}
                  onChangeText={setFaculty}
                  onFocus={() => faculty.length >= 2 && setShowFacultySuggestions(true)}
                />
              </View>
              {showFacultySuggestions && facultySuggestions.length > 0 && (
                <View style={[styles.suggestions, { backgroundColor: colors.suggestionBg, borderColor: colors.inputBorder }]}>
                  {facultySuggestions.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.suggestionItem, index < facultySuggestions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.inputBorder }]}
                      onPress={() => selectFaculty(item)}
                    >
                      <Text style={[styles.suggestionText, { color: colors.text }]}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Class Year */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Sınıf</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsContainer}
              >
                {CLASS_YEARS.map((year) => {
                  const isActive = classYear === year.id;
                  return (
                    <TouchableOpacity
                      key={year.id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isActive ? colors.chipActiveBg : colors.chipBg,
                          borderColor: isActive ? colors.chipActiveBg : colors.inputBorder,
                        }
                      ]}
                      onPress={() => setClassYear(year.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.chipText,
                        { color: isActive ? '#fff' : colors.textSecondary }
                      ]}>
                        {year.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Bio */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.text }]}>Biyografi</Text>
                <Text style={[styles.labelHint, { color: colors.textMuted }]}>(Opsiyonel)</Text>
              </View>
              <View style={[styles.textAreaWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <TextInput
                  style={[styles.textArea, { color: colors.text }]}
                  placeholder="Kendinden biraz bahset..."
                  placeholderTextColor={colors.textMuted}
                  value={bio}
                  onChangeText={(text) => setBio(text.slice(0, 200))}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />
              </View>
              <Text style={[styles.charCount, { color: colors.textMuted }]}>{bio.length}/200</Text>
            </View>

            {/* Trust Badge */}
            <View style={[styles.trustBadge, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)', borderColor: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.2)' }]}>
              <MaterialIcons name="verified-user" size={14} color={colors.primaryLight} />
              <Text style={[styles.trustBadgeText, { color: colors.primaryLight }]}>SADECE DOĞRULANMIŞ ÜNİVERSİTE ÖĞRENCİLERİ</Text>
            </View>

            {/* Next Button */}
            <TouchableOpacity
              style={[styles.button, !isFormValid && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={!isFormValid}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isFormValid ? ['#6366f1', '#8b5cf6'] : ['#9ca3af', '#9ca3af']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>Devam Et</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginLink}>
              <Text style={[styles.loginText, { color: colors.textSecondary }]}>Zaten hesabın var mı? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.loginLinkText, { color: colors.primaryLight }]}>Giriş Yap</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  labelHint: {
    fontSize: 12,
    fontWeight: '400',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  suggestions: {
    position: 'absolute',
    top: 76,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  suggestionText: {
    fontSize: 14,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  textAreaWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    minHeight: 80,
  },
  textArea: {
    fontSize: 15,
    textAlignVertical: 'top',
    minHeight: 60,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  trustBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    paddingHorizontal: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginText: {
    fontSize: 14,
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegisterBasicInfoScreen;
