
import Ionicons from '@expo/vector-icons/Ionicons';
import { collection, doc, getDoc, getDocs, getFirestore, query, where } from '@react-native-firebase/firestore';
import { GlassView } from 'expo-glass-effect';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/ThemedText';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useTheme } from '../../context/ThemeContext';

export default function VendorScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { theme, colorScheme } = useTheme();
    const insets = useSafeAreaInsets();
    const isDark = colorScheme === 'dark';
    const [vendor, setVendor] = useState<any>(null);
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOfferForTC, setSelectedOfferForTC] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const db = getFirestore();

                // Fetch Vendor
                const vendorRef = doc(db, 'vendors', id);
                const vendorSnap = await getDoc(vendorRef);

                let vendorData = null;
                let actualVendorId = id;

                if (vendorSnap.exists()) {
                    vendorData = vendorSnap.data();
                } else {
                    // Fallback: Try searching by name if ID lookup fails
                    // This is useful since the banner's offerId might be the vendor name
                    const vendorsRef = collection(db, 'vendors');
                    const nameQuery = query(vendorsRef, where('name', '==', id));
                    const nameSnap = await getDocs(nameQuery);
                    
                    if (!nameSnap.empty) {
                        const foundDoc = nameSnap.docs[0];
                        vendorData = foundDoc.data();
                        actualVendorId = foundDoc.id;
                    }
                }

                if (vendorData) {
                    setVendor(vendorData);

                    // Fetch Offers using the actual document ID
                    const offersRef = collection(db, 'offers');
                    const q = query(offersRef, where('vendorId', '==', actualVendorId), where('status', '==', 'active'));
                    const querySnapshot = await getDocs(q);

                    const fetchedOffers = querySnapshot.docs.map((doc: any) => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    setOffers(fetchedOffers);
                }
            } catch (error) {
                console.error("Error fetching vendor data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.brandGreen} />
            </View>
        );
    }

    if (!vendor) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
                <ThemedText style={styles.errorText}>Vendor not found</ThemedText>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header Image Section */}
                <View style={styles.headerContainer}>
                    <Image
                        source={{ uri: vendor.coverImage }}
                        style={styles.coverImage}
                        contentFit="cover"
                        transition={200}
                    />

                    {/* Header Buttons */}
                    <SafeAreaView style={styles.headerOverlay} edges={['top']}>
                        <View style={styles.headerButtonsRow}>
                            <TouchableOpacity
                                style={styles.roundButton}
                                onPress={() => router.back()}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="arrow-back" size={24} color="#000" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.roundButton}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="share-outline" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>

                    {/* Vendor Logo Overlapping */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={{ uri: vendor.profilePicture }}
                            style={styles.logoImage}
                            contentFit="cover"
                        />
                    </View>

                </View>

                {/* Vendor Details */}
                <View style={[styles.detailsContainer, { backgroundColor: theme.background }]}>
                    <View style={styles.vendorHeaderRow}>
                        {vendor.integralLogo ? (
                            <Image
                                source={{ uri: vendor.integralLogo }}
                                style={styles.integralLogo}
                                contentFit="contain"
                            />
                        ) : (
                            <ThemedText style={styles.vendorName}>{vendor.name}</ThemedText>
                        )}
                    </View>

                    <View style={styles.metaRow}>
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={16} color="#FFD700" />
                            <ThemedText style={styles.ratingText}>5.0</ThemedText>
                        </View>

                    </View>

                    {/* Offers List */}
                    <View style={styles.offersList}>
                        {offers.map((offer) => (
                            <View key={offer.id} style={styles.offerCard}>
                                {/* Top Info Pill */}
                                <View style={[styles.offerInfoContainer, { backgroundColor: isDark ? '#1A1D1F' : '#F5F5F5' }]}>
                                    <View style={styles.offerContent}>
                                        <ThemedText style={styles.offerTitle}>
                                            {offer.discountType === 'percentage' ? (
                                                <>
                                                    FLAT <ThemedText style={styles.greenText}>{offer.discountValue}%</ThemedText> OFF
                                                </>
                                            ) : offer.discountType === 'buy_one_get_one' || offer.titleEn?.toLowerCase().includes('buy') ? (
                                                <ThemedText style={styles.offerTitle}>
                                                    BUY <ThemedText style={styles.greenText}>1</ThemedText> GET <ThemedText style={styles.greenText}>1</ThemedText>
                                                </ThemedText>
                                            ) : (
                                                <>{offer.titleEn || offer.titleAr}</>
                                            )}
                                        </ThemedText>
                                        <ThemedText style={styles.offerSubtitle}>In-store</ThemedText>
                                    </View>
                                </View>

                                {/* Bottom Button Pills */}
                                <View style={styles.offerActionsRow}>
                                    <TouchableOpacity
                                        style={[styles.pillButton, { backgroundColor: isDark ? '#25292e' : '#FFF' }]}
                                        onPress={() => setSelectedOfferForTC(offer)}
                                    >
                                        <Ionicons name="alert-circle-outline" size={22} color={theme.subtitle} />
                                        <ThemedText style={styles.pillButtonTextSmall}>View T&C</ThemedText>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.pillButton, styles.redeemPill]}
                                        onPress={() => router.push(`/redeem/${offer.id}?vendorId=${id}`)}
                                    >
                                        <Ionicons name="flash" size={18} color="#FFF" />
                                        <ThemedText style={[styles.pillButtonTextSmall, { color: '#FFF' }]}>REDEEM</ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* T&C Modal */}
            <Modal
                visible={!!selectedOfferForTC}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedOfferForTC(null)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setSelectedOfferForTC(null)}
                >
                    <GlassView style={StyleSheet.absoluteFill} glassEffectStyle="regular" colorScheme="dark" tintColor="rgba(0,0,0,0.3)" />
                    <Pressable
                        style={[
                            styles.drawerContainer,
                            {
                                backgroundColor: isDark ? '#1A1D1F' : '#FFFFFF',
                                paddingBottom: insets.bottom + 20
                            }
                        ]}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Drawer Handle */}
                        <View style={styles.handleContainer}>
                            <View style={[styles.handle, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
                        </View>

                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <ThemedText style={styles.modalTitleText}>TERMS & CONDITIONS</ThemedText>
                                <TouchableOpacity
                                    onPress={() => setSelectedOfferForTC(null)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons name="close-circle" size={28} color={isDark ? '#FFF' : '#000'} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                style={styles.modalBody}
                                contentContainerStyle={styles.modalBodyContent}
                            >
                                <ThemedText style={styles.descriptionText}>
                                    {selectedOfferForTC?.descriptionEn || selectedOfferForTC?.descriptionAr || 'No specific terms provided for this offer.'}
                                </ThemedText>

                                {/* Common Terms could go here */}
                                <View style={styles.commonTerms}>
                                    <View style={styles.termRow}>
                                        <Ionicons name="checkmark-circle" size={18} color={Colors.brandGreen} />
                                        <ThemedText style={styles.termText}>Valid for in-store purchases only</ThemedText>
                                    </View>
                                    <View style={styles.termRow}>
                                        <Ionicons name="checkmark-circle" size={18} color={Colors.brandGreen} />
                                        <ThemedText style={styles.termText}>Cannot be combined with other offers</ThemedText>
                                    </View>
                                </View>
                            </ScrollView>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        fontFamily: Typography.metropolis.medium,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    headerContainer: {
        height: 250,
        width: '100%',
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    headerButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    roundButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    logoContainer: {
        position: 'absolute',
        bottom: -20, // Overlap
        left: 20,
        width: 100,
        height: 100,
        borderRadius: 20,
        backgroundColor: '#1E2a38', // Dark background based on screenshot
        padding: 4,
        zIndex: 5,
        elevation: 5,
        borderColor: '#FFFFFF',
    },
    logoImage: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },
    detailsContainer: {
        paddingTop: 30, // Space for logo overlap
        paddingHorizontal: 20,
    },
    vendorHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    vendorName: {
        fontSize: 26,
        fontFamily: Typography.integral.bold,
        color: '#000',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    integralLogo: {
        width: 180,
        height: 60,
    },
    rightChips: {
        flexDirection: 'row',
        gap: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginTop: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 14,
        fontFamily: Typography.metropolis.semiBold,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000000',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    categoryEmoji: {
        fontSize: 12,
    },
    categoryText: {
        fontSize: 12,
        fontFamily: Typography.metropolis.medium,
    },
    offersList: {
        marginTop: 24,
        gap: 20,
    },
    offerCard: {
        marginBottom: 8,
        gap: 12,
    },
    offerInfoContainer: {
        borderRadius: 40,
        paddingHorizontal: 28,
        paddingVertical: 24,
    },
    offerContent: {
        gap: 4,
    },
    offerTitle: {
        fontSize: 28,
        fontFamily: Typography.integral.bold,
        letterSpacing: -0.5,
        textTransform: 'uppercase',
    },
    greenText: {
        color: Colors.brandGreen,
        fontFamily: Typography.integral.bold,
    },
    offerSubtitle: {
        fontSize: 15,
        fontFamily: Typography.metropolis.medium,
        color: '#8E8E93',
    },
    offerActionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    pillButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        height: 56,
        borderRadius: 30,
        gap: 8,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    redeemPill: {
        backgroundColor: Colors.brandGreen,
        shadowColor: Colors.brandGreen,
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    pillButtonTextSmall: {
        fontSize: 14,
        fontFamily: Typography.metropolis.semiBold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
    },
    drawerContainer: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '80%',
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    handle: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
    },
    modalContent: {
        paddingHorizontal: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitleText: {
        fontSize: 20,
        fontFamily: Typography.integral.bold,
        letterSpacing: 0.5,
    },
    modalBody: {
        marginBottom: 20,
    },
    modalBodyContent: {
        paddingBottom: 20,
    },
    descriptionText: {
        fontSize: 16,
        fontFamily: Typography.metropolis.medium,
        lineHeight: 24,
        color: '#8E8E93',
    },
    commonTerms: {
        marginTop: 24,
        gap: 12,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    termRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    termText: {
        fontSize: 14,
        fontFamily: Typography.metropolis.medium,
        color: '#666',
    },
});
