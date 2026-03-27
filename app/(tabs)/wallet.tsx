import { getAuth } from '@react-native-firebase/auth';
import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  HelpLink,
  HowItWorksDrawer,
  RecentRedemptions,
  SpendButton,
  SpendCardDrawer,
  XCard,
  XCardHeader,
} from '../../components/wallet';

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const [isHelpDrawerVisible, setIsHelpDrawerVisible] = useState(false);
  const [isSpendDrawerVisible, setIsSpendDrawerVisible] = useState(false);
  const [balance, setBalance] = useState(0);
  const [creatorCode, setCreatorCode] = useState<string | undefined>(undefined);
  const currency = 'QAR';

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getFirestore();
    const studentRef = doc(db, 'students', user.uid);

    const unsubscribe = onSnapshot(
      studentRef,
      (docSnap) => {
        if (docSnap && docSnap.exists()) {
          const data = docSnap.data();
          if (data) {
            setBalance(typeof data.cashback === 'number' ? data.cashback : 0);
            setCreatorCode(data.creatorCode);
          }
        }
      },
      (error) => {
        console.warn('Wallet snapshot error:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSpendPress = () => {
    setIsSpendDrawerVisible(true);
  };

  const handleSpendDrawerClose = () => {
    setIsSpendDrawerVisible(false);
  };

  const handleHelpPress = () => {
    setIsHelpDrawerVisible(true);
  };

  const handleHelpDrawerClose = () => {
    setIsHelpDrawerVisible(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <XCardHeader />
        <XCard earnings={balance} currency={currency} creatorCode={creatorCode} />
        <SpendButton onPress={handleSpendPress} />
        <HelpLink onPress={handleHelpPress} />
        <RecentRedemptions />
      </ScrollView>

      <HowItWorksDrawer
        visible={isHelpDrawerVisible}
        onClose={handleHelpDrawerClose}
      />

      <SpendCardDrawer
        visible={isSpendDrawerVisible}
        onClose={handleSpendDrawerClose}
        balance={balance}
        currency={currency}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
});
