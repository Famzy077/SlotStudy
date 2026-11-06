import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';

import SplashScreen from '@/features/auth/screens/SplashScreen';
import OnboardingScreen from '@/features/auth/screens/OnboardingScreen';
import LoginScreen from '@/features/auth/screens/LoginScreen';
import SignupScreen from '@/features/auth/screens/SignupScreen';
import TermsScreen from '@/features/auth/screens/TermsScreen';
import VerifyOtpScreen from '@/features/auth/screens/VerifyOtpScreen';
import ForgotPasswordScreen from '@/features/auth/screens/ForgotPasswordScreen';
import AcademicSetupScreen from '@/features/auth/screens/AcademicSetupScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="AcademicSetup" component={AcademicSetupScreen} />
    </Stack.Navigator>
  );
}
