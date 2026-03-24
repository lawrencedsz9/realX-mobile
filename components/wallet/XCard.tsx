import { Dimensions, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { Typography } from '../../constants/Typography';
import PhonkText from '../PhonkText';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 40;
const CARD_ASPECT_RATIO = 335 / 190; // Standard card aspect ratio roughly
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT_RATIO;

const xcardImage = require('../../assets/images/xcard.png');

type Props = {
    earnings?: number;
    currency?: string;
    creatorCode?: string;
};

export default function AZxXCard({ earnings = 0, currency = 'QAR', creatorCode }: Props) {
    return (
        <View style={styles.container}>
            <ImageBackground
                source={xcardImage}
                style={styles.card}
                imageStyle={styles.cardImage}
                resizeMode="cover"
            >
                {/* Card content overlaid on the image */}
                <View style={styles.cardContent}>
                    {/* Earnings section */}
                    <View style={styles.earningsSection}>
                        <Text style={styles.earningsLabel}>Cashback:</Text>
                        <View style={styles.earningsRow}>
                            <Text style={styles.earningsAmount}>
                                {earnings.toFixed(2)} {currency}
                            </Text>
                        </View>
                    </View>

                    {/* Creator Code Section (Bottom Right) */}
                    {creatorCode && (
                        <View style={styles.creatorCodeContainer}>
                            <Text style={styles.creatorCodeLabel}>CREATOR CODE</Text>
                            <PhonkText style={styles.creatorCodeText}>{creatorCode}</PhonkText>
                        </View>
                    )}
                </View>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 20,
        overflow: 'hidden',
    },
    cardImage: {
        borderRadius: 20,
    },
    cardContent: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
    },
    earningsSection: {
        marginTop: 4,
    },
    earningsLabel: {
        fontSize: 14,
        fontFamily: Typography.poppins.medium,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 4,
    },
    earningsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    earningsAmount: {
        fontSize: 28,
        fontFamily: Typography.poppins.semiBold,
        color: '#FFFFFF',
    },
    creatorCodeContainer: {
        alignSelf: 'flex-end',
        alignItems: 'flex-end',
    },
    creatorCodeLabel: {
        fontSize: 10,
        fontFamily: Typography.poppins.medium,
        color: 'rgba(255, 255, 255, 0.6)',
        letterSpacing: 1,
    },
    creatorCodeText: {
        fontSize: 18,
        color: '#FFFFFF',
    },
    coinEmoji: {
        fontSize: 24,
        marginLeft: 8,
    },
});
