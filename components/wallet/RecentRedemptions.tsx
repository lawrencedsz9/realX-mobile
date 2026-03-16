import { getAuth } from '@react-native-firebase/auth';
import { collection, doc, getDoc, getFirestore, limit, onSnapshot, orderBy, query, where } from '@react-native-firebase/firestore';
import { FlashList } from '@shopify/flash-list';
import { useEffect, useState } from 'react';
import { ActivityIndicator, I18nManager, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import RedemptionItem, { RedemptionData } from './RedemptionItem';

const LOGO_COLORS = ['#3D5A80', '#C41E3A', '#8B4513', '#2A9D8F', '#E76F51', '#E9C46A'];

export default function RecentRedemptions() {
    const [redemptions, setRedemptions] = useState<RedemptionData[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();
    const isRTL = I18nManager.isRTL;

    useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
            setLoading(false);
            return;
        }

        const db = getFirestore();
        const q = query(
            collection(db, 'transactions'),
            where('userId', '==', user.uid),
            where('type', '==', 'giftcard_redemption'),
            orderBy('createdAt', 'desc'),
            limit(3)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const db = getFirestore();
            const formattedData: RedemptionData[] = await Promise.all(snapshot.docs.map(async (snapshotDoc: any) => {
                const data = snapshotDoc.data();

                let dateStr = '';
                if (data.createdAt) {
                    const date = new Date(data.createdAt.seconds * 1000);
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    dateStr = `${day}/${month}/${year}`;
                }

                const vendorName = data.vendorName || t('unknown_vendor');
                const charCode = vendorName.charCodeAt(0) || 0;
                const color = LOGO_COLORS[charCode % LOGO_COLORS.length];

                let logoUrl = null;
                if (data.vendorId) {
                    try {
                        const vendorDoc = await getDoc(doc(db, 'vendors', data.vendorId));
                        if (vendorDoc.exists()) {
                            const vendorData = vendorDoc.data();
                            logoUrl = vendorData?.profilePicture || vendorData?.logoUrl || vendorData?.imageUrl || null;
                        }
                    } catch (error) {
                        console.warn(`Error fetching vendor logo for ${data.vendorId}:`, error);
                    }
                }

                return {
                    id: snapshotDoc.id,
                    merchantName: vendorName,
                    date: dateStr,
                    offerType: t('gift_card'),
                    savedAmount: data.redemptionCardAmount || 0,
                    totalBill: data.totalAmount || 0,
                    remainingToPay: data.remainingAmount || 0,
                    currency: 'QR',
                    logoBackgroundColor: color,
                    logoUrl: logoUrl,
                };
            }));

            setRedemptions(formattedData);
            setLoading(false);
        }, (err) => {
            console.warn('RecentRedemptions fetch error:', err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [t]);

    const renderItem = ({ item }: { item: RedemptionData }) => (
        <RedemptionItem item={item} />
    );

    const renderSeparator = () => <View style={styles.separator} />;

    if (loading) {
        return (
            <View style={styles.container}>
                <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {t('recent_redemptions')}
                </Text>
                <ActivityIndicator
                    size="small"
                    color={Colors.brandGreen}
                    style={styles.loader}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t('recent_redemptions')}
            </Text>
            {redemptions.length > 0 ? (
                <FlashList
                    data={redemptions}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    ItemSeparatorComponent={renderSeparator}
                    scrollEnabled={false}
                    contentContainerStyle={styles.listContent}
                />
            ) : (
                <Text style={[styles.emptyText, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {t('no_recent_redemptions')}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingTop: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: Typography.metropolis.semiBold,
        color: Colors.light.text,
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    listContent: {
        backgroundColor: '#FFFFFF',
    },
    separator: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginLeft: 84,
    },
    emptyText: {
        fontSize: 14,
        fontFamily: Typography.metropolis.medium,
        color: '#999999',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    loader: {
        paddingTop: 20,
    },
});
