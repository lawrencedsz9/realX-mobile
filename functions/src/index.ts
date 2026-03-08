import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions';
import * as logger from 'firebase-functions/logger';
import { CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';

interface RedeemGiftCardData {
    vendorId: string;
    vendorName: string;
    giftCardAmount: number;
    totalBill: number;
    pin: string;
}

interface CreateVendorUserData {
    name: string;
    email: string;
    password?: string;
}

interface RedeemOfferData {
    vendorId: string;
    pin: string;
    billAmount: number;
    amountSaved?: number;
    creatorCode?: string;
}

initializeApp();

setGlobalOptions({ maxInstances: 10 });

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export const assignCreatorCode = onCall(async (request: CallableRequest<void>) => {
    const { auth } = request;
    if (!auth) throw new HttpsError('unauthenticated', 'Must be logged in');

    const uid = auth.uid;
    const db = getFirestore();

    let assignedCode: string | null = null;
    let attempts = 0;

    while (!assignedCode && attempts < 5) {
        const code = generateCode();
        const codeRef = db.collection('creator_codes').doc(code);
        const userRef = db.collection('students').doc(uid);

        try {
            await db.runTransaction(async (transaction: any) => {
                const codeDoc = await transaction.get(codeRef);
                if (codeDoc.exists) {
                    throw new Error('COLLISION'); // Code taken, throw to retry
                }

                // Claim the code
                transaction.set(codeRef, { uid, createdAt: FieldValue.serverTimestamp() });
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

export const redeemGiftCard = onCall(async (request: CallableRequest<RedeemGiftCardData>) => {
    const { auth, data } = request;
    if (!auth) throw new HttpsError('unauthenticated', 'Must be logged in');

    const { vendorId, vendorName, giftCardAmount, totalBill, pin } = data;

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
    const db = getFirestore();

    const vendorRef = db.collection('vendors').doc(vendorId);
    const userRef = db.collection('students').doc(uid);
    const transactionRef = db.collection('transactions').doc();

    const result = await db.runTransaction(async (transaction: any) => {
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
        const amountSaved = Math.min(giftCardAmount, totalBill);

        const transactionData = {
            totalAmount: totalBill,
            vendorName,
            vendorId,
            redemptionCardAmount: giftCardAmount,
            remainingAmount,
            type: 'giftcard_redemption',
            userId: uid,
            pin,
            createdAt: FieldValue.serverTimestamp(),
        };

        // Perform writes
        transaction.set(transactionRef, transactionData);
        transaction.update(userRef, {
            cashback: FieldValue.increment(-giftCardAmount),
            savings: FieldValue.increment(amountSaved),
        });

        return { transactionId: transactionRef.id, remainingAmount };
    });

    return result;
});

export const createVendorUser = onCall(
    { region: 'me-central1' },
    async (request: CallableRequest<CreateVendorUserData>) => {
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

        const authAdmin = getAuth();
        const db = getFirestore();

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
            createdAt: FieldValue.serverTimestamp(),
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

export const redeemOffer = onCall(async (request: CallableRequest<RedeemOfferData>) => {
    const { auth, data } = request;
    if (!auth) throw new HttpsError('unauthenticated', 'Must be logged in');

    const { vendorId, pin, billAmount, amountSaved = 0, creatorCode } = data;

    if (!vendorId) {
        throw new HttpsError('invalid-argument', 'Vendor ID is required');
    }
    if (!pin || pin.length !== 4) {
        throw new HttpsError('invalid-argument', 'A 4-digit PIN is required');
    }
    if (typeof billAmount !== 'number' || billAmount <= 0) {
        throw new HttpsError('invalid-argument', 'Invalid bill amount');
    }

    const uid = auth.uid;
    const db = getFirestore();

    const vendorRef = db.collection('vendors').doc(vendorId);
    let creatorCodeRef: any | null = null;
    if (creatorCode) {
        creatorCodeRef = db.collection('creator_codes').doc(creatorCode);
    }
    const userRef = db.collection('students').doc(uid);
    const transactionRef = db.collection('transactions').doc();

    const result = await db.runTransaction(async (transaction: any) => {
        let codeData: any | undefined;

        // Validate creator code if provided
        if (creatorCodeRef) {
            const codeDoc = await transaction.get(creatorCodeRef);
            if (!codeDoc.exists) {
                throw new HttpsError('invalid-argument', 'creator code failed');
            }
            codeData = codeDoc.data();
        }

        // Verify vendor PIN
        const vendorDoc = await transaction.get(vendorRef);
        if (!vendorDoc.exists) {
            throw new HttpsError('not-found', 'Vendor not found');
        }
        const vendorData = vendorDoc.data();
        if (!vendorData || String(vendorData.pin) !== String(pin)) {
            throw new HttpsError('permission-denied', 'PIN is incorrect');
        }

        const isXCardEnabled = vendorData.xcard === true;
        let cashbackAmount = 0;
        let creatorCashbackAmount = 0;
        let creatorUid: string | null = null;

        if (isXCardEnabled) {
            if (creatorCodeRef && codeData) {
                if (codeData.uid === uid) {
                    cashbackAmount = billAmount * 0.02; // 2% with own creator code
                } else {
                    cashbackAmount = billAmount * 0.01; // 1% for redeemer
                    creatorCashbackAmount = billAmount * 0.01; // 1% for creator
                    creatorUid = codeData.uid;
                }
            } else {
                cashbackAmount = billAmount * 0.01; // 1% without creator code
            }
        }

        // Perform writes
        const userUpdates: any = {};
        if (cashbackAmount > 0) {
            userUpdates.cashback = FieldValue.increment(cashbackAmount);
        }
        if (amountSaved > 0) {
            userUpdates.savings = FieldValue.increment(amountSaved);
        }

        if (Object.keys(userUpdates).length > 0) {
            transaction.update(userRef, userUpdates);
        }

        if (creatorUid && creatorCashbackAmount > 0) {
            const creatorUserRef = db.collection('students').doc(creatorUid);
            transaction.set(creatorUserRef, {
                cashback: FieldValue.increment(creatorCashbackAmount),
            }, { merge: true });
        }

        const transactionData: any = {
            type: 'offer_redemption',
            userId: uid,
            vendorId: vendorId,
            vendorName: vendorData.name || '',
            billAmount,
            cashbackAmount,
            pin,
            createdAt: FieldValue.serverTimestamp(),
        };

        if (creatorCode) {
            transactionData.creatorCode = creatorCode;
        }

        if (creatorUid && creatorCashbackAmount > 0) {
            transactionData.creatorCashbackAmount = creatorCashbackAmount;
            transactionData.creatorUid = creatorUid;
        }

        transaction.set(transactionRef, transactionData);

        return {
            transactionId: transactionRef.id,
            cashbackEarned: cashbackAmount,
            success: true,
        };
    });

    return result;
});
