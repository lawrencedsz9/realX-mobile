import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import PhonkText from '../PhonkText';
import { useResponsive } from '../../hooks/useResponsive';

type OfferItem = {
    id: string;
    title: string;
    subtitle: string;
    imageUrl?: string;
};

type Props = {
    offers?: OfferItem[];
    onOfferPress?: (offer: OfferItem) => void;
};

const defaultOffers: OfferItem[] = [
    { id: '1', title: 'Restaurant Deal', subtitle: 'Up to 30% off' },
    { id: '2', title: 'Coffee Shop', subtitle: 'Buy 1 Get 1 Free' },
    { id: '3', title: 'Grocery Store', subtitle: 'Fresh Deals Daily' },
];

export default function TrendingOffers({ offers = defaultOffers, onOfferPress }: Props) {
    const { horizontalPadding } = useResponsive();
    return (
        <View style={styles.container}>
            <View style={[styles.headerContainer, { paddingHorizontal: horizontalPadding }]}>
                <View style={styles.headerTitle}>
                    <PhonkText style={styles.trendingText}>TRENDING </PhonkText>
                    <PhonkText style={styles.offersText}>OFFERS</PhonkText>
                </View>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
            >
                {offers.map((offer) => (
                    <TouchableOpacity
                        key={offer.id}
                        style={styles.offerCard}
                        onPress={() => onOfferPress?.(offer)}
                        activeOpacity={0.7}
                    >
                        {/* Placeholder for offer image */}
                        <View style={styles.imagePlaceholder}>
                            <Text style={[{ color: '#000', fontFamily: Typography.poppins.medium }, styles.placeholderEmoji]}>🏷️</Text>
                        </View>
                        <View style={styles.offerContent}>
                            <PhonkText style={[{ color: '#000' }, styles.offerTitle]} numberOfLines={1}>
                                {offer.title}
                            </PhonkText>
                            <PhonkText style={[{ color: '#8E8E93' }, styles.offerSubtitle]} numberOfLines={1}>
                                {offer.subtitle}
                            </PhonkText>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 16,
    },
    headerContainer: {
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
    scrollContent: {
        gap: 12,
    },
    offerCard: {
        width: 150,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    imagePlaceholder: {
        width: '100%',
        height: 100,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderEmoji: {
        fontSize: 40,
    },
    offerContent: {
        padding: 10,
    },
    offerTitle: {
        fontSize: 14,
        marginBottom: 2,
    },
    offerSubtitle: {
        fontSize: 12,
    },
});

