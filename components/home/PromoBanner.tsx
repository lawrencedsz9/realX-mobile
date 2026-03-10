import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View , Text} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const BANNER_WIDTH = screenWidth - 48;
const BANNER_HEIGHT = 192;

type BannerItem = {
    bannerId: string;
    altText: string;
    images: {
        desktop?: string;
        mobile?: string;
    };
    isActive: boolean;
    offerId: string;
    lastUpdated?: string;
};

export default function PromoBanner() {
    const [banners, setBanners] = useState<BannerItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const db = getFirestore();
                const cmsDocRef = doc(db, 'cms', 'banner');
                const cmsSnap = await getDoc(cmsDocRef);

                if (cmsSnap.exists()) {
                    const data = cmsSnap.data();
                    const activeBanners = (data?.banners || [])
                        .filter((b: any) => b.isActive) as BannerItem[];
                    setBanners(activeBanners);
                }
            } catch (error) {
                console.error('Error fetching banners:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBanners();
    }, []);

    useEffect(() => {
        if (banners.length <= 1 || isDragging) return;

        const timer = setTimeout(() => {
            const nextIndex = (activeIndex + 1) % banners.length;
            scrollViewRef.current?.scrollTo({
                x: nextIndex * (BANNER_WIDTH + 10),
                animated: true,
            });
            setActiveIndex(nextIndex);
        }, 3000);

        return () => clearTimeout(timer);
    }, [activeIndex, banners.length, isDragging]);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.max(
            0,
            Math.min(banners.length - 1, Math.round(contentOffsetX / (BANNER_WIDTH + 10)))
        );
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loaderContainer]}>
                <ActivityIndicator size="large" color="#333" />
            </View>
        );
    }

    if (banners.length === 0) {
        return (
            <View style={[styles.container, styles.loaderContainer]}>
                <Text>No banners available</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={BANNER_WIDTH + 10}
                decelerationRate="fast"
                contentContainerStyle={styles.scrollContent}
                onScroll={handleScroll}
                onScrollBeginDrag={() => setIsDragging(true)}
                onScrollEndDrag={() => setIsDragging(false)}
                scrollEventThrottle={16}
            >
                {banners.map((banner) => (
                    <View key={banner.bannerId} style={styles.bannerColumn}>
                        <View style={styles.topPill}>
                            <Image
                                source={{ uri: banner.images.mobile }}
                                style={styles.topImage}
                                contentFit="cover"
                                accessibilityLabel={banner.altText || 'Banner Image'}
                            />
                        </View>

                        <View style={styles.bottomPill}>
                            <Image
                                source={{ uri: banner.images.mobile }}
                                style={styles.bottomImage}
                                contentFit="cover"
                                accessibilityLabel={banner.altText || 'Banner Image'}
                            />
                        </View>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.paginationContainer}>
                {banners.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.paginationDot,
                            index === activeIndex && styles.paginationDotActive,
                        ]}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
    },
    loaderContainer: {
        height: BANNER_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: 24, // Center item by using (screenWidth - BANNER_WIDTH) / 2
        gap: 10,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        gap: 4,
    },
    paginationDot: {
        width: 28,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E0E0E0',
    },
    paginationDotActive: {
        backgroundColor: '#333333',
        width: 96,
    },
    bannerColumn: {
        width: BANNER_WIDTH,
        height: BANNER_HEIGHT,
    },
    topPill: {
        flex: 1,
        borderRadius: 30,
        overflow: 'hidden',
    },
    bottomPill: {
        flex: 1,
        borderRadius: 30,
        overflow: 'hidden',
    },
    topImage: {
        width: '100%',
        height: '200%',
    },
    bottomImage: {
        width: '100%',
        height: '200%',
        transform: [{ translateY: '-50%' }],
    },
});
