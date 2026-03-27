import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import PhonkText from '../PhonkText';

type BrandItem = {
    id: string;
    name: string;
    logoUrl: string;
    isActive: boolean;
};

export default function BrandGrid() {
    const [brands, setBrands] = useState<BrandItem[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchBrands = async () => {
            try {
                const db = getFirestore();
                const brandsDocRef = doc(db, 'cms', 'brand');
                const brandsSnap = await getDoc(brandsDocRef);

                if (brandsSnap.exists()) {
                    const data = brandsSnap.data();
                    const activeBrands = (data?.brands || [])
                        .filter((b: any) => b.isActive)
                        .map((b: any) => ({
                            id: b.id,
                            name: b.name,
                            logoUrl: b.logoUrl,
                            isActive: b.isActive,
                        })) as BrandItem[];
                    setBrands(activeBrands);
                }
            } catch (error) {
                console.error('Error fetching brands:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBrands();
    }, []);

    const handlePress = (brand: BrandItem) => {
        router.push(`/vendor/${brand.name}`);
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loaderContainer]}>
                <ActivityIndicator size="small" color={Colors.brandGreen} />
            </View>
        );
    }

    if (brands.length === 0) {
        return null; // Or show a default state
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>
                    <PhonkText style={styles.shopByText}>TOP </PhonkText>
                    <PhonkText style={styles.brandText}>BRANDS</PhonkText>
                </Text>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {brands.map((brand) => (
                    <TouchableOpacity
                        key={brand.id}
                        style={styles.brandItem}
                        activeOpacity={0.7}
                        onPress={() => handlePress(brand)}
                    >
                        <Image
                            source={{ uri: brand.logoUrl }}
                            style={styles.imageContainer}
                            contentFit="contain"
                            cachePolicy="memory-disk"
                        />
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
    shopByText: {
        color: Colors.light.text,
        letterSpacing: 1,
    },
    brandText: {
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
        paddingHorizontal: 20,
        gap: 16,
    },
    brandItem: {
        alignItems: 'center',
    },
    imageContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
});
