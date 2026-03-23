import { Ionicons } from '@expo/vector-icons';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import PhonkText from '../../components/PhonkText';
import i18n, { setStoredLanguage } from '../../src/localization/i18n';
import { applyRTL } from '../../src/localization/rtl';

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [userData, setUserData] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    photoURL?: string;
    role?: string;
    creatorCode?: string;
    savings?: number;
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
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.light.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <PhonkText style={[{ color: Colors.light.text }, styles.headerText]}>
            PROFILE
          </PhonkText>
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
              <PhonkText style={[{ color: '#FFFFFF' }, styles.badgeText]}>ROOKIE</PhonkText>
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
              <Text style={[{ color: Colors.light.text, fontFamily: Typography.poppins.medium }, styles.userName]}>
                {userData ? `${userData.firstName} ${userData.lastName}` : 'Darren Watkins'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push('/profile-details')}
            >
              <Ionicons name="create-outline" size={16} color="#8E8E93" />
              <PhonkText style={[{ color: Colors.light.text }, styles.editButtonText]}>PROFILE</PhonkText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <PhonkText style={[{ color: Colors.light.text }, styles.sectionTitle]}>SAVINGS TRACKER 🔥</PhonkText>
        </View>

        <View style={styles.savingsCard}>
          <Text style={[{ color: Colors.light.text, fontFamily: Typography.poppins.medium }, styles.savingsLabel]}>All time you've saved</Text>
          <View style={styles.savingsAmountContainer}>
            <PhonkText style={[{ color: '#1AD04F' }, styles.savingsAmountGreen]}>
              {(userData?.savings ?? 23.12).toFixed(2)}
            </PhonkText>
            <PhonkText style={[{ color: Colors.light.text }, styles.savingsCurrency]}> QAR</PhonkText>
          </View>
        </View>

        <View style={styles.menuContainer}>
          <MenuItem icon="time-outline" label={t('redemption_history')} onPress={() => router.push('/redemption-history' as any)} />
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
          <TouchableOpacity
            style={styles.logoutPill}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.logoutContent}>
              <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
              <PhonkText style={styles.logoutText}>{t('log_out').toUpperCase()}</PhonkText>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  color,
  bgColor
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  color?: string;
  bgColor?: string;
}) {

  return (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: bgColor || '#F5F5F7' }]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.menuItemLeft}>
        <Ionicons name={icon} size={24} color={color || "#000"} />
        <Text style={[{ color: color || Colors.light.text, fontFamily: Typography.poppins.medium }, styles.menuItemLabel]}>{label}</Text>
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
    fontFamily: Typography.poppins.semiBold,
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
    color: '#8E8E93',
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
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
    fontFamily: Typography.poppins.medium,
    color: '#000'
  },
  savingsAmountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  savingsAmountGreen: {
    fontSize: 32,
    color: '#1AD04F',
    marginRight: 8,
  },
  savingsCurrency: {
    fontSize: 28,
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
    fontFamily: Typography.poppins.semiBold,
    color: '#000',
  },
  logoutPill: {
    backgroundColor: '#FFF1F0',
    borderRadius: 30,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD5D2',
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    color: '#FF3B30',
  },
});
