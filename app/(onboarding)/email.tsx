import { Ionicons } from '@expo/vector-icons';
import { getAuth, isSignInWithEmailLink, sendSignInLinkToEmail, signInWithEmailLink } from '@react-native-firebase/auth';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useResponsive } from '../../hooks/useResponsive';
import { ResponsiveContainer } from '../../components/ResponsiveContainer';
import { actionCodeSettings, clearAuthEmail, getAuthEmail, saveAuthEmail } from '../../utils/auth';

// ✅ Email normalization (strict identity)
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
  const { isTablet, horizontalPadding } = useResponsive();
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string; mode?: string }>();
  const { role, mode } = params;

  const [email, setEmail] = useState('');
  const [isNewUser, setIsNewUser] = useState(mode === 'signup');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [manualLink, setManualLink] = useState('');
  const inputRef = useRef<TextInput>(null);

  const hasHandledLink = useRef(false);
  const url = Linking.useLinkingURL();


  // Verify email link
  const verifyAutomaticLink = async (incomingUrl: string) => {
    if (hasHandledLink.current) return;

    const authInstance = getAuth();
    if (!(await isSignInWithEmailLink(authInstance, incomingUrl))) return;

    setIsLoading(true);
    hasHandledLink.current = true;

    try {
      let storedEmail = await getAuthEmail();

      if (!storedEmail) {
        // 🔴 fallback (user manually inputs email)
        Alert.prompt(
          'Confirm Email',
          'Enter your email to complete sign-in',
          async (inputEmail) => {
            if (!inputEmail) return;

            const normalizedEmail = normalizeEmail(inputEmail);

            await signInWithEmailLink(authInstance, normalizedEmail, incomingUrl);

            if (isNewUser) {
              router.replace({
                pathname: '/(onboarding)/details',
                params: { role, email: normalizedEmail },
              });
            } else {
              router.replace('/(tabs)');
            }

            await clearAuthEmail();
          },
          'plain-text',
        );
        return;
      }

      const normalizedEmail = normalizeEmail(storedEmail);

      await signInWithEmailLink(authInstance, normalizedEmail, incomingUrl);
      
      await clearAuthEmail();

      if (isNewUser) {
        router.replace({
          pathname: '/(onboarding)/details',
          params: { role, email: normalizedEmail },
        });
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('Verification Failed', err.message || 'Failed to verify link.');
    } finally {
      setIsLoading(false);
      setCheckingLink(false);
    }
  };

  // Cold start
  useEffect(() => {
    const checkInitialLink = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        verifyAutomaticLink(initialUrl);
      } else {
        setCheckingLink(false);
      }
    };
    checkInitialLink();
  }, []);

  // Foreground
  useEffect(() => {
    if (url) {
      verifyAutomaticLink(url);
    }
  }, [url]);

  const handleBack = () => {
    router.back();
  };

  const handleSendMagicLink = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return;

    setIsLoading(true);
    try {
      const authInstance = getAuth();

      // ✅ Signup: Check if account exists (prevent duplicates)
      if (isNewUser) {
        const fnInstance = getFunctions(undefined, 'me-central1');
        const checkStudent = httpsCallable(fnInstance, 'checkStudentExists');

        const result = await checkStudent({ email: normalizedEmail });

        if ((result.data as { exists: boolean }).exists) {
          Alert.alert('Account exists', 'Please login instead.');
          return;
        }
      }

      await sendSignInLinkToEmail(authInstance, normalizedEmail, actionCodeSettings);
      await saveAuthEmail(normalizedEmail);

      Alert.alert('Email Sent', `A magic link has been sent to ${normalizedEmail}. Check your inbox.`);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLinkVerify = async () => {
    if (!manualLink.trim()) return;

    setIsLoading(true);
    try {
      const authInstance = getAuth();

      if (await isSignInWithEmailLink(authInstance, manualLink)) {
        const storedEmail = await getAuthEmail();

        if (!storedEmail) {
          Alert.alert('Error', 'No email found in storage. Please start again.');
          return;
        }

        const normalizedEmail = normalizeEmail(storedEmail);

        await signInWithEmailLink(authInstance, normalizedEmail, manualLink);

        await clearAuthEmail();

        if (isNewUser) {
          router.replace({
            pathname: '/(onboarding)/details',
            params: { role, email: normalizedEmail },
          });
        } else {
          router.replace('/(tabs)');
        }
      } else {
        Alert.alert('Invalid Link', 'The link you pasted is not valid.');
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to verify link.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    if (manualLink) {
      await handleManualLinkVerify();
      return;
    }
    await handleSendMagicLink();
  };

  if (checkingLink) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.brandGreen} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.headerBackground}>
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          <ResponsiveContainer>
            <View style={styles.topButtons}>
              <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
                <Ionicons name="arrow-back" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.replace('/')} style={styles.iconButton}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>
          </ResponsiveContainer>
        </SafeAreaView>
      </View>

      <View style={styles.cardContainer}>
        <ResponsiveContainer>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.card}>
            <View style={styles.textContainer}>
              <PhonkText style={styles.titleLine}>
                <Text style={styles.greenText}>CREATE YOUR</Text>
              </PhonkText>
              <PhonkText style={styles.titleLine}>
                <Text style={styles.blackText}>{role === 'creator' ? 'CREATOR' : 'STUDENT'} ACCOUNT</Text>
              </PhonkText>
            </View>

            <View style={styles.inputWrapper}>
              <View style={[styles.singleInputContainer, { marginBottom: 15 }]}>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder="Student Email"
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

              {manualLink && (
                <View style={{ alignItems: 'center', marginVertical: 10 }}>
                  <Ionicons name="mail-outline" size={60} color={Colors.brandGreen} />
                  <View style={[styles.singleInputContainer, { marginTop: 20, width: '100%' }]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Paste the link from your email here"
                      placeholderTextColor="#999"
                      value={manualLink}
                      onChangeText={setManualLink}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>
              )}
            </View>

            <Text style={styles.infoText}>
              Use your university email address to access exclusive student deals and discounts.
            </Text>
          </View>
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={20}
          style={styles.footer}
        >
          <TouchableOpacity
            style={[styles.button, (isLoading || !email) && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={isLoading || !email}
            activeOpacity={0.8}
          >
            {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Continue</Text>}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </ResponsiveContainer>
    </View>
  </View>
  );
}


// --- Styles remain unchanged ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.brandGreen },
  headerBackground: { height: 250, backgroundColor: Colors.brandGreen, justifyContent: 'center' },
  headerContent: { paddingHorizontal: 20, paddingTop: 10 },
  topButtons: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 },
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
  cardContainer: { flex: 1, backgroundColor: 'white', borderTopLeftRadius: 50, borderTopRightRadius: 50, marginTop: -80, paddingHorizontal: 30, paddingTop: 40 },
  card: { flex: 1 },
  textContainer: { marginBottom: 40, alignItems: 'center' },
  titleLine: { fontSize: 32, textAlign: 'center', lineHeight: 38 },
  greenText: { color: Colors.brandGreen },
  blackText: { color: '#000000' },
  inputWrapper: { marginBottom: 20 },
  singleInputContainer: { backgroundColor: '#F3F3F3', borderRadius: 30, height: 60, justifyContent: 'center', paddingHorizontal: 25 },
  input: { fontSize: 16, fontFamily: Typography.poppins.medium, color: '#000' },
  infoText: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 20, paddingHorizontal: 10, fontFamily: Typography.poppins.medium },
  footer: { paddingBottom: 40 },
  button: { backgroundColor: Colors.brandGreen, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontFamily: Typography.poppins.medium },
});
