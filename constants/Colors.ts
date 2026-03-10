/**
 * Unified color palette for the application.
 */

const primaryRed = '#E60000';
export const Colors = {
    light: {
        text: '#000000',
        background: '#FFFFFF',
        tint: primaryRed,
        subtitle: '#666666',
        tabIconDefault: '#666666',
        tabIconSelected: primaryRed,
        primary: primaryRed,
        buttonText: '#FFFFFF',
    },

    // Specific onboarding colors if they need to be fixed regardless of theme
    brandGreen: '#18B852',
    onboarding: {
        background: '#FFFFFF',
        title: '#000000',
        subtitle: '#666666',
        primary: '#18B852',
        buttonText: '#FFFFFF',
        shadow: '#18B852',
    }
};

export default Colors;
