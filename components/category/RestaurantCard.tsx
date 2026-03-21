import { Image } from 'expo-image';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

type Props = {
    id: string;
    name: string;
    cashbackText?: string;
    discountText?: string;
    isTrending?: boolean;
    isTopRated?: boolean;
    imageUri?: string;
    logoUri?: string;
    onPress?: () => void;
    style?: any;
    xcardEnabled?: boolean;
};

export default function RestaurantCard({
    name,
    cashbackText = 'Cashbacks',
    discountText = '60% DISCOUNT',
    isTrending = false,
    isTopRated = false,
    imageUri,
    logoUri,
    onPress,
    style,
    xcardEnabled = false,
}: Props) {
    return (
        <TouchableOpacity
            style={[styles.container, style]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            {/* Image placeholder or actual image */}
            <View style={styles.imageContainer}>
                  <View style={styles.topPill}>
    <Image
      source={{ uri: imageUri }}
      style={styles.topImage}
      contentFit="cover"
    />
  </View>

  <View style={styles.bottomPill}>
    <Image
      source={{ uri: imageUri }}
      style={styles.bottomImage}
      contentFit="cover"
    />
  </View>
    {/* Logo */}
  <View style={styles.logoContainer}>
    <View style={styles.logoWrapper}>
      {logoUri ? (
        <Image
          source={{ uri: logoUri }}
          style={styles.logoImage}
          contentFit="cover"
        />
      ) : (
        <Text style={[{ color: '#000', fontFamily: Typography.metropolis.medium }, styles.logoEmoji]}>🏪</Text>
      )}
    </View>
  </View>

  {/* Cashback Badge */}
  {xcardEnabled && (
    <View style={styles.xcardBadge}>
      <Image
        source={require('../../assets/images/cashback.png')}
        style={styles.xcardIcon}
        contentFit="contain"
      />
    </View>
  )}
            </View>


            {/* Content */}
            <View style={styles.content}>
                <Text style={[{ color: '#000', fontFamily: Typography.metropolis.medium }, styles.name]} numberOfLines={1}>{name}</Text>

                {/* Discount Tag */}
                <View style={styles.discountWrapper}>
                    <Text style={[{ color: Colors.brandGreen, fontFamily: Typography.metropolis.medium }, styles.discountText]}>{discountText}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 200, // Fixed height for consistency
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    imageContainer: {
        width: '100%',
        height: 120, // Keep height or make it variable? 120 is fine for a card.

    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#E8E8E8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderEmoji: {
        fontSize: 40,
        opacity: 0.3,
    },
    logoContainer: {
        position: 'absolute',
        left: 10,
        bottom: 10, // Logo in the corner
        zIndex: 2,
    },
    logoWrapper: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    logoEmoji: {
        fontSize: 20,
    },
    badgesContainer: { // Container for badges to handle spacing/positioning if needed
        position: 'absolute',
        top: 10,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between', // Distribute badges
        paddingHorizontal: 10,
        pointerEvents: 'none', // Allow clicks to pass through if needed
    },
    trendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.brandGreen,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        alignSelf: 'flex-start',
        marginLeft: 'auto', // Push to right if alone, or use justifyContent
    },
    topRatedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFD700', // Gold for top rated
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        alignSelf: 'flex-start',
    },
    trendingIcon: {
        fontSize: 10,
    },
    badgeText: { // generic text style for badges
        fontSize: 10,
        fontFamily: Typography.metropolis.semiBold,
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    topRatedText: {
        color: '#000000', // Dark text on Gold
    },

    content: {
        padding: 12,
    },
    name: {
        fontSize: 16,
        fontFamily: Typography.metropolis.semiBold,
        marginBottom: 4,
    },
    cashbackRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    cashbackText: {
        fontSize: 12,
        fontFamily: Typography.metropolis.medium,
        color: '#666666',
    },
    discountWrapper: {
        backgroundColor: 'rgba(76, 217, 100, 0.1)', // Light green background for discount
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    discountText: {
        fontSize: 13,
        fontFamily: Typography.metropolis.semiBold,
        color: Colors.brandGreen,
    },

    topPill: {
  flex: 1,
  borderRadius: 20,
  overflow: 'hidden',
},

bottomPill: {
  flex: 1,
  borderRadius: 20,
  overflow: 'hidden',
},

topImage: {
  width: '100%',
  height: '200%',
},

bottomImage: {
  width: '100%',
  height: '200%',
  transform: [{ translateY: '-50%' }],
},
xcardBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
},
xcardIcon: {
    width: 20,
    height: 20,
},
});
