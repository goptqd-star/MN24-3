import { initializeApp, FirebaseApp } from "firebase/app";
// Explicitly import firestore for its side-effects to ensure the service is registered.
import "firebase/firestore"; 
// Update imports to use the new API for persistence
import { initializeFirestore, persistentLocalCache, Firestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// =================================================================================================
// QUAN TRỌNG: THAY THẾ CÁC GIÁ TRỊ DƯỚI ĐÂY BẰNG CẤU HÌNH DỰ ÁN FIREBASE CỦA BẠN
// Bạn có thể lấy thông tin này từ Console của Firebase:
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

// Khởi tạo Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Khởi tạo Firebase Auth và lấy một tham chiếu đến dịch vụ
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


// Xuất hàm lấy Firestore instance và Auth instance
export { getDb, auth };