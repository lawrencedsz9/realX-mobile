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
                <Text style={styles.lastUpdated}>Last Updated: March 11, 2026</Text>

                <View style={styles.section}>
                    <Text style={styles.paragraph}>
                        Welcome to RealX! Realx for Software LLC (RealX, we, us, or our) provides the RealX mobile application, website, and related services (collectively, the Services). RealX is a software platform that helps brands verify student status and provide targeted offers, discounts, and promotions to eligible students. Our platform is designed to connect students with verified offers while providing brands with anonymized analytics to understand offer engagement. By accessing or using the Services, you agree to these Terms and Conditions (Terms). If you do not agree with any part of these Terms, you should not use the Services.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Eligibility and Account Creation</Text>
                    <Text style={styles.paragraph}>
                        To use RealX, you must be a student. The platform is intended for students of all ages, including minors under the age of 18. If you are under 18, you must have a parent or guardian review these Terms and provide explicit consent for you to create an account and use the Services. Parents or guardians are responsible for supervising minors’ use of the Services and agreeing to these Terms on their behalf.
                    </Text>
                    <Text style={styles.paragraph}>
                        When creating an account, you must provide accurate, complete, and truthful information. This includes your name, email address, school or university, and any student verification details requested by RealX. Your parent or guardian may assist you in providing this information. You are responsible for keeping your account information updated if it changes. Misrepresentation or false information can result in account suspension or termination.
                    </Text>
                    <Text style={styles.paragraph}>
                        You are responsible for maintaining the confidentiality of your account credentials, including your username and password. You agree to notify us immediately if you suspect any unauthorized use of your account. RealX reserves the right to suspend, disable, or terminate your account at any time if we detect fraudulent activity, misuse of the platform, multiple accounts attempting to exploit offers, or any other violations of these Terms.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Using the Services and Offers</Text>
                    <Text style={styles.paragraph}>
                        RealX provides access to discounts, promotions, and special offers from our merchant partners. RealX acts solely as a software platform that verifies student eligibility and provides analytics to the merchants. We do not control the content, availability, or fulfillment of any offer, and we are not responsible for any issues, delays, or disputes arising from the offers themselves.
                    </Text>
                    <Text style={styles.paragraph}>
                        All offers are provided and managed entirely by the merchants. Each merchant sets the terms, conditions, and availability of their offers. It is the merchant’s responsibility to honor the offers, deliver the products or services, and address any complaints or issues. You agree that RealX cannot be held liable for the accuracy, fulfillment, quality, or reliability of any offer provided by a merchant.
                    </Text>
                    <Text style={styles.paragraph}>
                        You may browse offers, redeem them if eligible, and track your usage within the RealX platform. Misuse of offers, including using multiple accounts to redeem the same offer, sharing student verification with non-eligible users, or attempting to manipulate the system, is strictly prohibited. Any such misuse may result in suspension or termination of your account. You also agree to treat merchants, RealX staff, and other users respectfully and refrain from any fraudulent, abusive, or harassing behavior.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Parental Consent and Responsibilities</Text>
                    <Text style={styles.paragraph}>
                        For users under 18, parental or guardian consent is required. Parents or guardians may review, correct, or delete their child’s account information and may request account suspension or termination at any time. Parents/guardians are responsible for ensuring that their child uses the Services appropriately, in compliance with these Terms. Any action taken by a minor using the Services is the responsibility of the parent or guardian.
                    </Text>
                    <Text style={styles.paragraph}>
                        Parents/guardians are encouraged to discuss the use of the platform with their child and monitor offer usage. Parents should understand that RealX is a software verification platform and does not guarantee the fulfillment or quality of any merchant offer.
                    </Text>
                    <Text style={styles.paragraph}>
                        There is zero tolerance for objectionable content or abusive users
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Privacy, Data Collection, and Analytics</Text>
                    <Text style={styles.paragraph}>
                        Your use of RealX is also governed by our Privacy Policy, which explains how we collect, store, and share personal information. We collect information you provide directly, such as your name, email, school or university, student verification documents, and account preferences. Additionally, some information may be collected automatically, including your device type, IP address, app usage, and location data. This information helps us maintain security, improve the platform, and detect fraudulent activity.
                    </Text>
                    <Text style={styles.paragraph}>
                        RealX provides anonymized or aggregated analytics to merchants to help them understand how their offers are used. No personally identifiable information of minors is shared with merchants without parental consent. By using the platform, you consent to the collection, processing, and sharing of data as described in our Privacy Policy.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Intellectual Property</Text>
                    <Text style={styles.paragraph}>
                        All content provided through RealX, including graphics, text, logos, app design, and software, is owned by RealX or its licensors. You are granted a limited, non-exclusive license to access and use the Services for personal use. You may not copy, distribute, reproduce, modify, or create derivative works from the content without our prior written consent.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Limitation of Liability</Text>
                    <Text style={styles.paragraph}>
                        The Services are provided on an “as is” and “as available” basis. RealX makes no guarantees regarding the availability, accuracy, or reliability of merchant offers. RealX is not responsible for any loss, damage, or disputes arising from the use of the Services, including the failure of a merchant to fulfill an offer, delays, or inaccuracies. By using the platform, you agree that you are doing so at your own risk. In no event shall RealX be liable for any indirect, incidental, or consequential damages.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Termination</Text>
                    <Text style={styles.paragraph}>
                        RealX may suspend or terminate your account at any time for violations of these Terms, fraudulent activity, misuse of the Services, or legal/regulatory reasons. You may request account termination at any time by contacting info@realx.qa. Upon termination, access to your account will end, but RealX may retain information as required for legal, regulatory, or fraud-prevention purposes.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Updates to Terms</Text>
                    <Text style={styles.paragraph}>
                        RealX may update these Terms periodically to reflect changes in the Services, legal requirements, or platform improvements. Updates will be indicated by the “Last Updated” date at the top. Continued use of the platform after an update constitutes your acceptance of the revised Terms.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Governing Principles</Text>
                    <Text style={styles.paragraph}>
                        These Terms are governed by general principles of international technology and commercial law. Users agree to attempt to resolve disputes through communication, mediation, or arbitration wherever possible.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>
                    <Text style={styles.paragraph}>
                        If you have questions about these Terms or your account, you can contact us at:
                    </Text>
                    <Text style={styles.paragraph}>
                        Realx for Software LLC{"\n"}
                        Email: info@realx.qa
                    </Text>
                    <Text style={styles.paragraph}>
                        Parents/guardians may contact us regarding accounts of minors at the same address.
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
        fontFamily: Typography.metropolis.semiBold,
        color: '#000',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 40,
    },
    lastUpdated: {
        fontSize: 14,
        fontFamily: Typography.metropolis.medium,
        color: '#999',
        marginBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Typography.metropolis.semiBold,
        color: '#000',
        marginBottom: 12,
    },
    paragraph: {
        fontSize: 16,
        fontFamily: Typography.metropolis.medium,
        color: '#666',
        lineHeight: 24,
    },
});
