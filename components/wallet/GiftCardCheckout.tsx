import { Ionicons } from '@expo/vector-icons';
import { getAuth } from '@react-native-firebase/auth';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { Image } from 'expo-image';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    I18nManager,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import PhonkText from '../PhonkText';
import { triggerSubtleHaptic } from '../../utils/haptics';
import { showLocalNotification } from '../../utils/notifications';
import { useTranslation } from 'react-i18next';

type Brand = {
    id: string;
    name: string;
    logo: string | null;
    backgroundColor?: string;
};

type GiftCardCheckoutProps = {
    brand: Brand;
    selectedAmount: number;
    currency: string;
    onBack: () => void;
    onSuccess?: () => void;
};

export default function GiftCardCheckout({
    brand,
    selectedAmount,
    currency,
    onBack,
    onSuccess,
}: GiftCardCheckoutProps) {
    const [pin, setPin] = useState('');
    const [totalBill, setTotalBill] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);
    const pinInputRef = useRef<TextInput>(null);

    const totalBillNum = parseFloat(totalBill) || 0;
    const remainingAmount = Math.max(0, totalBillNum - selectedAmount);

    const canRedeem = pin.length === 4 && totalBillNum > 0;
    const { t } = useTranslation();
    const isRTL = I18nManager.isRTL;

    const handleRedeem = async () => {
        if (!canRedeem) return;
        triggerSubtleHaptic();

        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
            Alert.alert(t('error'), t('login_required_message'));
            return;
        }

        setIsRedeeming(true);
        try {
            const functions = getFunctions(undefined, 'me-central1');
            const redeemGiftCard = httpsCallable(functions, 'redeemGiftCard');

            await redeemGiftCard({
                vendorId: brand.id,
                vendorName: brand.name,
                giftCardAmount: selectedAmount,
                totalAmount: totalBillNum,
                pin,
            });

            const successMessage = t('redemption_success_message', {
                currency,
                amount: selectedAmount.toFixed(2),
            });

            // Show local notification for the gift card redemption
            showLocalNotification(
                t('redemption_success_title'),
                successMessage,
                { type: 'giftcard_redemption' }
            );

            Alert.alert(
                t('redemption_success_title'),
                t('redemption_success_message', {
                    currency,
                    amount: selectedAmount.toFixed(2),
                }),
                [
                    {
                        text: t('done'),
                        onPress: () => onSuccess?.(),
                    },
                ]
            );
        } catch (error: any) {
            console.error('Gift card redemption error:', error);
            Alert.alert(
                t('redemption_failed_title'),
                error.message || t('redemption_failed_message')
            );
        } finally {
            setIsRedeeming(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header */}
            <View style={[styles.header, isRTL && styles.headerRTL]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        triggerSubtleHaptic();
                        onBack();
                    }}
                    activeOpacity={0.7}
                >
                    <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color="#000000" />
                </TouchableOpacity>
                <View style={styles.logoContainer}>
                    <PhonkText style={styles.logoX}>X</PhonkText>
                    <PhonkText style={styles.logoCard}>CARD</PhonkText>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Gift Card Display Card */}
                <View style={styles.offerCardWrapper}>
                    <View style={styles.offerCard}>
                        <TouchableOpacity
                            style={[styles.tcButton, isRTL && styles.tcButtonRTL]}
                            onPress={() => triggerSubtleHaptic()}
                        >
                            <Ionicons name="information-circle-outline" size={18} color="#888" />
                            <Text style={[styles.tcText, isRTL && styles.tcTextRTL]}>
                                {t('view_tc')}
                            </Text>
                        </TouchableOpacity>

                        <PhonkText style={styles.offerTitle}>
                            {selectedAmount.toFixed(2)}
                            <Text style={styles.greenText}>{currency}</Text>
                        </PhonkText>
                        <PhonkText style={styles.offerSubtitleLabel}>{t('gift_card_text')}</PhonkText>
                        <Text style={styles.offerSubtitle}>{t('in_store_badge')}</Text>
                    </View>

                    {/* Logo Overlay */}
                    <View style={styles.brandLogoOverlay}>
                        <View style={[styles.brandLogoInner, { backgroundColor: brand.backgroundColor || '#1E2A38' }]}>
                            {brand.logo ? (
                                <Image source={{ uri: brand.logo }} style={styles.brandLogoImage} contentFit="contain" />
                            ) : (
                                <Text style={styles.brandLogoPlaceholder}>
                                    {brand.name.charAt(0)}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Redemption Card */}
                <View style={styles.redemptionCard}>
                    {/* PIN Entry */}
                    <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {t('enter_vendor_pin')}
                    </Text>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[styles.pinContainer, isRTL && styles.pinContainerRTL]}
                        onPress={() => {
                            triggerSubtleHaptic();
                            pinInputRef.current?.focus();
                        }}
                    >
                        {[0, 1, 2, 3].map((index) => (
                            <View key={index} style={styles.pinBox}>
                                <Text style={[styles.pinText, pin.length > index && { color: '#000', marginTop: 0 }]}>
                                    {pin.length > index ? '●' : '*'}
                                </Text>
                            </View>
                        ))}
                    </TouchableOpacity>

                    <TextInput
                        ref={pinInputRef}
                        style={{ position: 'absolute', opacity: 0, height: 0, width: 0 }}
                        value={pin}
                        onChangeText={(text) => {
                            if (text.length <= 4) setPin(text);
                        }}
                        keyboardType="numeric"
                    />

                    {/* Total Bill */}
                    <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {t('total_bill')}
                    </Text>
                    <View style={[styles.amountInputContainer, isRTL && styles.amountInputContainerRTL]}>
                        <Text style={[styles.currencyPrefix, isRTL && styles.currencyPrefixRTL]}>
                            {currency}
                        </Text>
                        <TextInput
                            style={[styles.amountInput, { textAlign: isRTL ? 'right' : 'left' }]}
                            value={totalBill}
                            onChangeText={setTotalBill}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#CCC"
                        />
                    </View>

                    {/* Breakdown */}
                    {totalBillNum > 0 && (
                        <View style={styles.breakdownContainer}>
                            <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>{t('total_bill')}</Text>
                                <Text style={styles.breakdownValue}>
                                    {currency} {totalBillNum.toFixed(2)}
                                </Text>
                            </View>
                            <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabelGreen}>{t('gift_card_redeemed_label')}</Text>
                                <Text style={styles.breakdownValueGreen}>
                                    − {currency} {Math.min(selectedAmount, totalBillNum).toFixed(2)}
                                </Text>
                            </View>
                            <View style={styles.breakdownDivider} />
                            <View style={styles.breakdownRow}>
                                <Text style={styles.breakdownLabelBold}>{t('amount_to_pay_label')}</Text>
                                <PhonkText style={styles.breakdownValueBold}>
                                    {currency} {remainingAmount.toFixed(2)}
                                </PhonkText>
                            </View>
                        </View>
                    )}
                </View>

                {/* Spacer */}
                <View style={{ height: 20 }} />

                {/* Redeem Button */}
                <TouchableOpacity
                    style={[styles.redeemButton, !canRedeem && styles.redeemButtonDisabled]}
                    activeOpacity={0.9}
                    onPress={handleRedeem}
                    disabled={!canRedeem || isRedeeming}
                >
                    {isRedeeming ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="flash" size={20} color="#FFF" />
                            <PhonkText style={styles.redeemButtonText}>{t('redeem_button_text')}</PhonkText>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerRTL: {
        flexDirection: 'row-reverse',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoX: {
        fontSize: 24,
        color: Colors.brandGreen,
    },
    logoCard: {
        fontSize: 24,
        color: '#000000',
    },
    headerSpacer: {
        width: 40,
    },
    scrollContent: {
        paddingHorizontal: 24,
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
    tcButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    tcButtonRTL: {
        right: undefined,
        left: 20,
        flexDirection: 'row-reverse',
    },
    tcText: {
        fontSize: 14,
        color: '#888',
        fontFamily: Typography.poppins.semiBold,
    },
    tcTextRTL: {
        marginLeft: 0,
        marginRight: 4,
    },
    offerTitle: {
        fontSize: 32,
        color: '#00',
        textAlign: 'center',
    },
    greenText: {
        color: Colors.brandGreen,
    },
    offerSubtitleLabel: {
        fontSize: 28,
        color: Colors.brandGreen,
        marginTop: 2,
    },
    offerSubtitle: {
        fontSize: 16,
        color: '#888',
        fontFamily: Typography.poppins.medium,
        marginTop: 4,
    },
    brandLogoOverlay: {
        position: 'absolute',
        top: -50,
        alignSelf: 'center',
        width: 100,
        height: 100,
        borderRadius: 25,
        backgroundColor: '#FFFFFF',
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
    brandLogoInner: {
        width: '100%',
        height: '100%',
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    brandLogoImage: {
        width: '60%',
        height: '60%',
    },
    brandLogoPlaceholder: {
        fontSize: 40,
        fontFamily: Typography.poppins.semiBold,
        color: '#FFFFFF',
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
        fontFamily: Typography.poppins.semiBold,
        marginBottom: 12,
    },
    pinContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    pinContainerRTL: {
        flexDirection: 'row-reverse',
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
    },
    pinText: {
        fontSize: 30,
        color: '#E0E0E0',
        fontFamily: Typography.poppins.medium,
        marginTop: 10,
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
    amountInputContainerRTL: {
        flexDirection: 'row-reverse',
    },
    currencyPrefix: {
        fontSize: 16,
        color: '#AAA',
        fontFamily: Typography.poppins.semiBold,
        marginRight: 10,
    },
    currencyPrefixRTL: {
        marginLeft: 10,
        marginRight: 0,
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
        fontSize: 18,
        color: '#000',
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
});
