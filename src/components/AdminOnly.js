import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';



const AdminOnly = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(null);
  const navigation = useNavigation();
  const auth = getAuth();

  useEffect(() => {
    const checkAdminStatus = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        setIsAdmin(docSnap.exists() && docSnap.data().isAdmin);
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  if (isAdmin === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAdmin) {
    navigation.navigate('Main');
    return null;
  }

  return children;
};

export default AdminOnly;