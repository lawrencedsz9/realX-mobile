import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { deleteUser, getAuth, updateProfile } from '@react-native-firebase/auth';
import { doc, getDoc, getFirestore, updateDoc } from '@react-native-firebase/firestore';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import PhonkText from '../components/PhonkText';
import { useResponsive } from '../hooks/useResponsive';
import { ResponsiveContainer } from '../components/ResponsiveContainer';

export default function ProfileDetailsScreen() {
    const { isTablet, horizontalPadding } = useResponsive();
    const router = useRouter();
    const BRAND_GREEN = Colors.brandGreen;

    // Form states
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [dob, setDob] = useState<Date | null>(null);
    const [photoURL, setPhotoURL] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        const authInstance = getAuth();
        const user = authInstance.currentUser;
        if (!user) {
            router.replace('/(onboarding)');
            return;
        }

        const fetchUserData = async () => {
            try {
                const db = getFirestore();
                const studentDocRef = doc(db, 'students', user.uid);
                const docSnap = await getDoc(studentDocRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFirstName(data?.firstName || '');
                    setLastName(data?.lastName || '');
                    setEmail(data?.email || user.email || '');
                    setPhotoURL(data?.photoURL || user.photoURL || null);
                    if (data?.dob) {
                        try {
                            if (data.dob.includes('-')) {
                                const [year, month, day] = data.dob.split('-').map(Number);
                                setDob(new Date(year, month - 1, day));
                            } else if (data.dob.includes('/')) {
                                const [day, month, year] = data.dob.split('/').map(Number);
                                setDob(new Date(year, month - 1, day));
                            }
                        } catch (e) {
                            console.error('Date parsing error:', e);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                Alert.alert('Error', 'Failed to load profile data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleBack = () => {
        router.back();
    };

    const formatDate = (date: Date | null) => {
        if (!date) return 'DD/MM/YYYY';
        return date.toLocaleDateString('en-GB');
    };

    const handleToggleEdit = () => {
        if (isEditing) {
            handleSave();
        } else {
            setIsEditing(true);
        }
    };

    const handleSave = async () => {
        const authInstance = getAuth();
        const user = authInstance.currentUser;
        if (!user) return;

        setIsSaving(true);
        try {
            const db = getFirestore();
            const studentDocRef = doc(db, 'students', user.uid);

            const updatedData = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                dob: dob ? dob.toISOString().split('T')[0] : '',
                updatedAt: new Date(),
            };

            await updateDoc(studentDocRef, updatedData);

            await updateProfile(user, {
                displayName: `${firstName.trim()} ${lastName.trim()}`
            });

            setIsEditing(false);
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Permanently',
                    style: 'destructive',
                    onPress: async () => {
                        const authInstance = getAuth();
                        const user = authInstance.currentUser;
                        if (!user) return;

                        setIsLoading(true);
                        try {
                            // The "Delete User Data" extension is triggered by the Auth user deletion
                            await deleteUser(user);
                            
                            // Explicitly sign out to clear any local session data
                            // This may throw if the user is already deleted, which is expected
                            try {
                                await authInstance.signOut();
                            } catch (_) {
                                // User already deleted, sign out is a no-op
                            }
                            
                            Alert.alert('Account Deleted', 'Your account and data have been successfully removed.');
                            router.replace('/(onboarding)');
                        } catch (error: any) {
                            console.error('Error deleting account:', error);
                            if (error.code === 'auth/requires-recent-login') {
                                Alert.alert(
                                    'Security Re-authentication Required',
                                    'For security reasons, deleting your account requires a recent login. Please log out and log back in, then try again.',
                                    [{ text: 'OK' }]
                                );
                            } else {
                                Alert.alert('Error', 'Failed to delete account. Please try again later.');
                            }
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDob(selectedDate);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors.light.background }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
                </TouchableOpacity>
                <PhonkText style={styles.headerTitle}>DETAILS</PhonkText>
                <TouchableOpacity onPress={handleToggleEdit} style={styles.editButton}>
                    <PhonkText style={[styles.editButtonText, isEditing && { color: BRAND_GREEN }]}>
                        {isEditing ? 'SAVE' : 'EDIT'}
                    </PhonkText>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingHorizontal: horizontalPadding }
                    ]}
                >
                    <ResponsiveContainer>
                    {/* Profile Image Section */}
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatarMain, { backgroundColor: '#F5F5F7' }]}>
                            {photoURL ? (
                                <Image source={{ uri: photoURL }} style={styles.avatarImage} />
                            ) : (
                                <Ionicons name="person" size={80} color="#E0E0E0" />
                            )}
                        </View>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.form}>
                        {isLoading || isSaving ? (
                            <ActivityIndicator size="large" color={BRAND_GREEN} style={{ marginTop: 20 }} />
                        ) : (
                            <>
                                {/* First Name Field */}
                                <View style={styles.inputGroup}>
                                    <PhonkText style={styles.label}>FIRST NAME</PhonkText>
                                    <View style={[styles.inputWrapper, !isEditing && styles.disabledInput]}>
                                        <TextInput
                                            style={[styles.input, !isEditing && styles.disabledText, { color: Colors.light.text }]}
                                            value={firstName}
                                            onChangeText={setFirstName}
                                            editable={isEditing}
                                            placeholder="First name"
                                            placeholderTextColor="#999"
                                        />
                                    </View>
                                </View>

                                {/* Last Name Field */}
                                <View style={styles.inputGroup}>
                                    <PhonkText style={styles.label}>LAST NAME</PhonkText>
                                    <View style={[styles.inputWrapper, !isEditing && styles.disabledInput]}>
                                        <TextInput
                                            style={[styles.input, !isEditing && styles.disabledText, { color: Colors.light.text }]}
                                            value={lastName}
                                            onChangeText={setLastName}
                                            editable={isEditing}
                                            placeholder="Last name"
                                            placeholderTextColor="#999"
                                        />
                                    </View>
                                </View>

                                {/* Email Field */}
                                <View style={styles.inputGroup}>
                                    <PhonkText style={styles.label}>EMAIL ADDRESS</PhonkText>
                                    <View style={[styles.inputWrapper, styles.disabledInput]}>
                                        <TextInput
                                            style={[styles.input, styles.disabledText, { color: Colors.light.text }]}
                                            value={email}
                                            editable={false}
                                            placeholder="Email address"
                                            placeholderTextColor="#999"
                                        />
                                    </View>
                                </View>

                                {/* Date of Birth Field */}
                                <View style={styles.inputGroup}>
                                    <PhonkText style={styles.label}>DATE OF BIRTH</PhonkText>
                                    <TouchableOpacity
                                        style={[styles.inputWrapper, !isEditing && styles.disabledInput]}
                                        onPress={() => isEditing && setShowDatePicker(true)}
                                        disabled={!isEditing}
                                    >
                                        <Text style={[styles.input, !isEditing && styles.disabledText, !dob && { color: '#999' }]}>
                                            {formatDate(dob)}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {showDatePicker && (
                                    <DateTimePicker
                                        value={dob || new Date(2000, 0, 1)}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={onDateChange}
                                        maximumDate={new Date()}
                                        textColor="black"
                                    />
                                )}
                            </>
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                        <TouchableOpacity 
                            style={styles.deleteAccountPill} 
                            onPress={handleDeleteAccount}
                            activeOpacity={0.7}
                        >
                            <View style={styles.deleteContent}>
                                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                <PhonkText style={styles.deleteAccountText}>DELETE ACCOUNT</PhonkText>
                            </View>
                        </TouchableOpacity>
                    </View>
                    </ResponsiveContainer>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        gap: 16,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F5F5F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        flex: 1,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    editButton: {
        backgroundColor: '#F5F5F7',
        borderRadius: 24,
        paddingVertical: 10,
        paddingHorizontal: 20,
        
    },
    editButtonText: {
        fontSize: 14,
    },
    scrollContent: {
        paddingTop: 20,
        paddingBottom: 40,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarMain: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 4,
        borderColor: '#F5F5F7',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    form: {
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 12,
        color: '#8E8E93',
        paddingLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
        borderRadius: 24,
        paddingHorizontal: 20,
        height: 60,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontFamily: Typography.poppins.semiBold,
    },
    disabledInput: {
        opacity: 0.8,
    },
    disabledText: {
        color: '#8E8E93',
    },
    actions: {
        marginTop: 24,
    },
    deleteAccountPill: {
        backgroundColor: '#FFF1F0',
        borderRadius: 30,
        paddingVertical: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFD5D2',
    },
    deleteContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    deleteAccountText: {
        fontSize: 14,
        color: '#FF3B30',
    },
});
