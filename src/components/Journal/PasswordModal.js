import React from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Palette, spacing, typography, borderRadius } from '../../theme/colors';

export default function PasswordModal({
  visible,
  password,
  setPassword,
  modalType,
  isEnabled,
  isChecking,
  onClose,
  onConfirm,
  onBiometricPress,
  biometricTypes
}) {
  const modalTitle = {
    UNLOCK_JOURNAL: 'Unlock Journal',
    SET_PASSWORD: 'Set Journal Password',
    CHANGE_PASSWORD: 'Change Journal Password'
  }[modalType];

  const confirmLabel = {
    UNLOCK_JOURNAL: 'Unlock',
    SET_PASSWORD: 'Set Password',
    CHANGE_PASSWORD: 'Change',
  }[modalType];

  const noteText = {
    UNLOCK_JOURNAL: 'Enter your existing journal password to unlock your entries.',
    SET_PASSWORD:"Your password must be at least 6 characters and include a number and special character.",
    CHANGE_PASSWORD: 'Enter a new password for your journal.'
  }[modalType];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.passwordModalContainer}>
        <View style={styles.passwordModalContent}>
          <Text style={styles.passwordModalTitle}>{modalTitle}</Text>

          {/* Optional biometric button for UNLOCK_JOURNAL */}
          {modalType === 'UNLOCK_JOURNAL' && !isChecking && isEnabled && biometricTypes.length > 0 && (
            <TouchableOpacity style={styles.biometricButton} onPress={onBiometricPress}>
              <MaterialCommunityIcons
                name={
                  biometricTypes.includes('fingerprint') ?
                    'fingerprint' :
                    biometricTypes.includes('face') ?
                      'face-recognition' :
                      'lock'
                }
                size={24}
                color={Palette.white}
              />
              <Text style={styles.biometricButtonText}>
                {biometricTypes.includes('fingerprint') ?
                  'Unlock with Fingerprint' :
                  biometricTypes.includes('face') ?
                    'Unlock with Face ID' :
                    'Unlock with Biometrics'}
              </Text>
            </TouchableOpacity>
          )}

          <TextInput
            style={styles.passwordInput}
            placeholder="Enter password"
            secureTextEntry={true}
            value={password}
            onChangeText={setPassword}
            autoFocus={true}
          />

          <Text style={styles.passwordNote}>{noteText}</Text>

          <View style={styles.passwordButtonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  passwordModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  passwordModalContent: {
    backgroundColor: Palette.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '85%',
    maxWidth: 400,
  },
  passwordModalTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: Palette.textDark,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: typography.body.fontSize,
    marginBottom: spacing.sm,
  },
  passwordNote: {
    fontSize: typography.caption.fontSize,
    color: Palette.textLight,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: typography.caption.lineHeight,
  },
  passwordButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: Palette.border,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    flex: 1,
    marginRight: spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Palette.textDark,
    fontWeight: typography.h2.fontWeight,
  },
  confirmButton: {
    backgroundColor: Palette.secondaryBlue,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    flex: 1,
    marginLeft: spacing.sm,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: Palette.white,
    fontWeight: typography.h2.fontWeight,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.secondaryPurple,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  biometricButtonText: {
    color: Palette.white,
    fontSize: typography.body.fontSize,
    fontWeight: typography.h3.fontWeight,
    marginLeft: spacing.sm,
  },
});
