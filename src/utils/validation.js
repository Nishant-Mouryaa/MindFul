// utils/validation.js

export const validation = {
  /**
   * Sanitize text input to prevent XSS and clean up content
   */
  sanitizeText(text) {
    if (!text || typeof text !== 'string') return '';

    return text
      // Remove script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove other HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove null bytes
      .replace(/\0/g, '')
      // Trim whitespace
      .trim();
  },

  /**
   * Validate a journal entry
   */
  validateEntry(entry) {
    const errors = [];

    // Title validation
    if (!entry.title || entry.title.trim().length === 0) {
      errors.push('Title is required');
    } else if (entry.title.length > 200) {
      errors.push('Title must be less than 200 characters');
    }

    // Content validation
    if (!entry.content || entry.content.trim().length === 0) {
      errors.push('Content is required');
    } else if (entry.content.length > 50000) {
      errors.push('Content exceeds maximum length (50,000 characters)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate mood selection
   */
  validateMood(mood) {
    const validMoods = [
      'great', 'good', 'neutral', 'down', 
      'sad', 'anxious', 'angry', 'tired'
    ];
    return validMoods.includes(mood);
  },

  /**
   * Validate email format
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate date
   */
  validateDate(date) {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  },

  /**
   * Sanitize and validate entry before saving
   */
  prepareEntryForSave(entry) {
    const sanitizedEntry = {
      ...entry,
      title: this.sanitizeText(entry.title),
      content: this.sanitizeText(entry.content)
    };

    const validationResult = this.validateEntry(sanitizedEntry);
    
    return {
      entry: sanitizedEntry,
      isValid: validationResult.isValid,
      errors: validationResult.errors
    };
  }
};