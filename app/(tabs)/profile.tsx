import { Ionicons } from '@expo/vector-icons';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/ThemedText';
import { Typography } from '../../constants/Typography';
import { useTheme } from '../../context/ThemeContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const PURPLE = '#7D57FF';
  const [userData, setUserData] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
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
      if (docSnap.exists()) {
        setUserData(docSnap.data() as any);
      }
    });

    return () => unsubscribe();
  }, []);


  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(getAuth());
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
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
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.headerText}>
            Manage your <ThemedText style={styles.purpleText}>profile</ThemedText>
          </ThemedText>
        </View>

        {/* Profile Info Card */}
        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.7}
          onPress={() => router.push('/profile-details')}
        >
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
              {userData?.photoURL || getAuth().currentUser?.photoURL ? (
                <Image
                  source={{ uri: userData?.photoURL || getAuth().currentUser?.photoURL || undefined }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }]}>
                  <Ionicons name="person" size={32} color="#CCC" />
                </View>
              )}
            </View>
            <View style={styles.nameContainer}>
              <ThemedText style={styles.userName}>
                {userData ? `${userData.firstName} ${userData.lastName}` : 'Loading...'}
              </ThemedText>
            </View>
          </View>
        </TouchableOpacity>



        {/* Savings Tracker Section */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Savings Tracker</ThemedText>
        </View>

        <View style={[styles.savingsCard, { backgroundColor: theme.background, borderColor: theme.subtitle + '20' }]}>
          <View style={styles.savingsInfo}>
            <ThemedText type="subtitle" style={styles.savingsLabel}>Your cashback balance</ThemedText>
            <ThemedText style={styles.savingsAmount}>
              <ThemedText style={styles.purpleAmount}>{userData?.cashback ?? 0}</ThemedText> QAR
            </ThemedText>
          </View>
          <TouchableOpacity style={[styles.moreButton, { backgroundColor: theme.background, borderColor: theme.subtitle + '20' }]} activeOpacity={0.7}>
            <ThemedText style={styles.moreButtonText}>More</ThemedText>
            <Ionicons name="chevron-forward" size={14} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Creator Code Section */}
        {userData?.role === 'creator' && userData?.creatorCode && (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Creator Code</ThemedText>
            </View>

            <View style={[styles.savingsCard, { backgroundColor: theme.background, borderColor: theme.subtitle + '20' }]}>
              <View style={styles.savingsInfo}>
                <ThemedText type="subtitle" style={styles.savingsLabel}>Your Creator Code</ThemedText>
                <ThemedText style={styles.savingsAmount}>
                  <ThemedText style={styles.purpleAmount}>{userData.creatorCode}</ThemedText>
                </ThemedText>
              </View>
            </View>
          </>
        )}

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <MenuItem icon="time-outline" label="Redemption History" />
          <MenuItem icon="heart-outline" label="Favourites" />
          <MenuItem icon="language-outline" label="Change Language" />
          <MenuItem
            icon="mail-outline"
            label="Contact Us"
            onPress={() => Linking.openURL('mailto:info@realx.qa')}
          />
          <MenuItem
            icon="document-text-outline"
            label="Terms and Conditions"
            onPress={() => router.push('/terms')}
          />
          <MenuItem
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => router.push('/privacy')}
          />
          <MenuItem
            icon="log-out-outline"
            label="Log out"
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
  const iconColor = color || theme.text;

  return (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: theme.background === '#FFFFFF' ? '#F5F5F5' : '#1A1D1F' }]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.menuItemLeft}>
        <Ionicons name={icon} size={24} color={iconColor} />
        <ThemedText style={[styles.menuItemLabel, { color: iconColor }]}>{label}</ThemedText>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 32,
  },
  headerText: {
    fontSize: 32,
    fontFamily: Typography.metropolis.semiBold,
    lineHeight: 40,
  },
  purpleText: {
    color: '#7D57FF',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 20,
    backgroundColor: '#FFF',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F5F5F5',
  },
  nameContainer: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontFamily: Typography.metropolis.semiBold,
  },
  userPhone: {
    fontSize: 14,
    fontFamily: Typography.metropolis.medium,
    marginTop: 4,
  },

  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: Typography.metropolis.semiBold,
  },
  savingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 20,
    backgroundColor: '#FFF',
  },
  savingsInfo: {
    flex: 1,
  },
  savingsLabel: {
    fontSize: 14,
    fontFamily: Typography.metropolis.medium,
    marginBottom: 8,
  },
  savingsAmount: {
    fontSize: 32,
    fontFamily: Typography.metropolis.semiBold,
  },
  purpleAmount: {
    color: '#7D57FF',
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: '#F9F9F9',
  },
  moreButtonText: {
    fontSize: 14,
    fontFamily: Typography.metropolis.medium,
    marginRight: 4,
  },
  menuContainer: {
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    paddingVertical: 20,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemLabel: {
    fontSize: 18,
    fontFamily: Typography.metropolis.semiBold,
  },
});
