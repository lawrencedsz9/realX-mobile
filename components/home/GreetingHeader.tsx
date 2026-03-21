import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

type Props = {
    userName: string;
};

export default function GreetingHeader({ userName }: Props) {
    return (
        <View style={styles.container}>
            <View style={styles.textContainer}>
                <Text style={[{ color: '#000', fontFamily: Typography.metropolis.medium }, styles.greeting]}>
                    Hey <Text style={[{ color: Colors.brandGreen, fontFamily: Typography.metropolis.medium }, styles.userName]}>{userName}</Text>,
                </Text>
                <Text style={[{ color: '#000', fontFamily: Typography.metropolis.medium }, styles.subtitle]}>Ready to save?</Text>
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
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    textContainer: {
        flex: 1,
    },
    greeting: {
        fontSize: 28,
        fontFamily: Typography.metropolis.semiBold,
    },
    userName: {
        color: Colors.brandGreen,
        fontFamily: Typography.metropolis.semiBold,
    },
    subtitle: {
        fontSize: 28,
        fontFamily: Typography.metropolis.semiBold,
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
