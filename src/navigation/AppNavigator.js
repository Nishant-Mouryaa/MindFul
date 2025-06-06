import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import BottomTabNavigator from './BottomTabNavigator';
import AdminStack from './AdminStack'; // Import the new AdminStack
import PdfViewerScreen from '../screens/PdfViewerScreen';

import BoardSelectionScreen from '../screens/Test/BoardSelectionScreen';
import StandardSelectionScreen from '../screens/Test/StandardSelectionScreen';
import SubjectSelectionScreen from '../screens/Test/SubjectSelectionScreen';
import ChapterSelectionScreen from '../screens/Test/ChapterSelectionScreen';
import TestListScreen from '../screens/Test/TestListScreen';
import TestScreen from '../screens/Test/TestScreen';
import AboutUsScreen from '../screens/AboutUsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';



import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';


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
    <AppStack.Screen name="BoardSelection" component={BoardSelectionScreen} />
    <AppStack.Screen name="StandardSelection" component={StandardSelectionScreen} />
    <AppStack.Screen name="SubjectSelection" component={SubjectSelectionScreen} />
    <AppStack.Screen name="ChapterSelection" component={ChapterSelectionScreen} />
    <AppStack.Screen name="TestList" component={TestListScreen} />
    <AppStack.Screen name="TestScreen" component={TestScreen} />
    <AppStack.Screen name="AboutUs" component={AboutUsScreen} />
    <AppStack.Screen name="Settings" component={SettingsScreen} />
    <AppStack.Screen name="Profile" component={ProfileScreen} />
    
    

    <AppStack.Screen name="Admin" component={AdminStack} />

    <AppStack.Screen 
      name="PdfViewer" 
      component={PdfViewerScreen}
      options={({ route }) => ({ title: route.params?.title || 'PDF' })}
    />
  </AppStack.Navigator>

  
);

const AppNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });

    return unsubscribe; // Clean up on unmount
  }, []);

  if (isLoading) {
    // Return a loading screen here if needed
    return null;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;