// utils/encryption.js
// Simple encryption that works with Expo without native dependencies

const ENCRYPTION_VERSION = 'v2';

// Simple XOR-based encryption key (in production, use a more secure approach)
const getEncryptionKey = () => {
  return 'MindfulJournal2024SecureKey!@#$%';
};

/**
 * Convert string to array of char codes
 */
const stringToCharCodes = (str) => {
  const codes = [];
  for (let i = 0; i < str.length; i++) {
    codes.push(str.charCodeAt(i));
  }
  return codes;
};

/**
 * Convert array of char codes to string
 */
const charCodesToString = (codes) => {
  return String.fromCharCode(...codes);
};

/**
 * Simple XOR encryption
 */
const xorEncrypt = (text, key) => {
  const textCodes = stringToCharCodes(text);
  const keyCodes = stringToCharCodes(key);
  const encrypted = [];
  
  for (let i = 0; i < textCodes.length; i++) {
    encrypted.push(textCodes[i] ^ keyCodes[i % keyCodes.length]);
  }
  
  return encrypted;
};

/**
 * Simple XOR decryption (same as encryption due to XOR properties)
 */
const xorDecrypt = (encryptedCodes, key) => {
  const keyCodes = stringToCharCodes(key);
  const decrypted = [];
  
  for (let i = 0; i < encryptedCodes.length; i++) {
    decrypted.push(encryptedCodes[i] ^ keyCodes[i % keyCodes.length]);
  }
  
  return charCodesToString(decrypted);
};

/**
 * Convert array of numbers to Base64-safe string
 */
const arrayToBase64 = (arr) => {
  try {
    // Convert array to JSON string, then to base64
    const jsonStr = JSON.stringify(arr);
    // Use a simple encoding that works in React Native
    let result = '';
    for (let i = 0; i < jsonStr.length; i++) {
      result += String.fromCharCode(jsonStr.charCodeAt(i) + 1);
    }
    return result;
  } catch (error) {
    console.error('arrayToBase64 error:', error);
    return '';
  }
};

/**
 * Convert Base64-safe string back to array of numbers
 */
const base64ToArray = (str) => {
  try {
    // Decode the string
    let decoded = '';
    for (let i = 0; i < str.length; i++) {
      decoded += String.fromCharCode(str.charCodeAt(i) - 1);
    }
    return JSON.parse(decoded);
  } catch (error) {
    console.error('base64ToArray error:', error);
    return [];
  }
};

export const encryptionUtils = {
  /**
   * Encrypt text
   */
  async encryptText(text) {
    try {
      if (!text || typeof text !== 'string') {
        return text || '';
      }
      
      const key = getEncryptionKey();
      const encryptedCodes = xorEncrypt(text, key);
      const encoded = arrayToBase64(encryptedCodes);
      
      return `${ENCRYPTION_VERSION}:${encoded}`;
    } catch (error) {
      console.error('Encryption error:', error);
      // Return original text if encryption fails
      return text;
    }
  },

  /**
   * Decrypt text
   */
  async decryptText(encryptedText) {
    try {
      if (!encryptedText || typeof encryptedText !== 'string') {
        return encryptedText || '';
      }

      // Check for version prefix
      if (encryptedText.startsWith(`${ENCRYPTION_VERSION}:`)) {
        const encoded = encryptedText.substring(ENCRYPTION_VERSION.length + 1);
        const encryptedCodes = base64ToArray(encoded);
        
        if (encryptedCodes.length === 0) {
          return encryptedText;
        }
        
        const key = getEncryptionKey();
        return xorDecrypt(encryptedCodes, key);
      }

      // Handle legacy v1 encryption or unencrypted text
      if (encryptedText.startsWith('v1:')) {
        // Return as-is for legacy data (user will need to re-save)
        return encryptedText.substring(3);
      }

      // Return as-is if not encrypted
      return encryptedText;
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedText;
    }
  },

  /**
   * Encrypt entire journal entry
   */
  async encryptEntry(entry) {
    try {
      if (!entry) return entry;

      const encryptedTitle = entry.title 
        ? await this.encryptText(entry.title) 
        : '';
      const encryptedContent = entry.content 
        ? await this.encryptText(entry.content) 
        : '';

      return {
        ...entry,
        title: encryptedTitle,
        content: encryptedContent,
        encrypted: true,
        encryptionVersion: ENCRYPTION_VERSION
      };
    } catch (error) {
      console.error('Error encrypting entry:', error);
      // Return entry without encryption if it fails
      return { ...entry, encrypted: false };
    }
  },

  /**
   * Decrypt entire journal entry
   */
  async decryptEntry(entry) {
    try {
      if (!entry) return entry;
      if (!entry.encrypted) return entry;

      const decryptedTitle = entry.title 
        ? await this.decryptText(entry.title) 
        : '';
      const decryptedContent = entry.content 
        ? await this.decryptText(entry.content) 
        : '';

      return {
        ...entry,
        title: decryptedTitle,
        content: decryptedContent,
        encrypted: false
      };
    } catch (error) {
      console.error('Error decrypting entry:', error);
      return entry;
    }
  }
};

export default encryptionUtils;