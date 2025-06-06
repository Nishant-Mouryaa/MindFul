import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from './config/firebase';

const auth = getAuth();
const db = getFirestore(app);

export const setupAdminUser = async (email, password) => {
  try {
    // Create user in Firebase Authentication
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Set admin privileges in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      isAdmin: true,
      createdAt: new Date(),
    });
    
    console.log('Admin user created successfully:', user.email);
    return user;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
};

// Usage: Call this function once to create your first admin
// setupAdminUser('admin@example.com', 'securePassword123');