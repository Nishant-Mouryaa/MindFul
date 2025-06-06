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



export default function App() {
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
    'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
  });
  return (
    
    <PaperProvider theme={LightTheme} >

    <AppProvider>
      <AppNavigator />
      
      
    </AppProvider>
    </PaperProvider>
  );
}
