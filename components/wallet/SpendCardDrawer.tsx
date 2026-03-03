import { collection, getDocs, getFirestore, query, where } from '@react-native-firebase/firestore';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import RedeemGiftCard from './RedeemGiftCard';

type Props = {
    visible: boolean;
    onClose: () => void;
    balance: number;
    currency: string;
};

type BrandItem = {
    id: string;
    name: string;
    logo: string | null; // null for placeholder
    backgroundColor?: string;
    loyalty?: number[];
};

// Fetch dynamically instead of using placeholders

function BrandListItem({
    brand,
    isSelected,
    onSelect,
}: {
    brand: BrandItem;
    isSelected: boolean;
    onSelect: () => void;
}) {
    return (
        <TouchableOpacity
            style={[
                styles.brandItem,
                isSelected && styles.brandItemSelected,
            ]}
            onPress={onSelect}
            activeOpacity={0.7}
        >
            <View
                style={[
                    styles.brandLogo,
                    { backgroundColor: brand.backgroundColor || '#F0F0F0' },
                ]}
            >
                {brand.logo ? (
                    <Image source={{ uri: brand.logo }} style={styles.brandLogoImage} />
                ) : (
                    <Text style={styles.brandLogoPlaceholder}>
                        {brand.name.charAt(0)}
                    </Text>
                )}
            </View>
            <Text style={styles.brandName}>{brand.name}</Text>
        </TouchableOpacity>
    );
}

export default function SpendCardDrawer({
    visible,
    onClose,
    balance,
    currency,
}: Props) {
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
    const [brands, setBrands] = useState<BrandItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!visible) return;

        const fetchBrands = async () => {
            setLoading(true);
            try {
                const db = getFirestore();
                const q = query(
                    collection(db, 'vendors'),
                    where('xcard', '==', true)
                );
                const snapshot = await getDocs(q);

                const items: BrandItem[] = snapshot.docs.map((doc: any) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: data.name || 'Unknown',
                        logo: data.profilePicture || data.logoUrl || data.imageUrl || null,
                        backgroundColor: '#F0F0F0',
                        loyalty: data.loyalty || [],
                    };
                });

                setBrands(items);
            } catch (error) {
                console.error('Error fetching vendors for XCard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBrands();
    }, [visible]);

    const filteredBrands = brands.filter((brand) =>
        brand.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleBrandSelect = (brandId: string) => {
        setSelectedBrandId(brandId);
    };

    const selectedBrand = brands.find(b => b.id === selectedBrandId);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <View style={[styles.container, { paddingTop: insets.top }]}>
                {selectedBrand ? (
                    <RedeemGiftCard
                        brand={selectedBrand}
                        onBack={() => setSelectedBrandId(null)}
                        maxLimit={balance}
                        currency={currency}
                        onSuccess={onClose}
                    />
                ) : (
                    <>
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={onClose}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.backArrow}>←</Text>
                            </TouchableOpacity>
                            <View style={styles.logoContainer}>
                                <Text style={styles.logoX}>X</Text>
                                <Text style={styles.logoCard}>CARD</Text>
                            </View>
                            <View style={styles.headerSpacer} />
                        </View>

                        {/* Balance Card */}
                        <View style={styles.balanceCard}>
                            <Text style={styles.balanceLabel}>Available Balance:</Text>
                            <Text style={styles.balanceValue}>
                                {balance} {currency}
                            </Text>
                        </View>

                        {/* Search Bar */}
                        <View style={styles.searchContainer}>
                            <Text style={styles.searchIcon}>🔍</Text>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search for brands..."
                                placeholderTextColor="#999999"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        {/* Brand List */}
                        {loading ? (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <ActivityIndicator size="large" color={Colors.brandGreen} />
                            </View>
                        ) : (
                            <FlatList
                                data={filteredBrands}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <BrandListItem
                                        brand={item}
                                        isSelected={selectedBrandId === item.id}
                                        onSelect={() => handleBrandSelect(item.id)}
                                    />
                                )}
                                style={styles.brandList}
                                contentContainerStyle={[
                                    styles.brandListContent,
                                    { paddingBottom: insets.bottom + 20 },
                                ]}
                                showsVerticalScrollIndicator={false}
                            />
                        )}
                    </>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backArrow: {
        fontSize: 20,
        color: '#000000',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoX: {
        fontSize: 24,
        fontFamily: Typography.integral.bold,
        color: Colors.brandGreen,
    },
    logoCard: {
        fontSize: 24,
        fontFamily: Typography.integral.bold,
        color: '#000000',
    },
    headerSpacer: {
        width: 40,
    },
    balanceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8F8F8',
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 12,
    },
    balanceLabel: {
        fontSize: 14,
        fontFamily: Typography.metropolis.medium,
        color: '#666666',
    },
    balanceValue: {
        fontSize: 20,
        fontFamily: Typography.integral.bold,
        color: '#000000',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    searchIcon: {
        fontSize: 16,
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        fontFamily: Typography.metropolis.medium,
        color: '#000000',
        padding: 0,
    },
    brandList: {
        flex: 1,
    },
    brandListContent: {
        paddingHorizontal: 16,
    },
    brandItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        borderRadius: 12,
        marginBottom: 4,
    },
    brandItemSelected: {
        backgroundColor: '#F0F8FF',
        borderWidth: 2,
        borderColor: '#007AFF',
        borderBottomWidth: 2,
    },
    brandLogo: {
        width: 48,
        height: 48,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        overflow: 'hidden',
    },
    brandLogoImage: {
        width: '100%',
        height: '100%',
    },
    brandLogoPlaceholder: {
        fontSize: 18,
        fontFamily: Typography.metropolis.semiBold,
        color: '#FFFFFF',
    },
    brandName: {
        fontSize: 15,
        fontFamily: Typography.metropolis.medium,
        color: '#000000',
        flex: 1,
    },
});
