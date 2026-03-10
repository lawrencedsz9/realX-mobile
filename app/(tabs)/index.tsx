import { Colors } from '../../constants/Colors';
import { getAuth } from '@react-native-firebase/auth';
import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandGrid, CategoryGrid, GreetingHeader, PromoBanner, SearchBar, TrendingOffers } from '../../components/home';

export default function HomeScreen() {
  const [userName, setUserName] = useState<string>('');
  useEffect(() => {
    const authInstance = getAuth();
    const user = authInstance.currentUser;
    if (!user) return;

    const db = getFirestore();
    const studentDocRef = doc(db, 'students', user.uid);

    const unsubscribe = onSnapshot(studentDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserName(data?.firstName || '');
      }
    });

    return () => unsubscribe();
  }, []);

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
        <GreetingHeader userName={userName || 'User'} />
        <SearchBar placeholder="Search for anything..." />
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
