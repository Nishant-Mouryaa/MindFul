import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { Palette, AdminPalette } from './colors';
export { AdminPalette } from './colors'; 
/* Light – already used by the whole app */
export const LightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary:            Palette.primary,
    background:         Palette.bg,
    surface:            Palette.bg,
    onSurface:          Palette.text,
    onBackground:       Palette.text,
    outline:            Palette.textMuted,
  },
};

/* Dark – ONLY for admin */
export const AdminDarkTheme = {
  ...MD3DarkTheme,
  dark: true,
  mode: 'exact',
  colors: {
    ...MD3DarkTheme.colors,
    primary:            AdminPalette.primary,
    background:         AdminPalette.bg,
    surface:            AdminPalette.surface,
    onSurface:          AdminPalette.text,
    onBackground:       AdminPalette.text,
    outline:            AdminPalette.textMuted,
  },
};