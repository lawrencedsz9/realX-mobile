import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import PhonkText from '../../components/PhonkText';
import { useResponsive } from '../../hooks/useResponsive';
import { ResponsiveContainer } from '../../components/ResponsiveContainer';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
    const { isTablet, horizontalPadding } = useResponsive();
    const router = useRouter();
    const [step, setStep] = useState(0); // Set to 1 to show the screen in the screenshot directly, or as starting point

    const handleGetStarted = () => {
        setStep(1);
    };

    const handleSelectRole = (role: 'student' | 'creator') => {
        router.push({
            pathname: '/(onboarding)/email',
            params: { role, mode: 'signup' }
        } as any);
    };

    const handleLogin = () => {
        router.push('/(onboarding)/login' as any);
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors.brandGreen }]}>
            <StatusBar style="light" />

            <SafeAreaView style={styles.safeArea}>
                <ResponsiveContainer>
                {step === 0 ? (
                    <View style={styles.content}>
                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../assets/images/logo.png')}
                                style={styles.logo}
                                contentFit="contain"
                            />
                        </View>

                        {/* Headline */}
                        <View style={styles.headlineContainer}>
                            <PhonkText style={styles.headlineBroke}>BROKE?</PhonkText>
                            <PhonkText style={styles.headlineNotAnymore}>NOT ANYMORE.</PhonkText>
                        </View>

                        {/* Character Graphic */}
                        <View style={styles.graphicContainer}>
                            <Image
                                source={require('../../assets/images/onboarding.png')}
                                style={styles.characterImage}
                                contentFit="contain"
                                contentPosition="left"
                            />
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.subtext}>
                                Student-only deals + cashback that actually hits different.
                            </Text>

                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleGetStarted}
                                activeOpacity={0.9}
                            >
                                <PhonkText style={styles.buttonText}>GET STARTED</PhonkText>
                                <View style={styles.arrowCircle}>
                                    <Ionicons name="arrow-forward" size={24} color="white" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.roleSelectionContent}>
                        {/* Logo */}
                        <View style={styles.roleLogoContainer}>
                            <Image
                                source={require('../../assets/images/logo.png')}
                                style={styles.roleLogo}
                                contentFit="contain"
                            />
                        </View>

                        {/* Role Cards */}
                        <View style={styles.cardsWrapper}>
                            <TouchableOpacity
                                style={styles.roleCard}
                                activeOpacity={0.9}
                                onPress={() => handleSelectRole('student')}
                            >
                                <View style={[styles.roleImageCircle]}>
                                    <Image
                                        source={require('../../assets/images/join-student.png')}
                                        style={styles.roleImage}
                                        contentFit="contain"
                                    />
                                </View>
                                <View style={styles.roleTextContainer}>
                                    <PhonkText style={styles.roleTitle}>JOIN AS STUDENT</PhonkText>
                                    <Text style={styles.roleDescription}>
                                        Get exclusive discounts on 50+ brands + 1% cashback on every purchase
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward-outline" size={32} color="#AAAAAA" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.roleCard}
                                activeOpacity={0.9}
                                onPress={() => handleSelectRole('creator')}
                            >
                                <View style={[styles.roleImageCircle]}>
                                    <Image
                                        source={require('../../assets/images/join-creator.png')}
                                        style={styles.roleImage}
                                        contentFit="contain"
                                    />
                                </View>
                                <View style={styles.roleTextContainer}>
                                    <PhonkText style={styles.roleTitle}>JOIN AS CREATOR</PhonkText>
                                    <Text style={styles.roleDescription}>
                                        Share your personal code and earn double cashback when others use it
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward-outline" size={32} color="#AAAAAA" />
                            </TouchableOpacity>
                        </View>

                        {/* Login Pill */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleLogin}
                        >
                            <GlassView
                                style={styles.loginPill}
                                glassEffectStyle="regular"
                                colorScheme="light"
                            >
                                <Text style={styles.loginText}>
                                    Already have an account? <Text style={styles.loginBold}>Login</Text>
                                </Text>
                            </GlassView>
                        </TouchableOpacity>
                    </View>
                )}
                </ResponsiveContainer>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    logoContainer: {
        marginTop: 20,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        height: 48,
        width: 150,
    },
    headlineContainer: {
        marginTop: 40,
        alignSelf: 'flex-start',
        paddingLeft: 10,
    },
    headlineBroke: {
        fontSize: 40,
        color: '#FFFFFF',
        fontStyle: 'italic',
        lineHeight: 52,
    },
    headlineNotAnymore: {
        fontSize: 40,
        color: '#FFFFFF',
        lineHeight: 52
    },
    graphicContainer: {
        flex: 1,
        width: width,
        justifyContent: 'center',
        alignItems: 'flex-start',
        alignSelf: 'flex-start',
        marginLeft: -24, // Negate content padding to hit edge
        marginTop: 20,
    },
    characterImage: {
        width: width * 0.85,
        height: height * 0.45,
        maxWidth: 600,
    },
    footer: {
        width: '100%',
        paddingBottom: 40,
        paddingHorizontal: 10,
    },
    subtext: {
        fontFamily: Typography.poppins.medium,
        fontSize: 18,
        color: '#FFFFFF',
        textAlign: 'left',
        width: '100%',
        marginBottom: 30,
        lineHeight: 24,
    },
    button: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        height: 72,
        borderRadius: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 30,
        paddingRight: 10,
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        // Elevation for Android
        elevation: 5,
    },
    buttonText: {
        fontSize: 18,
        color: '#18B852',
    },
    arrowCircle: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#18B852',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Role selection styles
    roleSelectionContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center', // Center content vertically as in screenshot
        paddingHorizontal: 16,
    },
    roleLogoContainer: {
        marginBottom: 60,
    },
    roleLogo: {
        height: 80,
        width: 240,
    },
    cardsWrapper: {
        width: '100%',
        gap: 16,
        paddingHorizontal: 10,
    },
    roleCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 45,
        paddingRight: 8,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 6,
    },
    roleImageCircle: {
        width: 100,
        height: 100,
    },
    roleImage: {
        width: '100%',
        height: '100%',
    },
    roleTextContainer: {
        flex: 1,
        marginLeft: 4,
    },
    roleTitle: {
        fontSize: 20,
        color: '#000000',
        marginBottom: 8,
    },
    roleDescription: {
        fontFamily: Typography.poppins.medium,
        fontSize: 12,
        color: '#000000',
        lineHeight: 16,
        paddingRight: 10,
    },
    loginPill: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingVertical: 15,
        paddingHorizontal: 35,
        borderRadius: 100,
        marginTop: 50,
        overflow: 'hidden',
    },
    loginText: {
        color: '#FFFFFF',
        fontFamily: Typography.poppins.medium,
        fontSize: 16,
    },
    loginBold: {
        fontFamily: Typography.poppins.semiBold,
        color: "#000000",
    },
});



