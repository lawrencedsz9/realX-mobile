import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import RestaurantCard from './RestaurantCard';

type Restaurant = {
    id: string;
    name: string;
    cashbackText?: string;
    discountText?: string;
    isTrending?: boolean;
    imageUri?: string;
    logoUri?: string;
};

type Props = {
    title?: string;
    emoji?: string;
    restaurants?: Restaurant[];
    onRestaurantPress?: (restaurant: Restaurant) => void;
};

const defaultRestaurants: Restaurant[] = [
    {
        id: '1',
        name: 'TeaTime',
        cashbackText: 'Cashbacks',
        discountText: '60% DISCOUNT',
        isTrending: false,
    },
    {
        id: '2',
        name: 'Sahtein',
        cashbackText: 'Cashbacks',
        discountText: '60% DISCOUNT',
        isTrending: true,
    },
    {
        id: '3',
        name: 'Salt Bae',
        cashbackText: 'Cashbacks',
        discountText: '40% DISCOUNT',
        isTrending: false,
    },
    {
        id: '4',
        name: 'Burger King',
        cashbackText: 'Cashbacks',
        discountText: '50% DISCOUNT',
        isTrending: true,
    },
];

export default function BrowseSection({
    title = 'Yallah! browse food',
    emoji = '😋',
    restaurants = [],
    onRestaurantPress,
}: Props) {
    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>
                    {title} <Text style={styles.emoji}>{emoji}</Text>
                </Text>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {restaurants.map((restaurant) => (
                    <RestaurantCard
                        key={restaurant.id}
                        id={restaurant.id}
                        name={restaurant.name}
                        cashbackText={restaurant.cashbackText}
                        discountText={restaurant.discountText}
                        isTrending={restaurant.isTrending}
                        imageUri={restaurant.imageUri}
                        logoUri={restaurant.logoUri}
                        onPress={() => onRestaurantPress?.(restaurant)}
                        style={{ width: 170 }}
                    />
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
        fontFamily: Typography.metropolis.semiBold,
        color: Colors.light.text,
    },
    emoji: {
        fontSize: 20,
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 12,
    },
});
