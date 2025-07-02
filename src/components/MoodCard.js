import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { borderRadius, Palette, shadows, spacing, typography } from '../theme/colors';

export const MoodCard = ({ item, selected, onSelect }) => {
  return (
    <TouchableOpacity
      style={[
        styles.moodCard,
        { backgroundColor: item.color },
        selected && styles.selectedMood,
      ]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons name={item.icon} size={30} color="#fff" />
      <Text style={styles.moodName}>{item.name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  moodCard: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
  selectedMood: {
    transform: [{ scale: 1.1 }],
    ...shadows.high,
  },
  moodName: {
    color: Palette.white,
    fontWeight: typography.h3.fontWeight,
    fontSize: typography.small.fontSize,
    marginTop: spacing.xs,
  },
});

