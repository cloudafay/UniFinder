// Welcome/Splash Screen with Login & Create Account buttons
import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Animated, 
  Dimensions, 
  StyleSheet, 
  Platform,
  TouchableOpacity 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Colors } from '../../constants';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

type SplashScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Splash'>;

// Web doesn't support native driver for animations
const useNativeDriver = Platform.OS !== 'web';

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { colors, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver,
        }),
      ]),
      // Buttons fade in after logo
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver,
      }),
    ]).start();

    // Floating animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver,
        }),
      ])
    ).start();
  }, []);

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleCreateAccount = () => {
    navigation.navigate('RegisterBasicInfo');
  };

  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0a0a1a' : '#f0f4ff' }]}>
      {/* Gradient Background */}
      <LinearGradient
        colors={isDark 
          ? ['#0a0a1a', '#1a1a3a', '#0a0a1a'] 
          : ['#f0f4ff', '#e8edff', '#f0f4ff']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Ambient Background Blobs - daha az belirgin */}
      <View style={styles.blobContainer}>
        <View style={[styles.blob, styles.blobTopRight, { opacity: isDark ? 0.15 : 0.08 }]} />
        <View style={[styles.blob, styles.blobBottomLeft, { opacity: isDark ? 0.12 : 0.06 }]} />
        <View style={[styles.blob, styles.blobCenter, { opacity: isDark ? 0.1 : 0.05 }]} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: floatTranslate }],
            },
          ]}
        >
          {/* Logo Icon with Gradient */}
          <LinearGradient
            colors={['#1337ec', '#6366f1', '#8b5cf6']}
            style={styles.iconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name="school" size={56} color="#fff" />
          </LinearGradient>

          {/* App Name */}
          <Text style={[styles.title, { color: isDark ? '#fff' : '#1e293b' }]}>UniFinder</Text>

          {/* Tagline */}
          <Text style={[styles.tagline, { color: isDark ? '#94a3b8' : '#64748b' }]}>Kampüsünle Bağlan</Text>
        </Animated.View>

        {/* Buttons */}
        <Animated.View 
          style={[
            styles.buttonsContainer,
            { opacity: buttonAnim }
          ]}
        >
          {/* Login Button with Gradient */}
          <TouchableOpacity 
            style={styles.loginButtonWrapper}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#1337ec', '#6366f1']}
              style={styles.loginButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Create Account Button */}
          <TouchableOpacity 
            style={[
              styles.createButton, 
              { 
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(19, 55, 236, 0.08)',
                borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(19, 55, 236, 0.2)',
              }
            ]}
            onPress={handleCreateAccount}
            activeOpacity={0.8}
          >
            <Text style={[styles.createButtonText, { color: isDark ? '#a5b4fc' : Colors.primary }]}>
              Hesap Oluştur
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Bottom Text */}
      <View style={styles.bottomContainer}>
        <View style={[styles.bottomBadge, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(19, 55, 236, 0.05)' }]}>
          <MaterialIcons name="verified" size={14} color={isDark ? '#a5b4fc' : Colors.primary} />
          <Text style={[styles.bottomText, { color: isDark ? '#a5b4fc' : Colors.primary }]}>
            SADECE DOĞRULANMIŞ ÜNİVERSİTE ÖĞRENCİLERİ
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blobContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  blobTopRight: {
    width: 400,
    height: 400,
    top: -100,
    right: -100,
    backgroundColor: '#1337ec',
  },
  blobBottomLeft: {
    width: 350,
    height: 350,
    bottom: -100,
    left: -100,
    backgroundColor: '#6366f1',
  },
  blobCenter: {
    width: 250,
    height: 250,
    top: height * 0.3,
    left: width * 0.2,
    backgroundColor: '#8b5cf6',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 12px 40px rgba(19, 55, 236, 0.4)',
      } as any,
      ios: {
        shadowColor: '#1337ec',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
      default: {},
    }),
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 17,
    fontWeight: '500',
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 14,
  },
  loginButtonWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(19, 55, 236, 0.35)',
      } as any,
      ios: {
        shadowColor: '#1337ec',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
      default: {},
    }),
  },
  loginButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  createButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  bottomText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default SplashScreen;
