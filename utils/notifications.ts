import { getAuth } from '@react-native-firebase/auth';
import { doc, getFirestore, updateDoc, serverTimestamp } from '@react-native-firebase/firestore';
import {
  getMessaging,
  requestPermission,
  AuthorizationStatus,
  getToken,
  onTokenRefresh,
  onMessage,
  setBackgroundMessageHandler,
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import {
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  AndroidImportance,
  presentNotificationAsync,
} from 'expo-notifications';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';

const DEFAULT_TOPIC = 'all-users';

/**
 * Subscribe an FCM token to a topic via the backend callable function.
 */
const subscribeTokenToTopic = async (token: string, topic: string = DEFAULT_TOPIC) => {
  try {
    const functions = getFunctions(undefined, 'me-central1');
    const subscribe = httpsCallable(functions, 'subscribeToTopic');
    await subscribe({ token, topic });
  } catch (error) {
    console.error('Error subscribing to topic:', error);
  }
};

/**
 * Unsubscribe an FCM token from a topic via the backend callable function.
 */
const unsubscribeTokenFromTopic = async (token: string, topic: string = DEFAULT_TOPIC) => {
  try {
    const functions = getFunctions(undefined, 'me-central1');
    const unsubscribe = httpsCallable(functions, 'unsubscribeFromTopic');
    await unsubscribe({ token, topic });
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
  }
};

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
  // iOS permissions are handled by registerPushToken via RNFB messaging
};

/**
 * Request notification permissions, get FCM token, and subscribe to topic.
 */
export const registerPushToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return;

  try {
    const messaging = getMessaging();

    // Request permission on iOS (Android grants by default)
    const authStatus = await requestPermission(messaging);
    console.log('📱 Notification auth status:', authStatus, AuthorizationStatus);

    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('Notification permission denied. Status:', authStatus);
      return;
    }

    // Get the FCM token
    const token = await getToken(messaging);

    // Store in Firestore for debugging / 1:1 notifications
    const db = getFirestore();
    const userRef = doc(db, 'students', user.uid);
    await updateDoc(userRef, {
      fcmToken: token,
      fcmTokenUpdatedAt: serverTimestamp(),
      platform: Platform.OS,
    });

    // Subscribe to the default broadcast topic
    await subscribeTokenToTopic(token, DEFAULT_TOPIC);
  } catch (error) {
    console.error('Error registering push token:', error);
  }
};

/**
 * Listen for FCM token refresh events: update Firestore and re-subscribe to topic.
 * Returns an unsubscribe function.
 */
export const onTokenRefreshListener = () => {
  const messaging = getMessaging();
  return onTokenRefresh(messaging, async (token) => {
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

      // Re-subscribe to topic with the new token
      await subscribeTokenToTopic(token, DEFAULT_TOPIC);
    } catch (error) {
      console.error('Error refreshing push token:', error);
    }
  });
};

/**
 * Unsubscribe from topic and clear the FCM token from Firestore (call before logout).
 */
export const clearPushToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return;

  try {
    // Unsubscribe from topic before clearing the token
    const messaging = getMessaging();
    const token = await getToken(messaging);
    if (token) {
      await unsubscribeTokenFromTopic(token, DEFAULT_TOPIC);
    }

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
  const messaging = getMessaging();
  return onMessage(
    messaging,
    async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      console.log('📥 Foreground message received:', JSON.stringify(remoteMessage));
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
  const messaging = getMessaging();
  setBackgroundMessageHandler(
    messaging,
    async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      // For notification+data messages, the OS displays the notification automatically.
      // This handler is for any additional background processing.
      console.log('Background message handled:', remoteMessage.messageId);
    }
  );
};
