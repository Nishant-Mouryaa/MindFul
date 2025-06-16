// config/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';



const firebaseConfig = {
  apiKey: "AIzaSyDGMWa7KmwHvuAtYkvlJvtBQ_jY6vuqN4U",
  authDomain: "test-1ef59.firebaseapp.com",
  projectId: "test-1ef59",
  storageBucket: "test-1ef59.firebasestorage.app",
  messagingSenderId: "381657429111",
  appId: "1:381657429111:web:28039ba0cbe9b2cc208272",
  measurementId: "G-938WWBHK3B"
};

// firebase config using env



// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Initialize services
const db = getFirestore(app);
const storage = getStorage(app); // Remove the gs:// URL here

// Debugging
console.log('Firebase initialized successfully');
console.log('Storage bucket:', storage);

export { db, storage, app };
