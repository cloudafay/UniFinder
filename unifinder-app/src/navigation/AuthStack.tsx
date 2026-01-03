// Auth Stack Navigator
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';

// Screens
import SplashScreen from '../screens/Auth/SplashScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterBasicInfoScreen from '../screens/Auth/RegisterBasicInfoScreen';
import RegisterPhotoScreen from '../screens/Auth/RegisterPhotoScreen';
import RegisterInterestScreen from '../screens/Auth/RegisterInterestScreen';
import EmailVerificationScreen from '../screens/Auth/EmailVerificationScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: 'transparent' },
      }}
      initialRouteName="Splash"
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RegisterBasicInfo" component={RegisterBasicInfoScreen} />
      <Stack.Screen name="RegisterPhoto" component={RegisterPhotoScreen} />
      <Stack.Screen name="RegisterInterest" component={RegisterInterestScreen} />
      <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
    </Stack.Navigator>
  );
};

export default AuthStack;
