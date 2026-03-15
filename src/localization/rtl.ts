import { I18nManager } from 'react-native';

export function applyRTL(language: 'en' | 'ar') {
  const shouldBeRTL = language === 'ar';

  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
    return true;
  }

  return false;
}
