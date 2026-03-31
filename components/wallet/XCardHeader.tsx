import { StyleSheet, View } from 'react-native';
import PhonkText from '../PhonkText';

export default function XCardHeader() {
    return (
        <View style={styles.container}>
            <PhonkText style={styles.titleX}>X</PhonkText>
            <PhonkText style={styles.titleCard}>CARD</PhonkText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    titleX: {
        fontSize: 28,
        color: '#18B852',
    },
    titleCard: {
        fontSize: 28,
        color: '#000000',
    },
});
