import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getDatabase } from "firebase/database"
import { getAnalytics } from "firebase/analytics"

// Firebase configuration from your credentials
const firebaseConfig = {
  apiKey: "AIzaSyA4T14XH4Kls8Qesffr6KNywUXrwqbs8LQ",
  authDomain: "dev-space-d8dbe.firebaseapp.com",
  databaseURL: "https://dev-space-d8dbe-default-rtdb.firebaseio.com",
  projectId: "dev-space-d8dbe",
  storageBucket: "dev-space-d8dbe.firebasestorage.app",
  messagingSenderId: "1063806728845",
  appId: "1:1063806728845:web:e1c6b091a7bb1083f440c4",
  measurementId: "G-0C944DJJY7"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const realtimeDb = getDatabase(app)
export const analytics = getAnalytics(app)

export default app
