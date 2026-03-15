import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, TextInput, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useTheme } from '../../context/ThemeContext';

type Props = {
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    onSubmit?: () => void;
};

export default function SearchBar({ placeholder = 'Search for anything...', value, onChangeText, onSubmit }: Props) {
    const { theme } = useTheme();

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={Colors.brandGreen} style={styles.icon} />
                <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder={placeholder}
                    placeholderTextColor={theme.subtitle}
                    value={value}
                    onChangeText={onChangeText}
                    returnKeyType="search"
                    onSubmitEditing={onSubmit}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontFamily: Typography.metropolis.medium,
        padding: 0,
    },
});
