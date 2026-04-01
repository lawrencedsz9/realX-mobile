import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';
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
                const cmsDocRef = doc(db, 'cms', 'trending-offers');
                const cmsSnap = await getDoc(cmsDocRef);

                if (cmsSnap.exists()) {
                    const data = cmsSnap.data();
                    const offerIds = data?.offerIds || [];

                    const offersPromises = offerIds.map(async (id: string) => {
                        const offerDoc = await getDoc(doc(db, 'offers', id));
                        if (offerDoc.exists()) {
                            return { id: offerDoc.id, ...offerDoc.data() };
                        }
                        return null;
                    });

                    const fetchedOffers = (await Promise.all(offersPromises)).filter(o => o !== null);
                    setOffers(fetchedOffers);
                }
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
                        ? offer.titleAr || offer.titleEn || 'Untitled Offer'
                        : offer.titleEn || offer.titleAr || 'Untitled Offer';
                    const cashbackText = isRTL
                        ? offer.descriptionAr || offer.descriptionEn || 'Special Offer'
                        : offer.descriptionEn || offer.descriptionAr || 'Special Offer';
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
                            imageUri={offer.bannerImage}
                            logoUri={offer.vendorProfilePicture}
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
