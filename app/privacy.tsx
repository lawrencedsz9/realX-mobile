import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../constants/Typography';

export default function PrivacyScreen() {
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <Text style={styles.lastUpdated}>Last updated: October 2023</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Data Collection</Text>
                    <Text style={styles.paragraph}>
                        We collect information that you provide directly to us when you create an account, update your profile, or use our services. This may include your name, email address, phone number, and date of birth.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. How We Use Your Data</Text>
                    <Text style={styles.paragraph}>
                        We use the information we collect to provide, maintain, and improve our services, to process your transactions, and to communicate with you about realX updates and promotions.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Data Sharing</Text>
                    <Text style={styles.paragraph}>
                        We do not share your personal information with third parties except as described in this policy, such as with your consent or to comply with legal obligations.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Data Security</Text>
                    <Text style={styles.paragraph}>
                        We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. Your Choices</Text>
                    <Text style={styles.paragraph}>
                        You may update or correct your account information at any time by logging into your account or contacting us. You can also request the deletion of your account.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>6. Contact Us</Text>
                    <Text style={styles.paragraph}>
                        If you have any questions about this Privacy Policy, please contact us at support@realx.qa.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
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
        paddingHorizontal: 20,
        paddingVertical: 15,
        gap: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: Typography.poppins.semiBold,
        color: '#000',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 40,
    },
    lastUpdated: {
        fontSize: 14,
        fontFamily: Typography.poppins.medium,
        color: '#999',
        marginBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Typography.poppins.semiBold,
        color: '#000',
        marginBottom: 12,
    },
    paragraph: {
        fontSize: 16,
        fontFamily: Typography.poppins.medium,
        color: '#666',
        lineHeight: 24,
    },
});
