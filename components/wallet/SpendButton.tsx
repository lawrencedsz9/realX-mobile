import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

type Props = {
    onPress?: () => void;
};

export default function SpendButton({ onPress }: Props) {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.button}
                onPress={onPress}
                activeOpacity={0.85}
            >
                <Text style={styles.lightningIcon}>⚡</Text>
                <Text style={styles.buttonText}>SPEND THE CARD</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    button: {
        backgroundColor: Colors.brandGreen,
        borderRadius: 30,
        paddingVertical: 18,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.brandGreen,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    lightningIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    buttonText: {
        fontSize: 16,
        fontFamily: Typography.phonk.bold,
        color: '#FFFFFF',
        letterSpacing: 1,
    },
});
