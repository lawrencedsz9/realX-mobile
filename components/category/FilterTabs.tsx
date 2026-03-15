import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Typography } from '../../constants/Typography';

// Assuming these exist in your project, otherwise replace with hex strings
const BRAND_GREEN = '#58B368';
const BG_LIGHT = '#F5F5F5';

type FilterOption = {
    id: string;
    label: string;
    icon: any;
};

interface FilterTabsProps {
    selectedFilter: string;
    onFilterChange: (filterId: string) => void;
    filters?: FilterOption[];
}

const defaultFilters: FilterOption[] = [
    { id: 'all', label: 'All', icon: 'apps-outline' },
    { id: 'trending', label: 'Trending', icon: 'flame' },
];

export default function FilterTabs({ selectedFilter, onFilterChange, filters = defaultFilters }: FilterTabsProps) {
    const containerWidth = Dimensions.get('window').width - 40; // Adjust based on your padding
    const tabWidth = containerWidth / filters.length;

    // Initial position based on selectedFilter
    const initialIndex = filters.findIndex(f => f.id === selectedFilter);
    const translateX = useRef(new Animated.Value(initialIndex !== -1 ? initialIndex * tabWidth : 0)).current;
    const opacity = useRef(new Animated.Value(selectedFilter ? 1 : 0)).current;

    useEffect(() => {
        const index = filters.findIndex(f => f.id === selectedFilter);
        const hasSelection = index !== -1;

        if (hasSelection) {
            Animated.parallel([
                Animated.spring(translateX, {
                    toValue: index * tabWidth,
                    useNativeDriver: true,
                    bounciness: 4,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [selectedFilter, filters, tabWidth]);

    return (
        <View style={styles.outerContainer}>
            <View style={styles.container}>
                {/* Sliding Background */}
                <Animated.View
                    style={[
                        styles.slider,
                        { width: tabWidth, transform: [{ translateX }], opacity }
                    ]}
                />

                {/* Content Overlay */}
                {filters.map((filter) => {
                    const isSelected = selectedFilter === filter.id;
                    return (
                        <TouchableOpacity
                            key={filter.id}
                            style={[styles.filterButton, { width: tabWidth }]}
                            onPress={() => onFilterChange?.(filter.id)}
                            activeOpacity={1}
                        >
                            <Ionicons
                                name={filter.icon}
                                size={20}
                                color={isSelected ? '#FFFFFF' : '#000000'}
                            />
                            <Text style={[styles.filterText, { color: isSelected ? '#FFFFFF' : '#000000' }]}>
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    container: {
        flexDirection: 'row',
        backgroundColor: BG_LIGHT,
        borderRadius: 24, // Pure pill shape
        position: 'relative',
        height: 48,
        alignItems: 'center',
    },
    slider: {
        position: 'absolute',
        height: '100%',
        backgroundColor: BRAND_GREEN,
        borderRadius: 24,
        // Optional: add a slight border if you want it to look exactly like the image
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 8,
        zIndex: 1, // Ensures text is above the slider
    },
    filterText: {
        fontSize: 16,
        fontFamily: Typography.metropolis.semiBold,
    },
});