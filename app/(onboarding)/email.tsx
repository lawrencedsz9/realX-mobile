import { Ionicons } from '@expo/vector-icons';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  I18nManager,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import PhonkText from '../../components/PhonkText';
import { useTranslation } from 'react-i18next';

// Email normalization (strict identity)
const normalizeEmail = (email: string): string => {
  const trimmed = email.trim().toLowerCase();
  const [local, domain] = trimmed.split('@');

  if (!domain) return trimmed;

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const cleanLocal = local.split('+')[0].replace(/\./g, '');
    return `${cleanLocal}@gmail.com`;
  }

  return trimmed;
};

export default function EmailOnboarding() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string; mode?: string }>();
  const { role, mode } = params;
  const { t } = useTranslation();

  const isRTL = I18nManager.isRTL;
  const arrowIconName = isRTL ? 'arrow-forward' : 'arrow-back';
  const inputTextAlign: 'left' | 'right' = isRTL ? 'right' : 'left';
  const roleTitle = role === 'creator' ? t('onboarding_email_title_creator') : t('onboarding_email_title_student');

  const [email, setEmail] = useState('');
  const isNewUser = mode === 'signup';
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleBack = () => {
    router.back();
  };

  const handleSendOtp = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return;

    setIsLoading(true);
    try {
      // Signup: check if account already exists
      if (isNewUser) {
        const fnInstance = getFunctions(undefined, 'me-central1');
        const checkStudent = httpsCallable(fnInstance, 'checkStudentExists');
        const result = await checkStudent({ email: normalizedEmail });

        if ((result.data as { exists: boolean }).exists) {
          Alert.alert(t('onboarding_account_exists_title'), t('onboarding_account_exists_message'));
          return;
        }
      }

      // Send OTP
      const fnInstance = getFunctions(undefined, 'me-central1');
      const sendOtp = httpsCallable(fnInstance, 'sendOtp');
      await sendOtp({ email: normalizedEmail, purpose: isNewUser ? 'signup' : 'login' });

      // Navigate to verification screen
      router.replace({
        pathname: '/(onboarding)/verify',
        params: { email: normalizedEmail, purpose: isNewUser ? 'signup' : 'login', role },
      });
    } catch (err: any) {
      console.error(err);
      Alert.alert(t('error'), err.message || t('onboarding_generic_error_message'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    await handleSendOtp();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={styles.contentArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <View style={styles.headerBackground}>
          <SafeAreaView edges={['top']} style={styles.headerContent}>
            <View style={[styles.topButtons, isRTL && styles.topButtonsRTL]}>
              <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
                <Ionicons name={arrowIconName} size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.replace('/')} style={styles.iconButton}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        <View style={[styles.cardContainer, { flex: 1 }]}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.card}>
              <View style={styles.iconCircle}>
                <Ionicons name="person-add-outline" size={36} color={Colors.brandGreen} />
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.titleSmall}>{t('onboarding_email_title_prefix')}</Text>
                <View style={styles.titleRow}>
                  <PhonkText style={styles.titleLarge}>
                    <Text style={styles.greenText}>{roleTitle}</Text>
                  </PhonkText>
                  <PhonkText style={styles.titleLarge}>
                    <Text style={styles.blackText}> {t('onboarding_email_title_suffix')}</Text>
                  </PhonkText>
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <View style={[styles.singleInputContainer, email ? styles.inputFocused : null]}>
                  <Ionicons name="mail-outline" size={20} color={email ? Colors.brandGreen : '#999'} style={styles.inputIcon} />
                  <TextInput
                    ref={inputRef}
                    style={[styles.input, { textAlign: inputTextAlign, flex: 1 }]}
                    placeholder={t('onboarding_email_placeholder')}
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                    editable={!isLoading}
                    autoFocus
                  />
                </View>
              </View>

              <Text style={styles.infoText}>{t('onboarding_email_description')}</Text>
              <TouchableOpacity onPress={() => router.push('/(onboarding)/upload-id' as any)} style={styles.linkButton}>
                <Text style={styles.linkText}>{t('onboarding_no_edu_email_link')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, email && !isLoading && styles.buttonEnabled]}
          onPress={handleContinue}
          disabled={isLoading || !email}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>{t('onboarding_continue')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  contentArea: { flex: 1 },
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
  card: { flex: 1, alignItems: 'center' },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#F0F9F0',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, marginTop: 8,
  },
  textContainer: { marginBottom: 32, alignItems: 'center' },
  titleSmall: {
    fontSize: 14, fontFamily: Typography.poppins.medium,
    color: '#666', textTransform: 'uppercase', letterSpacing: 2,
    marginBottom: 4, textAlign: 'center',
  },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  titleLarge: { fontSize: 32, textAlign: 'center', lineHeight: 38 },
  greenText: { color: Colors.brandGreen },
  blackText: { color: '#000000' },
  inputWrapper: { marginBottom: 20, width: '100%' },
  singleInputContainer: {
    backgroundColor: '#F5F5F5', borderRadius: 16,
    height: 58, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, borderWidth: 2, borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: Colors.brandGreen,
    backgroundColor: '#F0F9F0',
  },
  inputIcon: { marginRight: 10 },
  input: { fontSize: 16, fontFamily: Typography.poppins.medium, color: '#000' },
  infoText: {
    fontSize: 14, color: '#999', textAlign: 'center',
    lineHeight: 20, paddingHorizontal: 10,
    fontFamily: Typography.poppins.medium, marginBottom: 8,
  },
  linkButton: { paddingVertical: 8, paddingHorizontal: 16 },
  linkText: {
    fontSize: 14, color: Colors.brandGreen, textAlign: 'center',
    lineHeight: 20, fontFamily: Typography.poppins.semiBold,
  },
  footer: { paddingHorizontal: 28, paddingBottom: 40, backgroundColor: 'white' },
  button: {
    backgroundColor: Colors.brandGreen, height: 62, borderRadius: 31,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    opacity: 0.5,
  },
  buttonEnabled: {
    opacity: 1,
    shadowColor: Colors.brandGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontFamily: Typography.poppins.semiBold },
});
