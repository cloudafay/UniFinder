// UniFinder App Entry Point
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, LinkingOptions, getStateFromPath as defaultGetStateFromPath } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import {
  useFonts,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

// Context Providers
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { LocationProvider } from './src/context/LocationContext';
import { FilterProvider } from './src/context/FilterContext';

// Components
import ErrorBoundary from './src/components/common/ErrorBoundary';

// Navigation
import RootNavigator from './src/navigation/RootNavigator';
import { RootStackParamList } from './src/navigation/types';

// Constants
import { Colors } from './src/constants';

// Styles
import './src/styles/global.css';

// Keep splash screen visible while loading resources
SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash screen zaten gizlenmiş olabilir
});

// Deep Linking Configuration
const prefix = Linking.createURL('/');
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix, 'unifinder://', 'https://app.unifinder.com'],
  config: {
    screens: {
      Auth: {
        path: 'auth',
        screens: {
          Login: 'login',
          Register: 'register',
        },
      },
      Main: {
        path: '',
        screens: {
          Discover: 'discover',
          Events: 'events',
          Groups: 'groups',
          Messages: 'messages',
          Profile: 'profile',
        },
      },
      UserProfile: 'user/:userId',
      EventDetail: 'event/:eventId',
      GroupChat: 'group/:groupId',
      Chat: 'chat/:matchId',
      Premium: 'premium',
      Boost: 'boost',
      DailyTasks: 'tasks',
      Badges: 'badges/:userId?',
      SpotifyConnect: 'spotify',
      PhotoVerification: 'verify',
      AddStory: 'add-story',
      ViewStory: 'story/:storyId/:userId',
      Settings: 'settings',
      EditProfile: 'edit-profile',
      NotificationCenter: 'notifications',
      Followers: 'followers/:userId',
      Following: 'following/:userId',
    },
  },
  // Bilinmeyen route'ları ana sayfaya yönlendir
  getStateFromPath: (path, config) => {
    // Boş path veya sadece "/" ise Main'e yönlendir
    if (!path || path === '/' || path === '') {
      return {
        routes: [{ name: 'Main' as const }],
      };
    }
    
    // Varsayılan davranışı kullan
    const defaultState = defaultGetStateFromPath(path, config);
    
    // Eğer state bulunamazsa Main'e yönlendir
    if (!defaultState) {
      return {
        routes: [{ name: 'Main' as const }],
      };
    }
    
    return defaultState;
  },
};

// Loading component
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>Yükleniyor...</Text>
    </View>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDark } = useTheme();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Auth yüklemesi tamamlandığında splash'i gizle
    if (!isLoading) {
      const hideSplash = async () => {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          // Splash zaten gizlenmiş olabilir
        }
        setAppReady(true);
      };
      hideSplash();
    }
  }, [isLoading]);

  if (isLoading || !appReady) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator isAuthenticated={isAuthenticated} />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  // Font yüklenince splash'i gizle
  useEffect(() => {
    if (fontsLoaded) {
      // Fontlar yüklendi, ama auth kontrolü için biraz bekle
      const timer = setTimeout(async () => {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          // Zaten gizlenmiş olabilir
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <NavigationContainer 
            linking={linking}
            fallback={<LoadingScreen />}
          >
            <ThemeProvider>
              <ErrorBoundary>
                <AuthProvider>
                  <LocationProvider>
                    <FilterProvider>
                      <NotificationProvider>
                        <AppContent />
                      </NotificationProvider>
                    </FilterProvider>
                  </LocationProvider>
                </AuthProvider>
              </ErrorBoundary>
            </ThemeProvider>
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f6f8',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
});
