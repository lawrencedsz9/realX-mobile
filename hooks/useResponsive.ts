import { useWindowDimensions, Platform } from 'react-native';

/**
 * Custom hook for handling responsive layouts.
 * Provides details about the current screen dimensions and device type.
 */
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  // Standard breakpoints
  const isTablet = Platform.OS === 'ios' ? Platform.isPad : width >= 768;
  const isDesktop = width >= 1024;
  const isPortrait = height > width;

  // Layout constants based on device
  const horizontalPadding = isTablet ? 40 : 20;
  const maxContentWidth = 800;
  const contentWidth = isTablet ? Math.min(width - horizontalPadding * 2, maxContentWidth) : width - horizontalPadding * 2;

  return {
    width,
    height,
    isTablet,
    isDesktop,
    isPortrait,
    horizontalPadding,
    contentWidth,
    maxContentWidth,
    // Helper to get responsive value
    responsiveValue: <T>(mobile: T, tablet: T, desktop?: T): T => {
      if (isDesktop && desktop !== undefined) return desktop;
      if (isTablet) return tablet;
      return mobile;
    },
  };
};
