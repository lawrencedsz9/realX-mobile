/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import * as admin from 'firebase-admin';
import { CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions';
import * as logger from 'firebase-functions/logger';

admin.initializeApp();

setGlobalOptions({ region: 'me-central1', maxInstances: 10 });

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export const assignCreatorCode = onCall(async (request: CallableRequest) => {
    const { auth } = request;
    if (!auth) throw new HttpsError('unauthenticated', 'Must be logged in');

    const uid = auth.uid;
    const db = admin.firestore();

    let assignedCode: string | null = null;
    let attempts = 0;

    while (!assignedCode && attempts < 5) {
        const code = generateCode();
        const codeRef = db.collection('creator_codes').doc(code);
        const userRef = db.collection('students').doc(uid);

        try {
            await db.runTransaction(async (transaction) => {
                const codeDoc = await transaction.get(codeRef);
                if (codeDoc.exists) {
                    throw new Error('COLLISION'); // Code taken, throw to retry
                }

                // Claim the code
                transaction.set(codeRef, { uid, createdAt: admin.firestore.FieldValue.serverTimestamp() });
                // Update the user document
                transaction.update(userRef, { creatorCode: code });
            });

            assignedCode = code; // Success! Break the loop
        } catch (error) {
            if (error instanceof Error && error.message !== 'COLLISION') throw error;
            if (!(error instanceof Error)) throw error;
            attempts++;
        }
    }

    if (!assignedCode) {
        throw new HttpsError('internal', 'Failed to generate unique code');
    }

    return { creatorCode: assignedCode };
});

export const redeemGiftCard = onCall(async (request: CallableRequest) => {
    const { auth, data } = request;
    if (!auth) throw new HttpsError('unauthenticated', 'Must be logged in');

    const { vendorId, vendorName, giftCardAmount, totalBill, pin } = data as {
        vendorId: string;
        vendorName: string;
        giftCardAmount: number;
        totalBill: number;
        pin: string;
    };

    // Validate required fields
    if (!vendorId || !vendorName) {
        throw new HttpsError('invalid-argument', 'Vendor information is required');
    }
    if (typeof giftCardAmount !== 'number' || giftCardAmount <= 0) {
        throw new HttpsError('invalid-argument', 'Invalid gift card amount');
    }
    if (typeof totalBill !== 'number' || totalBill <= 0) {
        throw new HttpsError('invalid-argument', 'Invalid total bill amount');
    }
    if (!pin || pin.length !== 4) {
        throw new HttpsError('invalid-argument', 'A 4-digit PIN is required');
    }

    const uid = auth.uid;
    const db = admin.firestore();

    const vendorRef = db.collection('vendors').doc(vendorId);
    const userRef = db.collection('students').doc(uid);
    const transactionRef = db.collection('transactions').doc();

    const result = await db.runTransaction(async (transaction) => {
        // Verify vendor PIN
        const vendorDoc = await transaction.get(vendorRef);
        if (!vendorDoc.exists) {
            throw new HttpsError('not-found', 'Vendor not found');
        }
        const vendorData = vendorDoc.data();
        if (!vendorData || String(vendorData.pin) !== String(pin)) {
            throw new HttpsError('permission-denied', 'Incorrect vendor PIN');
        }

        // Verify user cashback balance
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
            throw new HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        const currentCashback = userData?.cashback || 0;

        if (currentCashback < giftCardAmount) {
            throw new HttpsError('failed-precondition', 'Insufficient cashback balance');
        }

        const remainingAmount = Math.max(0, totalBill - giftCardAmount);

        const transactionData = {
            totalAmount: totalBill,
            vendorName,
            vendorId,
            redemptionCardAmount: giftCardAmount,
            remainingAmount,
            type: 'giftcard_redemption',
            userId: uid,
            pin,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Perform writes
        transaction.set(transactionRef, transactionData);
        transaction.update(userRef, {
            cashback: admin.firestore.FieldValue.increment(-giftCardAmount),
        });

        return { transactionId: transactionRef.id, remainingAmount };
    });

    return result;
});

export const redeemOffer = onCall(async (request: CallableRequest) => {
    const { auth, data } = request;
    if (!auth) throw new HttpsError('unauthenticated', 'Must be logged in');

    const {
        offerId,
        vendorId,
        vendorName,
        totalAmount,
        pin,
        creatorCode,
        discountValue,
        discountType,
    } = data as {
        offerId: string;
        vendorId: string;
        vendorName: string;
        totalAmount: number;
        pin: string;
        creatorCode?: string;
        discountValue: number;
        discountType: string;
    };

    // Validate required fields
    if (!offerId || !vendorId || !vendorName) {
        throw new HttpsError('invalid-argument', 'Offer and vendor information is required');
    }
    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
        throw new HttpsError('invalid-argument', 'Invalid total amount');
    }
    if (!pin || pin.length !== 4) {
        throw new HttpsError('invalid-argument', 'A 4-digit PIN is required');
    }
    if (typeof discountValue !== 'number' || discountValue <= 0) {
        throw new HttpsError('invalid-argument', 'Invalid discount value');
    }

    const uid = auth.uid;
    const db = admin.firestore();

    const vendorRef = db.collection('vendors').doc(vendorId);
    const userRef = db.collection('students').doc(uid);
    const transactionRef = db.collection('transactions').doc();

    const result = await db.runTransaction(async (transaction) => {
        // 1. Validate creator code (if provided)
        let creatorCodeOwnerUid: string | null = null;
        if (creatorCode && creatorCode.trim() !== '') {
            const trimmedCode = creatorCode.trim();
            const codeRef = db.collection('creator_codes').doc(trimmedCode);
            const codeDoc = await transaction.get(codeRef);
            if (!codeDoc.exists) {
                throw new HttpsError('not-found', 'Invalid creator code');
            }
            creatorCodeOwnerUid = codeDoc.data()?.uid || null;
        }



        // 2. Verify vendor PIN
        const vendorDoc = await transaction.get(vendorRef);
        if (!vendorDoc.exists) {
            throw new HttpsError('not-found', 'Vendor not found');
        }
        const vendorData = vendorDoc.data();
        if (!vendorData || String(vendorData.pin) !== String(pin)) {
            throw new HttpsError('permission-denied', 'Incorrect vendor PIN');
        }

        const isXcard = vendorData.xcard === true;

        // 3. Verify user exists
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
            throw new HttpsError('not-found', 'User not found');
        }

        // 4. Calculate discount
        let discountAmount = 0;
        if (discountType === 'percentage') {
            discountAmount = totalAmount * (discountValue / 100);
        } else {
            discountAmount = discountValue; // flat discount
        }
        discountAmount = Math.min(discountAmount, totalAmount); // can't exceed total
        const finalAmount = totalAmount - discountAmount;

        // 5. Calculate cashback (only for xcard-enabled vendors)
        const round = (n: number) => Math.round(n * 100) / 100;
        let cashbackAmount = 0;
        let creatorCashbackAmount = 0;
        if (isXcard) {
            cashbackAmount = round(finalAmount * 0.01); // 1% cashback to redeemer
            if (creatorCodeOwnerUid) {
                creatorCashbackAmount = round(finalAmount * 0.01); // 1% to creator code owner
            }
        }

        // 6. Build transaction record
        const transactionData = {
            type: 'offer_redemption',
            offerId,
            vendorId,
            vendorName,
            totalAmount,
            discountValue,
            discountType,
            discountAmount,
            finalAmount,
            creatorCode: (creatorCode && creatorCode.trim() !== '') ? creatorCode.trim() : null,
            creatorCodeOwnerId: creatorCodeOwnerUid,
            userId: uid,
            cashbackAmount,
            creatorCashbackAmount,
            pin,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // 7. Perform writes
        transaction.set(transactionRef, transactionData);

        // Combine cashback amounts if the user used their own creator code
        let totalUserCashback = cashbackAmount;
        let updateCreatorSeparately = true;

        if (creatorCodeOwnerUid === uid && creatorCashbackAmount > 0) {
            totalUserCashback += creatorCashbackAmount;
            updateCreatorSeparately = false;
        }

        // Update user savings and cashback
        const userUpdates: Record<string, admin.firestore.FieldValue> = {
            savings: admin.firestore.FieldValue.increment(discountAmount),
        };
        if (totalUserCashback > 0) {
            userUpdates.cashback = admin.firestore.FieldValue.increment(totalUserCashback);
        }
        transaction.update(userRef, userUpdates);

        // Update creator code owner's cashback if it's a different user
        if (updateCreatorSeparately && creatorCodeOwnerUid && creatorCashbackAmount > 0) {
            const creatorRef = db.collection('students').doc(creatorCodeOwnerUid);

            await transaction.get(creatorRef);

            if (!creatorDoc.exists) {
                throw new HttpsError('not-found', 'Creator user not found');
            }

            transaction.update(creatorRef, {
                cashback: admin.firestore.FieldValue.increment(creatorCashbackAmount),
            });
        }

        return {
            transactionId: transactionRef.id,
            finalAmount,
            discountAmount,
            cashbackAmount,
            creatorCashbackAmount,
        };
    });

    logger.info('Offer redeemed', {
        offerId,
        vendorId,
        userId: uid,
        transactionId: result.transactionId,
    });

    return result;
});

export const createVendorUser = onCall(
    { region: 'me-central1' },
    async (request: CallableRequest) => {
        const { auth, data } = request;

        // 1️⃣ Auth required
        if (!auth) {
            throw new HttpsError('unauthenticated', 'User not authenticated');
        }

        // 2️⃣ Super admin only
        if (!auth.token.admin) {
            throw new HttpsError('permission-denied', 'Admin access required');
        }

        const { name, email, password } = data;

        // 3️⃣ Validate input
        if (!name || !email || !password) {
            throw new HttpsError(
                'invalid-argument',
                'name, email, and password are required'
            );
        }

        const authAdmin = admin.auth();
        const db = admin.firestore();

        // 4️⃣ Create Auth user
        const user = await authAdmin.createUser({
            email,
            password,
            displayName: name,
            emailVerified: true, // optional since you're onboarding manually
        });

        // 6️⃣ Create vendor Firestore document
        await db.collection('vendors').doc(user.uid).set({
            name,
            email,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info('Vendor created', {
            vendorId: user.uid,
        });

        return {
            uid: user.uid,
            success: true,
        };
    }
);

export const checkStudentExists = onCall(async (request: CallableRequest) => {
    const email = (request.data as { email?: string })?.email?.toLowerCase().trim();

    if (!email) {
        throw new HttpsError('invalid-argument', 'Email is required');
    }

    try {
        const snapshot = await admin
            .firestore()
            .collection('students')
            .where('email', '==', email)
            .limit(1)
            .get();

        return { exists: !snapshot.empty };
    } catch (error) {
        logger.error('checkStudentExists error', error);
        throw new HttpsError('internal', 'Something went wrong');
    }
});

export const migrateStudentProfile = onCall(async (request: CallableRequest) => {
    const { auth } = request;
    if (!auth) throw new HttpsError('unauthenticated', 'Must be logged in');

    const uid = auth.uid;
    const db = admin.firestore();

    // Check if this user already has a profile under their current UID
    const currentDoc = await db.collection('students').doc(uid).get();
    if (currentDoc.exists) {
        return { migrated: false, reason: 'Profile already exists for current UID' };
    }

    // Look up the user's email from Firebase Auth
    const userRecord = await admin.auth().getUser(uid);
    const email = userRecord.email;
    if (!email) {
        return { migrated: false, reason: 'No email associated with this account' };
    }

    // Query for an existing profile with this email
    const snapshot = await db
        .collection('students')
        .where('email', '==', email)
        .limit(1)
        .get();

    if (snapshot.empty) {
        return { migrated: false, reason: 'No existing profile found for this email' };
    }

    const existingDoc = snapshot.docs[0];

    // Don't migrate if it's the same document
    if (existingDoc.id === uid) {
        return { migrated: false, reason: 'Profile already under current UID' };
    }

    const existingData = existingDoc.data();

    // Migrate: copy to new UID, delete old doc
    await db.runTransaction(async (transaction) => {
        transaction.set(db.collection('students').doc(uid), {
            ...existingData,
            uid: uid,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        transaction.delete(existingDoc.ref);
    });

    logger.info('Migrated student profile', {
        fromUid: existingDoc.id,
        toUid: uid,
        email,
    });

    return { migrated: true };
});
