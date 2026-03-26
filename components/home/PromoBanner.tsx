import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';

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
    const scrollViewRef = useRef<ScrollView>(null);
    const router = useRouter();

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

    const { isTablet, width: screenWidth } = useResponsive();
    const bannerWidth = isTablet ? Math.min(screenWidth - 80, 800) : screenWidth - 48;
    const bannerHeight = isTablet ? 300 : 192;

    useEffect(() => {
        if (banners.length <= 1) return;

        const interval = setInterval(() => {
            const nextIndex = (activeIndex + 1) % banners.length;
            scrollViewRef.current?.scrollTo({
                x: nextIndex * (bannerWidth + 10),
                animated: true,
            });
            setActiveIndex(nextIndex);
        }, 3000);

        return () => clearInterval(interval);
    }, [banners.length, activeIndex, bannerWidth]);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / (bannerWidth + 10));
        setActiveIndex(index);
    };

    const handlePress = (banner: BannerItem) => {
        if (banner.offerId) {
            router.push(`/vendor/${banner.offerId}`);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { height: bannerHeight }, styles.loaderContainer]}>
                <ActivityIndicator size="large" color="#333" />
            </View>
        );
    }

    if (banners.length === 0) {
        return (
            <View style={[styles.container, styles.loaderContainer]}>
                <Text style={{ color: '#8E8E93', fontFamily: 'System' }}>No banners available</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={bannerWidth + 10}
                decelerationRate="fast"
                contentContainerStyle={[styles.scrollContent, isTablet && { paddingHorizontal: (screenWidth - bannerWidth) / 2 }]}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {banners.map((banner) => (
                    <TouchableOpacity
                        key={banner.bannerId}
                        style={[styles.bannerColumn, { width: bannerWidth, height: bannerHeight }]}
                        onPress={() => handlePress(banner)}
                        activeOpacity={0.9}
                    >
                        <View style={styles.topPill}>
                            <Image
                                source={{ uri: (isTablet && banner.images.desktop) ? banner.images.desktop : banner.images.mobile }}
                                style={styles.topImage}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                                accessibilityLabel={banner.altText || 'Banner Image'}
                            />
                        </View>

                        <View style={styles.bottomPill}>
                            <Image
                                source={{ uri: (isTablet && banner.images.desktop) ? banner.images.desktop : banner.images.mobile }}
                                style={styles.bottomImage}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                                accessibilityLabel={banner.altText || 'Banner Image'}
                            />
                        </View>
                    </TouchableOpacity>
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: 24,
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
