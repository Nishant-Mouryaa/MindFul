// components/Journal/PasswordStrengthIndicator.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { passwordUtils } from '../../utils/passwordUtils';
import { Palette, spacing, typography } from '../../theme/colors';

export default function PasswordStrengthIndicator({ password }) {
  const strength = passwordUtils.getPasswordStrength(password);
  const validation = passwordUtils.validatePassword(password);
  
  const getBarWidth = () => {
    return `${(strength.score / 6) * 100}%`;
  };

  if (!password) return null;

  return (
    <View style={styles.container}>
      <View style={styles.strengthBar}>
        <View 
          style={[
            styles.strengthBarFill, 
            { width: getBarWidth(), backgroundColor: strength.color }
          ]} 
        />
      </View>
      <Text style={[styles.strengthLabel, { color: strength.color }]}>
        Password Strength: {strength.label}
      </Text>
      {!validation.isValid && (
        <View style={styles.requirementsList}>
          <Text style={styles.requirementsTitle}>Requirements:</Text>
          {validation.errors.map((error, index) => (
            <Text key={index} style={styles.requirementItem}>• {error}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  strengthBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  strengthLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  requirementsList: {
    marginTop: spacing.sm,
  },
  requirementsTitle: {
    fontSize: typography.caption.fontSize,
    color: Palette.textLight,
    marginBottom: spacing.xs,
  },
  requirementItem: {
    fontSize: typography.caption.fontSize,
    color: '#ff4444',
    marginLeft: spacing.sm,
    lineHeight: 18,
  },
});