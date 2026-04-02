import Ionicons from '@expo/vector-icons/Ionicons';
import { getAuth } from '@react-native-firebase/auth';
import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    I18nManager,
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
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import PhonkText from '../../components/PhonkText';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { triggerSubtleHaptic } from '../../utils/haptics';
import { normalizeDigits } from '../../utils/numbers';

// Types for better type safety
interface VendorData {
    profilePicture?: string;
    name?: string;
    nameAr?: string;
    xcard?: boolean;
    pin?: string;
    [key: string]: any;
}

interface OfferData {
    discountValue?: string | number;
    discountType?: string;
    vendorId?: string;
    titleEn?: string;
    titleAr?: string;
    [key: string]: any;
}

export default function RedeemScreen() {
    const { id, vendorId } = useLocalSearchParams<{ id: string; vendorId: string }>();
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';
    const [vendor, setVendor] = useState<VendorData | null>(null);
    const [offer, setOffer] = useState<OfferData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [resolvedVendorId, setResolvedVendorId] = useState<string>('');

    // Step: 'creator' only shown for xcard vendors, otherwise start at 'pin'
    const [step, setStep] = useState<'creator' | 'pin'>('pin');
    const [creatorCode, setCreatorCode] = useState('');
    const [pin, setPin] = useState('');
    const [amount, setAmount] = useState('');

    const pinInputRef = useRef<TextInput>(null);
    const amountInputRef = useRef<TextInput>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            if (!id) return;
            try {
                const db = getFirestore();

                // Fetch Offer first to get vendorId if not provided
                const offerRef = doc(db, 'offers', id);
                const offerSnap = await getDoc(offerRef);

                let currentVendorId = vendorId;

                if (offerSnap.exists() && isMounted) {
                    const offerData = offerSnap.data() as OfferData;
                    setOffer(offerData);

                    // If vendorId was not provided, use the one from the offer document
                    if (!currentVendorId && offerData.vendorId) {
                        currentVendorId = offerData.vendorId;
                    }
                }

                if (currentVendorId) {
                    setResolvedVendorId(currentVendorId);

                    // Fetch Vendor
                    const vendorRef = doc(db, 'vendors', currentVendorId);
                    const vendorSnap = await getDoc(vendorRef);
                    if (vendorSnap.exists() && isMounted) {
                        const vendorData = vendorSnap.data() as VendorData;
                        setVendor(vendorData);

                        // If vendor has xcard enabled, start with creator code step
                        if (vendorData.xcard === true) {
                            setStep('creator');
                        }
                    }
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

    // Discount calculation
    const totalAmount = parseFloat(normalizeDigits(amount)) || 0;
    const discountValue = Number(offer?.discountValue) || 0;
    const discountType = offer?.discountType || 'percentage';

    let discountAmount = 0;
    if (discountType === 'percentage') {
        discountAmount = totalAmount * (discountValue / 100);
    } else {
        discountAmount = Math.min(discountValue, totalAmount);
    }
    const finalAmount = Math.max(0, totalAmount - discountAmount);

    const canRedeem = pin.length === 4 && totalAmount > 0;

    const handleRedeem = async () => {
        if (!canRedeem) return;

        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
            Alert.alert(t('error'), t('login_required_message'));
            return;
        }

        setIsRedeeming(true);
        try {
            const functions = getFunctions(undefined, 'me-central1');
            const redeemOffer = httpsCallable(functions, 'redeemOffer');

            const result = await redeemOffer({
                offerId: id,
                vendorId: resolvedVendorId,
                vendorName: (isArabic ? (vendor?.nameAr || vendor?.name) : vendor?.name) || '',
                totalAmount,
                pin: normalizeDigits(pin),
                creatorCode: creatorCode ? normalizeDigits(creatorCode).trim() : undefined,
                discountValue,
                discountType,
            });

            const data = result.data as any;

            const currency = t('currency_qar');
            const savedAmount = data.discountAmount?.toFixed(2) || discountAmount.toFixed(2);
            let message = t('you_saved_success_message', { currency, amount: savedAmount });
            
            if (data.cashbackAmount > 0) {
                message += `\n${t('cashback_earned_success_message', { currency, amount: data.cashbackAmount.toFixed(2) })}`;
            }

            Alert.alert(
                t('redemption_successful_title'),
                message,
                [
                    {
                        text: t('done'),
                        onPress: () => router.replace('/'),
                    },
                ]
            );
        } catch (error: any) {
            console.error('Offer redemption error:', error);
            Alert.alert(
                t('redemption_failed_title'),
                error.message || t('redemption_failed_message')
            );
        } finally {
            setIsRedeeming(false);
        }
    };

    const handleAction = () => {
        triggerSubtleHaptic();
        if (step === 'creator') {
            setStep('pin');
            setTimeout(() => {
                pinInputRef.current?.focus();
            }, 300);
        } else {
            Keyboard.dismiss();

            const normalizedPin = normalizeDigits(pin);
            const normalizedAmount = normalizeDigits(amount);

            if (normalizedPin.length !== 4) {
                Alert.alert(t('hold_on'), t('enter_4_digit_pin'));
                return;
            }
            if (!normalizedAmount || isNaN(Number(normalizedAmount)) || Number(normalizedAmount) <= 0) {
                Alert.alert(t('hold_on'), t('enter_valid_amount'));
                return;
            }

            handleRedeem();
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
                <Text style={styles.errorText}>{t('redemption_info_not_found')}</Text>
                <TouchableOpacity
                    onPress={() => {
                        triggerSubtleHaptic();
                        router.back();
                    }}
                >
                    <Text style={styles.backLink}>{t('go_back')}</Text>
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
                                    triggerSubtleHaptic();
                                    if (step === 'pin' && vendor.xcard === true) {
                                        setStep('creator');
                                        Keyboard.dismiss();
                                    } else {
                                        router.back();
                                    }
                                }}
                            >
                                <Ionicons name={isArabic ? "arrow-forward" : "arrow-back"} size={24} color="#000" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Offer Card */}
                            <View style={styles.offerCardWrapper}>
                                <View style={styles.offerCard}>
                                    <PhonkText style={[styles.offerTitle, { writingDirection: isArabic ? 'rtl' : 'ltr' }]}>
                                        {t('flat_off_prefix')}<Text style={styles.greenText}>
                                            {offer.discountValue}{offer.discountType === 'percentage' ? '%' : ''}
                                        </Text>{t('flat_off_suffix')}
                                    </PhonkText>
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

                            {/* Creator Code Step (xcard vendors only) */}
                            {step === 'creator' && (
                                <View style={styles.creatorCard}>
                                    <Text style={[styles.inputLabel, { textAlign: isArabic ? 'right' : 'left' }]}>
                                        {t('have_creator_code')} <Text style={styles.optionalText}>{t('optional')}</Text>
                                    </Text>
                                    <View style={[styles.creatorInputContainer, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
                                        <TextInput
                                            style={[styles.creatorInput, { textAlign: isArabic ? 'right' : 'left', writingDirection: isArabic ? 'rtl' : 'ltr' }]}
                                            value={creatorCode}
                                            onChangeText={(text) => setCreatorCode(normalizeDigits(text).toUpperCase())}
                                            placeholder={t('creator_code_placeholder')}
                                            placeholderTextColor="#CCC"
                                            autoCapitalize="characters"
                                            maxLength={6}
                                            returnKeyType="next"
                                            onSubmitEditing={handleAction}
                                            autoCorrect={false}
                                        />
                                    </View>
                                </View>
                            )}

                            {/* PIN + Amount Step */}
                            {step === 'pin' && (
                                <View style={styles.redemptionCard}>
                                    <Text style={[styles.inputLabel, { textAlign: isArabic ? 'right' : 'left' }]}>{t('enter_vendor_pin')}</Text>
                                    <View style={styles.pinContainer}>
                                        <TouchableOpacity
                                            activeOpacity={1}
                                            style={[styles.pinVisualContainer, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}
                                            onPress={() => {
                                                triggerSubtleHaptic();
                                                pinInputRef.current?.focus();
                                            }}
                                        >
                                            {[0, 1, 2, 3].map((index) => (
                                                <View key={index} style={[styles.pinBox, pin.length === index && styles.pinBoxActive]}>
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
                                            onChangeText={(text) => {
                                                const normalized = normalizeDigits(text);
                                                const numericText = normalized.replace(/[^0-9]/g, '');
                                                if (numericText.length <= 4) {
                                                    setPin(numericText);
                                                }
                                                if (numericText.length === 4) {
                                                    amountInputRef.current?.focus();
                                                }
                                            }}
                                            keyboardType="number-pad"
                                            maxLength={4}
                                            returnKeyType="done"
                                            onSubmitEditing={() => amountInputRef.current?.focus()}
                                        />
                                    </View>

                                    <Text style={[styles.inputLabel, { textAlign: isArabic ? 'right' : 'left' }]}>{t('total_bill')}:</Text>
                                    <View style={[styles.amountInputContainer, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
                                        <Text style={[styles.currencyPrefix, { writingDirection: isArabic ? 'rtl' : 'ltr' }]}>{t('currency_qar')}</Text>
                                        <TextInput
                                            ref={amountInputRef}
                                            style={[styles.amountInput, { textAlign: isArabic ? 'right' : 'left', writingDirection: isArabic ? 'rtl' : 'ltr' }]}
                                            value={amount}
                                            onChangeText={(text) => {
                                                const normalized = normalizeDigits(text);
                                                // Allow only digits and one decimal point
                                                const filtered = normalized.replace(/[^0-9.]/g, '');
                                                // Ensure only one dot
                                                const parts = filtered.split('.');
                                                const final = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : filtered;
                                                setAmount(final);
                                            }}
                                            keyboardType="decimal-pad"
                                            placeholder="0"
                                            placeholderTextColor="#CCC"
                                            returnKeyType="done"
                                            onSubmitEditing={handleAction}
                                        />
                                    </View>

                                    {/* Breakdown */}
                                    {totalAmount > 0 && (
                                        <View style={styles.breakdownContainer}>
                                            <View style={[styles.breakdownRow, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
                                                <Text style={[styles.breakdownLabel, { textAlign: isArabic ? 'right' : 'left' }]}>{t('total_bill')}</Text>
                                                <Text style={[styles.breakdownValue, { writingDirection: isArabic ? 'rtl' : 'ltr' }]}>
                                                    {t('amount_with_currency', { amount: totalAmount.toFixed(2), currency: t('currency_qar') })}
                                                </Text>
                                            </View>
                                            <View style={[styles.breakdownRow, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
                                                <Text style={[styles.breakdownLabelGreen, { textAlign: isArabic ? 'right' : 'left' }]}>
                                                    {t('home_title')} ({offer.discountValue}{offer.discountType === 'percentage' ? '%' : ''})
                                                </Text>
                                                <Text style={[styles.breakdownValueGreen, { writingDirection: isArabic ? 'rtl' : 'ltr' }]}>
                                                    {t('amount_with_currency_negative', { amount: discountAmount.toFixed(2), currency: t('currency_qar') })}
                                                </Text>
                                            </View>
                                            <View style={styles.breakdownDivider} />
                                            <View style={[styles.breakdownRow, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
                                                <Text style={[styles.breakdownLabelBold, { textAlign: isArabic ? 'right' : 'left' }]}>{t('amount_to_pay_label')}</Text>
                                                <PhonkText style={[styles.breakdownValueBold, { writingDirection: isArabic ? 'rtl' : 'ltr' }]}>
                                                    {t('amount_with_currency', { amount: finalAmount.toFixed(2), currency: t('currency_qar') })}
                                                </PhonkText>
                                            </View>
                                            {vendor.xcard === true && (
                                                <View style={[styles.breakdownRow, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
                                                    <Text style={[styles.cashbackLabel, { textAlign: isArabic ? 'right' : 'left' }]}>
                                                        {t('cashback_label_formatted', { percentage: 1 })}
                                                    </Text>
                                                    <Text style={[styles.cashbackValue, { writingDirection: isArabic ? 'rtl' : 'ltr' }]}>
                                                        {t('amount_with_currency_positive', { amount: (finalAmount * 0.01).toFixed(2), currency: t('currency_qar') })}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* Spacer to push button to bottom */}
                            <View style={{ flex: 1, minHeight: 20 }} />

                            {/* Action Button */}
                            <TouchableOpacity
                                style={[
                                    styles.redeemButton,
                                    step === 'pin' && !canRedeem && styles.redeemButtonDisabled,
                                ]}
                                activeOpacity={0.9}
                                onPress={handleAction}
                                disabled={(step === 'pin' && !canRedeem) || isRedeeming}
                            >
                                {isRedeeming ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <>
                                        <Ionicons name="flash" size={20} color="#FFF" />
                                        <PhonkText style={styles.redeemButtonText}>
                                            {step === 'creator' ? t('continue_caps') : t('redeem_caps')}
                                        </PhonkText>
                                    </>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
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
        fontFamily: Typography.poppins.medium,
        marginBottom: 10,
    },
    backLink: {
        color: Colors.brandGreen,
        fontFamily: Typography.poppins.semiBold,
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
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
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
        color: '#000',
        textAlign: 'center',
    },
    greenText: {
        color: Colors.brandGreen,
    },
    redemptionCard: {
        backgroundColor: '#F7F7F7',
        borderRadius: 35,
        padding: 24,
    },
    inputLabel: {
        fontSize: 16,
        color: '#444',
        fontFamily: Typography.poppins.semiBold,
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
        fontFamily: Typography.poppins.medium,
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
        fontFamily: Typography.poppins.semiBold,
        marginRight: 10,
    },
    amountInput: {
        flex: 1,
        fontSize: 18,
        color: '#000',
        fontFamily: Typography.poppins.semiBold,
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
        fontFamily: Typography.poppins.medium,
    },
    breakdownValue: {
        fontSize: 14,
        color: '#666',
        fontFamily: Typography.poppins.semiBold,
    },
    breakdownLabelGreen: {
        fontSize: 14,
        color: Colors.brandGreen,
        fontFamily: Typography.poppins.medium,
    },
    breakdownValueGreen: {
        fontSize: 14,
        color: Colors.brandGreen,
        fontFamily: Typography.poppins.semiBold,
    },
    breakdownDivider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 4,
    },
    breakdownLabelBold: {
        fontSize: 16,
        color: '#000',
        fontFamily: Typography.poppins.semiBold,
    },
    breakdownValueBold: {
        fontSize: 16,
        color: '#000',
    },
    cashbackLabel: {
        fontSize: 13,
        color: '#FF9800',
        fontFamily: Typography.poppins.medium,
    },
    cashbackValue: {
        fontSize: 13,
        color: '#FF9800',
        fontFamily: Typography.poppins.semiBold,
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
    redeemButtonDisabled: {
        opacity: 0.5,
    },
    redeemButtonText: {
        color: '#FFF',
        fontSize: 22,
        letterSpacing: 1,
    },
    creatorCard: {
        backgroundColor: '#F7F7F7',
        borderRadius: 35,
        padding: 24,
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
        fontFamily: Typography.poppins.semiBold,
    },
    optionalText: {
        color: '#888',
        fontFamily: Typography.poppins.medium,
        fontSize: 14,
    },
});
