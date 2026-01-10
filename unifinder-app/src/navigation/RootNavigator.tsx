// Ana Navigasyon
import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from './types';

// Navigatörler
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';

// Ekranlar
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import MatchSuccessScreen from '../screens/Main/MatchSuccessScreen';
import FilterSearchScreen from '../screens/Main/FilterSearchScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import UserProfileScreen from '../screens/Profile/UserProfileScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import NotificationCenterScreen from '../screens/Notifications/NotificationCenterScreen';
import PrivacySettingsScreen from '../screens/Settings/PrivacySettingsScreen';
import VerificationScreen from '../screens/Settings/VerificationScreen';
import ChangePasswordScreen from '../screens/Settings/ChangePasswordScreen';
import BlockedUsersScreen from '../screens/Settings/BlockedUsersScreen';
import MutedUsersScreen from '../screens/Settings/MutedUsersScreen';
import ReportedUsersScreen from '../screens/Settings/ReportedUsersScreen';
import DownloadDataScreen from '../screens/Settings/DownloadDataScreen';
import ClearHistoryScreen from '../screens/Settings/ClearHistoryScreen';
import NotificationSettingsScreen from '../screens/Settings/NotificationSettingsScreen';
import HelpCenterScreen from '../screens/Settings/HelpCenterScreen';
import TermsOfServiceScreen from '../screens/Settings/TermsOfServiceScreen';
import LocationSettingsScreen from '../screens/Settings/LocationSettingsScreen';
import DistanceSettingsScreen from '../screens/Settings/DistanceSettingsScreen';
import AddStoryScreen from '../screens/Story/AddStoryScreen';
import ViewStoryScreen from '../screens/Story/ViewStoryScreen';
import FollowersScreen from '../screens/Profile/FollowersScreen';
import FollowingScreen from '../screens/Profile/FollowingScreen';
import ProfileViewersScreen from '../screens/Profile/ProfileViewersScreen';
import PremiumScreen from '../screens/Premium/PremiumScreen';

// Mega Features Ekranları (28 Aralık 2025)
// Gamification
import DailyTasksScreen from '../screens/Gamification/DailyTasksScreen';
import BadgesScreen from '../screens/Gamification/BadgesScreen';
// Events
import EventsScreen from '../screens/Events/EventsScreen';
import EventDetailScreen from '../screens/Events/EventDetailScreen';
import CreateEventScreen from '../screens/Events/CreateEventScreen';
// Groups
import GroupListScreen from '../screens/Groups/GroupListScreen';
import GroupChatScreen from '../screens/Groups/GroupChatScreen';
import CreateGroupScreen from '../screens/Groups/CreateGroupScreen';
import GroupMembersScreen from '../screens/Groups/GroupMembersScreen';
import GroupSettingsScreen from '../screens/Groups/GroupSettingsScreen';
// Profile Enhancements
import ProfilePreviewScreen from '../screens/Profile/ProfilePreviewScreen';
import EditPromptsScreen from '../screens/Profile/EditPromptsScreen';
import AdvancedFiltersScreen from '../screens/Profile/AdvancedFiltersScreen';
// Boost
import BoostScreen from '../screens/Boost/BoostScreen';
// Video Call
import VideoCallScreen from '../screens/VideoCall/VideoCallScreen';
import IncomingCallScreen from '../screens/VideoCall/IncomingCallScreen';
import CallHistoryScreen from '../screens/VideoCall/CallHistoryScreen';
// Verification
import PhotoVerificationScreen from '../screens/Verification/PhotoVerificationScreen';
// Spotify
import SpotifyConnectScreen from '../screens/Spotify/SpotifyConnectScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

type RootNavigatorProps = {
  isAuthenticated: boolean;
};

export const RootNavigator: React.FC<RootNavigatorProps> = ({ isAuthenticated }) => {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const onboardingComplete = await AsyncStorage.getItem('@unifinder_onboarding_complete');
      setShowOnboarding(onboardingComplete !== 'true');
    } catch (error) {
      setShowOnboarding(false);
    }
  };

  // Onboarding durumu kontrol edilirken bekle
  if (showOnboarding === null) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {showOnboarding && !isAuthenticated ? (
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen}
          options={{ animation: 'fade' }}
        />
      ) : null}
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="UserProfile"
            component={UserProfileScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="MatchSuccess"
            component={MatchSuccessScreen}
            options={{
              presentation: 'transparentModal',
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="FilterSearch"
            component={FilterSearchScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="NotificationCenter"
            component={NotificationCenterScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="PrivacySettings"
            component={PrivacySettingsScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="Verification"
            component={VerificationScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="BlockedUsers"
            component={BlockedUsersScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="MutedUsers"
            component={MutedUsersScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="ReportedUsers"
            component={ReportedUsersScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="DownloadData"
            component={DownloadDataScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="ClearHistory"
            component={ClearHistoryScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="NotificationSettings"
            component={NotificationSettingsScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="HelpCenter"
            component={HelpCenterScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="TermsOfService"
            component={TermsOfServiceScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="LocationSettings"
            component={LocationSettingsScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="DistanceSettings"
            component={DistanceSettingsScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="AddStory"
            component={AddStoryScreen}
            options={{
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="ViewStory"
            component={ViewStoryScreen}
            options={{
              presentation: 'fullScreenModal',
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="Followers"
            component={FollowersScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="Following"
            component={FollowingScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="ProfileViewers"
            component={ProfileViewersScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="Premium"
            component={PremiumScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          {/* Mega Features Ekranları */}
          {/* Gamification */}
          <Stack.Screen
            name="DailyTasks"
            component={DailyTasksScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Badges"
            component={BadgesScreen}
            options={{ animation: 'slide_from_right' }}
          />
          {/* Events */}
          <Stack.Screen
            name="Events"
            component={EventsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="EventDetail"
            component={EventDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="CreateEvent"
            component={CreateEventScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          {/* Groups */}
          <Stack.Screen
            name="GroupList"
            component={GroupListScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="GroupChat"
            component={GroupChatScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="CreateGroup"
            component={CreateGroupScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="GroupMembers"
            component={GroupMembersScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="GroupSettings"
            component={GroupSettingsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          {/* Profile Enhancements */}
          <Stack.Screen
            name="ProfilePreview"
            component={ProfilePreviewScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="EditPrompts"
            component={EditPromptsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="AdvancedFilters"
            component={AdvancedFiltersScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          {/* Boost */}
          <Stack.Screen
            name="Boost"
            component={BoostScreen}
            options={{ animation: 'slide_from_right' }}
          />
          {/* Video Call */}
          <Stack.Screen
            name="VideoCall"
            component={VideoCallScreen}
            options={{ presentation: 'fullScreenModal', animation: 'fade' }}
          />
          <Stack.Screen
            name="IncomingCall"
            component={IncomingCallScreen}
            options={{ presentation: 'fullScreenModal', animation: 'fade' }}
          />
          <Stack.Screen
            name="CallHistory"
            component={CallHistoryScreen}
            options={{ animation: 'slide_from_right' }}
          />
          {/* Verification */}
          <Stack.Screen
            name="PhotoVerification"
            component={PhotoVerificationScreen}
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
          />
          {/* Spotify */}
          <Stack.Screen
            name="SpotifyConnect"
            component={SpotifyConnectScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
