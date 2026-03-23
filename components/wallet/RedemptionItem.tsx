import { I18nManager, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

export type RedemptionData = {
    id: string;
    merchantName: string;
    date: string;
    offerType: string;
    savedAmount: number;
    totalBill: number;
    remainingToPay: number;
    currency: string;
    logoPlaceholder?: string;
    logoBackgroundColor?: string;
    logoUrl?: string | null;
};

type Props = {
    item: RedemptionData;
};

export default function RedemptionItem({ item }: Props) {
    const isRTL = I18nManager.isRTL;

    return (
        <View style={[styles.container, isRTL && styles.containerRTL]}>
            {/* Merchant Logo */}
            <View style={[
                styles.logoContainer,
                { backgroundColor: item.logoBackgroundColor || '#F5F5F5' },
                isRTL ? { marginLeft: 14 } : { marginRight: 14 },
            ]}>
                {item.logoUrl ? (
                    <Image source={{ uri: item.logoUrl }} style={styles.logoImage} />
                ) : (
                    <Text style={styles.logoText}>
                        {item.logoPlaceholder || item.merchantName.substring(0, 2).toUpperCase()}
                    </Text>
                )}
            </View>

            {/* Merchant Info */}
            <View style={styles.infoContainer}>
                <Text style={[styles.dateText, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {item.date}
                </Text>
                <Text style={[styles.merchantName, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {item.merchantName}
                </Text>
                <Text style={[styles.offerType, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {item.offerType}
                </Text>
            </View>

            {/* Saved Amount */}
            <View style={[styles.savedContainer, isRTL && { alignItems: 'flex-start' }]}>
                <Text style={styles.savedLabel}>
                    {item.savedAmount.toFixed(2)} {item.currency}
                </Text>
                <Text style={styles.totalBillText}>
                    of {item.totalBill.toFixed(2)} {item.currency}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
    },
    containerRTL: {
        flexDirection: 'row-reverse',
    },
    logoContainer: {
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 12,
        fontFamily: Typography.poppins.semiBold,
        color: '#FFFFFF',
    },
    logoImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    infoContainer: {
        flex: 1,
    },
    dateText: {
        fontSize: 11,
        fontFamily: Typography.poppins.medium,
        color: '#999999',
        marginBottom: 2,
    },
    merchantName: {
        fontSize: 16,
        fontFamily: Typography.poppins.semiBold,
        color: Colors.light.text,
        marginBottom: 2,
    },
    offerType: {
        fontSize: 12,
        fontFamily: Typography.poppins.medium,
        color: '#666666',
    },
    savedContainer: {
        alignItems: 'flex-end',
    },
    savedLabel: {
        fontSize: 18,
        fontFamily: Typography.poppins.semiBold,
        color: Colors.brandGreen,
        marginBottom: 2,
    },
    totalBillText: {
        fontSize: 11,
        fontFamily: Typography.poppins.medium,
        color: '#999999',
    },
});
