import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import en from './locales/en.json';
import ar from './locales/ar.json';

export const LANGUAGE_KEY = 'app_language';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

function getDeviceLanguage(): 'en' | 'ar' {
  const locales = getLocales();
  const languageCode = locales?.[0]?.languageCode ?? 'en';
  return languageCode === 'ar' ? 'ar' : 'en';
}

export async function getStoredLanguage(): Promise<'en' | 'ar' | null> {
  try {
    const value = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (value === 'en' || value === 'ar') return value;
    return null;
  } catch {
    return null;
  }
}

export async function setStoredLanguage(language: 'en' | 'ar') {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
}

export async function initI18n() {
  const storedLanguage = await getStoredLanguage();
  const initialLanguage = storedLanguage ?? getDeviceLanguage();

  // eslint-disable-next-line import/no-named-as-default-member
  await i18next.use(initReactI18next).init({
    compatibilityJSON: 'v3',
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

  return initialLanguage;
}

export default i18next;
