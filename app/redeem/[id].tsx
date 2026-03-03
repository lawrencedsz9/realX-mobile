
import Ionicons from '@expo/vector-icons/Ionicons';
import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

export default function RedeemScreen() {
    const { id, vendorId } = useLocalSearchParams<{ id: string; vendorId: string }>();
    const router = useRouter();
    const [vendor, setVendor] = useState<any>(null);
    const [offer, setOffer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState<'creator' | 'pin'>('creator');
    const [creatorCode, setCreatorCode] = useState('');
    const [pin, setPin] = useState('');
    const [amount, setAmount] = useState('80');
    const pinInputRef = useRef<TextInput>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!id || !vendorId) return;
            try {
                const db = getFirestore();

                // Fetch Vendor
                const vendorRef = doc(db, 'vendors', vendorId);
                const vendorSnap = await getDoc(vendorRef);
                if (vendorSnap.exists()) {
                    setVendor(vendorSnap.data());
                }

                // Fetch Offer
                const offerRef = doc(db, 'offers', id);
                const offerSnap = await getDoc(offerRef);
                if (offerSnap.exists()) {
                    setOffer(offerSnap.data());
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, vendorId]);

    const handleAction = () => {
        if (step === 'creator') {
            setStep('pin');
        } else {
            // Logic for redemption will go here
            console.log(`Redeeming with PIN: ${pin}, Amount: ${amount}, Creator: ${creatorCode}`);

            if (creatorCode) {
                Alert.alert('Success', 'Redemption successful');
            }
            // router.push('/redeem/success');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.brandGreen} />
            </View>
        );
    }

    if (!vendor || !offer) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Information not found</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backLink}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        if (step === 'pin') setStep('creator');
                        else router.back();
                    }}
                >
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {/* Offer Card */}
                <View style={styles.offerCardWrapper}>
                    <View style={styles.offerCard}>
                        {/* View T&C */}
                        <TouchableOpacity style={styles.tcButton}>
                            <Ionicons name="information-circle-outline" size={18} color="#888" />
                            <Text style={styles.tcText}>View T&C</Text>
                        </TouchableOpacity>

                        <Text style={styles.offerTitle}>
                            FLAT <Text style={styles.greenText}>
                                {offer.discountValue}{offer.discountType === 'percentage' ? '%' : ''}
                            </Text> OFF
                        </Text>
                        <Text style={styles.offerSubtitle}>In-store</Text>
                    </View>

                    {/* Logo Overlay */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={{ uri: vendor.profilePicture }}
                            style={styles.logoImage}
                            contentFit="contain"
                        />
                    </View>
                </View>

                {/* Conditional Cards based on Step */}
                {step === 'creator' && (
                    <View style={styles.creatorCard}>
                        <Text style={styles.inputLabel}>
                            Have a creator code? <Text style={styles.optionalText}>(Optional)</Text>
                        </Text>
                        <View style={styles.creatorInputContainer}>
                            <TextInput
                                style={styles.creatorInput}
                                value={creatorCode}
                                onChangeText={setCreatorCode}
                                placeholder="MRBEAST6000"
                                placeholderTextColor="#CCC"
                                autoCapitalize="characters"
                            />
                        </View>
                    </View>
                )}

                {step === 'pin' && (
                    <View style={styles.redemptionCard}>
                        <Text style={styles.inputLabel}>Enter Vendor PIN:</Text>
                        <TouchableOpacity
                            activeOpacity={1}
                            style={styles.pinContainer}
                            onPress={() => pinInputRef.current?.focus()}
                        >
                            {[0, 1, 2, 3].map((index) => (
                                <View key={index} style={styles.pinBox}>
                                    <Text style={[styles.pinText, pin.length > index && { color: '#000', marginTop: 0 }]}>
                                        {pin.length > index ? '●' : '*'}
                                    </Text>
                                </View>
                            ))}
                        </TouchableOpacity>

                        <TextInput
                            ref={pinInputRef}
                            style={{ position: 'absolute', opacity: 0, height: 0, width: 0 }}
                            value={pin}
                            onChangeText={(text) => {
                                if (text.length <= 4) setPin(text);
                            }}
                            keyboardType="numeric"
                        />

                        <Text style={styles.inputLabel}>Total Paid:</Text>
                        <View style={styles.amountInputContainer}>
                            <Text style={styles.currencyPrefix}>QAR</Text>
                            <TextInput
                                style={styles.amountInput}
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor="#CCC"
                            />
                        </View>
                    </View>
                )}

                {/* Spacer to push button to bottom */}
                <View style={{ flex: 1 }} />

                {/* Action Button */}
                <TouchableOpacity
                    style={styles.redeemButton}
                    activeOpacity={0.9}
                    onPress={handleAction}
                >
                    <Ionicons name="flash" size={20} color="#FFF" />
                    <Text style={styles.redeemButtonText}>
                        {step === 'creator' ? 'CONTINUE' : 'REDEEM'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
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
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        fontFamily: Typography.metropolis.medium,
        marginBottom: 10,
    },
    backLink: {
        color: Colors.brandGreen,
        fontFamily: Typography.metropolis.semiBold,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    backButton: {
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
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 30,
    },
    offerCardWrapper: {
        position: 'relative',
        width: '100%',
        marginTop: 50,
    },
    offerCard: {
        backgroundColor: '#F7F7F7',
        borderRadius: 35,
        paddingTop: 70,
        paddingBottom: 40,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tcButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    tcText: {
        fontSize: 14,
        color: '#888',
        fontFamily: Typography.metropolis.semiBold,
    },
    logoContainer: {
        position: 'absolute',
        top: -50,
        alignSelf: 'center',
        width: 100,
        height: 100,
        borderRadius: 25,
        backgroundColor: '#1E2a38',
        borderWidth: 4,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },
    logoImage: {
        width: '60%',
        height: '60%',
    },
    offerTitle: {
        fontSize: 32,
        fontFamily: Typography.integral.bold,
        color: '#000',
        textAlign: 'center',
    },
    greenText: {
        color: Colors.brandGreen,
    },
    offerSubtitle: {
        fontSize: 16,
        color: '#888',
        fontFamily: Typography.metropolis.medium,
        marginTop: 4,
    },
    redemptionCard: {
        backgroundColor: '#F7F7F7',
        borderRadius: 35,
        padding: 24,
        marginTop: 20,
    },
    inputLabel: {
        fontSize: 16,
        color: '#444',
        fontFamily: Typography.metropolis.semiBold,
        marginBottom: 12,
    },
    pinContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    pinBox: {
        width: 65,
        height: 65,
        backgroundColor: '#FFF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    pinText: {
        fontSize: 30,
        color: '#E0E0E0',
        fontFamily: Typography.metropolis.medium,
        marginTop: 10,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 25,
        height: 55,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    currencyPrefix: {
        fontSize: 16,
        color: '#AAA',
        fontFamily: Typography.metropolis.semiBold,
        marginRight: 10,
    },
    amountInput: {
        flex: 1,
        fontSize: 18,
        color: '#000',
        fontFamily: Typography.metropolis.semiBold,
    },
    redeemButton: {
        backgroundColor: Colors.brandGreen,
        borderRadius: 35,
        height: 65,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 10,
        shadowColor: Colors.brandGreen,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    redeemButtonText: {
        color: '#FFF',
        fontSize: 22,
        fontFamily: Typography.integral.bold,
        letterSpacing: 1,
    },
    creatorCard: {
        backgroundColor: '#F7F7F7',
        borderRadius: 35,
        padding: 24,
        marginTop: 20,
    },
    creatorInputContainer: {
        backgroundColor: '#FFF',
        borderRadius: 25,
        height: 55,
        paddingHorizontal: 20,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    creatorInput: {
        fontSize: 18,
        color: '#000',
        fontFamily: Typography.metropolis.semiBold,
    },
    optionalText: {
        color: '#888',
        fontFamily: Typography.metropolis.medium,
        fontSize: 14,
    },
});

