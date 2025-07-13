// utils/encryption.js
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Buffer } from 'buffer';

const ENCRYPTION_KEY = 'journalEncryptionKey';

export const encryptionUtils = {
  // Generate or get encryption key
  async getOrCreateKey() {
    try {
      let key = await SecureStore.getItemAsync(ENCRYPTION_KEY);
      if (!key) {
        const randomBytes = await Crypto.getRandomBytesAsync(32);
        key = Buffer.from(randomBytes).toString('hex');
        await SecureStore.setItemAsync(ENCRYPTION_KEY, key);
      }
      return key;
    } catch (error) {
      console.error('Error managing encryption key:', error);
      return 'fallback-key-' + Date.now();
    }
  },

  // Simple XOR encryption with Buffer
  xorEncrypt(text, key) {
    const textBuffer = Buffer.from(text, 'utf8');
    const keyBuffer = Buffer.from(key, 'utf8');
    const result = Buffer.alloc(textBuffer.length);
    
    for (let i = 0; i < textBuffer.length; i++) {
      result[i] = textBuffer[i] ^ keyBuffer[i % keyBuffer.length];
    }
    
    return result.toString('base64');
  },

  // Simple XOR decryption with Buffer
  xorDecrypt(encodedText, key) {
    try {
      const encryptedBuffer = Buffer.from(encodedText, 'base64');
      const keyBuffer = Buffer.from(key, 'utf8');
      const result = Buffer.alloc(encryptedBuffer.length);
      
      for (let i = 0; i < encryptedBuffer.length; i++) {
        result[i] = encryptedBuffer[i] ^ keyBuffer[i % keyBuffer.length];
      }
      
      return result.toString('utf8');
    } catch (error) {
      console.error('XOR Decryption error:', error);
      return encodedText;
    }
  },

  // Encrypt text
  async encryptText(text) {
    try {
      if (!text) return '';
      
      const key = await this.getOrCreateKey();
      const encrypted = this.xorEncrypt(text, key);
      
      // Add version marker for future compatibility
      return `v1:${encrypted}`;
    } catch (error) {
      console.error('Encryption error:', error);
      return text;
    }
  },

  // Decrypt text
  async decryptText(encryptedText) {
    try {
      if (!encryptedText || typeof encryptedText !== 'string') {
        return encryptedText;
      }

      // Check if it's encrypted (has version marker)
      if (!encryptedText.startsWith('v1:')) {
        return encryptedText;
      }

      const key = await this.getOrCreateKey();
      const encrypted = encryptedText.substring(3); // Remove 'v1:' prefix
      
      return this.xorDecrypt(encrypted, key);
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedText;
    }
  },

  // Encrypt entire journal entry
  async encryptEntry(entry) {
    try {
      if (!entry) return entry;

      const encryptedTitle = entry.title ? await this.encryptText(entry.title) : '';
      const encryptedContent = entry.content ? await this.encryptText(entry.content) : '';
      
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
    if (!entry || !entry.encrypted) return entry;
    
    try {
      const decryptedTitle = entry.title ? await this.decryptText(entry.title) : '';
      const decryptedContent = entry.content ? await this.decryptText(entry.content) : '';
      
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