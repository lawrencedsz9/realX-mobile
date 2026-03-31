import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../constants/Typography';

export default function TermsScreen() {
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
                <Text style={styles.headerTitle}>Terms and Conditions</Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <Text style={styles.lastUpdated}>Last updated: October 2023</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Introduction</Text>
                    <Text style={styles.paragraph}>
                        Welcome to ReelX. These Terms and Conditions govern your use of our application and services. By accessing or using ReelX, you agree to be bound by these terms.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Use of Services</Text>
                    <Text style={styles.paragraph}>
                        You must be at least 18 years old to use this service. You agree to use ReelX only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else&apos;s use and enjoyment of ReelX.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Account Registration</Text>
                    <Text style={styles.paragraph}>
                        To access certain features, you may be required to register for an account. You represent and warrant that all registration information you submit is truthful and accurate.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Intellectual Property</Text>
                    <Text style={styles.paragraph}>
                        The content, organization, graphics, design, and other matters related to ReelX are protected under applicable copyrights and other proprietary laws.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. Limitation of Liability</Text>
                    <Text style={styles.paragraph}>
                        ReelX shall not be liable for any indirect, incidental, special, consequential or punitive damages, or any loss of profits or revenues.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>6. Changes to Terms</Text>
                    <Text style={styles.paragraph}>
                        We reserve the right to modify these terms at any time. Your continued use of ReelX after any such changes constitutes your acceptance of the new Terms and Conditions.
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
