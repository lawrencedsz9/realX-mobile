import { collection, getDocs, getFirestore, query, where } from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, I18nManager, ScrollView, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import PhonkText from '../PhonkText';
import RestaurantCard from '../category/RestaurantCard';
import { useTranslation } from 'react-i18next';

export default function TrendingOffers() {
    const { t } = useTranslation();
    const isRTL = I18nManager.isRTL;
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView | null>(null);
    const router = useRouter();
    const displayedOffers = useMemo(() => (isRTL ? [...offers].reverse() : offers), [offers, isRTL]);
    const trendingLabelPrefix = t('trending_label_prefix');
    const trendingLabelHighlight = t('trending_label_highlight');

    useEffect(() => {
        const fetchTrendingOffers = async () => {
            try {
                const db = getFirestore();
                const q = query(collection(db, 'vendors'), where('isTrending', '==', true));
                const snapshot = await getDocs(q);

                const fetchedResults: any[] = [];
                snapshot.docs.forEach((docSnap: any) => {
                    const vendorData = docSnap.data();
                    const vendorOffers = vendorData.offers || [];
                    vendorOffers.forEach((offer: any, index: number) => {
                        fetchedResults.push({
                            id: `${docSnap.id}_offer_${index}`,
                            vendorId: docSnap.id,
                            ...offer,
                            nameEn: vendorData.nameEn || vendorData.name,
                            nameAr: vendorData.nameAr || vendorData.nameAr,
                            vendorName: vendorData.name,
                            vendorNameAr: vendorData.nameAr,
                            shortDescription: vendorData.shortDescription,
                            shortDescriptionAr: vendorData.shortDescriptionAr || vendorData.shortDescriptionAR,
                            brandDescription: vendorData.brandDescription,
                            descriptionEn: vendorData.descriptionEn,
                            descriptionAr: vendorData.descriptionAr,
                            vendorProfilePicture: vendorData.profilePicture,
                            coverImage: vendorData.coverImage,
                            xcard: vendorData.xcard || false,
                            isTrending: true,
                        });
                    });
                });

                setOffers(fetchedResults);
            } catch (error) {
                console.error('Error fetching trending offers:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTrendingOffers();
    }, []);

    useEffect(() => {
        if (displayedOffers.length <= 1) {
            return;
        }

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % displayedOffers.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [displayedOffers.length]);

    useEffect(() => {
        if (!scrollViewRef.current || displayedOffers.length === 0) {
            return;
        }

        const cardWidth = 220;
        const gap = 12;
        const horizontalPadding = 20;
        const maxIndex = Math.max(0, displayedOffers.length - 1);
        const safeIndex = Math.min(currentIndex, maxIndex);
        const offset = horizontalPadding + safeIndex * (cardWidth + gap);

        scrollViewRef.current.scrollTo({ x: offset, animated: true });
    }, [currentIndex, displayedOffers.length]);

    const handleOfferPress = (offer: any) => {
        if (offer.vendorId) {
            router.push({ pathname: '/vendor/[id]', params: { id: offer.vendorId } });
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loaderContainer]}>
                <ActivityIndicator size="small" color={Colors.brandGreen} />
            </View>
        );
    }

    if (displayedOffers.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={styles.headerTitle}>
                    <PhonkText style={[styles.trendingText, { writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
                        {trendingLabelPrefix}
                    </PhonkText>
                    <PhonkText style={[styles.offersText, { writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
                        {trendingLabelHighlight}
                    </PhonkText>
                </View>
            </View>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { flexDirection: 'row' }]}
            >
                {displayedOffers.map((offer) => {
                    const name = isRTL
                        ? (offer.nameAr || offer.vendorNameAr || offer.nameEn || offer.vendorName || 'Vendor')
                        : (offer.nameEn || offer.vendorName || offer.nameAr || offer.vendorNameAr || 'Vendor');
                    const cashbackText = isRTL
                        ? (offer.shortDescriptionAr || offer.shortDescriptionAR || offer.descriptionAr || offer.brandDescription || '')
                        : (offer.shortDescription || offer.brandDescription || offer.descriptionEn || '');
                    const discountText = `${offer.discountValue || ''}${offer.discountType === 'percentage' ? '%' : ''} OFF`;

                    return (
                        <RestaurantCard
                            key={offer.id}
                            id={offer.id}
                            name={name}
                            cashbackText={cashbackText}
                            discountText={discountText}
                            isTrending={offer.isTrending}
                            isTopRated={offer.isTopRated}
                            imageUri={offer.coverImage || offer.bannerImage}
                            logoUri={offer.vendorProfilePicture || offer.profilePicture}
                            xcardEnabled={offer.xcard}
                            onPress={() => handleOfferPress(offer)}
                            style={styles.offerCard}
                        />
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 16,
    },
    headerContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    headerTitle: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    trendingText: {
        fontSize: 20,
        color: Colors.light.text,
        letterSpacing: 1,
    },
    offersText: {
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
        paddingHorizontal: 30,
        gap: 12,

    },
    offerCard: {
        width: 220,
    },
});
