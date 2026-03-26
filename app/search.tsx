import Ionicons from '@expo/vector-icons/Ionicons';
import { collection, getDocs, getFirestore, query, where, limit, startAfter } from '@react-native-firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView} from 'react-native-safe-area-context';
import { RestaurantCard } from '../components/category';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useResponsive } from '../hooks/useResponsive';
import { ResponsiveContainer } from '../components/ResponsiveContainer';

export default function SearchScreen() {
    const { isTablet, isDesktop, horizontalPadding } = useResponsive();
    const { q } = useLocalSearchParams<{ q: string }>();
    const router = useRouter();
    const isDark = false;

    const [searchQuery, setSearchQuery] = useState(q || '');
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [isListEnd, setIsListEnd] = useState(false);

    // Fetch offers with pagination — only when user has typed a query
    const fetchOffers = useCallback(async (isNew = false, currentQuery = searchQuery) => {
        const trimmedQuery = currentQuery.trim().toLowerCase();

        // Don't query Firestore if no search text — saves reads
        if (!trimmedQuery) {
            setOffers([]);
            setLastDoc(null);
            setIsListEnd(true);
            setLoading(false);
            setLoadingMore(false);
            return;
        }

        if (loading || (loadingMore && !isNew) || (isListEnd && !isNew)) return;

        if (isNew) {
            setLoading(true);
            setLastDoc(null);
            setIsListEnd(false);
        } else {
            setLoadingMore(true);
        }

        try {
            const db = getFirestore();
            const offersRef = collection(db, 'offers');
            const PAGE_SIZE = 20;

            const constraints: any[] = [
                where('status', '==', 'active'),
                where('searchTokens', 'array-contains', trimmedQuery),
            ];

            let q;
            if (isNew) {
                q = query(offersRef, ...constraints, limit(PAGE_SIZE) as any);
            } else {
                q = query(offersRef, ...constraints, startAfter(lastDoc) as any, limit(PAGE_SIZE) as any);
            }

            const snapshot = await getDocs(q);

            const fetched = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
            }));

            if (isNew) {
                setOffers(fetched);
            } else {
                setOffers(prev => [...prev, ...fetched]);
            }

            if (snapshot.docs.length > 0) {
                setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
                setIsListEnd(snapshot.docs.length < PAGE_SIZE);
            } else {
                setIsListEnd(true);
            }
        } catch (error) {
            console.error('Error fetching offers for search:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [loading, loadingMore, isListEnd, lastDoc, searchQuery]);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchOffers(true);
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // No client-side filtering needed — Firestore array-contains handles exact token matching
    const filteredOffers = offers;

    const handleOfferPress = useCallback(
        (offer: any) => {
            if (offer.vendorId) {
                router.push({ pathname: '/vendor/[id]', params: { id: offer.vendorId } });
            }
        },
        [router]
    );

    const handleLoadMore = () => {
        if (!isListEnd && !loadingMore && !loading) {
            fetchOffers(false);
        }
    };

    const numColumns = isDesktop ? 4 : isTablet ? 3 : 2;

    const renderItem = useCallback(
        ({ item, index }: { item: any; index: number }) => {
            const isFirstInRow = index % numColumns === 0;
            const isLastInRow = index % numColumns === numColumns - 1;

            return (
                <View
                    style={[
                        styles.cardWrapper,
                        {
                            paddingLeft: isFirstInRow ? horizontalPadding : 8,
                            paddingRight: isLastInRow ? horizontalPadding : 8,
                        },
                    ]}
                >
                    <RestaurantCard
                        id={item.id}
                        name={item.titleEn || item.titleAr || 'Untitled Offer'}
                        cashbackText={item.descriptionEn || item.descriptionAr || 'Special Offer'}
                        discountText={`${item.discountValue}${item.discountType === 'percentage' ? '%' : ''} OFF`}
                        isTrending={item.isTrending}
                        isTopRated={item.isTopRated}
                        imageUri={item.bannerImage}
                        logoUri={item.vendorProfilePicture}
                        xcardEnabled={item.xcardEnabled}
                        onPress={() => handleOfferPress(item)}
                    />
                </View>
            );
        },
        [handleOfferPress, numColumns, horizontalPadding]
    );

    const renderFooter = () => {
        if (!loadingMore) return <View style={{ height: 20 }} />;
        return (
            <View style={styles.loaderFooter}>
                <ActivityIndicator size="small" color={Colors.brandGreen} />
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: Colors.light.background }]} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.light.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={[styles.backButton, { backgroundColor: '#FFF' }]} onPress={() => router.back()} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={22} color="#000" />
                </TouchableOpacity>

                <View style={[styles.searchContainer, { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' }]}>
                    <Ionicons name="search" size={18} color={Colors.brandGreen} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: Colors.light.text }]}
                        placeholder="Search for offers..."
                        placeholderTextColor={Colors.light.tabIconDefault}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                        autoFocus
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close-circle" size={18} color="#AAA" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Results */}
            <ResponsiveContainer>
                {loading ? (
                    <View style={styles.centeredContainer}>
                        <ActivityIndicator size="large" color={Colors.brandGreen} />
                    </View>
                ) : filteredOffers.length === 0 ? (
                    <View style={styles.centeredContainer}>
                        <Text style={[{ color: Colors.light.text, fontFamily: Typography.poppins.medium }, styles.emptyEmoji]}>🔍</Text>
                        <Text style={[{ color: Colors.light.text, fontFamily: Typography.poppins.medium }, styles.emptyTitle]}>
                            {searchQuery.trim() ? 'No offers found' : 'Search for offers'}
                        </Text>
                        <Text style={[{ color: Colors.light.tabIconDefault, fontFamily: Typography.poppins.medium }, styles.emptySubtitle]}>
                            {searchQuery.trim()
                                ? `We couldn't find any offers matching "${searchQuery.trim()}"`
                                : 'Type a keyword to find deals and discounts'}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        key={`search-grid-${numColumns}`}
                        data={filteredOffers}
                        keyExtractor={(item) => item.id}
                        numColumns={numColumns}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={renderFooter}
                        ListHeaderComponent={
                            <Text style={[{ color: Colors.light.text, fontFamily: Typography.poppins.medium, paddingHorizontal: horizontalPadding }, styles.resultCount]}>
                                {filteredOffers.length} {filteredOffers.length === 1 ? 'result' : 'results'}
                            </Text>
                        }
                    />
                )}
            </ResponsiveContainer>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 24,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontFamily: Typography.poppins.medium,
        padding: 0,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyEmoji: {
        fontSize: 60,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontFamily: Typography.poppins.semiBold,
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        fontFamily: Typography.poppins.medium,
        textAlign: 'center',
        lineHeight: 22,
    },
    resultCount: {
        fontSize: 14,
        fontFamily: Typography.poppins.medium,
        color: '#8E8E93',
        paddingTop: 8,
        paddingBottom: 16,
    },
    listContent: {
        paddingBottom: 40,
    },
    cardWrapper: {
        flex: 1,
        marginBottom: 16,
    },
    loaderFooter: {
        paddingVertical: 20,
        alignItems: 'center',
    },
});
