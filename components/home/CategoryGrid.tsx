import { collection, getDocs, getFirestore, orderBy, query } from '@react-native-firebase/firestore';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { triggerSubtleHaptic } from '../../utils/haptics';

type CategoryItem = {
    id: string;
    name: string;
    image?: string | any;
    icon?: string;
};

type Props = {
    categories?: CategoryItem[];
    onCategoryPress?: (category: CategoryItem) => void;
};

export default function CategoryGrid({ categories: propCategories, onCategoryPress }: Props) {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const [fetchedCategories, setFetchedCategories] = useState<CategoryItem[]>([]);
    const [loading, setLoading] = useState(!propCategories);

    const isArabic = i18n.language === 'ar';

    useEffect(() => {
        if (propCategories) return;

        const fetchCategories = async () => {
            try {
                const db = getFirestore();
                const q = query(
                    collection(db, 'categories'),
                    orderBy('order', 'asc')
                );

                const snapshot = await getDocs(q);
                const items: CategoryItem[] = snapshot.docs.map((doc: any) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: isArabic ? (data.nameArabic || data.nameAr || data.nameEnglish) : data.nameEnglish,
                        image: data.imageUrl,
                    };
                });

                // Add "See More" at the end to match original layout if it fits
                if (items.length > 0) {
                    items.push({
                        id: 'coming-soon',
                        name: t('coming_soon'),
                        image: require('../../assets/images/see-more.svg')
                    });
                }

                setFetchedCategories(items);
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, [propCategories, isArabic, t]);

    const displayCategories = propCategories || fetchedCategories;

    const handleCategoryPress = (item: CategoryItem) => {
        triggerSubtleHaptic();
        if (onCategoryPress) {
            onCategoryPress(item);
        } else if (item.id !== 'coming-soon') {
            router.push({
                pathname: "/category/[id]",
                params: { id: item.id, name: item.name }
            });
        }
    };

    const renderCategory = ({ item }: { item: CategoryItem }) => {
        return (
            <TouchableOpacity
                style={styles.categoryItem}
                onPress={() => handleCategoryPress(item)}
                activeOpacity={0.7}
            >
                <View style={styles.imageContainer}>
                    {item.image ? (
                        <Image
                            source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                            style={styles.categoryImage}
                            contentFit="contain"
                        />
                    ) : (
                        <Text style={[{ color: '#000', fontFamily: Typography.poppins.medium }, { fontSize: 40 }]}>{item.icon}</Text>
                    )}
                </View>
                <Text style={[{ color: '#000', fontFamily: Typography.poppins.medium }, styles.categoryName]} numberOfLines={1}>{item.name}</Text>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loaderContainer]}>
                <ActivityIndicator size="small" color={Colors.light.tint} />
            </View>
        );
    }

    if (displayCategories.length === 0) {
        return null; // Or some fallback
    }

    return (
        <View style={[styles.container, { minHeight: Math.ceil((displayCategories.length || 1) / 4) * 130 }]}>
            <FlashList
                data={displayCategories}
                renderItem={renderCategory}
                keyExtractor={(item) => item.id}
                numColumns={4}
                scrollEnabled={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    categoryItem: {
        alignItems: 'center',
        marginBottom: 16,
    },
    imageContainer: {
        marginBottom: 8,
    },
    categoryImage: {
        width: 80,
        height: 80,
    },
    categoryName: {
        fontSize: 12,
        fontFamily: Typography.poppins.medium,
        textAlign: 'center',
    },
    loaderContainer: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
