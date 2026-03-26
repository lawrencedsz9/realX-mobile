/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import * as admin from 'firebase-admin';
import { CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions';
admin.initializeApp();

setGlobalOptions({ region: 'me-central1', maxInstances: 10 });

const db = admin.firestore();

/**
 * Utils
 */
const generateCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

const toCents = (amount: number) => Math.round(amount * 100);
const fromCents = (cents: number) => cents / 100;

/**
 * 🔑 Assign Creator Code (IDEMPOTENT)
 */
export const assignCreatorCode = onCall(async (request: CallableRequest) => {
  const { auth } = request;
  if (!auth) throw new HttpsError('unauthenticated', 'Must be logged in');

  const uid = auth.uid;
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

    let code: string | null = null;
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
 * 🔍 Check Student Exists (LOGIN PRECHECK)
 */
export const checkStudentExists = onCall(async (request: CallableRequest) => {
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
 * 🔐 Verify Vendor PIN (DIRECT COMPARISON)
 */
const verifyPin = (inputPin: string, storedPin: string) => {
  return inputPin === storedPin;
};

/**
 * 💳 CORE TRANSACTION HANDLER
 */
interface TransactionOptions {
  uid: string;
  vendorId: string;
  vendorName: string;
  totalAmount: number;
  pin: string;
  type: 'giftcard' | 'offer';
  giftCardAmount?: number;
  offerId?: string | null;
  discountValue?: number;
  discountType?: 'percentage' | 'flat' | null;
  creatorCode?: string | null;
}

const processTransaction = async ({
  uid,
  vendorId,
  vendorName,
  totalAmount,
  pin,
  type,
  giftCardAmount = 0,
  offerId = null,
  discountValue = 0,
  discountType = null,
  creatorCode = null,
}: TransactionOptions) => {
  const userRef = db.collection('students').doc(uid);
  const vendorRef = db.collection('vendors').doc(vendorId);
  const transactionRef = db.collection('transactions').doc();

  return db.runTransaction(async (tx) => {
    /**
     * 🔹 ALL READS FIRST
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
     * 🔐 Verify PIN
     */
    const validPin = verifyPin(pin, vendorData.pin);
    if (!validPin) {
      throw new HttpsError('permission-denied', 'Invalid PIN');
    }

    /**
     * 💰 Convert to cents
     */
    const totalCents = toCents(totalAmount);
    let discountCents = 0;
    let finalCents = totalCents;

    /**
     * 🎯 OFFER LOGIC
     */
    let creatorUid: string | null = null;
    let creatorRef = null;
    let creatorDoc = null;

    if (type !== 'giftcard') {
      if (discountType === 'percentage') {
        discountCents = Math.round(totalCents * (discountValue / 100));
      } else if (discountType === 'amount') {
        discountCents = toCents(discountValue);
      } else {
        throw new HttpsError('invalid-argument', 'Invalid discount type');
      }

      discountCents = Math.min(discountCents, totalCents);
      finalCents = totalCents - discountCents;

      /**
       * 🎯 Creator Code Validation
       */
      if (creatorCode) {
        const code = creatorCode.trim().toUpperCase();
        const codeRef = db.collection('creator_codes').doc(code);
        const codeDoc = await tx.get(codeRef);

        if (!codeDoc.exists) {
          throw new HttpsError('not-found', 'Invalid creator code');
        }

        creatorUid = codeDoc.data()?.uid;
        creatorRef = db.collection('students').doc(creatorUid);
        creatorDoc = await tx.get(creatorRef);

        if (!creatorDoc.exists) {
          throw new HttpsError('not-found', 'Creator not found');
        }
      }
    }

    /**
     * 💳 GIFT CARD LOGIC
     */
    if (type === 'giftcard') {
      const balance = toCents(userData.cashback || 0);
      const redeemCents = toCents(giftCardAmount);

      if (balance < redeemCents) {
        throw new HttpsError('failed-precondition', 'Insufficient balance');
      }

      finalCents = Math.max(0, totalCents - redeemCents);

      tx.update(userRef, {
        cashback: admin.firestore.FieldValue.increment(-fromCents(redeemCents)),
      });
    }

    /**
     * 💰 CASHBACK LOGIC (ONLY FOR OFFERS WITH CREATOR)
     */
    let userCashback = 0;
    let creatorCashback = 0;

    if (creatorUid) {
      const cashbackCents = Math.round(finalCents * 0.01);

      userCashback = cashbackCents;
      creatorCashback = cashbackCents;
    }

    /**
     * 🧾 WRITE TRANSACTION
     */
    tx.set(transactionRef, {
      type,
      userId: uid,
      vendorId,
      vendorName,
      totalAmount,
      discountAmount: fromCents(discountCents),
      finalAmount: fromCents(finalCents),
      creatorCode: creatorCode || null,
      creatorUid,
      cashbackAmount: fromCents(userCashback),
      creatorCashbackAmount: fromCents(creatorCashback),
      offerId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    /**
     * 👤 Update User
     */
    const userUpdates: admin.firestore.UpdateData<admin.firestore.DocumentData> = {};

    if (discountCents > 0) {
      userUpdates.savings =
        admin.firestore.FieldValue.increment(fromCents(discountCents));
    }

    if (userCashback > 0) {
      userUpdates.cashback =
        admin.firestore.FieldValue.increment(fromCents(userCashback));
    }

    if (Object.keys(userUpdates).length > 0) {
      tx.update(userRef, userUpdates);
    }

    /**
     * 👥 Update Creator
     */
    if (creatorRef && creatorUid !== uid && creatorCashback > 0) {
      tx.update(creatorRef, {
        cashback: admin.firestore.FieldValue.increment(
          fromCents(creatorCashback)
        ),
      });
    }

    return {
      transactionId: transactionRef.id,
      finalAmount: fromCents(finalCents),
    };
  });
};

/**
 * 🎁 Gift Card Redemption
 */
export const redeemGiftCard = onCall(async (request: CallableRequest) => {
  const { auth, data } = request;
  if (!auth) throw new HttpsError('unauthenticated', 'Login required');

  return processTransaction({
    uid: auth.uid,
    type: 'giftcard',
    ...data,
  });
});

/**
 * 🏷 Offer Redemption
 */
export const redeemOffer = onCall(async (request: CallableRequest) => {
  const { auth, data } = request;
  if (!auth) throw new HttpsError('unauthenticated', 'Login required');

  return processTransaction({
    uid: auth.uid,
    type: 'offer',
    ...data,
  });
});