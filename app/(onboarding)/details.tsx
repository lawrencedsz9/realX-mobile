import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { getAuth } from '@react-native-firebase/auth';
import { doc, getFirestore, serverTimestamp, setDoc } from '@react-native-firebase/firestore';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import PhonkText from '../../components/PhonkText';





export default function DetailsOnboarding() {
    const router = useRouter();
    const params = useLocalSearchParams<{ email?: string; role?: string }>();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dob, setDob] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [gender, setGender] = useState<'Male' | 'Female' | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleContinue = async () => {
        if (!isFormValid || isLoading) return;

        setIsLoading(true);
        try {
            const authInstance = getAuth();
            const user = authInstance.currentUser;
            if (!user) {
                throw new Error('No authenticated user found');
            }

            const role = params.role || 'student';

            const studentData: any = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                dob: dob ? dob.toISOString().split('T')[0] : '', // Format: YYYY-MM-DD
                gender,
                email: params.email || user.email,
                role: role,
                cashback: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                uid: user.uid,
            };

            const db = getFirestore();
            await setDoc(doc(db, 'students', user.uid), studentData);

            if (role === 'creator') {
                const functions = getFunctions(undefined, 'me-central1');
                const assignCode = httpsCallable(functions, 'assignCreatorCode');
                await assignCode();
            }

            console.log('Student details saved successfully!');
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error('Error saving student details:', error);
            Alert.alert('Error', error.message || 'Failed to save details. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        router.back();
    };

    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setDob(selectedDate);
        }
    };

    const formatDate = (date: Date | null) => {
        if (!date) return 'Date of Birth (DD/MM/YYYY)';
        return date.toLocaleDateString('en-GB');
    };

    const isFormValid = firstName.trim() && lastName.trim() && dob && gender && !isLoading;

    return (
        <View style={[styles.container, { backgroundColor: Colors.brandGreen }]}>
            <StatusBar style="light" />

            {/* Header / Background Section */}
            <View style={styles.headerBackground}>
                <SafeAreaView edges={['top']} style={styles.headerContent}>
                    <View style={styles.topButtons}>
                        <TouchableOpacity
                            onPress={handleBack}
                            style={[styles.iconButton, { opacity: 0 }]}
                            disabled={true}
                        >
                            <Ionicons name="arrow-back" size={24} color="black" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.replace('/')}
                            style={[styles.iconButton, { opacity: 0 }]}
                            disabled={true}
                        >
                            <Ionicons name="close" size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>

            {/* Main Content Card */}
            <View style={[styles.cardContainer, { backgroundColor: '#FFFFFF' }]}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.card}>
                            <View style={styles.textContainer}>
                                <PhonkText style={styles.titleLine}>
                                    <Text style={styles.blackText}>ENTER YOUR</Text>
                                </PhonkText>
                                <PhonkText style={styles.titleLine}>
                                    <Text style={styles.greenText}>DETAILS</Text>
                                </PhonkText>
                            </View>

                            <View style={styles.formContainer}>
                                <View style={styles.row}>
                                    <View style={[styles.inputContainer, { flex: 1, marginRight: 10, backgroundColor: '#F3F3F3' }]}>
                                        <TextInput
                                            style={[styles.input, { color: '#000000' }]}
                                            placeholder="First Name"
                                            placeholderTextColor="#999999"
                                            value={firstName}
                                            onChangeText={setFirstName}
                                            editable={!isLoading}
                                        />
                                    </View>
                                    <View style={[styles.inputContainer, { flex: 1, backgroundColor: '#F3F3F3' }]}>
                                        <TextInput
                                            style={[styles.input, { color: '#000000' }]}
                                            placeholder="Last Name"
                                            placeholderTextColor="#999999"
                                            value={lastName}
                                            onChangeText={setLastName}
                                            editable={!isLoading}
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.inputContainer, { backgroundColor: '#F3F3F3' }]}
                                    onPress={() => {
                                        Keyboard.dismiss();
                                        setShowDatePicker(true);
                                    }}
                                    disabled={isLoading}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.input, !dob && { color: '#00000' }]}>
                                        {formatDate(dob)}
                                    </Text>
                                </TouchableOpacity>

                                {showDatePicker && (
                                    <View style={Platform.OS === 'ios' ? styles.iosPickerContainer : null}>
                                        {Platform.OS === 'ios' && (
                                            <View style={styles.pickerHeader}>
                                                <TouchableOpacity
                                                    onPress={() => setShowDatePicker(false)}
                                                    style={styles.doneButtonStyle}
                                                >
                                                    <Text style={styles.doneButtonText}>Done</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                        <DateTimePicker
                                            value={dob || new Date(2000, 0, 1)}
                                            mode="date"
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={onDateChange}
                                            maximumDate={new Date()}
                                            textColor="black"
                                        />
                                    </View>
                                )}

                                <View style={styles.genderContainer}>
                                    <Text style={styles.label}>Gender</Text>
                                    <View style={styles.genderOptions}>
                                        <TouchableOpacity
                                            style={[styles.genderButton, { backgroundColor: '#F3F3F3' }, gender === 'Male' && styles.genderButtonSelected]}
                                            onPress={() => setGender('Male')}
                                            disabled={isLoading}
                                        >
                                            <Text style={[styles.genderText, gender === 'Male' && styles.genderTextSelected]}>Male</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.genderButton, { backgroundColor: '#F3F3F3' }, gender === 'Female' && styles.genderButtonSelected]}
                                            onPress={() => setGender('Female')}
                                            disabled={isLoading}
                                        >
                                            <Text style={[styles.genderText, gender === 'Female' && styles.genderTextSelected]}>Female</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={20}
                        style={styles.footer}
                    >
                        <TouchableOpacity
                            style={[styles.button, !isFormValid && styles.buttonDisabled]}
                            onPress={handleContinue}
                            disabled={!isFormValid}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonText}>{isLoading ? 'Saving...' : 'Continue'}</Text>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.brandGreen,
    },
    headerBackground: {
        height: 250,
        backgroundColor: Colors.brandGreen,
    },
    headerContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    topButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 1)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardContainer: {
        flex: 1,
        backgroundColor: 'white',
        borderTopLeftRadius: 50,
        borderTopRightRadius: 50,
        marginTop: -80,
        paddingHorizontal: 30,
        paddingTop: 40,
    },
    card: {
        flex: 1,
    },
    textContainer: {
        marginBottom: 30,
        alignItems: 'center',
    },
    titleLine: {
        fontSize: 32,
        textAlign: 'center',
        lineHeight: 38,
    },
    greenText: {
        color: Colors.brandGreen,
    },
    blackText: {
    },
    formContainer: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    inputContainer: {
        backgroundColor: '#F3F3F3',
        borderRadius: 30,
        height: 60,
        justifyContent: 'center',
        paddingHorizontal: 25,
        marginBottom: 15,
    },
    input: {
        fontSize: 16,
        fontFamily: Typography.poppins.medium,
    },
    genderContainer: {
        marginTop: 10,
    },
    label: {
        fontSize: 16,
        fontFamily: Typography.poppins.medium,
        marginBottom: 10,
        marginLeft: 10,
    },
    genderOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    genderButton: {
        flex: 1,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F3F3F3',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    genderButtonSelected: {
        backgroundColor: 'rgba(52, 168, 83, 0.1)',
        borderColor: Colors.brandGreen,
    },
    genderText: {
        fontSize: 16,
        fontFamily: Typography.poppins.medium,
    },
    genderTextSelected: {
        color: Colors.brandGreen,
        fontFamily: Typography.poppins.semiBold,
    },
    footer: {
        paddingBottom: 40,
    },
    button: {
        backgroundColor: Colors.brandGreen,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: Typography.poppins.medium,
    },
    iosPickerContainer: {
        backgroundColor: '#F3F3F3',
        borderRadius: 20,
        marginBottom: 15,
        overflow: 'hidden',
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 15,
        paddingTop: 10,
        backgroundColor: '#F3F3F3',
    },
    doneButtonStyle: {
        padding: 5,
    },
    doneButtonText: {
        color: Colors.brandGreen,
        fontFamily: Typography.poppins.semiBold,
        fontSize: 16,
    },
});
