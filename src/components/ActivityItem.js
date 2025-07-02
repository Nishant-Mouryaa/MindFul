import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { borderRadius, Palette, spacing, typography } from '../theme/colors';

export const ActivityItem = ({ icon, label, value, color }) => {
  return (
    <View style={styles.activityItem}>
      <View style={[styles.activityIconContainer, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.activityLabel}>{label}</Text>
      <Text style={styles.activityValue}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  activityLabel: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: Palette.textMedium,
  },
  activityValue: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: Palette.textDark,
  },
});
