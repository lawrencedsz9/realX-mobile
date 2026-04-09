/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
//These are the cloud functions file


import * as admin from 'firebase-admin';
import { CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { setGlobalOptions } from 'firebase-functions';
import { Resend } from 'resend';

admin.initializeApp();
setGlobalOptions({ region: 'me-central1', maxInstances: 10 });

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const db = admin.firestore();

/**
 * =============================
 * Utils
 * =============================
 */
const generateCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

const toCents = (amount: number) => Math.round(amount * 100);
const fromCents = (cents: number) => cents / 100;

const verifyPin = (inputPin: string, storedPin: string) => inputPin === storedPin;

const normalizeDigits = (input: string | number | undefined | null): string => {
  if (input === null || input === undefined) return '';

  const str = String(input);

  const arabic = '٠١٢٣٤٥٦٧٨٩';
  const persian = '۰۱۲۳۴۵۶۷۸۹';

  return str.replace(/[٠-٩۰-۹]/g, (d) => {
    const index = arabic.indexOf(d);
    if (index > -1) return index.toString();
    return persian.indexOf(d).toString();
  });
};


/**
 * =============================
 * Creator Code Helpers
 * =============================
 */
const validateCreatorCode = async (tx, creatorCode: string | null) => {
  if (!creatorCode) return null;

  const code = normalizeDigits(creatorCode).trim().toUpperCase();
  const codeRef = db.collection('creator_codes').doc(code);
  const codeDoc = await tx.get(codeRef);

  if (!codeDoc.exists) {
    throw new HttpsError('not-found', 'Invalid creator code');
  }

  const creatorUid = codeDoc.data()?.uid;
  const creatorRef = db.collection('students').doc(creatorUid);
  const creatorDoc = await tx.get(creatorRef);

  if (!creatorDoc.exists) {
    throw new HttpsError('not-found', 'Creator not found');
  }

  const creatorName = creatorDoc.data()?.name || null;

  return { creatorUid, creatorRef, code, creatorName };
};

/**
 * =============================
 * Pricing / Discount Logic
 * =============================
 */

/**
 * =============================
 * Push Notification Helpers
 * =============================
 */
const sendCreatorNotification = async (
  creatorUid: string,
  cashbackAmount: number,
  vendorName: string
) => {
  try {
    const creatorDoc = await db.collection('students').doc(creatorUid).get();
    const fcmToken = creatorDoc.data()?.fcmToken;

    if (!fcmToken) return;

    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: 'Your code was used!',
        body: `Someone used your code at ${vendorName}. You earned QAR ${cashbackAmount.toFixed(2)} cashback!`,
      },
      data: {
        type: 'creator_code_used',
        vendorName,
        cashbackAmount: cashbackAmount.toString(),
      },
      android: {
        notification: {
          channelId: 'reelx_creator',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    });
  } catch (error) {
    console.error('Failed to send creator notification:', error);
  }
};
const calculateDiscount = (totalCents: number, discountType, discountValue) => {
  let discountCents = 0;

  if (discountType === 'percentage') {
    discountCents = Math.round(totalCents * (discountValue / 100));
  } else if (discountType === 'amount') {
    discountCents = toCents(discountValue);
  } else {
    throw new HttpsError('invalid-argument', 'Invalid discount type');
  }

  discountCents = Math.min(discountCents, totalCents);
  return discountCents;
};

/**
 * =============================
 * Cashback Logic (UPDATED RULES)
 * =============================
 */
const calculateCashback = ({
  finalCents,
  vendorData,
  creatorUid,
  type,
}) => {
  let userCashback = 0;
  let creatorCashback = 0;

  const isXcardVendor = vendorData.xcard === true;

  // ❌ No cashback for giftcards
  if (type === 'giftcard') {
    return { userCashback, creatorCashback };
  }

  if (!isXcardVendor) {
    return { userCashback, creatorCashback };
  }

  const cashbackCents = Math.round(finalCents * 0.01);

  // ✅ User always gets cashback for xcard vendor
  userCashback = cashbackCents;

  // ✅ Creator gets cashback if code used (even self-use)
  if (creatorUid) {
    creatorCashback = cashbackCents;
  }

  return { userCashback, creatorCashback };
};

/**
 * =============================
 * Core Transaction
 * =============================
 */
const processTransaction = async (options) => {
  const {
    uid,
    vendorId,
    vendorName,
    totalAmount,
    pin,
    type,
    giftCardAmount = 0,
    offerIndex = null,
    creatorCode = null,
  } = options;

  const normalizedTotalAmount = parseFloat(normalizeDigits(totalAmount));
  const normalizedGiftCardAmount = parseFloat(normalizeDigits(giftCardAmount));
  const normalizedPin = normalizeDigits(pin);

  if (isNaN(normalizedTotalAmount) || normalizedTotalAmount <= 0) {
    throw new HttpsError('invalid-argument', 'Invalid total amount');
  }

  if (!normalizedPin || normalizedPin.length !== 4) {
    throw new HttpsError('invalid-argument', 'Invalid PIN');
  }

  const userRef = db.collection('students').doc(uid);
  const vendorRef = db.collection('vendors').doc(vendorId);
  const transactionRef = db.collection('transactions').doc();

  return db.runTransaction(async (tx) => {
    /**
     * =============================
     * 1. READS
     * =============================
     */
    const [userDoc, vendorDoc] = await Promise.all([
      tx.get(userRef),
      tx.get(vendorRef),
    ]);

    if (!userDoc.exists) throw new HttpsError('not-found', 'User not found');
    if (!vendorDoc.exists) throw new HttpsError('not-found', 'Vendor not found');

    const userData = userDoc.data();
    const vendorData = vendorDoc.data();

    /**
     * =============================
     * 2. PIN VALIDATION
     * =============================
     */
    if (!verifyPin(normalizedPin, vendorData.pin)) {
      throw new HttpsError('permission-denied', 'Invalid PIN');
    }

    /**
     * =============================
     * 3. AMOUNTS
     * =============================
     */
    const totalCents = toCents(normalizedTotalAmount);
    let discountCents = 0;
    let finalCents = totalCents;
    let giftcardSavingsCents = 0;

    /**
     * =============================
     * 4. OFFER LOGIC (from vendor's embedded offers)
     * =============================
     */
    let creatorData = null;
    let appliedOffer = null;

    if (type !== 'giftcard') {
      if (offerIndex !== null && offerIndex !== undefined) {
        const vendorOffers = vendorData.offers || [];
        if (offerIndex < 0 || offerIndex >= vendorOffers.length) {
          throw new HttpsError('not-found', 'Offer not found for this vendor');
        }
        appliedOffer = vendorOffers[offerIndex];
        discountCents = calculateDiscount(
          totalCents,
          appliedOffer.discountType,
          appliedOffer.discountValue
        );
        finalCents = totalCents - discountCents;
      }

      creatorData = await validateCreatorCode(tx, creatorCode);
    }

    /**
     * =============================
     * 5. GIFT CARD LOGIC
     * =============================
     */
    if (type === 'giftcard') {
      const balance = toCents(userData.cashback || 0);
      const redeemCents = toCents(normalizedGiftCardAmount || 0);
      giftcardSavingsCents = redeemCents;

      if (balance < redeemCents) {
        throw new HttpsError('failed-precondition', 'Insufficient balance');
      }

      finalCents = Math.max(0, totalCents - redeemCents);

      tx.update(userRef, {
        cashback: admin.firestore.FieldValue.increment(-fromCents(redeemCents)),
      });
    }

    /**
     * =============================
     * 6. CASHBACK
     * =============================
     */
    const { userCashback, creatorCashback } = calculateCashback({
      finalCents,
      vendorData,
      creatorUid: creatorData?.creatorUid,
      type,
    });

    /**
     * =============================
     * 7. WRITE TRANSACTION
     * =============================
     */
    tx.set(transactionRef, {
      type,
      userId: uid,
      vendorId,
      vendorName,
      totalAmount: normalizedTotalAmount,
      discountAmount: fromCents(discountCents),
      finalAmount: fromCents(finalCents),
      creatorCode: creatorData?.code || null,
      creatorUid: creatorData?.creatorUid || null,
      cashbackAmount: fromCents(userCashback),
      creatorCashbackAmount: fromCents(creatorCashback),
      offer: appliedOffer || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    /**
     * =============================
     * 8. UPDATE USER
     * =============================
     */
    const userUpdates = {};

    const totalSavingsCents = discountCents + giftcardSavingsCents;

    if (totalSavingsCents > 0) {
      userUpdates.savings =
        admin.firestore.FieldValue.increment(fromCents(totalSavingsCents));
    }

    if (userCashback > 0) {
      userUpdates.cashback =
        admin.firestore.FieldValue.increment(fromCents(userCashback));
    }

    if (Object.keys(userUpdates).length > 0) {
      tx.update(userRef, userUpdates);
    }

    /**
     * =============================
     * 9. UPDATE CREATOR
     * =============================
     */
    if (creatorData?.creatorRef && creatorCashback > 0) {
      tx.update(creatorData.creatorRef, {
        cashback: admin.firestore.FieldValue.increment(
          fromCents(creatorCashback)
        ),
      });
    }

    // Total cashback for the redeeming user (self-use = double)
    const totalUserCashbackCents =
      creatorData?.creatorUid === uid
        ? userCashback + creatorCashback
        : userCashback;

    return {
      transactionId: transactionRef.id,
      finalAmount: fromCents(finalCents),
      discountAmount: fromCents(discountCents),
      cashbackAmount: fromCents(totalUserCashbackCents),
      creatorUid: creatorData?.creatorUid || null,
      creatorName: creatorData?.creatorName || null,
      creatorCashback: fromCents(creatorCashback),
      vendorName,
    };
  });
};

/**
 * =============================
 * Public Functions
 * =============================
 */
export const redeemGiftCard = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login required');
  }

  const result = await processTransaction({
    uid: request.auth.uid,
    type: 'giftcard',
    ...request.data,
  });

  // Send creator notification outside the transaction
  if (result.creatorUid && result.creatorCashback > 0) {
    sendCreatorNotification(
      result.creatorUid,
      result.creatorCashback,
      result.vendorName
    ).catch((err) => console.error('Creator notification failed:', err));
  }

  return result;
});

export const redeemOffer = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login required');
  }

  const result = await processTransaction({
    uid: request.auth.uid,
    type: 'offer',
    ...request.data,
  });

  // Send creator notification outside the transaction
  if (result.creatorUid && result.creatorCashback > 0) {
    sendCreatorNotification(
      result.creatorUid,
      result.creatorCashback,
      result.vendorName
    ).catch((err) => console.error('Creator notification failed:', err));
  }

  return result;
});

/**
 * =============================
 * Creator Code Assignment
 * =============================
 */
export const assignCreatorCode = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  const uid = request.auth.uid;
  const userRef = db.collection('students').doc(uid);

  return db.runTransaction(async (tx) => {
    const userDoc = await tx.get(userRef);

    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    const existingCode = userDoc.data()?.creatorCode;
    if (existingCode) {
      return { creatorCode: existingCode };
    }

    let code = null;
    let attempts = 0;

    while (!code && attempts < 5) {
      const candidate = generateCode();
      const codeRef = db.collection('creator_codes').doc(candidate);
      const codeDoc = await tx.get(codeRef);

      if (!codeDoc.exists) {
        tx.set(codeRef, {
          uid,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        tx.update(userRef, { creatorCode: candidate });
        code = candidate;
      }

      attempts++;
    }

    if (!code) {
      throw new HttpsError('internal', 'Failed to generate code');
    }

    return { creatorCode: code };
  });
});

/**
 * =============================
 * Student Check
 * =============================
 */
export const checkStudentExists = onCall(async (request: CallableRequest) => {
  const email = request.data?.email?.toLowerCase()?.trim();

  if (!email) {
    throw new HttpsError('invalid-argument', 'Email required');
  }

  // ✅ Restrict ONLY self-signup emails
  const isEduQa = /^[^@]+@[^@]+\.edu\.qa$/.test(email);

  if (!isEduQa) {
    throw new HttpsError(
      'permission-denied',
      'Only .edu.qa emails can sign up'
    );
  }

  const snapshot = await db
    .collection('students')
    .where('email', '==', email)
    .limit(1)
    .get();

  return { exists: !snapshot.empty };
});

export const checkStudentExistsLogin = onCall(async (request: CallableRequest) => {
  const email = request.data?.email?.toLowerCase()?.trim();

  if (!email) {
    throw new HttpsError('invalid-argument', 'Email required');
  }

  const snapshot = await db
    .collection('students')
    .where('email', '==', email)
    .limit(1)
    .get();

  return { exists: !snapshot.empty };
});

/**
 * =============================
 * OTP Auth Constants
 * =============================
 */
const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_SENDS_PER_WINDOW = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_VERIFY_ATTEMPTS = 3;

/**
 * =============================
 * Send OTP
 * =============================
 */
export const sendOtp = onCall(async (request: CallableRequest) => {
  const email = request.data?.email?.toLowerCase()?.trim();
  const purpose = request.data?.purpose; // "signup" | "login"

  if (!email) {
    throw new HttpsError('invalid-argument', 'Email is required');
  }

  if (!purpose || !['signup', 'login'].includes(purpose)) {
    throw new HttpsError('invalid-argument', 'Purpose must be "signup" or "login"');
  }

  // Signup: restrict to .edu.qa
  if (purpose === 'signup') {
    const isEduQa = /^[^@]+@[^@]+\.edu\.qa$/.test(email);
    if (!isEduQa) {
      throw new HttpsError('permission-denied', 'Only .edu.qa emails can sign up');
    }

    // Check if account already exists
    const snapshot = await db
      .collection('students')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      throw new HttpsError('already-exists', 'An account with this email already exists');
    }
  }

  // Login: verify account exists
  if (purpose === 'login') {
    const snapshot = await db
      .collection('students')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new HttpsError('not-found', 'No account found with this email');
    }
  }

  // Rate limiting
  const now = admin.firestore.Timestamp.now();
  const otpRef = db.collection('otps').doc(email);
  const otpDoc = await otpRef.get();

  if (otpDoc.exists) {
    const data = otpDoc.data()!;
    const windowStart = data.rateLimit?.windowStart?.toMillis() ?? 0;
    const windowAge = now.toMillis() - windowStart;

    // Check 15-minute window limit
    if (windowAge < RATE_LIMIT_WINDOW_MS) {
      const sendCount = data.rateLimit?.sendCount ?? 0;
      if (sendCount >= MAX_OTP_SENDS_PER_WINDOW) {
        const retryAfterMinutes = Math.ceil((RATE_LIMIT_WINDOW_MS - windowAge) / 60000);
        throw new HttpsError(
          'resource-exhausted',
          `Too many OTP requests. Try again in ${retryAfterMinutes} minutes.`
        );
      }
    }

    // Check 60-second cooldown
    const lastSent = data.createdAt?.toMillis() ?? 0;
    const elapsed = now.toMillis() - lastSent;
    if (elapsed < COOLDOWN_MS) {
      const retryAfter = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
      throw new HttpsError(
        'resource-exhausted',
        `Please wait ${retryAfter} seconds before requesting a new code.`,
        { retryAfter }
      );
    }
  }

  // Generate 6-digit OTP
  const code = String(Math.floor(100000 + Math.random() * 900000));

  // Calculate new rate limit values
  let sendCount = 1;
  let windowStart = now;

  if (otpDoc.exists) {
    const data = otpDoc.data()!;
    const existingWindowStart = data.rateLimit?.windowStart?.toMillis() ?? 0;
    const windowAge = now.toMillis() - existingWindowStart;

    if (windowAge < RATE_LIMIT_WINDOW_MS) {
      sendCount = (data.rateLimit?.sendCount ?? 0) + 1;
      windowStart = data.rateLimit?.windowStart ?? now;
    }
  }

  // Store OTP in Firestore
  await otpRef.set({
    code,
    attempts: 0,
    createdAt: now,
    expiresAt: admin.firestore.Timestamp.fromMillis(now.toMillis() + OTP_EXPIRY_MINUTES * 60 * 1000),
    purpose,
    verified: false,
    rateLimit: { sendCount, windowStart },
  });

  // Send email via Resend
  try {
    await getResend().emails.send({
      from: 'ReelX <welcome@realx.qa>',
      to: email,
      subject: 'Your ReelX Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px;
          margin: 0 auto; padding: 32px;">
          <h1 style="color: #18B852; font-size: 24px;
            margin-bottom: 24px;">ReelX</h1>
          <p style="font-size: 16px; color: #333;
            margin-bottom: 16px;">Your verification code is:</p>
          <div style="background: #f5f5f5; border-radius: 12px;
            padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: bold;
              letter-spacing: 8px; color: #18B852;">${code}</span>
          </div>
          <p style="font-size: 14px; color: #666; margin-bottom: 8px;">
            This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
          <p style="font-size: 14px; color: #999;">If you didn't request
            this code, you can safely ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    throw new HttpsError('internal', 'Failed to send verification email. Please try again.');
  }

  return { success: true };
});

/**
 * =============================
 * Verify OTP
 * =============================
 */
export const verifyOtp = onCall(async (request: CallableRequest) => {
  const email = request.data?.email?.toLowerCase()?.trim();
  const code = request.data?.code?.trim();
  const purpose = request.data?.purpose;

  if (!email) {
    throw new HttpsError('invalid-argument', 'Email is required');
  }

  if (!code || !/^\d{6}$/.test(code)) {
    throw new HttpsError('invalid-argument', 'A valid 6-digit code is required');
  }

  if (!purpose || !['signup', 'login'].includes(purpose)) {
    throw new HttpsError('invalid-argument', 'Purpose must be "signup" or "login"');
  }

  const now = admin.firestore.Timestamp.now();
  const otpRef = db.collection('otps').doc(email);
  const otpDoc = await otpRef.get();

  if (!otpDoc.exists) {
    throw new HttpsError('not-found', 'No verification code found. Please request a new one.');
  }

  const data = otpDoc.data()!;

  if (data.verified) {
    throw new HttpsError('permission-denied', 'This code has already been used. Please request a new one.');
  }

  if (data.expiresAt.toMillis() < now.toMillis()) {
    throw new HttpsError('deadline-exceeded', 'Code has expired. Please request a new one.');
  }

  if (data.attempts >= MAX_VERIFY_ATTEMPTS) {
    throw new HttpsError('resource-exhausted', 'Too many attempts. Please request a new code.');
  }

  // Increment attempts
  await otpRef.update({
    attempts: admin.firestore.FieldValue.increment(1),
  });

  // Check code match
  if (data.code !== code) {
    const remaining = MAX_VERIFY_ATTEMPTS - (data.attempts + 1);
    throw new HttpsError(
      'invalid-argument',
      `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
    );
  }

  // Mark as verified
  await otpRef.update({ verified: true });

  let uid: string;

  if (purpose === 'signup') {
    // Create Firebase Auth user (or get existing)
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      uid = userRecord.uid;
    } catch {
      const userRecord = await admin.auth().createUser({
        email,
        emailVerified: true,
      });
      uid = userRecord.uid;
    }
  } else {
    // Login: look up UID from students collection
    const snapshot = await db
      .collection('students')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new HttpsError('not-found', 'No account found with this email');
    }

    uid = snapshot.docs[0].id;
  }

  // Generate custom token
  const customToken = await admin.auth().createCustomToken(uid);

  return { success: true, customToken };
});

/**
 * =============================
 * Topic Subscription (Callable)
 * =============================
 */
export const subscribeToTopic = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login required');
  }

  const { token, topic } = request.data;

  if (!token || !topic) {
    throw new HttpsError('invalid-argument', 'Token and topic are required');
  }

  try {
    const result = await admin.messaging().subscribeToTopic(token, topic);
    console.log('Subscribe result:', JSON.stringify(result));
    return { success: true };
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    throw new HttpsError('internal', 'Failed to subscribe to topic');
  }
});

export const unsubscribeFromTopic = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login required');
  }

  const { token, topic } = request.data;

  if (!token || !topic) {
    throw new HttpsError('invalid-argument', 'Token and topic are required');
  }

  try {
    await admin.messaging().unsubscribeFromTopic(token, topic);
    return { success: true };
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    throw new HttpsError('internal', 'Failed to unsubscribe from topic');
  }
});

/**
 * =============================
 * Admin Send Notification via Topic (Callable)
 * =============================
 */
export const sendNotification = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login required');
  }

  // Verify admin role via custom claim or Firestore admin field
  const isCustomAdmin = request.auth.token.admin === true;
  let isFirestoreAdmin = false;
  if (!isCustomAdmin) {
    const adminDoc = await db.collection('students').doc(request.auth.uid).get();
    isFirestoreAdmin = adminDoc.exists && adminDoc.data()?.admin === true;
  }
  if (!isCustomAdmin && !isFirestoreAdmin) {
    throw new HttpsError('permission-denied', 'Admin access required');
  }

  const { title, body, imageUrl, topic } = request.data;

  if (!title || !body) {
    throw new HttpsError('invalid-argument', 'Title and body are required');
  }

  const targetTopic = topic || 'all-users';

  try {
    const messageId = await admin.messaging().send({
      topic: targetTopic,
      notification: {
        title,
        body,
      },
      data: {
        type: 'admin_broadcast',
      },
      android: {
        notification: {
          channelId: 'reelx_general',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    });

    await db.collection('notifications').add({
      title,
      body,
      imageUrl: imageUrl || null,
      topic: targetTopic,
      sentBy: request.auth.uid,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      messageId,
    });

    return { success: true, messageId };
  } catch (error) {
    console.error('Error sending topic notification:', error);
    throw new HttpsError('internal', 'Failed to send notification');
  }
});

/**
 * =============================
 * Admin Broadcast Notification via Topic (Firestore Trigger)
 * =============================
 */
export const sendAdminNotification = onDocumentCreated(
  {
    document: 'notifications/{notificationId}',
    region: 'me-central1',
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const notification = snap.data();
    if (!notification || notification.status !== 'pending') return;

    await snap.ref.update({ status: 'sending' });

    try {
      const targetTopic = notification.topic || 'all-users';

      const messageId = await admin.messaging().send({
        topic: targetTopic,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          type: 'admin_broadcast',
          notificationId: snap.id,
        },
        android: {
          notification: {
            channelId: 'reelx_general',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      });

      await snap.ref.update({
        status: 'completed',
        messageId,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Error sending broadcast notification:', error);
      await snap.ref.update({
        status: 'failed',
        error: error.message || 'Unknown error',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
);