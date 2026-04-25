import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDuXQrU63klvOD7mdK1G9EWSMKmANBmPfA",
  authDomain: "members-4d6b3.firebaseapp.com",
  databaseURL: "https://members-4d6b3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "members-4d6b3",
  storageBucket: "members-4d6b3.firebasestorage.app",
  messagingSenderId: "538980022485",
  appId: "1:538980022485:web:a28c4d40f960989fc10a5c",
  measurementId: "G-FSLQ1D8FEN"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getDatabase(app);
export const storage = getStorage(app);
