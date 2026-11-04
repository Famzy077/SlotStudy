import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { useSettingsStore } from '@/features/settings/store/settings.store';
import { AppAlertHost } from '@/shared/components/feedback/AppAlert';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

import { SocketProvider } from '@/shared/context/SocketContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <SocketProvider>
            <ThemeSynchronizer />
            <NavigationContainer>{children}</NavigationContainer>
            <AppAlertHost />
          </SocketProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}


function ThemeSynchronizer() {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const { setColorScheme } = useNativeWindColorScheme();

  useEffect(() => {
    setColorScheme(themeMode);
  }, [setColorScheme, themeMode]);

  return null;
}
