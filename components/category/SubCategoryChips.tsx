import { Image } from 'expo-image';
import { memo, useCallback } from 'react';
import { ColorSchemeName, ScrollView, StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

export type SubCategory = {
    id: string;
    name: string;
    icon: string | number | { uri: string };
};

type Props = {
    subCategories?: SubCategory[];
    selectedId?: string;
    onSelect?: (subCategory: SubCategory) => void;
    containerStyle?: ViewStyle;
};

const ICON_CONTAINER_SIZE = 60;
const ICON_SIZE = 36;

/**
 * SubCategoryChip component for individual chips
 */
const SubCategoryChip = memo(({
    item,
    isSelected,
    onPress,
}: {
    item: SubCategory;
    isSelected: boolean;
    onPress: (item: SubCategory) => void;
}) => {
    const renderIcon = () => {
        const { icon } = item;

        // Handle Image sources (require/number or object with uri)
        if (typeof icon === 'number' || (typeof icon === 'object' && icon !== null)) {
            return <Image source={icon} style={styles.imageIcon} contentFit="contain" />;
        }

        // Handle string icons (emoji or remote URL)
        if (typeof icon === 'string') {
            const isRemote = icon.startsWith('http') || icon.includes('/');
            if (isRemote) {
                return <Image source={{ uri: icon }} style={styles.imageIcon} contentFit="contain" />;
            }
            return <Text style={styles.emojiIcon}>{icon}</Text>;
        }

        return null;
    };

    return (
        <TouchableOpacity
            style={styles.chip}
            onPress={() => onPress(item)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Select ${item.name} category`}
        >
            <View style={[
                styles.iconContainer,
                { backgroundColor: isSelected ? Colors.brandGreenLight : '#F5F5F5' },
                isSelected && styles.iconContainerSelected,
            ]}>
                {renderIcon()}
            </View>
            <Text style={[
                styles.chipText,
                { color: isSelected ? Colors.brandGreen : Colors.light.text },
                isSelected && styles.chipTextSelected,
            ]}>
                {item.name}
            </Text>
        </TouchableOpacity>
    );
});

/**
 * Horizontal scrollable chips for sub-categories
 */
function SubCategoryChips({
    subCategories = [],
    selectedId = 'all',
    onSelect,
    containerStyle,
}: Props) {

    const handleSelect = useCallback((item: SubCategory) => {
        onSelect?.(item);
    }, [onSelect]);

    return (
        <View style={[styles.container, containerStyle]}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                decelerationRate="fast"
            >
                {subCategories.map((subCategory) => (
                    <SubCategoryChip
                        key={subCategory.id}
                        item={subCategory}
                        isSelected={selectedId === subCategory.id}
                        onPress={handleSelect}
                    />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 16,
        height: 125, // Fixed height to prevent layout jumps
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 16, // Using gap for consistent spacing between chips
    },
    chip: {
        alignItems: 'center',
    },
    iconContainer: {
        width: ICON_CONTAINER_SIZE,
        height: ICON_CONTAINER_SIZE,
        borderRadius: ICON_CONTAINER_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        overflow: 'hidden',
        marginBottom: 8,
    },
    iconContainerSelected: {
        borderColor: Colors.brandGreen,
    },
    emojiIcon: {
        fontSize: 28,
    },
    imageIcon: {
        width: ICON_SIZE,
        height: ICON_SIZE,
    },
    chipText: {
        fontSize: 12,
        fontFamily: Typography.metropolis.medium,
        textAlign: 'center',
        lineHeight: 18,
    },
    chipTextSelected: {
        fontFamily: Typography.metropolis.semiBold,
    },
});

export default memo(SubCategoryChips);

