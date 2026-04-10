import { Ionicons } from '@expo/vector-icons';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  I18nManager,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
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

// Email normalization
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

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;
  const arrowIconName = isRTL ? 'arrow-forward' : 'arrow-back';
  const inputTextAlign: 'left' | 'right' = isRTL ? 'right' : 'left';
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleBack = () => {
    router.back();
  };

  const handleLogin = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return;

    setIsLoading(true);

    try {
      const fnInstance = getFunctions(undefined, 'me-central1');
      const sendOtp = httpsCallable(fnInstance, 'sendOtp');
      await sendOtp({ email: normalizedEmail, purpose: 'login' });

      router.replace({
        pathname: '/(onboarding)/verify',
        params: { email: normalizedEmail, purpose: 'login' },
      });
    } catch (err: any) {
      console.error(err);

      // If account not found, show signup modal
      if (err.code === 'not-found') {
        setShowSignUpModal(true);
        return;
      }

      Alert.alert(t('error'), err.message || t('onboarding_generic_error_message'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    await handleLogin();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={styles.contentArea}
        behavior="padding"
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

        <View style={[styles.cardContainer, { backgroundColor: '#FFFFFF' }]}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.card}>
              <View style={styles.iconCircle}>
                <Ionicons name="log-in-outline" size={36} color={Colors.brandGreen} />
              </View>

              <View style={styles.textContainer}>
                <PhonkText style={styles.titleLarge}>
                  <Text style={styles.greenText}>{t('onboarding_login_title')}</Text>
                </PhonkText>
              </View>

              <View style={styles.inputWrapper}>
                <View style={[styles.singleInputContainer, email ? styles.inputFocused : null]}>
                  <Ionicons name="mail-outline" size={20} color={email ? Colors.brandGreen : '#999'} style={styles.inputIcon} />
                  <TextInput
                    ref={inputRef}
                    style={[styles.input, { color: '#000000', textAlign: inputTextAlign, flex: 1 }]}
                    placeholder={t('onboarding_email_placeholder')}
                    placeholderTextColor="#999999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                    editable={!isLoading}
                    autoFocus={true}
                  />
                </View>
              </View>

              <Text style={styles.infoText}>
                {t('onboarding_login_info')}
              </Text>
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
            <Text style={styles.buttonText}>
              {t('onboarding_login_title')}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showSignUpModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSignUpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="person-add-outline" size={40} color={Colors.brandGreen} />
            </View>
            <PhonkText style={styles.modalTitle}>{t('onboarding_account_not_found_title')}</PhonkText>
            <Text style={styles.modalText}>{t('onboarding_account_not_found_message')}</Text>

            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={() => {
                setShowSignUpModal(false);
                router.push({ pathname: '/(onboarding)/email', params: { role: 'student', mode: 'signup' } });
              }}
            >
              <Text style={styles.modalPrimaryButtonText}>{t('onboarding_sign_up')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSecondaryButton}
              onPress={() => setShowSignUpModal(false)}
            >
              <Text style={styles.modalSecondaryButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentArea: {
    flex: 1,
  },
  headerBackground: {
    height: 250,
    backgroundColor: Colors.brandGreen,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  topButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
  },
  topButtonsRTL: {
    flexDirection: 'row-reverse',
  },
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
  card: {
    flex: 1, alignItems: 'center',
  },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#F0F9F0',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, marginTop: 8,
  },
  textContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  titleLarge: {
    fontSize: 32, textAlign: 'center', lineHeight: 38,
  },
  greenText: {
    color: Colors.brandGreen,
  },
  inputWrapper: {
    marginBottom: 20, width: '100%',
  },
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
  input: {
    fontSize: 16,
    fontFamily: Typography.poppins.medium,
  },
  infoText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
    fontFamily: Typography.poppins.medium,
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 40,
    backgroundColor: 'white',
  },
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
  buttonText: {
    color: '#FFFFFF', fontSize: 17, fontFamily: Typography.poppins.semiBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 13,
    elevation: 10,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F9F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    color: Colors.brandGreen,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: Typography.poppins.medium,
    lineHeight: 24,
  },
  modalPrimaryButton: {
    backgroundColor: Colors.brandGreen,
    height: 56,
    borderRadius: 28,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalPrimaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: Typography.poppins.semiBold,
  },
  modalSecondaryButton: {
    height: 56,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSecondaryButtonText: {
    color: '#999',
    fontSize: 16,
    fontFamily: Typography.poppins.medium,
  },
});
