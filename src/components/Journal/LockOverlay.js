import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Palette, spacing, typography, borderRadius } from '../../theme/colors';

export default function LockOverlay({
  checkingSecurity,
  message,
  isEnabled,
  isAvailable,
  types,
  onPressBiometric,
  onPressPassword,
}) {
  if (checkingSecurity) {
    return (
      <View style={styles.lockOverlay}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>{message || 'Checking security...'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.lockOverlay}>
      <MaterialCommunityIcons name="lock" size={80} color="#fff" />
      <Text style={styles.lockOverlayText}>Journal is Locked</Text>

      {isEnabled && isAvailable && types?.length > 0 && (
        <TouchableOpacity style={styles.biometricButton} onPress={onPressBiometric}>
          <MaterialCommunityIcons
            name={
              types.includes('fingerprint') ?
                'fingerprint' :
                types.includes('face') ?
                  'face-recognition' :
                  'lock'
            }
            size={24}
            color={Palette.white}
          />
          <Text style={styles.biometricButtonText}>
            {types.includes('fingerprint') ?
              'Unlock with Fingerprint' :
              types.includes('face') ?
                'Unlock with Face ID' :
                'Unlock with Biometrics'}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.lockOverlayButton} onPress={onPressPassword}>
        <Text style={styles.lockOverlayButtonText}>Unlock with Password</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  lockOverlayText: {
    fontSize: typography.h1.fontSize,
    fontWeight: typography.h1.fontWeight,
    color: Palette.white,
    marginVertical: spacing.lg,
    textAlign: 'center',
  },
  loadingText: {
    color: Palette.white,
    fontSize: typography.body.fontSize,
    marginTop: spacing.md,
  },
  lockOverlayButton: {
    backgroundColor: Palette.secondaryBlue,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  lockOverlayButtonText: {
    color: Palette.white,
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.secondaryPurple,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginTop: spacing.lg,
  },
  biometricButtonText: {
    color: Palette.white,
    fontSize: typography.body.fontSize,
    fontWeight: typography.h3.fontWeight,
    marginLeft: spacing.sm,
  },
});
