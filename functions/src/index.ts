import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

admin.initializeApp();

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export const assignCreatorCode = onCall(async (request) => {
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
        } catch (error: any) {
            if (error.message !== 'COLLISION') throw error;
            attempts++;
        }
    }

    if (!assignedCode) {
        throw new HttpsError('internal', 'Failed to generate unique code');
    }

    return { creatorCode: assignedCode };
});
