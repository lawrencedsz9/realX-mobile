import { getAuth } from '@react-native-firebase/auth';
import { doc, getFirestore, updateDoc, serverTimestamp } from '@react-native-firebase/firestore';
import messaging, { type FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import {
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  AndroidImportance,
  presentNotificationAsync,
} from 'expo-notifications';

/**
 * Register Android notification channels (required for Android 8.0+)
 */
export const setupNotificationChannels = async () => {
  if (Platform.OS === 'android') {
    await setNotificationChannelAsync('reelx_general', {
      name: 'General',
      importance: AndroidImportance.HIGH,
    });
    await setNotificationChannelAsync('reelx_creator', {
      name: 'Creator Earnings',
      importance: AndroidImportance.HIGH,
    });
  }
};

/**
 * Request notification permissions (iOS) and register the FCM token
 * in the user's Firestore document.
 */
export const registerPushToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return;

  try {
    // Request permission on iOS (Android grants by default)
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('Notification permission denied');
      return;
    }

    // On iOS, register for APNS before fetching FCM token
    if (Platform.OS === 'ios') {
      await messaging().registerDeviceForRemoteMessages();
    }

    // Get the FCM token
    const token = await messaging().getToken();

    // Store in Firestore
    const db = getFirestore();
    const userRef = doc(db, 'students', user.uid);
    await updateDoc(userRef, {
      fcmToken: token,
      fcmTokenUpdatedAt: serverTimestamp(),
      platform: Platform.OS,
    });
  } catch (error) {
    console.error('Error registering push token:', error);
  }
};

/**
 * Listen for FCM token refresh events and update Firestore.
 * Returns an unsubscribe function.
 */
export const onTokenRefreshListener = () => {
  return messaging().onTokenRefresh(async (token) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    try {
      const db = getFirestore();
      const userRef = doc(db, 'students', user.uid);
      await updateDoc(userRef, {
        fcmToken: token,
        fcmTokenUpdatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error refreshing push token:', error);
    }
  });
};

/**
 * Clear the FCM token from Firestore (call before logout).
 */
export const clearPushToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return;

  try {
    const db = getFirestore();
    const userRef = doc(db, 'students', user.uid);
    await updateDoc(userRef, {
      fcmToken: null,
      fcmTokenUpdatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error clearing push token:', error);
  }
};

/**
 * Set up the foreground message handler.
 * When a remote message arrives while the app is in the foreground,
 * display it using expo-notifications.
 * Returns an unsubscribe function.
 */
export const setupForegroundMessageHandler = () => {
  return messaging().onMessage(
    async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      const { title, body } = remoteMessage.notification ?? {};

      if (title || body) {
        await presentNotificationAsync({
          title: title ?? 'Reelx',
          body: body ?? '',
          data: remoteMessage.data ?? {},
        });
      }
    }
  );
};

/**
 * Show a local notification immediately using expo-notifications.
 */
export const showLocalNotification = async (
  title: string,
  body: string,
  data?: Record<string, any>
) => {
  try {
    await scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data ?? {},
        sound: 'default',
      },
      trigger: null, // immediate
    });
  } catch (error) {
    console.error('Error showing local notification:', error);
  }
};

/**
 * Register the background message handler at module level.
 * Must be called at the top level of the app entry point.
 */
export const registerBackgroundHandler = () => {
  messaging().setBackgroundMessageHandler(
    async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      // For notification+data messages, the OS displays the notification automatically.
      // This handler is for any additional background processing.
      console.log('Background message handled:', remoteMessage.messageId);
    }
  );
};
