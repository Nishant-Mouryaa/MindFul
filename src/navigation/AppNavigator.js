import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';  // Use onSnapshot
import { db } from '../config/firebase';
import { useEffect, useState } from 'react';

// Import all your screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import BottomTabNavigator from './BottomTabNavigator';
import HomeScreen from '../screens/home/HomeScreen';
import BreathingScreen from '../screens/mental-health/BreathingScreen';
import CBTScreen from '../screens/mental-health/CBTScreen';
import GroundingScreen from '../screens/mental-health/GroundingScreen';
import JournalScreen from '../screens/mental-health/JournalScreen';
import EmergencyResourcesScreen from '../screens/mental-health/EmergencyResourcesScreen';
import SavedRecordsScreen from '../screens/mental-health/SavedRecordsScreen';
import RecordDetailScreen from '../screens/mental-health/RecordDetailScreen';

const AuthStack = createStackNavigator();
const AppStack = createStackNavigator();

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Signup" component={SignupScreen} />
  </AuthStack.Navigator>
);

const MainNavigator = () => (
  <AppStack.Navigator screenOptions={{ headerShown: false }}>
    <AppStack.Screen name="Main" component={BottomTabNavigator} />
    <AppStack.Screen name="Home" component={HomeScreen} />
    <AppStack.Screen name="Breathing" component={BreathingScreen} />
    <AppStack.Screen name="CBT" component={CBTScreen} />
    <AppStack.Screen name="Grounding" component={GroundingScreen} />
    <AppStack.Screen name="Journal" component={JournalScreen} />
    <AppStack.Screen name="EmergencyResources" component={EmergencyResourcesScreen} />
    <AppStack.Screen name="SavedRecordsScreen" component={SavedRecordsScreen} />
    <AppStack.Screen name="RecordDetailScreen" component={RecordDetailScreen} />
  </AppStack.Navigator>
);

export default function AppNavigator() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isLoading: true
  });

  const auth = getAuth();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        setAuthState({
            isAuthenticated: !!user,
            isLoading: false
        });
    });

    // Cleanup the auth subscription
    return unsubscribeAuth;
  }, [auth]);

  if (authState.isLoading) {
    // Return a loading screen or null
    return null;
  }

  // Decide which navigator to show
  return (
    <NavigationContainer>
      {authState.isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
