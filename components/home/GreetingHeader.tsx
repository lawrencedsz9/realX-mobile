import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useResponsive } from '../../hooks/useResponsive';

type Props = {
    userName: string;
};

export default function GreetingHeader({ userName }: Props) {
    const { horizontalPadding } = useResponsive();
    return (
        <View style={[styles.container, { paddingHorizontal: horizontalPadding }]}>
            <View style={styles.textContainer}>
                <Text style={[{ color: '#000', fontFamily: Typography.poppins.medium }, styles.greeting]}>
                    Hey <Text style={[{ color: Colors.brandGreen, fontFamily: Typography.poppins.medium }, styles.userName]}>{userName}</Text>,
                </Text>
                <Text style={[{ color: '#000', fontFamily: Typography.poppins.medium }, styles.subtitle]}>Ready to save?</Text>
            </View>
            <TouchableOpacity
                style={styles.avatarContainer}
                activeOpacity={0.8}
            >
                <View style={[styles.avatarPlaceholder, { backgroundColor: '#F0F0F0' }]}>
                    <Image
                        source={require('../../assets/images/user.png')}
                        style={styles.avatarImage}
                    />
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        paddingBottom: 12,
    },
    textContainer: {
        flex: 1,
    },
    greeting: {
        fontSize: 28,
        fontFamily: Typography.poppins.semiBold,
    },
    userName: {
        color: Colors.brandGreen,
        fontFamily: Typography.poppins.semiBold,
    },
    subtitle: {
        fontSize: 28,
        fontFamily: Typography.poppins.semiBold,
    },
    avatarContainer: {
        width: 60,
        height: 60,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: Colors.brandGreen,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
});
