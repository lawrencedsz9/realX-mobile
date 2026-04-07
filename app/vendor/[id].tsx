
import Ionicons from '@expo/vector-icons/Ionicons';
import { doc, getDoc, getDocs, getFirestore, query, where, collection } from '@react-native-firebase/firestore';
import { GlassView } from 'expo-glass-effect';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import PhonkText from '../../components/PhonkText';

export default function VendorScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { i18n, t } = useTranslation();
    const isArabic = i18n.language === 'ar';
    const [vendor, setVendor] = useState<any>(null);
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOfferForTC, setSelectedOfferForTC] = useState<any>(null);
    const [actualVendorId, setActualVendorId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const db = getFirestore();

                // Fetch Vendor
                const vendorRef = doc(db, 'vendors', id);
                const vendorSnap = await getDoc(vendorRef);
                
                let vendorData = null;
                let foundVendorId = id;

                if (vendorSnap.exists()) {
                    vendorData = vendorSnap.data();
                    setActualVendorId(id);
                } else {
                    // Fallback: Try searching by name if ID lookup fails
                    // This is useful since the banner's offerId might be the vendor name
                    const vendorsRef = collection(db, 'vendors');
                    const nameQuery = query(vendorsRef, where('name', '==', id));
                    const nameSnap = await getDocs(nameQuery);
                    
                    if (!nameSnap.empty) {
                        const foundDoc = nameSnap.docs[0];
                        vendorData = foundDoc.data();
                        foundVendorId = foundDoc.id;
                        setActualVendorId(foundDoc.id);
                    } else if (isArabic) {
                        const nameArQuery = query(vendorsRef, where('nameAr', '==', id));
                        const nameArSnap = await getDocs(nameArQuery);
                        if (!nameArSnap.empty) {
                            const foundDoc = nameArSnap.docs[0];
                            vendorData = foundDoc.data();
                            foundVendorId = foundDoc.id;
                            setActualVendorId(foundDoc.id);
                        }
                    }
                }

                if (vendorData) {
                    setVendor(vendorData);

                    // Use offers array from vendor document
                    const vendorOffers = (vendorData.offers || []).map((offer: any, index: number) => ({
                        id: `${foundVendorId}_offer_${index}`,
                        ...offer,
                    }));

                    setOffers(vendorOffers);
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
                <View style={[styles.errorContainer, { backgroundColor: Colors.light.background }]}>
                <Text style={[{ color: Colors.light.text, fontFamily: Typography.poppins.medium }, styles.errorText]}>{t('vendor_not_found')}</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: Colors.light.background }]}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

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
                <View style={[styles.detailsContainer, { backgroundColor: Colors.light.background }]}>
                    <View style={styles.vendorHeaderRow}>
                        {vendor.integralLogo ? (
                            <Image
                                source={{ uri: vendor.integralLogo }}
                                style={styles.integralLogo}
                                contentFit="contain"
                            />
                        ) : (
                            <PhonkText style={[{ color: Colors.light.text }, styles.vendorName]}>{isArabic ? (vendor.nameAr || vendor.name) : vendor.name}</PhonkText>
                        )}
                    </View>

                    <View style={styles.metaRow}>
                    </View>

                    {/* Offers List */}
                    <View style={styles.offersList}>
                        {offers.map((offer) => {
                            const offerTitle = isArabic
                                ? (offer.titleAr || offer.titleEn)
                                : (offer.titleEn || offer.titleAr);

                            return (
                                <View key={offer.id} style={styles.offerCard}>
                                    {offer.xcard && (
                                        <Image
                                            source={require('../../assets/images/cashback.png')}
                                            style={styles.xcardBadge}
                                        />
                                    )}
                                    {/* Top Info Pill */}
                                    <View style={[styles.offerInfoContainer, { backgroundColor: '#F5F5F5' }]}>
                                        <View style={styles.offerContent}>
                                            <PhonkText style={[{ color: Colors.light.text }, styles.offerTitle]}>
                                                {(offerTitle || "").split(/(\d+(?:\.\d+)?\s?%?)/).map((part: string, index: number) => 
                                                    /^\d+(?:\.\d+)?\s?%?$/.test(part) ? (
                                                        <PhonkText key={index} style={styles.greenText}>{part}</PhonkText>
                                                    ) : (
                                                        part
                                                    )
                                                )}
                                            </PhonkText>
                                        </View>
                                    </View>
                                    {/* Bottom Button Pills */}
                                    <View style={styles.offerActionsRow}>
                                        <TouchableOpacity
                                            style={[styles.pillButton, { backgroundColor: '#FFF' }]}
                                            onPress={() => setSelectedOfferForTC(offer)}
                                        >
                                            <Ionicons name="alert-circle-outline" size={22} color="#8E8E93" />
                                            <Text style={[{ color: Colors.light.text, fontFamily: Typography.poppins.medium }, styles.pillButtonTextSmall]}>{t('view_tc')}</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.pillButton, styles.redeemPill]}
                                            onPress={() => {
                                                const offerData = JSON.stringify({
                                                    titleEn: offer.titleEn,
                                                    titleAr: offer.titleAr,
                                                    descriptionEn: offer.descriptionEn,
                                                    descriptionAr: offer.descriptionAr,
                                                    discountValue: offer.discountValue,
                                                    discountType: offer.discountType,
                                                });
                                                router.push(`/redeem/${offer.id}?vendorId=${actualVendorId || id}&offerData=${encodeURIComponent(offerData)}`);
                                            }}
                                        >
                                            <Ionicons name="flash" size={18} color="#FFF" />
                                            <Text style={[{ color: '#FFF', fontFamily: Typography.poppins.medium }, styles.pillButtonTextSmall]}>{t('redeem_caps')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
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
                                backgroundColor: '#FFFFFF',
                                paddingBottom: insets.bottom + 20
                            }
                        ]}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Drawer Handle */}
                        <View style={styles.handleContainer}>
                            <View style={[styles.handle, { backgroundColor: '#E0E0E0' }]} />
                        </View>

                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <PhonkText style={[{ color: Colors.light.text, textAlign: isArabic ? 'right' : 'left' }, styles.modalTitleText]}>{t('terms_and_conditions_caps')}</PhonkText>
                                <TouchableOpacity
                                    onPress={() => setSelectedOfferForTC(null)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons name="close-circle" size={28} color="#000" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                style={styles.modalBody}
                                contentContainerStyle={styles.modalBodyContent}
                            >
                                <Text style={[{ color: Colors.light.text, fontFamily: Typography.poppins.medium, textAlign: isArabic ? 'right' : 'left' }, styles.descriptionText]}>
                                    {isArabic
                                        ? (selectedOfferForTC?.descriptionAr || selectedOfferForTC?.descriptionEn || t('no_specific_terms'))
                                        : (selectedOfferForTC?.descriptionEn || selectedOfferForTC?.descriptionAr || t('no_specific_terms'))}
                                </Text>

                                <View style={styles.commonTerms}>
                                    <View style={[styles.termRow, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
                                        <Ionicons name="checkmark-circle" size={18} color={Colors.brandGreen} />
                                        <Text style={[{ color: Colors.light.text, fontFamily: Typography.poppins.medium, textAlign: isArabic ? 'right' : 'left' }, styles.termText]}>{t('in_store_only')}</Text>
                                    </View>
                                    <View style={[styles.termRow, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
                                        <Ionicons name="checkmark-circle" size={18} color={Colors.brandGreen} />
                                        <Text style={[{ color: Colors.light.text, fontFamily: Typography.poppins.medium, textAlign: isArabic ? 'right' : 'left' }, styles.termText]}>{t('cannot_be_combined')}</Text>
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
        fontFamily: Typography.poppins.medium,
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
        zIndex: 5,
        elevation: 5,
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
        fontFamily: Typography.poppins.semiBold,
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
        fontFamily: Typography.poppins.medium,
    },
    offersList: {
        marginTop: 24,
        gap: 20,
    },
    offerCard: {
        marginBottom: 8,
        position: 'relative',
    },
    xcardBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 10,
    },
    offerInfoContainer: {
        borderRadius: 30,
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    offerContent: {
        gap: 4,
    },
    offerTitle: {
        fontSize: 28,
        letterSpacing: -0.5,
        textTransform: 'uppercase',
    },
    greenText: {
        color: Colors.brandGreen,
    },
    offerSubtitle: {
        fontSize: 15,
        fontFamily: Typography.poppins.medium,
        color: '#8E8E93',
    },
    offerActionsRow: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#F5F5F5',
        borderRadius: 30,
        paddingHorizontal: 8,
        paddingVertical: 8,
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
    },
    redeemPill: {
        backgroundColor: Colors.brandGreen,
    },
    pillButtonTextSmall: {
        fontSize: 14,
        fontFamily: Typography.poppins.semiBold,
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
        fontFamily: Typography.poppins.medium,
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
        fontFamily: Typography.poppins.medium,
        color: '#666',
    },
});
