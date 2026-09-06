// Firebase V10 Compat Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBk-C_kK5t0ikxbjnxupd9x07iTEnBSDVg",
  authDomain: "lbuddy-bf570.firebaseapp.com",
  projectId: "lbuddy-bf570",
  storageBucket: "lbuddy-bf570.firebasestorage.app",
  messagingSenderId: "297605700923",
  appId: "1:297605700923:web:83c4b65fa1c8cbef536b1e",
  measurementId: "G-02F74GGTZ6"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

auth.onAuthStateChanged((user) => {
  if (user) {
    const fallbackName = (user.email && user.email.indexOf('@') > 0) ? user.email.split('@')[0] : 'User';
    const finalName = user.displayName ? user.displayName.trim() : fallbackName;
    localStorage.setItem('lb_current_user', JSON.stringify({
      uid: user.uid,
      email: user.email,
      name: finalName || 'User'
    }));
    window.dispatchEvent(new CustomEvent('firebaseAuthUpdate', { detail: { user } }));
  } else {
    localStorage.removeItem('lb_current_user');
    window.dispatchEvent(new CustomEvent('firebaseAuthUpdate', { detail: { user: null } }));
  }
});