import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

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
    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>
                    <Text style={styles.trendingText}>TRENDING </Text>
                    <Text style={styles.offersText}>OFFERS</Text>
                </Text>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
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
                            <Text style={[{ color: '#000', fontFamily: Typography.metropolis.medium }, styles.placeholderEmoji]}>🏷️</Text>
                        </View>
                        <View style={styles.offerContent}>
                            <Text style={[{ color: '#000', fontFamily: Typography.metropolis.medium }, styles.offerTitle]} numberOfLines={1}>
                                {offer.title}
                            </Text>
                            <Text style={[{ color: '#8E8E93', fontFamily: Typography.metropolis.medium }, styles.offerSubtitle]} numberOfLines={1}>
                                {offer.subtitle}
                            </Text>
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
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 20,
    },
    trendingText: {
        fontFamily: Typography.integral.bold,
        color: Colors.light.text,
        letterSpacing: 1,
    },
    offersText: {
        fontFamily: Typography.integral.bold,
        color: Colors.brandGreen,
        fontStyle: 'italic',
        letterSpacing: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
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
        fontFamily: Typography.integral.bold,
        marginBottom: 2,
    },
    offerSubtitle: {
        fontSize: 12,
        fontFamily: Typography.integral.bold,
    },
});
