import { Ionicons } from '@expo/vector-icons';
import { getAuth } from '@react-native-firebase/auth';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { Image } from 'expo-image';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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

    const handleRedeem = async () => {
        if (!canRedeem) return;

        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
            Alert.alert('Error', 'You must be logged in to redeem.');
            return;
        }

        setIsRedeeming(true);
        try {
            const functions = getFunctions();
            const redeemGiftCard = httpsCallable(functions, 'redeemGiftCard');

            const result = await redeemGiftCard({
                vendorId: brand.id,
                vendorName: brand.name,
                giftCardAmount: selectedAmount,
                totalBill: totalBillNum,
                pin,
            });

            const data = result.data as any;

            Alert.alert(
                'Redemption successful!',
                `You saved ${selectedAmount} qar`,
                [
                    {
                        text: 'Done',
                        onPress: () => onSuccess?.(),
                    },
                ]
            );
        } catch (error: any) {
            console.error('Gift card redemption error:', error);
            Alert.alert(
                'Redemption Failed',
                error.message || 'Something went wrong. Please try again.'
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
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={onBack}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color="#000000" />
                </TouchableOpacity>
                <View style={styles.logoContainer}>
                    <Text style={styles.logoX}>X</Text>
                    <Text style={styles.logoCard}>CARD</Text>
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
                        <TouchableOpacity style={styles.tcButton}>
                            <Ionicons name="information-circle-outline" size={18} color="#888" />
                            <Text style={styles.tcText}>View T&C</Text>
                        </TouchableOpacity>

                        <Text style={styles.offerTitle}>
                            {selectedAmount}
                            <Text style={styles.greenText}>{currency}</Text>
                        </Text>
                        <Text style={styles.offerSubtitleLabel}>Gift Card</Text>
                        <Text style={styles.offerSubtitle}>In-store</Text>
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
                    <Text style={styles.inputLabel}>Enter Vendor PIN:</Text>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.pinContainer}
                        onPress={() => pinInputRef.current?.focus()}
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
                    <Text style={styles.inputLabel}>Total Bill:</Text>
                    <View style={styles.amountInputContainer}>
                        <Text style={styles.currencyPrefix}>{currency}</Text>
                        <TextInput
                            style={styles.amountInput}
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
                                <Text style={styles.breakdownLabel}>Total Bill</Text>
                                <Text style={styles.breakdownValue}>
                                    {currency} {totalBillNum.toFixed(2)}
                                </Text>
                            </View>
                            <View style={styles.breakdownRow}>
                                <Text style={styles.breakdownLabelGreen}>Gift Card Redeemed</Text>
                                <Text style={styles.breakdownValueGreen}>
                                    − {currency} {Math.min(selectedAmount, totalBillNum).toFixed(2)}
                                </Text>
                            </View>
                            <View style={styles.breakdownDivider} />
                            <View style={styles.breakdownRow}>
                                <Text style={styles.breakdownLabelBold}>Remaining Amount</Text>
                                <Text style={styles.breakdownValueBold}>
                                    {currency} {remainingAmount.toFixed(2)}
                                </Text>
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
                            <Text style={styles.redeemButtonText}>REDEEM</Text>
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
        fontFamily: Typography.integral.bold,
        color: Colors.brandGreen,
    },
    logoCard: {
        fontSize: 24,
        fontFamily: Typography.integral.bold,
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
    tcText: {
        fontSize: 14,
        color: '#888',
        fontFamily: Typography.metropolis.semiBold,
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
    offerSubtitleLabel: {
        fontSize: 28,
        fontFamily: Typography.integral.bold,
        color: Colors.brandGreen,
        marginTop: 2,
    },
    offerSubtitle: {
        fontSize: 16,
        color: '#888',
        fontFamily: Typography.metropolis.medium,
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
        fontFamily: Typography.metropolis.semiBold,
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
        fontFamily: Typography.metropolis.semiBold,
        marginBottom: 12,
    },
    pinContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
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
        fontFamily: Typography.metropolis.medium,
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
    currencyPrefix: {
        fontSize: 16,
        color: '#AAA',
        fontFamily: Typography.metropolis.semiBold,
        marginRight: 10,
    },
    amountInput: {
        flex: 1,
        fontSize: 18,
        color: '#000',
        fontFamily: Typography.metropolis.semiBold,
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
    redeemButtonDisabled: {
        opacity: 0.5,
    },
    redeemButtonText: {
        color: '#FFF',
        fontSize: 22,
        fontFamily: Typography.integral.bold,
        letterSpacing: 1,
    },
});
