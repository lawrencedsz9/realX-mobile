import { I18nManager } from 'react-native';

export type AppLocale = 'en' | 'ar';

const DIRECTION_BY_LOCALE: Record<AppLocale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  ar: 'rtl',
};

export function applyRTL(locale: AppLocale) {
  const shouldBeRTL = DIRECTION_BY_LOCALE[locale] === 'rtl';

  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
    return true;
  }

  return false;
}
