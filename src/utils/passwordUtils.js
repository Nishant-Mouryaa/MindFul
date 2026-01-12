// utils/passwordUtils.js
import * as Crypto from 'expo-crypto';

// Salt for password hashing (in production, use a unique salt per user stored securely)
const PASSWORD_SALT = 'your-unique-app-salt-change-this-in-production';

export const passwordUtils = {
  /**
   * Hash a password using SHA-256 with salt
   */
  async hashPassword(password) {
    try {
      const saltedPassword = password + PASSWORD_SALT;
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        saltedPassword
      );
      return hash;
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new Error('Failed to hash password');
    }
  },

  /**
   * Verify a password against a stored hash
   */
  async verifyPassword(inputPassword, storedHash) {
    try {
      const inputHash = await this.hashPassword(inputPassword);
      return inputHash === storedHash;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  },

  /**
   * Validate password strength
   */
  validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    if (!password || password.length < minLength) {
      errors.push(`At least ${minLength} characters`);
    }
    if (!hasUpperCase) errors.push('One uppercase letter');
    if (!hasLowerCase) errors.push('One lowercase letter');
    if (!hasNumbers) errors.push('One number');
    if (!hasSpecialChar) errors.push('One special character');

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Get password strength score and label
   */
  getPasswordStrength(password) {
    if (!password) {
      return { score: 0, label: 'None', color: '#e0e0e0' };
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    let label, color;
    if (strength <= 2) {
      label = 'Weak';
      color = '#ff4444';
    } else if (strength <= 4) {
      label = 'Medium';
      color = '#ffaa00';
    } else {
      label = 'Strong';
      color = '#00C851';
    }

    return { score: strength, label, color };
  }
};