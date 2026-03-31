import { Ionicons } from '@expo/vector-icons';
import { getAuth, isSignInWithEmailLink, sendSignInLinkToEmail, signInWithEmailLink } from '@react-native-firebase/auth';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import PhonkText from '../../components/PhonkText';
import { actionCodeSettings, clearAuthEmail, getAuthEmail, saveAuthEmail } from '../../utils/auth';

// ✅ Email normalization
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
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLinkSent, setIsLinkSent] = useState(false);
    const [manualLink, setManualLink] = useState('');
    const [showSignUpModal, setShowSignUpModal] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const url = Linking.useURL();


    useEffect(() => {
        const verifyAutomaticLink = async (incomingUrl: string) => {
            const authInstance = getAuth();

            if (await isSignInWithEmailLink(authInstance, incomingUrl)) {
                setIsLoading(true);

                try {
                    const storedEmail = await getAuthEmail();

                    if (storedEmail) {
                        const normalizedEmail = normalizeEmail(storedEmail);

                        await signInWithEmailLink(authInstance, normalizedEmail, incomingUrl);


                        await clearAuthEmail();
                        console.log('Successfully signed in automatically!');
                    } else {
                        Alert.alert('Error', 'No email found in storage. Please try starting again.');
                    }
                } catch (err: any) {
                    console.error(err);
                    Alert.alert('Verification Failed', err.message || 'Failed to verify link.');
                } finally {
                    setIsLoading(false);
                }
            }
        };

        if (url && isLinkSent) {
            verifyAutomaticLink(url);
        }
    }, [url, isLinkSent]);

    const handleBack = () => {
        if (isLinkSent) {
            setIsLinkSent(false);
        } else {
            router.back();
        }
    };

    const handleSendMagicLink = async (inputEmail: string) => {
        const normalizedEmail = normalizeEmail(inputEmail);

        const authInstance = getAuth();
        await sendSignInLinkToEmail(authInstance, normalizedEmail, actionCodeSettings);
        await saveAuthEmail(normalizedEmail);

        setIsLinkSent(true);
    };

    const handleLogin = async () => {
        const normalizedEmail = normalizeEmail(email);
        if (!normalizedEmail) return;

        setIsLoading(true);

        try {
            const fnInstance = getFunctions(undefined, 'me-central1');
            const checkStudent = httpsCallable(fnInstance, 'checkStudentExists');

            const result = await checkStudent({ email: normalizedEmail });

            if (!(result.data as { exists: boolean }).exists) {
                setShowSignUpModal(true);
                return;
            }

            await handleSendMagicLink(normalizedEmail);
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

                if (storedEmail) {
                    const normalizedEmail = normalizeEmail(storedEmail);

                    await signInWithEmailLink(authInstance, normalizedEmail, manualLink);

                    await clearAuthEmail();
                    console.log('Successfully signed in manually!');
                } else {
                    Alert.alert('Error', 'No email found in storage. Please try starting again.');
                }
            } else {
                Alert.alert('Invalid Link', 'The link you pasted is not a valid sign-in link.');
            }
        } catch (err: any) {
            console.error(err);
            Alert.alert('Error', err.message || 'Failed to verify link.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleContinue = async () => {
        if (isLinkSent) {
            if (manualLink) {
                await handleManualLinkVerify();
            } else {
                setIsLoading(true);
                try {
                    await handleSendMagicLink(email);
                    Alert.alert('Email Sent', 'A new link has been sent to your email.');
                } catch (err: any) {
                    Alert.alert('Error', err.message || 'Failed to resend email.');
                } finally {
                    setIsLoading(false);
                }
            }
            return;
        }

        await handleLogin();
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors.brandGreen }]}>
            <StatusBar style="light" />

            <View style={styles.headerBackground}>
                <SafeAreaView edges={['top']} style={styles.headerContent}>
                    <View style={styles.topButtons}>
                        <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
                            <Ionicons name="arrow-back" size={24} color="black" />
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
                        <View style={styles.textContainer}>
                            {isLinkSent ? (
                                <>
                                    <PhonkText style={styles.titleLine}>
                                        <Text style={styles.greenText}>CHECK YOUR</Text>
                                    </PhonkText>
                                    <PhonkText style={styles.titleLine}>
                                        <Text style={styles.blackText}>EMAIL</Text>
                                    </PhonkText>
                                </>
                            ) : (
                                <PhonkText style={styles.titleLine}>
                                    <Text style={styles.greenText}>LOGIN</Text>
                                </PhonkText>
                            )}
                        </View>

                        <View style={styles.inputWrapper}>
                            {isLinkSent ? (
                                <View style={{ alignItems: 'center', marginVertical: 10 }}>
                                    <Ionicons name="mail-outline" size={60} color={Colors.brandGreen} />
                                    <View style={[styles.singleInputContainer, { backgroundColor: '#F3F3F3' }]}>
                                        <TextInput
                                            style={[styles.input, { color: '#000000' }]}
                                            placeholder="Paste the link from your email here"
                                            placeholderTextColor="#999999"
                                            value={manualLink}
                                            onChangeText={setManualLink}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                    </View>
                                </View>
                            ) : (
                                <View style={[styles.singleInputContainer, { backgroundColor: '#F3F3F3' }]}>
                                    <TextInput
                                        ref={inputRef}
                                        style={[styles.input, { color: '#000000' }]}
                                        placeholder="Student Email"
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
                            )}
                        </View>

                        <Text style={styles.infoText}>
                            {isLinkSent
                                ? `We've sent a magic link to ${email}. Click the link in your email to login.`
                                : 'Enter your email to receive a secure login link.'}
                        </Text>
                    </View>
                </TouchableWithoutFeedback>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={20}
                    style={styles.footer}
                >
                    <TouchableOpacity
                        style={[
                            styles.button,
                            (isLoading || (!isLinkSent && !email)) && styles.buttonDisabled
                        ]}
                        onPress={handleContinue}
                        disabled={isLoading || (!isLinkSent && !email)}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>
                                {isLinkSent ? (manualLink ? 'Verify Link' : 'Resend Email') : 'Login'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </KeyboardAvoidingView>
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
                        <PhonkText style={styles.modalTitle}>ACCOUNT NOT FOUND</PhonkText>
                        <Text style={styles.modalText}>
                        It looks like you don&apos;t have an account yet. Would you like to create one?
                        </Text>

                        <TouchableOpacity
                            style={styles.modalPrimaryButton}
                            onPress={() => {
                                setShowSignUpModal(false);
                                router.push({ pathname: '/(onboarding)/email', params: { role: 'student', mode: 'signup' } });
                            }}
                        >
                            <Text style={styles.modalPrimaryButtonText}>Sign Up</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalSecondaryButton}
                            onPress={() => setShowSignUpModal(false)}
                        >
                            <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
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
        backgroundColor: Colors.brandGreen,
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
    card: {
        flex: 1,
    },
    textContainer: {
        marginBottom: 40,
        alignItems: 'center',
    },
    titleLine: {
        fontSize: 32,
        textAlign: 'center',
        lineHeight: 38,
    },
    greenText: {
        color: Colors.brandGreen,
    },
    blackText: {
    },
    inputWrapper: {
        marginBottom: 20,
    },
    singleInputContainer: {
        backgroundColor: '#F3F3F3',
        borderRadius: 30,
        height: 60,
        justifyContent: 'center',
        paddingHorizontal: 25,
    },
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
        paddingBottom: 40,
    },
    button: {
        backgroundColor: Colors.brandGreen,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: Typography.poppins.medium,
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
