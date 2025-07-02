
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { borderRadius, Palette, shadows, spacing, typography } from '../theme/colors';

export const QuickStat = ({ icon, value, label }) => {
  return (
    <View style={styles.quickStat}>
      <MaterialCommunityIcons name={icon} size={24} color={Palette.primary} />
      <Text style={styles.quickStatValue}>{value}</Text>
      <Text style={styles.quickStatLabel}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  quickStat: {
    alignItems: 'center',
    backgroundColor: Palette.card,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    width: '30%',
    ...shadows.low,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.primary,
    marginTop: spacing.xs,
  },
  quickStatLabel: {
    fontSize: typography.small.fontSize,
    color: Palette.textLight,
  },
});
