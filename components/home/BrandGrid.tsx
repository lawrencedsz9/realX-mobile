import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, I18nManager, ScrollView, StyleSheet, Text, TextStyle, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import PhonkText from '../PhonkText';
import { triggerSubtleHaptic } from '../../utils/haptics';
import { useTranslation } from 'react-i18next';

type BrandItem = {
    id: string;
    name: string;
    logoUrl: string;
    vendorId: string;
    isActive: boolean;
};

export default function BrandGrid() {
    const { t } = useTranslation();
    const isRTL = I18nManager.isRTL;
    const [brands, setBrands] = useState<BrandItem[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const displayedBrands = useMemo(() => (isRTL ? [...brands].reverse() : brands), [brands, isRTL]);
    const brandLabelPrefix = t('brand_header_prefix');
    const brandLabelHighlight = t('brand_header_highlight');

    useEffect(() => {
        const fetchBrands = async () => {
            try {
                const db = getFirestore();
                const brandsDocRef = doc(db, 'cms', 'brand');
                const brandsSnap = await getDoc(brandsDocRef);

                if (brandsSnap.exists()) {
                    const data = brandsSnap.data();
                    const activeBrands = (data?.brands || [])
                        .filter((b: any) => b.isActive)
                        .map((b: any) => ({
                            id: b.id,
                            name: b.name,
                            logoUrl: b.logoUrl,
                            vendorId: b.vendorId,
                            isActive: b.isActive,
                        })) as BrandItem[];
                    setBrands(activeBrands);
                }
            } catch (error) {
                console.error('Error fetching brands:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBrands();
    }, []);

    const handlePress = (brand: BrandItem) => {
        triggerSubtleHaptic();
        router.push(`/vendor/${brand.vendorId}`);
    };

    // Split brands into rows: ≤4 = 1 row, 5-8 = 2 rows, >8 = 2 scrollable rows
    const { row1, row2, needsScroll, isSingleRow } = useMemo(() => {
        const count = displayedBrands.length;
        if (count <= 4) {
            return { row1: displayedBrands, row2: [], needsScroll: false, isSingleRow: true };
        }
        if (count <= 8) {
            const mid = Math.ceil(count / 2);
            return {
                row1: displayedBrands.slice(0, mid),
                row2: displayedBrands.slice(mid),
                needsScroll: false,
                isSingleRow: false,
            };
        }
        // >8: evenly distribute across 2 scrollable rows
        const mid = Math.ceil(count / 2);
        return {
            row1: displayedBrands.slice(0, mid),
            row2: displayedBrands.slice(mid),
            needsScroll: true,
            isSingleRow: false,
        };
    }, [displayedBrands]);

    const renderBrand = (brand: BrandItem) => (
        <TouchableOpacity
            key={brand.id}
            style={styles.brandItem}
            activeOpacity={0.7}
            onPress={() => handlePress(brand)}
        >
            <Image
                source={{ uri: brand.logoUrl }}
                style={styles.imageContainer}
                contentFit="contain"
                cachePolicy="memory-disk"
            />
        </TouchableOpacity>
    );

    const renderRow = (items: BrandItem[], scrollable: boolean) => {
        if (scrollable) {
            return (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollContent, { flexDirection: 'row' }]}
                >
                    {items.map(renderBrand)}
                </ScrollView>
            );
        }
        return (
            <View style={styles.staticRow}>
                {items.map(renderBrand)}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[ styles.loaderContainer]}>
                <ActivityIndicator size="small" color={Colors.brandGreen} />
            </View>
        );
    }

    if (displayedBrands.length === 0) {
        return null;
    }

    return (
        <View>
            <View style={styles.headerContainer}>
                <View style={styles.headerTitle}>
                    <PhonkText style={[styles.shopByText, { writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
                        {brandLabelPrefix}
                    </PhonkText>
                    <PhonkText style={[styles.brandText, { writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
                        {brandLabelHighlight}
                    </PhonkText>
                </View>
            </View>
            {renderRow(row1, needsScroll)}
            {!isSingleRow && renderRow(row2, needsScroll)}
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    headerTitle: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    shopByText: {
        fontSize: 20,
        color: Colors.light.text,
        letterSpacing: 1,
    },
    brandText: {
        fontSize: 20,
        color: Colors.brandGreen,
        fontStyle: 'italic',
        letterSpacing: 1,
    },
    loaderContainer: {
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 14,
    },
    staticRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        gap: 14,
    },
    brandItem: {
        alignItems: 'center',
    },
    imageContainer: {
        width: 64,
        height: 64,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
});
