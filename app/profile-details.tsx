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


export default function ProfileDetailsScreen() {
    const router = useRouter();
    const BRAND_GREEN = Colors.brandGreen;

    // Form states
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [dob, setDob] = useState<Date | null>(null);
    const [gender, setGender] = useState<'Male' | 'Female' | null>(null);
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
                    setGender(data?.gender || null);
                    setPhotoURL(data?.photoURL || user.photoURL || null);
                    if (data?.dob) {
                        // Support both YYYY-MM-DD and DD/MM/YYYY
                        if (data.dob.includes('-')) {
                            const [year, month, day] = data.dob.split('-').map(Number);
                            setDob(new Date(year, month - 1, day));
                        } else {
                            const [day, month, year] = data.dob.split('/').map(Number);
                            setDob(new Date(year, month - 1, day));
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
                gender,
                updatedAt: new Date(),
            };

            await updateDoc(studentDocRef, updatedData);

            // Also update Auth profile display name
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
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const authInstance = getAuth();
                        const user = authInstance.currentUser;
                        if (!user) return;

                        setIsLoading(true);
                        try {
                            // Delete Auth account
                            // The Firebase Delete User Data extension will automatically
                            // handle deleting the user's Firestore data.
                            await deleteUser(user);
                            router.replace('/(onboarding)');
                        } catch (error: any) {
                            console.error('Error deleting account:', error);
                            if (error.code === 'auth/requires-recent-login') {
                                Alert.alert('Error', 'Please log out and log back in to perform this action.');
                            } else {
                                Alert.alert('Error', 'Failed to delete account');
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
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile Details</Text>
                <TouchableOpacity onPress={handleToggleEdit} style={styles.editButton}>
                    <Text style={[styles.editButtonText, isEditing && { color: BRAND_GREEN }]}>
                        {isEditing ? 'Save' : 'Edit'}
                    </Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Profile Image Section */}
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarMain}>
                            {photoURL ? (
                                <Image source={{ uri: photoURL }} style={styles.avatarMain} />
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
                                    <Text style={styles.label}>First Name</Text>
                                    <View style={[styles.inputWrapper, !isEditing && styles.disabledInput]}>
                                        <TextInput
                                            style={[styles.input, !isEditing && styles.disabledText]}
                                            value={firstName}
                                            onChangeText={setFirstName}
                                            editable={isEditing}
                                            placeholder="First name"
                                        />
                                    </View>
                                </View>

                                {/* Last Name Field */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Last Name</Text>
                                    <View style={[styles.inputWrapper, !isEditing && styles.disabledInput]}>
                                        <TextInput
                                            style={[styles.input, !isEditing && styles.disabledText]}
                                            value={lastName}
                                            onChangeText={setLastName}
                                            editable={isEditing}
                                            placeholder="Last name"
                                        />
                                    </View>
                                </View>

                                {/* Email Field */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Email</Text>
                                    <View style={[styles.inputWrapper, styles.disabledInput]}>
                                        <TextInput
                                            style={[styles.input, styles.disabledText]}
                                            value={email}
                                            editable={false}
                                            placeholder="Email address"
                                        />
                                    </View>
                                </View>

                                {/* Date of Birth Field */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Date of Birth</Text>
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
                                    />
                                )}

                                {/* Gender Field */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Gender</Text>
                                    <View style={styles.genderOptions}>
                                        <TouchableOpacity
                                            style={[
                                                styles.genderButton,
                                                gender === 'Male' && styles.genderButtonSelected,
                                                !isEditing && styles.disabledGenderButton
                                            ]}
                                            onPress={() => isEditing && setGender('Male')}
                                            disabled={!isEditing}
                                        >
                                            <Text style={[styles.genderText, gender === 'Male' && styles.genderTextSelected]}>Male</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.genderButton,
                                                gender === 'Female' && styles.genderButtonSelected,
                                                !isEditing && styles.disabledGenderButton
                                            ]}
                                            onPress={() => isEditing && setGender('Female')}
                                            disabled={!isEditing}
                                        >
                                            <Text style={[styles.genderText, gender === 'Female' && styles.genderTextSelected]}>Female</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actions}>

                        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                            <Text style={styles.deleteButtonText}>Delete Account</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
        flex: 1,
        textAlign: 'center',
    },
    editButton: {
        paddingHorizontal: 10,
    },
    editButtonText: {
        fontSize: 18,
        fontFamily: Typography.metropolis.semiBold,
        color: '#000',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 30,
        paddingBottom: 40,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 40,
        position: 'relative',
        alignSelf: 'center',
    },
    avatarMain: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#F9F9F9',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    uploadButton: {
        position: 'absolute',
        bottom: 0,
        right: 5,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    form: {
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 18,
        fontFamily: Typography.metropolis.semiBold,
        color: '#000',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        borderRadius: 24,
        paddingHorizontal: 20,
        height: 56,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontFamily: Typography.metropolis.medium,
        color: '#000',
    },
    disabledInput: {
        backgroundColor: '#F3F3F3',
    },
    disabledText: {
        color: '#999',
    },
    genderOptions: {
        flexDirection: 'row',
        gap: 12,
    },
    genderButton: {
        flex: 1,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F9F9F9',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    genderButtonSelected: {
        backgroundColor: 'rgba(24, 184, 82, 0.1)',
        borderColor: '#18B852',
    },
    disabledGenderButton: {
        backgroundColor: '#F3F3F3',
    },
    genderText: {
        fontSize: 16,
        fontFamily: Typography.metropolis.medium,
        color: '#000',
    },
    genderTextSelected: {
        color: '#18B852',
        fontFamily: Typography.metropolis.semiBold,
    },

    actions: {
        marginTop: 40,
        gap: 20,
    },
    saveButton: {
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 18,
        fontFamily: Typography.metropolis.semiBold,
        color: '#FFF',
    },
    deleteButton: {
        alignItems: 'flex-start',
    },
    deleteButtonText: {
        fontSize: 16,
        fontFamily: Typography.metropolis.medium,
        color: '#FF3B30',
    },
});
