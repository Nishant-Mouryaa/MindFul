// utils/encryption.js
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';

// First install crypto-js: expo install crypto-js

const ENCRYPTION_KEY = 'journalEncryptionKey';

export const encryptionUtils = {
  // Generate or get encryption key
  async getOrCreateKey() {
    try {
      let key = await SecureStore.getItemAsync(ENCRYPTION_KEY);
      if (!key) {
        const randomBytes = await Crypto.getRandomBytesAsync(32);
        key = btoa(String.fromCharCode(...new Uint8Array(randomBytes)));
        await SecureStore.setItemAsync(ENCRYPTION_KEY, key);
      }
      return key;
    } catch (error) {
      console.error('Error managing encryption key:', error);
      throw error;
    }
  },

  // Encrypt text
  async encryptText(text) {
    try {
      const key = await this.getOrCreateKey();
      const encrypted = CryptoJS.AES.encrypt(text, key).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      return text; // Fallback to unencrypted
    }
  },

  // Decrypt text
  async decryptText(encryptedText) {
    try {
      const key = await this.getOrCreateKey();
      const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedText; // Fallback to encrypted text
    }
  },

  // Encrypt entire
    // Encrypt entire journal entry
    async encryptEntry(entry) {
        try {
          const encryptedContent = await this.encryptText(entry.content);
          const encryptedTitle = await this.encryptText(entry.title);
          
          return {
            ...entry,
            title: encryptedTitle,
            content: encryptedContent,
            encrypted: true
          };
        } catch (error) {
          console.error('Error encrypting entry:', error);
          return entry;
        }
      },
    
      // Decrypt entire journal entry
      async decryptEntry(entry) {
        if (!entry.encrypted) return entry;
        
        try {
          const decryptedContent = await this.decryptText(entry.content);
          const decryptedTitle = await this.decryptText(entry.title);
          
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