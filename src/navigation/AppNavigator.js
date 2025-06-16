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
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import BottomTabNavigator from './BottomTabNavigator';
import HomeScreen from '../screens/home/HomeScreen';
import WorkoutScreen from '../screens/workout/WorkoutScreen';
import LogWorkoutScreen from '../screens/workout/LogWorkoutScreen';
import ProgressScreen from '../screens/progress/ProgressScreen';
import TipsScreen from '../screens/tips/TipsScreen';
import AcademyScreen from '../screens/academy/AcademyScreen';

const AuthStack = createStackNavigator();
const AppStack = createStackNavigator();
const OnboardingStack = createStackNavigator();

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Signup" component={SignupScreen} />
  </AuthStack.Navigator>
);

const OnboardingNavigator = () => (
  <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
    <OnboardingStack.Screen name="Onboarding" component={OnboardingScreen} />
  </OnboardingStack.Navigator>
);

const MainNavigator = () => (
  <AppStack.Navigator screenOptions={{ headerShown: false }}>
    <AppStack.Screen name="Main" component={BottomTabNavigator} />
    <AppStack.Screen name="Home" component={HomeScreen} />
    <AppStack.Screen name="Workout" component={WorkoutScreen} />
    <AppStack.Screen name="LogWorkout" component={LogWorkoutScreen} />
    <AppStack.Screen name="Progress" component={ProgressScreen} />
    <AppStack.Screen name="Tips" component={TipsScreen} />
    <AppStack.Screen name="Academy" component={AcademyScreen} />
    {/* ... other screens */}
  </AppStack.Navigator>
);

export default function AppNavigator() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    needsOnboarding: true,
    isLoading: true
  });

  const auth = getAuth();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Once we have a user, listen to that user's document in real-time
        const docRef = doc(db, 'users', user.uid);
        const unsubscribeDoc = onSnapshot(
          docRef,
          (snapshot) => {
            if (!snapshot.exists()) {
              // If no doc yet, assume we need onboarding
              setAuthState({
                isAuthenticated: true,
                needsOnboarding: true,
                isLoading: false
              });
            } else {
              // If doc exists, see if user has onboardingComplete
              const data = snapshot.data();
              const isDone = data.onboardingComplete === true;
              setAuthState({
                isAuthenticated: true,
                needsOnboarding: !isDone, // false if done
                isLoading: false
              });
            }
          },
          (error) => {
            console.error('onSnapshot error:', error);
            // If there's an error, assume we still need onboarding for safety
            setAuthState({
              isAuthenticated: true,
              needsOnboarding: true,
              isLoading: false
            });
          }
        );

        // Return unsubscribe function for the doc listener
        return () => {
          unsubscribeDoc();
        };
      } else {
        // If user is not logged in, no doc to listen to
        setAuthState({
          isAuthenticated: false,
          needsOnboarding: true,
          isLoading: false
        });
      }
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
      {!authState.isAuthenticated ? (
        // User not authenticated -> show Auth flow
        <AuthNavigator />
      ) : authState.needsOnboarding ? (
        // User is authenticated but not onboarded -> show Onboarding
        <OnboardingNavigator />
      ) : (
        // User is authenticated and done onboarding -> show main
        <MainNavigator />
      )}
    </NavigationContainer>
  );
}
