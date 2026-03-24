import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import PhonkText from '../PhonkText';
import GiftCardCheckout from './GiftCardCheckout';

type Brand = {
    id: string;
    name: string;
    logo: string | null;
    backgroundColor?: string;
    loyalty?: number[];
};

type RedeemGiftCardProps = {
    brand: Brand;
    onBack: () => void;
    maxLimit: number;
    currency: string;
    onSuccess?: () => void;
};


export default function RedeemGiftCard({
    brand,
    onBack,
    maxLimit,
    currency,
    onSuccess,
}: RedeemGiftCardProps) {
    const amounts = brand.loyalty && brand.loyalty.length > 0 ? brand.loyalty : [25, 50, 75];
    const [selectedAmount, setSelectedAmount] = useState(amounts[0]);
    const [showCheckout, setShowCheckout] = useState(false);

    if (showCheckout) {
        return (
            <GiftCardCheckout
                brand={brand}
                selectedAmount={selectedAmount}
                currency={currency}
                onBack={() => setShowCheckout(false)}
                onSuccess={onSuccess}
            />
        );
    }

    return (
        <View style={styles.container}>
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
                    <PhonkText style={styles.logoX}>X</PhonkText>
                    <PhonkText style={styles.logoCard}>CARD</PhonkText>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Main Card */}
                <View style={styles.mainCard}>
                    <Text style={styles.inStoreBadge}>In-store</Text>

                    <View style={styles.logoWrapper}>
                        <View style={[styles.brandLogoContainer, { backgroundColor: brand.backgroundColor || '#F0F0F0' }]}>
                            {brand.logo ? (
                                <Image source={{ uri: brand.logo }} style={styles.brandLogo} />
                            ) : (
                                <Text style={styles.brandLogoPlaceholder}>
                                    {brand.name.charAt(0)}
                                </Text>
                            )}
                        </View>
                    </View>

                    <Text style={styles.brandName}>{brand.name}</Text>

                    <View style={styles.generateGiftCardWrapper}>
                        <PhonkText style={styles.generateText}>GENERATE</PhonkText>
                        <PhonkText style={styles.giftCardText}>GIFT CARD</PhonkText>
                    </View>

                    <View style={styles.selectedAmountContainer}>
                        <PhonkText style={styles.selectedAmountText}>
                            {currency} {selectedAmount.toFixed(2)}
                        </PhonkText>
                    </View>
                </View>

                {/* Amount Selection */}
                <View style={styles.selectionSection}>
                    {/* MAX LIMIT label removed */}

                    <View style={styles.amountOptions}>
                        {amounts.map((amount) => (
                            <TouchableOpacity
                                key={amount}
                                style={[
                                    styles.amountOption,
                                    selectedAmount === amount && styles.amountOptionSelected,
                                ]}
                                onPress={() => setSelectedAmount(amount)}
                            >
                                <PhonkText style={[
                                    styles.amountOptionText,
                                    selectedAmount === amount && styles.amountOptionTextSelected,
                                ]}>
                                    {currency} {amount.toFixed(2)}
                                </PhonkText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Insufficient Balance Warning */}
                {selectedAmount > maxLimit && (
                    <View style={styles.insufficientContainer}>
                        <Ionicons name="alert-circle" size={18} color="#E53935" />
                        <Text style={styles.insufficientText}>
                            Insufficient balance. You need {currency} {selectedAmount.toFixed(2)} but only have {currency} {maxLimit.toFixed(2)}.
                        </Text>
                    </View>
                )}

                {/* Redeem Button */}
                <TouchableOpacity
                    style={[styles.redeemButton, selectedAmount > maxLimit && styles.redeemButtonDisabled]}
                    activeOpacity={0.8}
                    onPress={() => setShowCheckout(true)}
                    disabled={selectedAmount > maxLimit}
                >
                    <Ionicons name="flash" size={20} color="#FFFFFF" style={styles.redeemIcon} />
                    <PhonkText style={styles.redeemButtonText}>REDEEM</PhonkText>
                </TouchableOpacity>

                {/* T&C */}
                <TouchableOpacity style={styles.tcButton}>
                    <Ionicons name="information-circle-outline" size={18} color="#999999" />
                    <Text style={styles.tcButtonText}>View T&C</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
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
    mainCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 40,
        padding: 30,
        alignItems: 'center',
        marginTop: 40,
        position: 'relative',
    },
    inStoreBadge: {
        position: 'absolute',
        top: 30,
        left: 30,
        fontSize: 14,
        color: '#999999',
        fontFamily: Typography.poppins.medium,
    },
    logoWrapper: {
        marginTop: -70, // Offset to make logo pop out
        padding: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    brandLogoContainer: {
        width: 100,
        height: 100,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    brandLogo: {
        width: '100%',
        height: '100%',
    },
    brandLogoPlaceholder: {
        fontSize: 40,
        fontFamily: Typography.poppins.semiBold,
        color: '#FFFFFF',
    },
    brandName: {
        fontSize: 18,
        fontFamily: Typography.poppins.medium,
        color: '#000000',
        marginTop: 16,
    },
    generateGiftCardWrapper: {
        alignItems: 'center',
        marginTop: 12,
    },
    generateText: {
        fontSize: 28,
        color: '#000000',
        lineHeight: 32,
    },
    giftCardText: {
        fontSize: 28,
        color: Colors.brandGreen,
        lineHeight: 32,
    },
    selectedAmountContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 30,
        marginTop: 30,
        width: '100%',
        alignItems: 'center',
    },
    selectedAmountText: {
        fontSize: 24,
        color: '#000000',
    },
    selectionSection: {
        marginTop: 30,
    },
    amountOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    amountOption: {
        flex: 1,
        height: 56,
        backgroundColor: '#F8F9FA',
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    amountOptionSelected: {
        backgroundColor: '#FFFFFF',
        borderColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    amountOptionText: {
        fontSize: 14,
        color: '#666666',
    },
    amountOptionTextSelected: {
        color: '#000000',
    },
    redeemButton: {
        backgroundColor: Colors.brandGreen,
        height: 60,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
    },
    redeemButtonDisabled: {
        opacity: 0.4,
    },
    insufficientContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        borderRadius: 12,
        padding: 12,
        marginTop: 16,
        gap: 8,
    },
    insufficientText: {
        flex: 1,
        fontSize: 13,
        fontFamily: Typography.poppins.medium,
        color: '#E53935',
    },
    redeemIcon: {
        marginRight: 10,
    },
    redeemButtonText: {
        fontSize: 18,
        color: '#FFFFFF',
    },
    tcButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        paddingVertical: 10,
    },
    tcButtonText: {
        fontSize: 13,
        fontFamily: Typography.poppins.medium,
        color: '#999999',
        marginLeft: 6,
    },
});
