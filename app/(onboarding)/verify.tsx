import { Ionicons } from '@expo/vector-icons';
import { getAuth, signInWithCustomToken } from '@react-native-firebase/auth';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

const OTP_LENGTH = 6;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; purpose?: string; role?: string }>();
  const { email, purpose, role } = params;
  const { t } = useTranslation();

  const isRTL = I18nManager.isRTL;
  const arrowIconName = isRTL ? 'arrow-forward' : 'arrow-back';
  const inputTextAlign: 'left' | 'right' = isRTL ? 'right' : 'left';

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];

    // Handle paste of full code
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
      for (let i = 0; i < OTP_LENGTH; i++) {
        newOtp[i] = digits[i] || '';
      }
      setOtp(newOtp);
      const focusIndex = Math.min(digits.length, OTP_LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);
    setError(null);

    // Auto-advance
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== '');

  const handleVerify = useCallback(async () => {
    if (!isOtpComplete || !email || !purpose || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const fnInstance = getFunctions(undefined, 'me-central1');
      const verifyOtpFn = httpsCallable(fnInstance, 'verifyOtp');
      const result = await verifyOtpFn({
        email,
        code: otp.join(''),
        purpose,
      });

      const { customToken } = result.data as { customToken: string };

      // Sign in with custom token
      const authInstance = getAuth();
      await signInWithCustomToken(authInstance, customToken);

      // Navigate based on purpose
      if (purpose === 'signup') {
        router.replace({
          pathname: '/(onboarding)/details',
          params: { role: role || 'student', email },
        });
      }
      // Login: _layout.tsx auto-routes to (tabs) via onAuthStateChanged
    } catch (err: any) {
      console.error(err);

      const code = err.code || '';
      const message = err.message || t('onboarding_otp_generic_error');

      if (code === 'invalid-argument') {
        // Wrong code
        setError(message);
        // Clear OTP input
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      } else if (code === 'deadline-exceeded' || code === 'permission-denied' || code === 'resource-exhausted') {
        setError(message);
      } else if (code === 'not-found') {
        setError(message);
      } else {
        Alert.alert(t('error'), message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [otp, email, purpose, role, isLoading, router, t]);

  const handleResend = async () => {
    if (cooldownSeconds > 0 || resendLoading || !email || !purpose) return;

    setResendLoading(true);
    setError(null);
    setOtp(Array(OTP_LENGTH).fill(''));

    try {
      const fnInstance = getFunctions(undefined, 'me-central1');
      const sendOtpFn = httpsCallable(fnInstance, 'sendOtp');
      await sendOtpFn({ email, purpose });
      setCooldownSeconds(60);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      console.error(err);
      Alert.alert(t('error'), err.message || t('onboarding_otp_send_failed'));
    } finally {
      setResendLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const titleText = purpose === 'login'
    ? t('onboarding_otp_check_email_title')
    : t('onboarding_otp_verify_title');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <StatusBar style="light" />

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
            <View style={styles.iconContainer}>
              <Ionicons name="mail-open-outline" size={64} color={Colors.brandGreen} />
            </View>

            <View style={styles.textContainer}>
              <PhonkText style={styles.titleLine}>
                <Text style={styles.greenText}>{titleText}</Text>
              </PhonkText>
            </View>

            <Text style={styles.subtitle}>
              {t('onboarding_otp_subtitle', { email: email || '' })}
            </Text>

            <View style={[styles.otpContainer, isRTL && styles.otpContainerRTL]}>
              {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={[
                    styles.otpInput,
                    { textAlign: inputTextAlign },
                    otp[index] ? styles.otpInputFilled : null,
                  ]}
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH}
                  value={otp[index]}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  editable={!isLoading}
                  autoFocus={index === 0}
                  selectTextOnFocus
                />
              ))}
            </View>

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <View style={styles.resendContainer}>
              {cooldownSeconds > 0 ? (
                <Text style={styles.cooldownText}>
                  {t('onboarding_otp_resend_in', { seconds: cooldownSeconds })}
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
                  {resendLoading ? (
                    <ActivityIndicator size="small" color={Colors.brandGreen} />
                  ) : (
                    <Text style={styles.resendText}>{t('onboarding_otp_resend')}</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={20}
          style={styles.footer}
        >
          <TouchableOpacity
            style={[styles.button, (!isOtpComplete || isLoading) && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={!isOtpComplete || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>{t('onboarding_otp_verify_button')}</Text>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.brandGreen },
  headerBackground: { height: 250, backgroundColor: Colors.brandGreen },
  headerContent: { paddingHorizontal: 20, paddingTop: 10 },
  topButtons: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 },
  topButtonsRTL: { flexDirection: 'row-reverse' },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    marginTop: -80,
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  card: { flex: 1, alignItems: 'center' },
  iconContainer: {
    marginBottom: 24,
    marginTop: 10,
  },
  textContainer: { marginBottom: 16, alignItems: 'center' },
  titleLine: { fontSize: 28, textAlign: 'center', lineHeight: 34 },
  greenText: { color: Colors.brandGreen },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Typography.poppins.medium,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  otpContainerRTL: {
    flexDirection: 'row-reverse',
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F3F3F3',
    fontSize: 24,
    fontFamily: Typography.poppins.semiBold,
    color: '#000',
    textAlign: 'center',
  },
  otpInputFilled: {
    backgroundColor: '#E8F5E9',
    borderColor: Colors.brandGreen,
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: 13,
    color: '#E53935',
    textAlign: 'center',
    fontFamily: Typography.poppins.medium,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  resendContainer: {
    marginTop: 16,
    marginBottom: 20,
  },
  cooldownText: {
    fontSize: 14,
    color: '#999',
    fontFamily: Typography.poppins.medium,
  },
  resendText: {
    fontSize: 14,
    color: Colors.brandGreen,
    fontFamily: Typography.poppins.semiBold,
  },
  footer: { paddingBottom: 40, marginTop: 'auto' },
  button: {
    backgroundColor: Colors.brandGreen,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: Typography.poppins.medium,
  },
});
