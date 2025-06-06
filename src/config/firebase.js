// config/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';


const firebaseConfig = {
  apiKey: "AIzaSyBACL6T_ZD0bcThgCJ9UNBG1jSEgBJYOko",
  authDomain: "iyers-78791.firebaseapp.com",
  projectId: "iyers-78791",
  storageBucket: "iyers-78791.appspot.com", // Use this format instead of gs://
  messagingSenderId: "949976205738",
  appId: "1:949976205738:web:5652fa2e621d2150e1c3d3"
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
