// components/Journal/PasswordModal.js
import React from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import { passwordUtils } from '../../utils/passwordUtils';
import { Palette, spacing, typography, shadows, borderRadius } from '../../theme/colors';

export default function PasswordModal({
  visible,
  password,
  setPassword,
  modalType,
  isEnabled,
  onClose,
  onConfirm,
  onBiometricPress,
  biometricTypes = []
}) {
  const [showPassword, setShowPassword] = React.useState(false);
  
  const getModalTitle = () => {
    switch (modalType) {
      case 'UNLOCK_JOURNAL':
        return 'Unlock Journal';
      case 'SET_PASSWORD':
        return 'Set Journal Password';
      case 'CHANGE_PASSWORD':
        return 'Change Password';
      default:
        return 'Enter Password';
    }
  };

  const handleConfirm = () => {
    if (modalType !== 'UNLOCK_JOURNAL') {
      const validation = passwordUtils.validatePassword(password);
      if (!validation.isValid) {
        // The strength indicator will show the errors
        return;
      }
    }
    onConfirm();
  };

  const showStrengthIndicator = modalType === 'SET_PASSWORD' || modalType === 'CHANGE_PASSWORD';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredView}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>{getModalTitle()}</Text>
          
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter password"
              placeholderTextColor={Palette.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <MaterialCommunityIcons
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                color={Palette.textLight}
              />
            </TouchableOpacity>
          </View>

          {showStrengthIndicator && (
            <PasswordStrengthIndicator password={password} />
          )}

          {modalType === 'UNLOCK_JOURNAL' && isEnabled && biometricTypes.length > 0 && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={onBiometricPress}
            >
              <MaterialCommunityIcons
                name={biometricTypes.includes('face') ? 'face-recognition' : 'fingerprint'}
                size={32}
                color={Palette.primaryBlue}
              />
              <Text style={styles.biometricText}>Use Biometric</Text>
            </TouchableOpacity>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button, 
                styles.confirmButton,
                (!password || (showStrengthIndicator && !passwordUtils.validatePassword(password).isValid)) && 
                styles.disabledButton
              ]}
              onPress={handleConfirm}
              disabled={!password || (showStrengthIndicator && !passwordUtils.validatePassword(password).isValid)}
            >
              <Text style={styles.confirmButtonText}>
                {modalType === 'UNLOCK_JOURNAL' ? 'Unlock' : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: Palette.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '90%',
    maxWidth: 400,
    ...shadows.medium,
  },
  modalTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: Palette.textDark,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
  },
  eyeButton: {
    padding: spacing.sm,
  },
  biometricButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.lg,
    padding: spacing.md,
  },
  biometricText: {
    marginTop: spacing.sm,
    fontSize: typography.body.fontSize,
    color: Palette.primaryBlue,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Palette.background,
    marginRight: spacing.sm,
  },
  confirmButton: {
    backgroundColor: Palette.primaryBlue,
    marginLeft: spacing.sm,
  },
  disabledButton: {
    backgroundColor: Palette.textLight,
    opacity: 0.5,
  },
  cancelButtonText: {
    color: Palette.textDark,
    fontSize: typography.body.fontSize,
    fontWeight: '500',
  },
  confirmButtonText: {
    color: Palette.white,
    fontSize: typography.body.fontSize,
    fontWeight: '500',
  },
});