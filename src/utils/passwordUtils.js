// utils/passwordUtils.js
export const passwordUtils = {
    validatePassword: (password) => {
      const minLength = 8;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      
      const errors = [];
      if (password.length < minLength) errors.push(`At least ${minLength} characters`);
      if (!hasUpperCase) errors.push('One uppercase letter');
      if (!hasLowerCase) errors.push('One lowercase letter');
      if (!hasNumbers) errors.push('One number');
      if (!hasSpecialChar) errors.push('One special character');
      
      return {
        isValid: errors.length === 0,
        errors
      };
    },
  
    getPasswordStrength: (password) => {
      let strength = 0;
      if (password.length >= 8) strength++;
      if (password.length >= 12) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[a-z]/.test(password)) strength++;
      if (/\d/.test(password)) strength++;
      if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
      
      return {
        score: strength,
        label: strength <= 2 ? 'Weak' : strength <= 4 ? 'Medium' : 'Strong',
        color: strength <= 2 ? '#ff4444' : strength <= 4 ? '#ffaa00' : '#00C851'
      };
    }
  };