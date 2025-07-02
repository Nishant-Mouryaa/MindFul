// src/theme/colors.js
export const Palette = {
  primary: '#4DB6AC',
  primaryDark: '#00897B',
  primaryLight: '#B2DFDB',
  secondaryBlue: '#64B5F6',
  secondaryPurple: '#7986CB',
  secondaryOrange: '#FFB74D',
  secondaryPink: '#BA68C8',
  secondaryRed: '#E57373',
  textDark: '#333333',
  textMedium: '#555555',
  textLight: '#666666',
  background: '#F8F9FA',
  card: '#FFFFFF',
  border: '#E0E0E0',
  white: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 33.6,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 24,
  },
  h3: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 21.6,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
  },
  small: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  },
};

export const shadows = {
  low: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  high: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 25,
};