import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/lib/auth';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { token, user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      // If boarding not complete, go to onboarding, else go to tabs
      if (user && !user.onboardingCompleted) {
        router.replace('/(auth)/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    } else if (token && user && !user.onboardingCompleted && segments[1] !== 'onboarding') {
      // Force onboarding if not completed
      router.replace('/(auth)/onboarding');
    }
  }, [token, user?.onboardingCompleted, isLoading, segments]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  useEffect(() => {
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
      console.warn('OneSignal is not supported in Expo Go. Please use a development build.');
      return;
    }
    
    // OneSignal Initialization
    try {
      const { OneSignal } = require('react-native-onesignal');
      const appId = Constants.expoConfig?.extra?.oneSignalAppId || '4d04ee76-5382-48ac-ac26-74a057a63efd';
      OneSignal.initialize(appId);
      OneSignal.Notifications.requestPermission(true);
    } catch (e) {
      console.warn('OneSignal failed to initialize:', e);
    }
  }, []);

  useEffect(() => {
    if (user?.id && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
      try {
        const { OneSignal } = require('react-native-onesignal');
        OneSignal.login(user.id);
      } catch (e) {
        // Ignore login error if module missing
      }
    }
  }, [user?.id]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="events/[id]" options={{ headerShown: true, title: 'Event Details' }} />
        <Stack.Screen name="matches/[id]" options={{ headerShown: true, title: 'Squad Chat' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
