import { Ionicons } from '@expo/vector-icons';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, TouchableOpacity, View , Text} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

export default function ProfileScreen() {
  const router = useRouter();
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
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.light.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>PROFILE</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileContainer}>
          <View style={styles.profileTopSection}>
            <View style={styles.avatarContainer}>
              {userData?.photoURL || getAuth().currentUser?.photoURL ? (
                <Image
                  source={{ uri: userData?.photoURL || getAuth().currentUser?.photoURL || undefined }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E0E0E0' }]}>
                  <Ionicons name="person" size={32} color="#999" />
                </View>
              )}
            </View>
            <View style={[styles.badgeContainer, { backgroundColor: Colors.brandGreen }]}>
              <Text style={styles.badgeText}>ROOKIE</Text>
            </View>
          </View>
          
          <View style={styles.profileBottomSection}>
            <View>
              <Text style={styles.userName} numberOfLines={1}>
                {userData ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() : 'Loading...'}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {userData?.email || getAuth().currentUser?.email || 'Loading...'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editProfileButton}
              activeOpacity={0.7}
              onPress={() => router.push('/profile-details')}
            >
              <Ionicons name="pencil-outline" size={16} color="#444" />
              <Text style={styles.editProfileText}>Details</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Savings Tracker Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SAVINGS TRACKER 🔥</Text>
        </View>

        <View style={styles.savingsCard}>
          <Text style={styles.savingsLabel}>All time you've saved</Text>
          <View style={styles.savingsAmountRow}>
            <Text style={styles.greenAmount}>{userData?.savings ?? 0}</Text>
            <Text style={styles.blackAmount}>QAR</Text>
          </View>
        </View>

        {/* Creator Code Section */}
        {userData?.role === 'creator' && userData?.creatorCode && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>CREATOR CODE</Text>
            </View>

            <View style={styles.savingsCard}>
              <Text style={styles.savingsLabel}>Your Creator Code</Text>
              <View style={styles.savingsAmountRow}>
                <Text style={styles.greenAmount}>{userData.creatorCode}</Text>
              </View>
            </View>
          </>
        )}

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <MenuItem icon="time-outline" label="Redemption History" />
          <MenuItem icon="language-outline" label="Change Language" />
          <MenuItem
            icon="mail-outline"
            label="Contact Us"
            onPress={() => Linking.openURL('mailto:info@realx.qa')}
          />
          <MenuItem
            icon="document-text-outline"
            label="Terms & Conditions"
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
  const iconColor = color || Colors.light.text;

  return (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: Colors.light.background === '#FFFFFF' ? '#F5F5F5' : '#1A1D1F' }]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.menuItemLeft}>
        <Ionicons name={icon} size={24} color={iconColor} />
        <Text style={[styles.menuItemLabel, { color: iconColor }]}>{label}</Text>
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
    marginBottom: 16,
  },
  headerText: {
    fontSize: 28,
    fontFamily: Typography.integral.bold,
    letterSpacing: 1,
    color: '#000',
  },
  profileContainer: {
    marginBottom: 16,
  },
  profileTopSection: {
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
  },
  badgeText: {
    fontFamily: Typography.integral.bold,
    color: '#000',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  profileBottomSection: {
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  userName: {
    fontFamily: Typography.metropolis.semiBold,
    fontSize: 20,
    color: '#000',
    marginBottom: 4,
  },
  userEmail: {
    fontFamily: Typography.metropolis.medium,
    fontSize: 14,
    color: '#888',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  editProfileText: {
    fontFamily: Typography.metropolis.semiBold,
    fontSize: 12,
    color: '#444',
    marginLeft: 6,
  },
  sectionHeader: {
    marginBottom: 16,

  },
  sectionTitle: {
    fontFamily: Typography.integral.bold,
    fontSize: 18,
    color: '#000000',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  savingsCard: {
    backgroundColor: '#FFF',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 24,
    marginBottom: 16,
  },
  savingsLabel: {
    fontFamily: Typography.metropolis.medium,
    fontSize: 16,
    color: '#000',
  },
  savingsAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  greenAmount: {
    fontFamily: Typography.integral.bold,
    fontSize: 40,
    color: Colors.brandGreen,
  },
  blackAmount: {
    fontFamily: Typography.integral.bold,
    fontSize: 40,
    color: '#000',
    marginLeft: 8,
  },
  menuContainer: {
    gap: 16,
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
    fontFamily: Typography.metropolis.medium,
    fontSize: 16,
  },
});

