import { initializeApp, type FirebaseApp } from "firebase/app";
// FIX: Correctly import functions and types from 'firebase/firestore'.
import { initializeFirestore, persistentLocalCache, type Firestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// =================================================================================================
// IMPORTANT: REPLACE THE VALUES BELOW WITH YOUR FIREBASE PROJECT CONFIG
// You can get this information from the Firebase Console:
// Project settings > General > Your apps > Firebase SDK snippet > Config
// =================================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyDLjmEvxFN77cZoAgutIbfcSnpYZLvwynA",
  authDomain: "project-6402338388925710253.firebaseapp.com",
  projectId: "project-6402338388925710253",
  storageBucket: "project-6402338388925710253.firebasestorage.app",
  messagingSenderId: "888042239100",
  appId: "1:888042239100:web:0d363fa4d3de2f4960c5f9",
  measurementId: "G-L3R6D8TVPY"
};


// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Auth and get a reference to the service
const auth = getAuth(app);

let dbInstance: Firestore | null = null;

/**
 * Lazily initializes and returns the Firestore instance.
 * This singleton pattern helps prevent race conditions where Firestore is
 * requested before its service is available. It now uses the recommended
 * `initializeFirestore` with cache settings to enable offline persistence.
 */
const getDb = (): Firestore => {
    if (!dbInstance) {
        try {
            // Use the new API to initialize Firestore with offline persistence enabled.
            // This replaces the deprecated enableIndexedDbPersistence() function.
            dbInstance = initializeFirestore(app, {
                cache: persistentLocalCache({})
            });
        } catch (err) {
            console.error("Error initializing Firestore with persistence. Falling back to default in-memory cache.", err);
            // Fallback to memory-only cache if the initialization with persistence fails.
            dbInstance = initializeFirestore(app, {});
        }
    }
    return dbInstance;
};


// Export functions to get Firestore and Auth instances
export { getDb, auth };