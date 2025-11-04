import { initializeApp, FirebaseApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, Firestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Lấy cấu hình từ biến môi trường của Vite (import.meta.env)
const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID,
  measurementId: (import.meta as any).env.VITE_FIREBASE_MEASUREMENT_ID
};

// Khởi tạo Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Khởi tạo Firebase Auth và lấy một tham chiếu đến dịch vụ
const auth = getAuth(app);

let dbInstance: Firestore | null = null;

const getDb = (): Firestore => {
    if (!dbInstance) {
        try {
            dbInstance = initializeFirestore(app, {
                localCache: persistentLocalCache({})
            });
        } catch (err) {
            console.error("Error initializing Firestore with persistence. Falling back to default in-memory cache.", err);
            dbInstance = initializeFirestore(app, {});
        }
    }
    return dbInstance;
};

export { getDb, auth };
