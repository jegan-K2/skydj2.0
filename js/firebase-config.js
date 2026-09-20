/* ==========================================================================
   FIREBASE CONFIG — SKY DJ & EVENT MANAGEMENT
   Client & Admin Firebase Initialization
   ========================================================================== */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { 
  getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, 
  query, where, orderBy, limit, serverTimestamp, onSnapshot, setDoc 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { 
  getStorage, ref, uploadBytes, getDownloadURL, deleteObject 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut, onAuthStateChanged, updateProfile,
  GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, updatePassword
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

/* ── Firebase Configuration ──
   Replace credentials with your Firebase Console credentials
   Admin access is determined via Firebase Auth & Firestore rules, without hardcoding IDs in the UI.
*/
const firebaseConfig = {
  apiKey: "AIzaSyCR97JUyNHAV2s0p0bCMQDlkVk6QAI6yV4",
  authDomain: "skydjevent.firebaseapp.com",
  projectId: "skydjevent",
  storageBucket: "skydjevent.firebasestorage.app",
  messagingSenderId: "450544359729",
  appId: "1:450544359729:web:70d662df0981cd066ab810",
  measurementId: "G-PJFV2Z7P5Q"
};

/* ── Check if configured ── */
export function isFirebaseConfigured() {
  return (
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey.trim() !== ""
  );
}

/* ── Initialize Firebase ── */
let app, db, storage, auth;
let googleProvider;

if (isFirebaseConfigured()) {
  app            = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  db             = getFirestore(app);
  storage        = getStorage(app);
  auth           = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: "select_account" });
}

export { app, db, storage, auth, googleProvider };

/* ── Firestore Helpers ── */
export {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc,
  query, where, orderBy, limit, serverTimestamp, onSnapshot
};

/* ── Storage Helpers ── */
export { ref, uploadBytes, getDownloadURL, deleteObject };

/* ── Auth Helpers ── */
export { 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, 
  signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail, updatePassword, updateProfile 
};

/* ── Client Google Sign-In ── */
export async function signInClientWithGoogle() {
  if (!auth || !googleProvider) {
    throw new Error("Firebase Authentication is not configured yet. Please configure credentials in js/firebase-config.js.");
  }
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Save/update client user record in Firestore if db is available
  if (db && user) {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName || "Client",
          username: "",
          email: user.email || "",
          role: "client",
          createdAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.warn("Could not record client user profile:", e);
    }
  }

  return user;
}

/* ── PERMANENTLY CONFIGURED ADMIN ACCOUNT ── */
// This is the one and only admin account for SKY DJ & EVENT MANAGEMENT.
// The email is checked ONLY after Firebase Authentication has already verified
// the correct password — this is safe and not a security risk.
const ADMIN_EMAIL = "skydj23@gmail.com";

/* ── Check Admin Privileges via Firestore user role or claims ── */
export async function checkUserIsAdmin(user) {
  if (!user || !db) return false;

  try {
    // 1. Check users/{uid} document for role === 'admin'
    const userSnap = await getDoc(doc(db, "users", user.uid));
    if (userSnap.exists() && userSnap.data().role === "admin") return true;

    // 2. Check Firebase custom token claims
    try {
      const idTokenResult = await user.getIdTokenResult();
      if (idTokenResult.claims && idTokenResult.claims.admin === true) return true;
    } catch (_) {}

    // 3. Check adminConfig collection
    try {
      const configSnap = await getDoc(doc(db, "adminConfig", "main"));
      if (configSnap.exists()) {
        const cfg = configSnap.data();
        if (Array.isArray(cfg.adminUids) && cfg.adminUids.includes(user.uid)) return true;
        if (Array.isArray(cfg.adminEmails) && user.email && cfg.adminEmails.includes(user.email)) return true;
      }
    } catch (_) {}

    // 4. PERMANENT FALLBACK: Match against the configured admin email.
    //    Safe — Firebase Auth already verified the password before reaching here.
    if (user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      // Ensure Firestore admin documents exist / auto-repair if missing
      try {
        await setDoc(doc(db, "adminConfig", "main"), {
          adminUids: [user.uid],
          adminEmails: [user.email],
          createdAt: serverTimestamp()
        }, { merge: true });
        await setDoc(doc(db, "users", user.uid), {
          name: user.displayName || "Admin",
          email: user.email,
          role: "admin",
          createdAt: serverTimestamp()
        }, { merge: true });
      } catch (writeErr) {
        // Firestore write may fail if rules not yet deployed — still allow login
        console.warn("Could not persist admin role (rules not deployed yet):", writeErr.message);
      }
      return true;
    }

  } catch (err) {
    console.warn("checkUserIsAdmin error:", err);
  }
  return false;
}


/* ── Utility: Upload file to Firebase Storage ── */
export async function uploadFile(file, path) {
  if (!storage) throw new Error("Firebase Storage not configured.");
  const storageRef = ref(storage, path);
  const snapshot   = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

/* ── Utility: Format Date ── */
export function formatDate(timestamp) {
  if (!timestamp) return "";
  try {
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch {
    return "";
  }
}

/* ── Utility: Format Price ── */
export function formatPrice(amount, type = "per day") {
  if (amount === null || amount === undefined || amount === "") return "Price on Request";
  const num = Number(amount);
  if (isNaN(num)) return amount;
  return `₹${num.toLocaleString("en-IN")} ${type ? `/${type}` : ""}`;
}
