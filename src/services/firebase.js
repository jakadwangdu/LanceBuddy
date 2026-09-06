import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  applyActionCode,
  checkActionCode,
  reload
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBk-C_kK5t0ikxbjnxupd9x07iTEnBSDVg",
  authDomain: "lbuddy-bf570.firebaseapp.com",
  projectId: "lbuddy-bf570",
  storageBucket: "lbuddy-bf570.firebasestorage.app",
  messagingSenderId: "297605700923",
  appId: "1:297605700923:web:83c4b65fa1c8cbef536b1e",
  measurementId: "G-02F74GGTZ6"
};

let app = null;
let auth = null;
let googleProvider = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
} catch (err) {
  console.warn('Firebase initialization bypassed or blocked by browser:', err);
}

export {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  applyActionCode,
  checkActionCode,
  reload
};
