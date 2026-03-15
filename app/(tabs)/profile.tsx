import { Ionicons } from '@expo/vector-icons';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '../../components/ThemedText';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useTheme } from '../../context/ThemeContext';
import i18n, { setStoredLanguage } from '../../src/localization/i18n';
import { applyRTL } from '../../src/localization/rtl';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [userData, setUserData] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    photoURL?: string;
    role?: string;
    creatorCode?: string;
    cashback?: number;
  } | null>(null);

  useEffect(() => {
    const authInstance = getAuth();
    const user = authInstance.currentUser;
    if (!user) return;

    const db = getFirestore();
    const studentDocRef = doc(db, 'students', user.uid);

    const unsubscribe = onSnapshot(studentDocRef, (docSnap) => {
      if (docSnap && docSnap.exists()) {
        setUserData(docSnap.data() as any);
      }
    });

    return () => unsubscribe();
  }, []);

  const changeLanguage = async (language: 'en' | 'ar') => {
    try {
      await i18n.changeLanguage(language);
      await setStoredLanguage(language);

      const directionChanged = applyRTL(language);

      if (directionChanged) {
        Alert.alert(t('restart_required'), t('restart_message'));
      }
    } catch (error) {
      console.error('Language change error:', error);
    }
  };

  const handleChangeLanguage = () => {
    Alert.alert(
      t('select_language'),
      '',
      [
        { text: t('english'), onPress: () => void changeLanguage('en') },
        { text: t('arabic'), onPress: () => void changeLanguage('ar') },
        { text: t('cancel'), style: 'cancel' }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      t('logout_title'),
      t('logout_message'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('log_out'),
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(getAuth());
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert(t('error'), t('logout_failed'));
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <ThemedText style={styles.headerText}>
            PROFILE
          </ThemedText>
        </View>

        <TouchableOpacity
          style={styles.topPill}
          activeOpacity={0.7}
          onPress={() => router.push('/profile-details')}
        >
          <View style={styles.profileTopRow}>
            <View style={styles.avatarContainer}>
              {userData?.photoURL || getAuth().currentUser?.photoURL ? (
                <Image
                  source={{ uri: userData?.photoURL || getAuth().currentUser?.photoURL || undefined }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F0F0' }]}>
                  <Ionicons name="person" size={32} color="#AAA" />
                </View>
              )}
            </View>
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>ROOKIE</ThemedText>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomPill}
          activeOpacity={0.7}
          onPress={() => router.push('/profile-details')}
        >
          <View style={styles.profileBottomRow}>
            <View style={styles.userInfo}>
              <ThemedText style={styles.userName}>
                {userData ? `${userData.firstName} ${userData.lastName}` : 'Darren Watkins'}
              </ThemedText>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => router.push('/profile-details')}
            >
              <Ionicons name="create-outline" size={16} color="#8E8E93" />
              <ThemedText style={styles.editButtonText}>EDIT PROFILE</ThemedText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>SAVINGS TRACKER 🔥</ThemedText>
        </View>

        <View style={styles.savingsCard}>
          <ThemedText style={styles.savingsLabel}>All time you've saved</ThemedText>
          <View style={styles.savingsAmountContainer}>
            <ThemedText style={styles.savingsAmountGreen}>
              {(userData?.cashback ?? 23.12).toFixed(2)}
            </ThemedText>
            <ThemedText style={styles.savingsCurrency}> QAR</ThemedText>
          </View>
        </View>

        <View style={styles.menuContainer}>
          <MenuItem icon="time-outline" label={t('redemption_history')} />
          <MenuItem icon="language-outline" label={t('change_language')} onPress={handleChangeLanguage} />
          <MenuItem
            icon="mail-outline"
            label={t('contact_us')}
            onPress={() => Linking.openURL('mailto:info@realx.qa')}
          />
          <MenuItem
            icon="document-text-outline"
            label={t('terms_and_conditions')}
            onPress={() => router.push('/terms')}
          />
          <MenuItem
            icon="shield-checkmark-outline"
            label={t('privacy_policy')}
            onPress={() => router.push('/privacy')}
          />
          <MenuItem
            icon="log-out-outline"
            label={t('log_out')}
            onPress={handleLogout}
            color="#FF3B30"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  color
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  color?: string;
}) {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: '#F5F5F7' }]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.menuItemLeft}>
        <Ionicons name={icon} size={24} color="#000" />
        <ThemedText style={styles.menuItemLabel}>{label}</ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 16,
  },
  headerText: {
    fontSize: 28,
    fontFamily: Typography.integral.bold,
    letterSpacing: 0.5,
  },
  topPill: {
    backgroundColor: '#F5F5F7',
    borderRadius: 30,
    padding: 8,

  },
  bottomPill: {
    backgroundColor: '#F5F5F7',
    borderRadius: 30,
    paddingVertical: 24,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  profileTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 50,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  badge: {
    backgroundColor: '#1AD04F',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Typography.integral.bold,
  },
  profileBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontFamily: Typography.metropolis.semiBold,
    paddingLeft: 4,
  },

  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  editButtonText: {
    fontSize: 10,
    fontFamily: Typography.integral.bold,
    color: '#8E8E93',
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: Typography.integral.bold,
    textTransform: 'uppercase',
  },
  savingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#F0F0F2',
  },
  savingsLabel: {
    fontSize: 14,
    fontFamily: Typography.metropolis.medium,
    color: '#000',
    marginBottom: 12,
  },
  savingsAmountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  savingsAmountGreen: {
    fontSize: 32,
    fontFamily: Typography.integral.bold,
    color: '#1AD04F',
    marginRight: 8,
  },
  savingsCurrency: {
    fontSize: 28,
    fontFamily: Typography.integral.bold,
    color: '#000',
  },
  menuContainer: {
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemLabel: {
    fontSize: 16,
    fontFamily: Typography.metropolis.semiBold,
    color: '#000',
  },
});
