// utils/backup.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Crypto from 'expo-crypto';
import { encryptionUtils } from './encryption';

const BACKUP_VERSION = '1.0';

export const backupUtils = {
  /**
   * Generate a checksum for data integrity verification
   */
  async generateChecksum(data) {
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      stringData
    );
    return hash;
  },

  /**
   * Create a backup of all journal entries
   */
  async createBackup(entries) {
    try {
      const backupData = {
        version: BACKUP_VERSION,
        createdAt: new Date().toISOString(),
        entriesCount: entries.length,
        entries: entries,
        checksum: null,
      };

      // Generate checksum (excluding the checksum field itself)
      const dataForChecksum = { ...backupData };
      delete dataForChecksum.checksum;
      backupData.checksum = await this.generateChecksum(dataForChecksum);

      return backupData;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Failed to create backup');
    }
  },

  /**
   * Export backup to a file and share
   */
  async exportBackup(entries) {
    try {
      // Decrypt entries first (backup will contain decrypted data)
      const decryptedEntries = await Promise.all(
        entries.map(async (entry) => {
          if (entry.encrypted) {
            return await encryptionUtils.decryptEntry(entry);
          }
          return entry;
        })
      );

      const backup = await this.createBackup(decryptedEntries);
      const backupJson = JSON.stringify(backup, null, 2);

      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `journal_backup_${timestamp}.json`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      // Write to file
      await FileSystem.writeAsStringAsync(fileUri, backupJson);

      // Share the file
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Journal Backup',
        });
        return { success: true, filename };
      } else {
        throw new Error('Sharing not available on this device');
      }
    } catch (error) {
      console.error('Error exporting backup:', error);
      throw error;
    }
  },

  /**
   * Import backup from a file
   */
  async importBackup() {
    try {
      // Pick a document
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return { success: false, canceled: true };
      }

      const fileUri = result.assets[0].uri;

      // Read file content
      const content = await FileSystem.readAsStringAsync(fileUri);
      const backupData = JSON.parse(content);

      // Validate backup
      const validation = await this.validateBackup(backupData);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      return {
        success: true,
        data: backupData,
        entriesCount: backupData.entriesCount,
        createdAt: backupData.createdAt,
      };
    } catch (error) {
      console.error('Error importing backup:', error);
      throw error;
    }
  },

  /**
   * Validate backup data integrity
   */
  async validateBackup(backupData) {
    try {
      // Check required fields
      if (!backupData.version || !backupData.entries || !backupData.checksum) {
        return { isValid: false, error: 'Invalid backup format' };
      }

      // Verify version compatibility
      const [major] = backupData.version.split('.');
      const [currentMajor] = BACKUP_VERSION.split('.');
      if (parseInt(major) > parseInt(currentMajor)) {
        return {
          isValid: false,
          error: 'Backup version is newer than app version. Please update the app.',
        };
      }

      // Verify checksum
      const dataForChecksum = { ...backupData };
      delete dataForChecksum.checksum;
      const calculatedChecksum = await this.generateChecksum(dataForChecksum);

      if (calculatedChecksum !== backupData.checksum) {
        return {
          isValid: false,
          error: 'Backup file appears to be corrupted or modified.',
        };
      }

      // Validate entries structure
      if (!Array.isArray(backupData.entries)) {
        return { isValid: false, error: 'Invalid entries format' };
      }

      for (const entry of backupData.entries) {
        if (!entry.id || !entry.title || !entry.date) {
          return { isValid: false, error: 'One or more entries have invalid format' };
        }
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error validating backup:', error);
      return { isValid: false, error: 'Failed to validate backup' };
    }
  },

  /**
   * Restore entries from backup
   * @param {Object} backupData - The validated backup data
   * @param {Array} currentEntries - Current journal entries
   * @param {string} mode - 'merge' or 'replace'
   */
  async restoreFromBackup(backupData, currentEntries, mode = 'merge') {
    try {
      let restoredEntries;

      if (mode === 'replace') {
        // Replace all entries with backup
        restoredEntries = backupData.entries.map((entry) => ({
          ...entry,
          restoredAt: new Date().toISOString(),
        }));
      } else {
        // Merge: add entries that don't exist, update those that do
        const currentIds = new Set(currentEntries.map((e) => e.id));
        const backupIds = new Set(backupData.entries.map((e) => e.id));

        // Entries only in current (keep them)
        const onlyInCurrent = currentEntries.filter((e) => !backupIds.has(e.id));

        // Entries only in backup (add them)
        const onlyInBackup = backupData.entries.filter((e) => !currentIds.has(e.id));

        // Entries in both - use the newer one
        const inBoth = backupData.entries
          .filter((e) => currentIds.has(e.id))
          .map((backupEntry) => {
            const currentEntry = currentEntries.find((e) => e.id === backupEntry.id);
            const backupDate = new Date(backupEntry.updatedAt || backupEntry.date);
            const currentDate = new Date(currentEntry.updatedAt || currentEntry.date);

            return backupDate > currentDate ? backupEntry : currentEntry;
          });

        restoredEntries = [...onlyInCurrent, ...onlyInBackup, ...inBoth];
      }

      // Sort by date
      restoredEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Encrypt and save
      const encryptedEntries = await Promise.all(
        restoredEntries.map((entry) => encryptionUtils.encryptEntry(entry))
      );

      await AsyncStorage.setItem('journalEntries', JSON.stringify(encryptedEntries));

      return {
        success: true,
        entriesCount: restoredEntries.length,
        entries: restoredEntries,
      };
    } catch (error) {
      console.error('Error restoring from backup:', error);
      throw error;
    }
  },
};