import { getAuth } from '@react-native-firebase/auth';
import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import {
  BrandGrid,
  CategoryGrid,
  GreetingHeader,
  PromoBanner,
  SearchBar,
  TrendingOffers
} from '../../components/home';

import { Colors } from '../../constants/Colors';
import { triggerSubtleHaptic } from '../../utils/haptics';

export default function HomeScreen() {
  const [userName, setUserName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    const authInstance = getAuth();
    const user = authInstance.currentUser;
    if (!user) return;

    const db = getFirestore();
    const studentDocRef = doc(db, 'students', user.uid);

    const unsubscribe = onSnapshot(studentDocRef, (docSnap) => {
      if (docSnap && docSnap.exists()) {
        const data = docSnap.data();
        setUserName(data?.firstName || '');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSearch = useCallback(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    triggerSubtleHaptic();
    router.push({ pathname: '/search', params: { q: trimmed } });
  }, [searchQuery, router]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: Colors.light.background }]} edges={['top']}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.light.background}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: Colors.light.background }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <GreetingHeader userName={userName || t('user')} />
        <SearchBar
          placeholder={t('search_placeholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={handleSearch}
        />
        <PromoBanner />
        <CategoryGrid />
        <TrendingOffers />
        <BrandGrid />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 130,
  },
});
