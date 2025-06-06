// theme.js
import { DefaultTheme } from 'react-native-paper';

// Define a modern color palette and custom typography.
// (Ensure that custom fonts like 'Roboto-Regular' are loaded via Expo Font or a similar solution.)
const theme = {
  ...DefaultTheme,
  roundness: 12,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    accent: '#03dac4',
    background: '#f5f7fa',
    surface: '#ffffff',
    text: '#333333',
    error: '#B00020',
  },
  fonts: {
    // Customize these with your own fonts as needed.
    regular: { fontFamily: 'Roboto-Regular', fontWeight: 'normal' },
    medium: { fontFamily: 'Roboto-Medium', fontWeight: 'normal' },
    light: { fontFamily: 'Roboto-Light', fontWeight: 'normal' },
    thin: { fontFamily: 'Roboto-Thin', fontWeight: 'normal' },
  },
};

export default theme;
