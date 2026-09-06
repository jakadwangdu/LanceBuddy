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
  reload
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
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          const fallbackName = (user.email && user.email.indexOf('@') > 0) ? user.email.split('@')[0] : 'User';
          const finalName = user.displayName ? user.displayName.trim() : fallbackName;
          const userData = {
            uid: user.uid,
            email: user.email,
            name: finalName || 'User',
            photoURL: user.photoURL || null,
            emailVerified: Boolean(user.emailVerified)
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
      verifyActionCode
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
