import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  signInWithPopup,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  applyActionCode,
  reload,
  sendPasswordResetEmail,
  getDb
} from '../services/firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('lb_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || typeof onAuthStateChanged !== 'function') {
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const fallbackName = (user.email && user.email.indexOf('@') > 0) ? user.email.split('@')[0] : 'User';
          const finalName = user.displayName ? user.displayName.trim() : fallbackName;
          
          let plan = 'basic-free-plan';
          let userDataExt = { scoutsThisMonth: 0, scoutResetDate: new Date().toISOString() };
          
          try {
            const database = await getDb();
            if (database) {
              const { doc, getDoc, setDoc, updateDoc } = await import('firebase/firestore');
              const userDocRef = doc(database, 'users', user.uid);
              const userDoc = await Promise.race([
                getDoc(userDocRef),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 2500))
              ]);

              if (userDoc && userDoc.exists()) {
                const data = userDoc.data();
                plan = data.plan || 'basic-free-plan';
                if (plan === 'paid-premium-plan' && data.premiumUntil) {
                  const expiryDate = new Date(data.premiumUntil);
                  if (expiryDate < new Date()) {
                    plan = 'basic-free-plan';
                    updateDoc(userDocRef, { plan: 'basic-free-plan' }).catch(() => {});
                  }
                }
                
                // Reset monthly scout limits
                let currentScouts = data.scoutsThisMonth || 0;
                let resetDate = data.scoutResetDate ? new Date(data.scoutResetDate) : new Date();
                
                if (new Date() > resetDate) {
                  currentScouts = 0;
                  resetDate = new Date();
                  resetDate.setMonth(resetDate.getMonth() + 1);
                  updateDoc(userDocRef, { 
                    scoutsThisMonth: 0,
                    scoutResetDate: resetDate.toISOString()
                  }).catch(() => {});
                }
                
                userDataExt = {
                  scoutsThisMonth: currentScouts,
                  scoutResetDate: resetDate.toISOString()
                };
              } else {
                const nextReset = new Date();
                nextReset.setMonth(nextReset.getMonth() + 1);
                
                await setDoc(userDocRef, {
                  email: user.email,
                  name: finalName,
                  plan: 'basic-free-plan',
                  scoutsThisMonth: 0,
                  scoutResetDate: nextReset.toISOString(),
                  createdAt: new Date().toISOString()
                });
                userDataExt = { scoutsThisMonth: 0, scoutResetDate: nextReset.toISOString() };
              }
            }
          } catch (err) {
            console.warn('Firestore sync bypassed (offline or blocked by ad-blocker):', err?.message);
            try {
              const cached = JSON.parse(localStorage.getItem('lb_current_user') || '{}');
              if (cached.plan) plan = cached.plan;
            } catch {}
          }

          const userData = {
            uid: user.uid,
            email: user.email,
            name: finalName || 'User',
            photoURL: user.photoURL || null,
            emailVerified: Boolean(user.emailVerified),
            plan: plan,
            ...userDataExt
          };
          setCurrentUser(userData);
          try { localStorage.setItem('lb_current_user', JSON.stringify(userData)); } catch {}
        } else {
          setCurrentUser(null);
          try { localStorage.removeItem('lb_current_user'); } catch {}
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn('onAuthStateChanged listener failed:', err);
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    if (!auth) throw new Error('Authentication is currently offline.');
    return await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (name, email, password) => {
    if (!auth) throw new Error('Authentication is currently offline.');
    const res = await createUserWithEmailAndPassword(auth, email, password);
    if (res.user) {
      if (name) {
        try {
          await updateProfile(res.user, { displayName: name });
        } catch (e) {
          console.warn('Update profile display name error:', e);
        }
      }
      // Send Firebase Email Verification
      try {
        await sendEmailVerification(res.user);
      } catch (err) {
        console.warn('Firebase sendEmailVerification warning:', err);
      }
    }
    return res;
  };

  const sendVerificationEmail = async (customUser = null) => {
    const targetUser = customUser || auth?.currentUser;
    if (!targetUser) throw new Error('No active user account found to verify.');
    return await sendEmailVerification(targetUser);
  };

  const checkEmailVerification = async () => {
    if (!auth?.currentUser) return false;
    await reload(auth.currentUser);
    const verified = Boolean(auth.currentUser.emailVerified);
    if (verified) {
      setCurrentUser(prev => prev ? { ...prev, emailVerified: true } : null);
    }
    return verified;
  };

  const verifyActionCode = async (actionCode) => {
    if (!auth) throw new Error('Authentication is currently offline.');
    await applyActionCode(auth, actionCode);
    if (auth.currentUser) {
      await reload(auth.currentUser);
      setCurrentUser(prev => prev ? { ...prev, emailVerified: true } : null);
    }
  };

  const resetPassword = async (emailAddress) => {
    if (!auth) throw new Error('Authentication is offline.');
    return await sendPasswordResetEmail(auth, emailAddress);
  };

  const incrementScoutCount = async () => {
    if (!currentUser) return;
    try {
      const database = await getDb();
      if (!database) return;
      const { doc, updateDoc } = await import('firebase/firestore');
      const userDocRef = doc(database, 'users', currentUser.uid);
      const newCount = (currentUser.scoutsThisMonth || 0) + 1;
      await updateDoc(userDocRef, { scoutsThisMonth: newCount });
      setCurrentUser(prev => ({ ...prev, scoutsThisMonth: newCount }));
    } catch (err) {
      console.warn('Error incrementing scout count', err);
    }
  };

  const upgradePlan = async (planName, premiumUntil, paymentId = '') => {
    const isoDate = premiumUntil instanceof Date ? premiumUntil.toISOString() : String(premiumUntil);
    const updated = {
      ...(currentUser || {}),
      plan: planName,
      premiumUntil: isoDate,
      paymentId: paymentId
    };
    setCurrentUser(updated);
    try { localStorage.setItem('lb_current_user', JSON.stringify(updated)); } catch {}

    if (currentUser?.uid) {
      try {
        const database = await getDb();
        if (database) {
          const { doc, updateDoc } = await import('firebase/firestore');
          const userRef = doc(database, 'users', currentUser.uid);
          await updateDoc(userRef, {
            plan: planName,
            premiumUntil: isoDate,
            razorpayPaymentId: paymentId
          });
        }
      } catch (err) {
        console.warn('Could not sync payment with Firestore:', err);
      }
    }
  };

  const logout = async () => {
    if (auth) {
      try { await fbSignOut(auth); } catch {}
    }
    setCurrentUser(null);
    try { localStorage.removeItem('lb_current_user'); } catch {}
  };

  const loginWithGoogle = async () => {
    if (!auth || !googleProvider) throw new Error('Google Sign-In is currently unavailable.');
    return await signInWithPopup(auth, googleProvider);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      login,
      signup,
      logout,
      loginWithGoogle,
      sendVerificationEmail,
      checkEmailVerification,
      verifyActionCode,
      resetPassword,
      incrementScoutCount,
      upgradePlan
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
