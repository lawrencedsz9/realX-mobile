import {
  initializeAppCheck,
  ReactNativeFirebaseAppCheckProvider,
  getToken,
} from '@react-native-firebase/app-check';

let _appCheckInitialized = false;

/**
 * Initialize Firebase App Check with the appropriate provider.
 * Must be called before any Firebase service usage.
 *
 * - Development builds (__DEV__): uses debug provider
 * - Production: uses App Attest (iOS) / Play Integrity (Android)
 */
export async function initializeAppCheckProtection(): Promise<void> {
  if (_appCheckInitialized) return;

  const provider = new ReactNativeFirebaseAppCheckProvider();

  if (__DEV__) {
    // Debug provider — tokens are logged to console on first run
    // and must be registered in Firebase Console > App Check > Debug Tokens
    provider.configure({
      android: {
        provider: 'debug',
      },
      apple: {
        provider: 'debug',
      },
    });
  } else {
    // Production providers
    provider.configure({
      android: {
        provider: 'playIntegrity',
      },
      apple: {
        // App Attest on iOS 14+, DeviceCheck fallback on older devices
        provider: 'appAttestWithDeviceCheckFallback',
      },
    });
  }

  const appCheck = await initializeAppCheck(undefined, {
    provider,
    isTokenAutoRefreshEnabled: true,
  });

  _appCheckInitialized = true;

  if (__DEV__) {
    try {
      const { token } = await getToken(appCheck, false);
      console.log(
        '[AppCheck] Initialized. Token:',
        token?.substring(0, 20) + '...'
      );
    } catch (error: any) {
      console.warn(
        '[AppCheck] Token fetch failed (expected for new debug tokens):',
        error.message
      );
    }
  }
}
