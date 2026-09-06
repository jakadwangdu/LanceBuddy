// LanceBuddy Firebase Email Verification Service (100% Native Firebase Auth)
import {
  auth,
  sendEmailVerification,
  applyActionCode,
  checkActionCode,
  reload
} from './firebase';

/**
 * Sends a Firebase verification email directly to the authenticated user.
 * @param {import('firebase/auth').User} [customUser] - Optional Firebase User object
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendFirebaseVerificationEmail = async (customUser = null) => {
  const targetUser = customUser || auth?.currentUser;
  if (!targetUser) {
    throw new Error('No active user account found. Please sign up or log in first.');
  }

  await sendEmailVerification(targetUser);
  return {
    success: true,
    message: `Verification email sent by Firebase to ${targetUser.email}`
  };
};

/**
 * Reloads the current user to verify if their email has been verified via Firebase.
 * @returns {Promise<boolean>} True if email is verified
 */
export const checkEmailVerificationStatus = async () => {
  if (!auth?.currentUser) return false;
  try {
    await reload(auth.currentUser);
    return Boolean(auth.currentUser.emailVerified);
  } catch (err) {
    console.warn('Error checking verification status:', err);
    return false;
  }
};

/**
 * Applies a Firebase action code (oobCode) from verification link.
 * @param {string} actionCode
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const verifyFirebaseActionCode = async (actionCode) => {
  if (!auth) throw new Error('Firebase Authentication is offline.');
  if (!actionCode || !actionCode.trim()) {
    throw new Error('Please provide a valid verification code.');
  }

  const cleanCode = actionCode.trim();
  await applyActionCode(auth, cleanCode);
  if (auth.currentUser) {
    await reload(auth.currentUser);
  }
  return {
    success: true,
    message: 'Email successfully verified!'
  };
};

/**
 * Validates a Firebase action code without applying it yet.
 * @param {string} actionCode
 * @returns {Promise<{operation: string, data: object}>}
 */
export const inspectFirebaseActionCode = async (actionCode) => {
  if (!auth) throw new Error('Firebase Authentication is offline.');
  return await checkActionCode(auth, actionCode.trim());
};
