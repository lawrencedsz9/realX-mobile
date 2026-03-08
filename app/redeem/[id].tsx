import Ionicons from '@expo/vector-icons/Ionicons';
import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
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

// Types for better type safety
interface VendorData {
    profilePicture?: string;
    name?: string;
    xcard?: boolean;
    [key: string]: any;
}

interface OfferData {
    discountValue?: string | number;
    discountType?: string;
    [key: string]: any;
}

export default function RedeemScreen() {
    const { id, vendorId } = useLocalSearchParams<{ id: string; vendorId: string }>();
    const router = useRouter();
    const [vendor, setVendor] = useState<VendorData | null>(null);
    const [offer, setOffer] = useState<OfferData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<'creator' | 'pin'>('creator');
    const [creatorCode, setCreatorCode] = useState('');
    const [pin, setPin] = useState('');
    const [amount, setAmount] = useState('');
    const [focusedField, setFocusedField] = useState<'pin' | 'amount' | null>(null);

    const pinInputRef = useRef<TextInput>(null);
    const amountInputRef = useRef<TextInput>(null);

    // Derived values for UX
    const amountNum = parseFloat(amount) || 0;
    let discountAmt = 0;
    if (offer) {
        const discValue = Number(offer.discountValue) || 0;
        if (offer.discountType === 'percentage' || String(offer.discountValue).includes('%')) {
            discountAmt = (amountNum * discValue) / 100;
        } else {
            discountAmt = discValue;
        }
    }
    discountAmt = Math.min(discountAmt, amountNum);
    const remainingAmt = amountNum - discountAmt;
    const isFormValid = pin.length === 4 && amountNum > 0;

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            if (!id || !vendorId) return;
            try {
                const db = getFirestore();

                // Fetch Vendor
                const vendorRef = doc(db, 'vendors', vendorId);
                const vendorSnap = await getDoc(vendorRef);
                if (vendorSnap.exists() && isMounted) {
                    const data = vendorSnap.data() as VendorData;
                    setVendor(data);
                    // If XCard is not enabled, skip the creator code step
                    if (!data.xcard) {
                        setStep('pin');
                    }
                }

                // Fetch Offer
                const offerRef = doc(db, 'offers', id);
                const offerSnap = await getDoc(offerRef);
                if (offerSnap.exists() && isMounted) {
                    setOffer(offerSnap.data() as OfferData);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [id, vendorId]);

    const handleAction = async () => {
        if (step === 'creator') {
            setStep('pin');
            // Slight delay to allow render before focus
            setTimeout(() => {
                pinInputRef.current?.focus();
            }, 300);
        } else {
            if (!isFormValid) return;
            Keyboard.dismiss();

            if (pin.length !== 4) {
                Alert.alert('Hold on', 'Please enter a 4-digit PIN');
                return;
            }
            if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
                Alert.alert('Hold on', 'Please enter a valid amount');
                return;
            }

            try {
                setIsSubmitting(true);
                const functions = getFunctions();
                const redeemOffer = httpsCallable(functions, 'redeemOffer');

                const amountNum = parseFloat(amount) || 0;
                let discountAmt = 0;
                if (offer) {
                    if (offer.discountType === 'percentage' || String(offer.discountValue).includes('%')) {
                        discountAmt = (amountNum * Number(offer.discountValue)) / 100;
                    } else {
                        discountAmt = Number(offer.discountValue);
                    }
                }
                discountAmt = Math.min(discountAmt, amountNum);

                const payload: any = {
                    vendorId,
                    pin,
                    billAmount: amountNum,
                    amountSaved: discountAmt
                };

                if (creatorCode) {
                    payload.creatorCode = creatorCode;
                }

                const response = await redeemOffer(payload);

                if (response.data && (response.data as any).success) {
                    Alert.alert('Success', 'Redemption successful', [
                        { text: 'OK', onPress: () => router.push('/(tabs)') }
                    ]);
                } else {
                    Alert.alert('Error', 'An unexpected error occurred during redemption.');
                }
            } catch (error: any) {
                console.error('Error redeeming offer:', error);

                let errorTitle = 'Redemption Failed';
                let errorMessage = 'Could not process redemption. Please try again later.';

                if (error?.message) {
                    const msg = error.message.toLowerCase();

                    if (msg.includes('creator code failed')) {
                        errorTitle = 'Invalid Creator Code';
                        errorMessage = 'The creator code you entered is invalid. Please check and try again, or leave it blank to continue without one.';
                    } else if (msg.includes('pin is inccorect') || msg.includes('incorrect vendor pin')) {
                        errorTitle = 'Incorrect PIN';
                        errorMessage = 'The vendor PIN you entered is incorrect. Please ask the vendor and try again.';
                    } else if (msg.includes('vendor not found')) {
                        errorTitle = 'Vendor Error';
                        errorMessage = 'We could not locate this vendor in our system.';
                    } else if (msg.includes('invalid') || msg.includes('required')) {
                        errorMessage = error.message; // Let standard validation errors pass through as-is
                    }
                }

                Alert.alert(errorTitle, errorMessage);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.brandGreen} />
            </View>
        );
    }

    if (!vendor || !offer) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Information not found</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backLink}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                style={styles.keyboardAware}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.innerContainer}>
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => {
                                    if (step === 'pin' && vendor?.xcard) {
                                        setStep('creator');
                                        Keyboard.dismiss();
                                    } else {
                                        router.back();
                                    }
                                }}
                            >
                                <Ionicons name="arrow-back" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.content}>
                            <ScrollView
                                style={styles.scrollContent}
                                contentContainerStyle={styles.scrollContentContainer}
                                showsVerticalScrollIndicator={false}
                                keyboardDismissMode="on-drag"
                                keyboardShouldPersistTaps="handled"
                            >
                                {/* Offer Card */}
                                <View style={styles.offerCardWrapper}>
                                    <View style={styles.offerCard}>
                                        <Text style={styles.offerTitle}>
                                            FLAT <Text style={styles.greenText}>
                                                {offer.discountValue}{offer.discountType === 'percentage' ? '%' : ''}
                                            </Text> OFF
                                        </Text>
                                    </View>

                                    {/* Logo Overlay */}
                                    <View style={styles.logoContainer}>
                                        <Image
                                            source={{ uri: vendor.profilePicture }}
                                            style={styles.logoImage}
                                            contentFit="contain"
                                        />
                                    </View>
                                </View>

                                {/* Conditional Cards based on Step */}
                                {step === 'creator' && (
                                    <View style={styles.creatorCard}>
                                        <Text style={styles.inputLabel}>
                                            Have a creator code? <Text style={styles.optionalText}>(Optional)</Text>
                                        </Text>
                                        <View style={[
                                            styles.creatorInputContainer,
                                            focusedField === 'pin' && styles.inputContainerFocused // reusing focus style if needed
                                        ]}>
                                            <TextInput
                                                style={styles.creatorInput}
                                                value={creatorCode}
                                                onChangeText={(text) => setCreatorCode(text.toUpperCase())}
                                                placeholder="REELX1"
                                                placeholderTextColor="#CCC"
                                                autoCapitalize="characters"
                                                maxLength={6}
                                                returnKeyType="next"
                                                onSubmitEditing={handleAction}
                                                autoCorrect={false}
                                                autoFocus={true}
                                            />
                                        </View>
                                    </View>
                                )}

                                {step === 'pin' && (
                                    <View style={styles.redemptionCard}>
                                        <Text style={styles.inputLabel}>Enter Vendor PIN:</Text>
                                        <View style={styles.pinContainer}>
                                            <TouchableOpacity
                                                activeOpacity={1}
                                                style={styles.pinVisualContainer}
                                                onPress={() => pinInputRef.current?.focus()}
                                            >
                                                {[0, 1, 2, 3].map((index) => (
                                                    <View key={index} style={[
                                                        styles.pinBox,
                                                        pin.length === index && styles.pinBoxActive,
                                                        focusedField === 'pin' && pin.length === index && styles.pinBoxFocused
                                                    ]}>
                                                        <Text style={[styles.pinText, pin.length > index && { color: '#000', marginTop: 0 }]}>
                                                            {pin.length > index ? '●' : '*'}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </TouchableOpacity>

                                            <TextInput
                                                ref={pinInputRef}
                                                style={styles.hiddenPinInput}
                                                value={pin}
                                                onFocus={() => setFocusedField('pin')}
                                                onBlur={() => setFocusedField(null)}
                                                onChangeText={(text) => {
                                                    const numericText = text.replace(/[^0-9]/g, '');
                                                    if (numericText.length <= 4) {
                                                        setPin(numericText);
                                                        if (numericText.length > 0) {
                                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                        }
                                                    }
                                                    // Auto-advance to amount if 4 digits entered
                                                    if (numericText.length === 4) {
                                                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                                        amountInputRef.current?.focus();
                                                    }
                                                }}
                                                keyboardType="number-pad"
                                                maxLength={4}
                                                returnKeyType="next"
                                                onSubmitEditing={() => amountInputRef.current?.focus()}
                                                autoFocus={step === 'pin'}
                                            />
                                        </View>

                                        <Text style={styles.inputLabel}>Total Bill:</Text>
                                        <View style={[
                                            styles.amountInputContainer,
                                            focusedField === 'amount' && styles.inputContainerFocused
                                        ]}>
                                            <Text style={styles.currencyPrefix}>QAR</Text>
                                            <TextInput
                                                ref={amountInputRef}
                                                style={styles.amountInput}
                                                value={amount}
                                                onFocus={() => setFocusedField('amount')}
                                                onBlur={() => setFocusedField(null)}
                                                onChangeText={(text) => {
                                                    setAmount(text);
                                                    if (text.length > 0) {
                                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                    }
                                                }}
                                                keyboardType="decimal-pad"
                                                placeholder="0"
                                                placeholderTextColor="#CCC"
                                                returnKeyType="go"
                                                onSubmitEditing={handleAction}
                                            />
                                        </View>

                                        {amountNum > 0 && (
                                            <View style={styles.breakdownContainer}>
                                                <View style={styles.breakdownRow}>
                                                    <Text style={styles.breakdownLabel}>Total Bill</Text>
                                                    <Text style={styles.breakdownValue}>
                                                        QAR {amountNum.toFixed(2)}
                                                    </Text>
                                                </View>
                                                <View style={styles.breakdownRow}>
                                                    <Text style={styles.breakdownLabelGreen}>Offer Applied</Text>
                                                    <Text style={styles.breakdownValueGreen}>
                                                        − QAR {discountAmt.toFixed(2)}
                                                    </Text>
                                                </View>
                                                <View style={styles.breakdownDivider} />
                                                <View style={styles.breakdownRow}>
                                                    <Text style={styles.breakdownLabelBold}>Amount to Pay</Text>
                                                    <Text style={styles.breakdownValueBold}>
                                                        QAR {remainingAmt.toFixed(2)}
                                                    </Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </ScrollView>

                            {/* Action Button */}
                            <TouchableOpacity
                                style={[
                                    styles.redeemButton,
                                    (!isFormValid && step === 'pin') && styles.redeemButtonDisabled
                                ]}
                                activeOpacity={0.9}
                                onPress={handleAction}
                                disabled={isSubmitting || (!isFormValid && step === 'pin')}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <>
                                        <Ionicons name="flash" size={20} color="#FFF" />
                                        <Text style={styles.redeemButtonText}>
                                            {step === 'creator' ? 'CONTINUE' :
                                                amountNum > 0 ? `REDEEM QAR ${remainingAmt.toFixed(0)}` : 'REDEEM'}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    keyboardAware: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        fontFamily: Typography.metropolis.medium,
        marginBottom: 10,
    },
    backLink: {
        color: Colors.brandGreen,
        fontFamily: Typography.metropolis.semiBold,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 20,
    },
    scrollContent: {
        flex: 1,
    },
    scrollContentContainer: {
        paddingTop: 30,
        paddingBottom: 20,
    },
    offerCardWrapper: {
        position: 'relative',
        width: '100%',
        marginTop: 50,
    },
    offerCard: {
        backgroundColor: '#F7F7F7',
        borderRadius: 35,
        paddingTop: 70,
        paddingBottom: 40,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tcButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    tcText: {
        fontSize: 14,
        color: '#888',
        fontFamily: Typography.metropolis.semiBold,
    },
    logoContainer: {
        position: 'absolute',
        top: -50,
        alignSelf: 'center',
        width: 100,
        height: 100,
        borderRadius: 25,
        backgroundColor: '#1E2a38',
        borderWidth: 4,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },
    logoImage: {
        width: '60%',
        height: '60%',
    },
    offerTitle: {
        fontSize: 32,
        fontFamily: Typography.integral.bold,
        color: '#000',
        textAlign: 'center',
    },
    greenText: {
        color: Colors.brandGreen,
    },
    offerSubtitle: {
        fontSize: 16,
        color: '#888',
        fontFamily: Typography.metropolis.medium,
        marginTop: 4,
    },
    redemptionCard: {
        backgroundColor: '#F7F7F7',
        borderRadius: 35,
        padding: 24,
        marginTop: 20,
    },
    inputLabel: {
        fontSize: 16,
        color: '#444',
        fontFamily: Typography.metropolis.semiBold,
        marginBottom: 12,
    },
    pinContainer: {
        marginBottom: 24,
        position: 'relative',
    },
    pinVisualContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    pinBox: {
        width: 65,
        height: 65,
        backgroundColor: '#FFF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    pinBoxActive: {
        borderColor: Colors.brandGreen,
    },
    pinText: {
        fontSize: 30,
        color: '#E0E0E0',
        fontFamily: Typography.metropolis.medium,
        marginTop: 10,
    },
    hiddenPinInput: {
        position: 'absolute',
        opacity: 0,
        height: '100%',
        width: '100%',
        zIndex: -1,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 25,
        height: 55,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    currencyPrefix: {
        fontSize: 16,
        color: '#AAA',
        fontFamily: Typography.metropolis.semiBold,
        marginRight: 10,
    },
    inputContainerFocused: {
        borderColor: Colors.brandGreen,
        borderWidth: 1.5,
        shadowColor: Colors.brandGreen,
        shadowOpacity: 0.1,
    },
    pinBoxFocused: {
        shadowColor: Colors.brandGreen,
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    amountInput: {
        flex: 1,
        fontSize: 18,
        color: '#000',
        fontFamily: Typography.metropolis.semiBold,
    },
    redeemButtonDisabled: {
        backgroundColor: '#CCC',
        shadowColor: '#CCC',
        shadowOpacity: 0.1,
    },
    breakdownContainer: {
        marginTop: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    breakdownLabel: {
        fontSize: 14,
        color: '#666',
        fontFamily: Typography.metropolis.medium,
    },
    breakdownValue: {
        fontSize: 14,
        color: '#666',
        fontFamily: Typography.metropolis.semiBold,
    },
    breakdownLabelGreen: {
        fontSize: 14,
        color: Colors.brandGreen,
        fontFamily: Typography.metropolis.medium,
    },
    breakdownValueGreen: {
        fontSize: 14,
        color: Colors.brandGreen,
        fontFamily: Typography.metropolis.semiBold,
    },
    breakdownDivider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 4,
    },
    breakdownLabelBold: {
        fontSize: 16,
        color: '#000',
        fontFamily: Typography.metropolis.semiBold,
    },
    breakdownValueBold: {
        fontSize: 18,
        color: '#000',
        fontFamily: Typography.integral.bold,
    },
    redeemButton: {
        backgroundColor: Colors.brandGreen,
        borderRadius: 35,
        height: 65,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 10,
        shadowColor: Colors.brandGreen,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    redeemButtonText: {
        color: '#FFF',
        fontSize: 22,
        fontFamily: Typography.integral.bold,
        letterSpacing: 1,
    },
    creatorCard: {
        backgroundColor: '#F7F7F7',
        borderRadius: 35,
        padding: 24,
        marginTop: 20,
    },
    creatorInputContainer: {
        backgroundColor: '#FFF',
        borderRadius: 25,
        height: 55,
        paddingHorizontal: 20,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    creatorInput: {
        fontSize: 18,
        color: '#000',
        fontFamily: Typography.metropolis.semiBold,
    },
    optionalText: {
        color: '#888',
        fontFamily: Typography.metropolis.medium,
        fontSize: 14,
    },
});
