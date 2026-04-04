import '@react-native-firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  type FirebaseAuthTypes
} from '@react-native-firebase/auth';
import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initI18n } from '../src/localization/i18n';
import { applyRTL } from '../src/localization/rtl';


import CustomSplash from './splash'; // adjust path if needed



void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Phonk: require('../assets/fonts/phonk.otf'),
    Poppins: require('../assets/fonts/poppins.ttf'),
  });

  const [i18nReady, setI18nReady] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [appReady, setAppReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const setupLocalization = async () => {
      try {
        const language = await initI18n();
        applyRTL(language as 'en' | 'ar');
      } catch (err) {
        console.error('Error initializing localization:', err);
      } finally {
        setI18nReady(true);
      }
    };

    void setupLocalization();
  }, []);

  useEffect(() => {
    const subscriber = onAuthStateChanged(getAuth(), (currentUser) => {
      setUser(currentUser);
      setInitializing(false);
    });
    return subscriber;
  }, []);

  useEffect(() => {
    if (user) {
      const db = getFirestore();
      const studentDocRef = doc(db, 'students', user.uid);

      const unsubscribe = onSnapshot(
        studentDocRef,
        async (docSnap) => {
          if (docSnap.exists()) {
            setHasProfile(true);
          } else {
            // Profile not found by UID
            setHasProfile(false);
          }
        },
        (snapshotError) => {
          console.error('Error fetching student profile:', snapshotError);
          setHasProfile(false);
        }
      );

      return () => unsubscribe();
    } else {
      setHasProfile(null);
    }
  }, [user]);

useEffect(() => {
  if (
    i18nReady &&
    (loaded || error) &&
    !initializing &&
    (user === null || hasProfile !== null)
  ) {
    setAppReady(true);
  }
}, [i18nReady, loaded, error, initializing, user, hasProfile]);

  useEffect(() => {
    if (initializing || !loaded || !i18nReady) return;
    if (user && hasProfile === null) return;

    const inAuthGroup = (segments as string[]).indexOf('(onboarding)') !== -1;

    if (!user) {
      if (!inAuthGroup) {
        router.replace('/(onboarding)' as any);
      }
    } else {
      if (hasProfile === true) {
        if (inAuthGroup) {
          router.replace('/(tabs)' as any);
        }
      } else if (hasProfile === false) {
        const currentPath = segments.join('/');
        if (!currentPath.includes('details')) {
          router.replace('/(onboarding)/details' as any);
        }
      }
    }
  }, [user, initializing, loaded, i18nReady, segments, hasProfile, router]);

const [showSplash, setShowSplash] = useState(true);

if (!appReady || showSplash) {
  return (
    <CustomSplash
      onFinish={() => setShowSplash(false)}
    />
  );
}

  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="category" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ headerShown: false }} />
        <Stack.Screen name="vendor/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="redeem/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="redemption-history" options={{ headerShown: false }} />
        <Stack.Screen name="profile-details" options={{ headerShown: false }} />
        <Stack.Screen name="terms" options={{ headerShown: false }} />
        <Stack.Screen name="privacy" options={{ headerShown: false }} />
        <Stack.Screen name="x-academy" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops! Not Found' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
