import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { borderRadius, Palette, spacing, typography } from '../theme/colors';

export const QuickAction = ({ icon, label, onPress }) => {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={styles.quickActionIcon}>
        <MaterialCommunityIcons name={icon} size={24} color="#fff" />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  quickAction: {
    alignItems: 'center',
    width: '30%',
  },
  quickActionIcon: {
    backgroundColor: Palette.primary,
    width: 50,
    height: 50,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActionLabel: {
    fontSize: typography.small.fontSize,
    color: Palette.textLight,
    textAlign: 'center',
  },
});
