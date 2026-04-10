import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  I18nManager,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import PhonkText from '../../components/PhonkText';
import { useTranslation } from 'react-i18next';

export default function PendingVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { email } = params;
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const handleBack = () => {
    router.replace('/' as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.headerBackground}>
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          <View style={[styles.topButtons, isRTL && styles.topButtonsRTL]}>
            <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <View style={styles.centerContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="time-outline" size={48} color={Colors.brandGreen} />
            </View>
            <PhonkText style={styles.titleLarge}>
              <Text style={styles.greenText}>{t('onboarding_pending_title')}</Text>
            </PhonkText>
            <Text style={styles.subtitle}>{t('onboarding_pending_email_notification')}</Text>

            {email && (
              <View style={styles.emailBadge}>
                <Ionicons name="mail-outline" size={16} color="#666" />
                <Text style={styles.emailText}>{email}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.brandGreen },
  headerBackground: { height: 250, backgroundColor: Colors.brandGreen },
  headerContent: { paddingHorizontal: 20, paddingTop: 10 },
  topButtons: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 },
  topButtonsRTL: { flexDirection: 'row-reverse' },
  iconButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  cardContainer: {
    flex: 1, backgroundColor: 'white',
    borderTopLeftRadius: 50, borderTopRightRadius: 50,
    marginTop: -80, paddingHorizontal: 28, paddingTop: 36,
  },
  card: { flex: 1 },
  centerContent: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#F0F9F0',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 28,
  },
  titleLarge: { fontSize: 28, textAlign: 'center', lineHeight: 34, marginBottom: 16 },
  greenText: { color: Colors.brandGreen },
  subtitle: {
    fontSize: 15, color: '#666', textAlign: 'center',
    lineHeight: 22, fontFamily: Typography.poppins.medium,
    marginBottom: 24, paddingHorizontal: 10,
  },
  emailBadge: {
    backgroundColor: '#F5F5F5', borderRadius: 16,
    paddingHorizontal: 18, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  emailText: {
    fontSize: 15, fontFamily: Typography.poppins.medium,
    color: '#333',
  },
});
