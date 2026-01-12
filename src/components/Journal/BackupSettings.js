// components/Journal/BackupSettings.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Palette, spacing, typography, borderRadius, shadows } from '../../theme/colors';
import { backupUtils } from '../../utils/backup';

export default function BackupSettings({
  visible,
  onClose,
  journalEntries,
  setJournalEntries,
  onRefresh,
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    if (journalEntries.length === 0) {
      Alert.alert('No Entries', 'You have no journal entries to backup.');
      return;
    }

    setIsExporting(true);
    try {
      const result = await backupUtils.exportBackup(journalEntries);
      if (result.success) {
        Alert.alert(
          'Backup Created',
          `Successfully exported ${journalEntries.length} entries.`
        );
      }
    } catch (error) {
      Alert.alert('Export Failed', error.message || 'Failed to create backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const result = await backupUtils.importBackup();

      if (result.canceled) {
        setIsImporting(false);
        return;
      }

      if (result.success) {
        // Ask user how to handle the import
        Alert.alert(
          'Import Backup',
          `Found ${result.entriesCount} entries from ${new Date(
            result.createdAt
          ).toLocaleDateString()}.\n\nHow would you like to restore?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Merge',
              onPress: async () => {
                try {
                  const restoreResult = await backupUtils.restoreFromBackup(
                    result.data,
                    journalEntries,
                    'merge'
                  );
                  setJournalEntries(restoreResult.entries);
                  onRefresh?.();
                  Alert.alert(
                    'Restore Complete',
                    `Successfully merged entries. You now have ${restoreResult.entriesCount} entries.`
                  );
                } catch (error) {
                  Alert.alert('Restore Failed', error.message);
                }
              },
            },
            {
              text: 'Replace All',
              style: 'destructive',
              onPress: async () => {
                Alert.alert(
                  'Confirm Replace',
                  'This will delete all current entries and replace them with the backup. Are you sure?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Replace',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          const restoreResult = await backupUtils.restoreFromBackup(
                            result.data,
                            journalEntries,
                            'replace'
                          );
                          setJournalEntries(restoreResult.entries);
                          onRefresh?.();
                          Alert.alert(
                            'Restore Complete',
                            `Successfully restored ${restoreResult.entriesCount} entries.`
                          );
                        } catch (error) {
                          Alert.alert('Restore Failed', error.message);
                        }
                      },
                    },
                  ]
                );
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Import Failed', error.message || 'Failed to import backup.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Backup & Restore</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color={Palette.textLight} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Export Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="cloud-upload-outline"
                size={24}
                color={Palette.primary}
              />
              <Text style={styles.sectionTitle}>Export Backup</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Create a backup file of all your journal entries. The file will be saved
              to your device and can be shared or stored in cloud storage.
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.exportButton]}
              onPress={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <ActivityIndicator color={Palette.white} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="download"
                    size={20}
                    color={Palette.white}
                  />
                  <Text style={styles.buttonText}>Export Entries</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.entryCount}>
              {journalEntries.length} entries will be exported
            </Text>
          </View>

          {/* Import Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="cloud-download-outline"
                size={24}
                color={Palette.secondaryPurple}
              />
              <Text style={styles.sectionTitle}>Restore from Backup</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Import a previously created backup file. You can choose to merge with
              existing entries or replace all entries.
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.importButton]}
              onPress={handleImport}
              disabled={isImporting}
            >
              {isImporting ? (
                <ActivityIndicator color={Palette.white} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="upload"
                    size={20}
                    color={Palette.white}
                  />
                  <Text style={styles.buttonText}>Import Backup</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={Palette.secondaryBlue}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>About Backups</Text>
              <Text style={styles.infoText}>
                • Backups are stored as JSON files{'\n'}
                • All entry content is included{'\n'}
                • Backups are verified for integrity{'\n'}
                • Store backups in a secure location
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: Palette.textDark,
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    backgroundColor: Palette.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.low,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: Palette.textDark,
    marginLeft: spacing.sm,
  },
  sectionDescription: {
    fontSize: typography.body.fontSize,
    color: Palette.textLight,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  exportButton: {
    backgroundColor: Palette.primary,
  },
  importButton: {
    backgroundColor: Palette.secondaryPurple,
  },
  buttonText: {
    color: Palette.white,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  entryCount: {
    fontSize: typography.caption.fontSize,
    color: Palette.textLight,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Palette.secondaryBlue + '15',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  infoContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  infoTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: Palette.textDark,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: typography.caption.fontSize,
    color: Palette.textDark,
    lineHeight: 20,
  },
});