import '@react-native-firebase/app';
import { getAuth, isSignInWithEmailLink, onAuthStateChanged, signInWithEmailLink, type FirebaseAuthTypes } from '@react-native-firebase/auth';
import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import * as Linking from 'expo-linking';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../context/ThemeContext';
import { clearAuthEmail, getAuthEmail } from '../utils/auth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'IntegralBold': require('../assets/fonts/integralcf-bold.otf'),
    'MetropolisSemiBold': require('../assets/fonts/metropolis.semi-bold.otf'),
    'MetropolisMedium': require('../assets/fonts/metropolis.medium.otf'),
  });

  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const router = useRouter();
  const segments = useSegments();

  // Handle Firebase Email Link Authentication
  useEffect(() => {
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;

      const authInstance = getAuth();
      if (await isSignInWithEmailLink(authInstance, url)) {
        try {
          const email = await getAuthEmail();
          if (email) {
            await signInWithEmailLink(authInstance, email, url);
            await clearAuthEmail();
            console.log('Successfully signed in with email link!');
          } else {
            console.warn('Email link detected but no email found in storage.');
          }
        } catch (err) {
          console.error('Error signing in with email link:', err);
        }
      }
    };

    Linking.getInitialURL().then(handleDeepLink);

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  function onAuthStateChangedHandler(user: FirebaseAuthTypes.User | null) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = onAuthStateChanged(getAuth(), onAuthStateChangedHandler);
    return subscriber;
  }, []);

  useEffect(() => {
    if (user) {
      const db = getFirestore();
      const studentDocRef = doc(db, 'students', user.uid);

      const unsubscribe = onSnapshot(studentDocRef, docSnap => {
        setHasProfile(docSnap.exists());
      }, error => {
        console.error('Error fetching student profile:', error);
        setHasProfile(false);
      });
      return () => unsubscribe();
    } else {
      setHasProfile(null);
    }
  }, [user]);

  useEffect(() => {
    if ((loaded || error) && !initializing && (user === null || hasProfile !== null)) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, initializing, user, hasProfile]);

  useEffect(() => {
    if (initializing || !loaded) return;

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
  }, [user, initializing, loaded, segments, hasProfile]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <Stack>
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="category" options={{ headerShown: false }} />
          <Stack.Screen name="vendor/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="redeem/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="profile-details" options={{ headerShown: false }} />
          <Stack.Screen name="terms" options={{ headerShown: false }} />
          <Stack.Screen name="privacy" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ title: "Oops! Not Found" }} />
        </Stack>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
