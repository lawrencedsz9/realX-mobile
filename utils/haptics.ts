import * as Haptics from 'expo-haptics';

export function triggerSubtleHaptic() {
  try {
    void Haptics.selectionAsync();
  } catch (error) {
    console.warn('Haptic feedback failed', error);
  }
}
