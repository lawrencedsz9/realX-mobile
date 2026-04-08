/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
//These are the cloud functions file 


import * as admin from 'firebase-admin';
import { CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { setGlobalOptions } from 'firebase-functions';

admin.initializeApp();
setGlobalOptions({ region: 'me-central1', maxInstances: 10 });

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
 * Admin Send Notification (Callable)
 * =============================
 */
export const sendNotification = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login required');
  }

  // Verify admin role
  const adminDoc = await db.collection('students').doc(request.auth.uid).get();
  if (!adminDoc.exists || adminDoc.data()?.admin !== true) {
    throw new HttpsError('permission-denied', 'Admin access required');
  }

  const { title, body, imageUrl } = request.data;

  if (!title || !body) {
    throw new HttpsError('invalid-argument', 'Title and body are required');
  }

  // Fetch all users with FCM tokens from students collection
  const usersSnapshot = await db
    .collection('students')
    .where('fcmToken', '!=', null)
    .get();

  const tokens: string[] = [];
  usersSnapshot.forEach((doc) => {
    const token = doc.data().fcmToken;
    if (token) tokens.push(token);
  });

  const totalRecipients = tokens.length;

  if (tokens.length === 0) {
    await db.collection('notifications').add({
      title,
      body,
      imageUrl: imageUrl || null,
      sentBy: request.auth.uid,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      successCount: 0,
      failureCount: 0,
      totalRecipients: 0,
    });

    return { successCount: 0, failureCount: 0, totalRecipients: 0 };
  }

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);
    const response = await admin.messaging().sendEachForMulticast({
      tokens: batch,
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

    successCount += response.successCount;
    failureCount += response.failureCount;

    // Clean up invalid tokens
    response.responses.forEach((resp, idx) => {
      if (
        !resp.success &&
        resp.error &&
        (resp.error.code === 'messaging/invalid-registration-token' ||
          resp.error.code === 'messaging/registration-token-not-registered')
      ) {
        const failedToken = batch[idx];
        usersSnapshot.forEach((doc) => {
          if (doc.data().fcmToken === failedToken) {
            db.collection('students').doc(doc.id).update({
              fcmToken: admin.firestore.FieldValue.delete(),
            });
          }
        });
      }
    });
  }

  await db.collection('notifications').add({
    title,
    body,
    imageUrl: imageUrl || null,
    sentBy: request.auth.uid,
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    successCount,
    failureCount,
    totalRecipients,
  });

  return { successCount, failureCount, totalRecipients };
});

/**
 * =============================
 * Admin Broadcast Notification (Firestore Trigger)
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

    // Mark as processing
    await snap.ref.update({ status: 'sending' });

    try {
      // Fetch all users with FCM tokens
      const usersSnapshot = await db
        .collection('students')
        .where('fcmToken', '!=', null)
        .get();

      const tokens: string[] = [];
      usersSnapshot.forEach((doc) => {
        const token = doc.data().fcmToken;
        if (token) tokens.push(token);
      });

      if (tokens.length === 0) {
        await snap.ref.update({
          status: 'no_tokens',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return;
      }

      // Send in batches of 500 (FCM multicast limit)
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < tokens.length; i += 500) {
        const batch = tokens.slice(i, i + 500);
        const response = await admin.messaging().sendEachForMulticast({
          tokens: batch,
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

        successCount += response.successCount;
        failureCount += response.failureCount;

        // Clean up invalid tokens
        const invalidTokens: { token: string; uid: string }[] = [];
        response.responses.forEach((resp, idx) => {
          if (
            !resp.success &&
            resp.error &&
            (resp.error.code === 'messaging/invalid-registration-token' ||
              resp.error.code === 'messaging/registration-token-not-registered')
          ) {
            const failedToken = batch[idx];
            usersSnapshot.forEach((doc) => {
              if (doc.data().fcmToken === failedToken) {
                invalidTokens.push({ token: failedToken, uid: doc.id });
              }
            });
          }
        });

        // Remove invalid tokens from Firestore
        for (const { uid } of invalidTokens) {
          await db.collection('students').doc(uid).update({
            fcmToken: admin.firestore.FieldValue.delete(),
          });
        }
      }

      await snap.ref.update({
        status: 'completed',
        successCount,
        failureCount,
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