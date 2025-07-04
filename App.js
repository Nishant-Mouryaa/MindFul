import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { AppProvider } from './src/AppContext';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import './src/config/firebase';
import theme from './src/theme';
import { useFonts } from 'expo-font';
import { Palette } from './src/theme/colors';
import { MD3LightTheme } from 'react-native-paper';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useContext, useEffect } from 'react';
import { AppContext } from './src/AppContext';
import { Platform } from 'react';
import { getAuth } from 'firebase/auth';
import { db } from './src/config/firebase';
import { doc, updateDoc } from 'firebase/firestore';



const LightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary:      Palette.primary,
    primaryContainer: Palette.primaryLight,
    background:   Palette.bg,
    surface:      Palette.bg,
    outline:      Palette.textMuted,
    onSurface:    Palette.text,
    onBackground: Palette.text,
  },
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } else {
    alert('Must use physical device for Push Notifications');
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4DB6AC',
    });
  }
  return token;
}

function NotificationRegistrar() {
  const { setPushToken } = useContext(AppContext);
  useEffect(() => {
    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setPushToken(token);
        // Save token to Firestore if user is logged in
        try {
          const auth = getAuth();
          const user = auth.currentUser;
          if (user) {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { pushToken: token });
          }
        } catch (err) {
          console.error('Error saving push token to Firestore:', err);
        }
      }
    })();
  }, []);
  return null;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
    'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
  });
  return (
    <PaperProvider theme={LightTheme} >
      <AppProvider>
        <NotificationRegistrar />
        <AppNavigator />
      </AppProvider>
    </PaperProvider>
  );
}
