import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

interface ResponsiveContainerProps extends ViewProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * A container component that centers content and limits its width on larger screens.
 * Useful for maintaining a balanced layout on iPad/Tablets.
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({ 
  children, 
  style, 
  fullWidth = false,
  ...props 
}) => {
  const { isTablet, maxContentWidth } = useResponsive();

  if (fullWidth) {
    return <View style={[styles.fullWidth, style]} {...props}>{children}</View>;
  }

  return (
    <View style={styles.outerContainer}>
      <View 
        style={[
          styles.innerContainer, 
          isTablet && { maxWidth: maxContentWidth },
          style
        ]}
        {...props}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerContainer: {
    width: '100%',
  },
  fullWidth: {
    width: '100%',
  },
});
