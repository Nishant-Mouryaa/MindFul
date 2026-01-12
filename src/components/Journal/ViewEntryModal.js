// components/Journal/ViewEntryModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { Palette, spacing, typography, borderRadius, shadows } from '../../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getAuth } from 'firebase/auth';
import { validation } from '../../utils/validation';
import { encryptionUtils } from '../../utils/encryption';

const moodOptions = [
  { label: 'Great', value: 'great', icon: 'emoticon-excited-outline', color: '#58D68D' },
  { label: 'Good', value: 'good', icon: 'emoticon-happy-outline', color: Palette.primary },
  { label: 'Neutral', value: 'neutral', icon: 'emoticon-neutral-outline', color: Palette.textLight },
  { label: 'Down', value: 'down', icon: 'emoticon-sad-outline', color: Palette.secondaryBlue },
  { label: 'Sad', value: 'sad', icon: 'emoticon-frown-outline', color: Palette.secondaryBlue },
  { label: 'Anxious', value: 'anxious', icon: 'emoticon-confused-outline', color: Palette.secondaryOrange },
  { label: 'Angry', value: 'angry', icon: 'emoticon-angry-outline', color: Palette.secondaryRed },
  { label: 'Tired', value: 'tired', icon: 'emoticon-dead-outline', color: Palette.secondaryPurple },
];

export default function ViewEntryModal({
  entry,
  isLoading,
  onClose,
  onLoadingChange,
  journalEntries,
  setJournalEntries,
  trackActivity,
  syncQueue,
  isOnline,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedMood, setEditedMood] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);

  useEffect(() => {
    if (entry) {
      setEditedTitle(entry.title || '');
      setEditedContent(entry.content || '');
      setEditedMood(entry.mood || null);
      setIsEditing(false);
    }
  }, [entry]);

  if (!entry) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMoodConfig = (moodValue) => {
    return moodOptions.find((m) => m.value === moodValue) || null;
  };

  const moodConfig = getMoodConfig(isEditing ? editedMood : entry.mood);

  // Save edited entry
  const saveEdit = async () => {
    const preparedEntry = validation.prepareEntryForSave({
      title: editedTitle,
      content: editedContent,
    });

    if (!preparedEntry.isValid) {
      Alert.alert('Validation Error', preparedEntry.errors.join('\n'));
      return;
    }

    if (!editedMood) {
      Alert.alert('Select Mood', 'Please select a mood for this entry.');
      return;
    }

    setIsSaving(true);
    trackActivity?.();

    try {
      const updatedEntry = {
        ...entry,
        title: preparedEntry.entry.title,
        content: preparedEntry.entry.content,
        mood: editedMood,
        updatedAt: new Date().toISOString(),
      };

      // Update local state
      const updatedEntries = journalEntries.map((e) =>
        e.id === entry.id ? updatedEntry : e
      );
      setJournalEntries(updatedEntries);

      // Encrypt and save to local storage
      const encryptedEntries = await Promise.all(
        updatedEntries.map((e) => encryptionUtils.encryptEntry(e))
      );
      await AsyncStorage.setItem('journalEntries', JSON.stringify(encryptedEntries));

      // Sync to Firebase
      const auth = getAuth();
      if (auth.currentUser) {
        const encryptedEntry = await encryptionUtils.encryptEntry(updatedEntry);
        
        if (isOnline) {
          try {
            await updateDoc(doc(db, 'journals', entry.id), {
              title: encryptedEntry.title,
              content: encryptedEntry.content,
              mood: encryptedEntry.mood,
              updatedAt: updatedEntry.updatedAt,
            });
          } catch (firebaseError) {
            console.error('Firebase update error:', firebaseError);
            await syncQueue.addToQueue({
              type: 'UPDATE',
              entryId: entry.id,
              data: encryptedEntry,
            });
          }
        } else {
          await syncQueue.addToQueue({
            type: 'UPDATE',
            entryId: entry.id,
            data: encryptedEntry,
          });
        }
      }

      setIsEditing(false);
      Alert.alert('Success', 'Entry updated successfully!');
    } catch (error) {
      console.error('Error updating entry:', error);
      Alert.alert('Error', 'Failed to update entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    if (
      editedTitle !== entry.title ||
      editedContent !== entry.content ||
      editedMood !== entry.mood
    ) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setEditedTitle(entry.title);
              setEditedContent(entry.content);
              setEditedMood(entry.mood);
              setIsEditing(false);
            },
          },
        ]
      );
    } else {
      setIsEditing(false);
    }
  };

  // Share as text
  const shareAsText = async () => {
    try {
      const shareContent = `${entry.title}\n${formatDate(entry.date)}\n\n${entry.content}\n\n— From my journal`;
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        // Create a temp file to share
        const fileUri = `${FileSystem.cacheDirectory}journal_entry.txt`;
        await FileSystem.writeAsStringAsync(fileUri, shareContent);
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Share Journal Entry',
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device.');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share entry.');
    }
  };

  // Export as PDF
  const exportAsPdf = async () => {
    try {
      onLoadingChange(true);
      trackActivity?.();

      const filename = `${entry.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                padding: 40px;
                color: #333;
                line-height: 1.6;
              }
              h1 {
                color: #2c3e50;
                margin-bottom: 8px;
                font-size: 24px;
              }
              .meta {
                color: #7f8c8d;
                font-size: 14px;
                margin-bottom: 24px;
                padding-bottom: 16px;
                border-bottom: 1px solid #eee;
              }
              .mood {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 16px;
                background-color: #f0f0f0;
                font-size: 12px;
                margin-left: 12px;
              }
              .content {
                font-size: 16px;
                white-space: pre-wrap;
              }
              .footer {
                margin-top: 40px;
                padding-top: 16px;
                border-top: 1px solid #eee;
                font-size: 12px;
                color: #95a5a6;
              }
            </style>
          </head>
          <body>
            <h1>${entry.title}</h1>
            <div class="meta">
              ${formatDate(entry.date)} at ${formatTime(entry.date)}
              ${moodConfig ? `<span class="mood">Feeling: ${moodConfig.label}</span>` : ''}
            </div>
            <div class="content">${entry.content.replace(/\n/g, '<br>')}</div>
            <div class="footer">
              Exported from My Journal App
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await FileSystem.copyAsync({ from: uri, to: fileUri });

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Export Journal Entry',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Error', 'Failed to export entry as PDF.');
    } finally {
      onLoadingChange(false);
    }
  };

  // Delete entry
  const deleteEntry = async () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to permanently delete this journal entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              onLoadingChange(true);
              trackActivity?.();

              // Update local state
              const updatedEntries = journalEntries.filter((e) => e.id !== entry.id);
              setJournalEntries(updatedEntries);

              // Update local storage
              const encryptedEntries = await Promise.all(
                updatedEntries.map((e) => encryptionUtils.encryptEntry(e))
              );
              await AsyncStorage.setItem('journalEntries', JSON.stringify(encryptedEntries));

              // Delete from Firebase
              const auth = getAuth();
              if (auth.currentUser) {
                if (isOnline) {
                  try {
                    await deleteDoc(doc(db, 'journals', entry.id));
                  } catch (firebaseError) {
                    console.error('Firebase delete error:', firebaseError);
                    await syncQueue.addToQueue({
                      type: 'DELETE',
                      entryId: entry.id,
                    });
                  }
                } else {
                  await syncQueue.addToQueue({
                    type: 'DELETE',
                    entryId: entry.id,
                  });
                }
              }

              onClose();
              Alert.alert('Deleted', 'Entry has been deleted.');
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete entry. Please try again.');
            } finally {
              onLoadingChange(false);
            }
          },
        },
      ]
    );
  };

  const handleClose = () => {
    if (isEditing) {
      cancelEdit();
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={!!entry} animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
              <MaterialCommunityIcons
                name={isEditing ? 'close' : 'arrow-left'}
                size={24}
                color={Palette.textLight}
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle} numberOfLines={1}>
              {isEditing ? 'Edit Entry' : ''}
            </Text>

            {isEditing ? (
              <TouchableOpacity
                onPress={saveEdit}
                style={styles.headerButton}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={Palette.primary} />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                style={styles.headerButton}
              >
                <MaterialCommunityIcons name="pencil" size={24} color={Palette.primary} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title */}
            {isEditing ? (
              <TextInput
                style={styles.titleInput}
                value={editedTitle}
                onChangeText={setEditedTitle}
                placeholder="Entry title..."
                placeholderTextColor={Palette.textLight}
              />
            ) : (
              <Text style={styles.title}>{entry.title}</Text>
            )}

            {/* Metadata */}
            <View style={styles.metaContainer}>
              <View style={styles.dateContainer}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={16}
                  color={Palette.textLight}
                />
                <Text style={styles.dateText}>{formatDate(entry.date)}</Text>
              </View>

              {/* Mood Badge */}
              {isEditing ? (
                <TouchableOpacity
                  style={[
                    styles.moodBadge,
                    { backgroundColor: (moodConfig?.color || Palette.textLight) + '20' },
                  ]}
                  onPress={() => setShowMoodPicker(!showMoodPicker)}
                >
                  {moodConfig && (
                    <MaterialCommunityIcons
                      name={moodConfig.icon}
                      size={16}
                      color={moodConfig.color}
                    />
                  )}
                  <Text
                    style={[
                      styles.moodText,
                      { color: moodConfig?.color || Palette.textLight },
                    ]}
                  >
                    {moodConfig?.label || 'Select mood'}
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={16}
                    color={moodConfig?.color || Palette.textLight}
                  />
                </TouchableOpacity>
              ) : (
                moodConfig && (
                  <View
                    style={[
                      styles.moodBadge,
                      { backgroundColor: moodConfig.color + '20' },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={moodConfig.icon}
                      size={16}
                      color={moodConfig.color}
                    />
                    <Text style={[styles.moodText, { color: moodConfig.color }]}>
                      {moodConfig.label}
                    </Text>
                  </View>
                )
              )}
            </View>

            {/* Mood Picker (when editing) */}
            {isEditing && showMoodPicker && (
              <View style={styles.moodPickerContainer}>
                {moodOptions.map((mood) => (
                  <TouchableOpacity
                    key={mood.value}
                    style={[
                      styles.moodPickerItem,
                      editedMood === mood.value && {
                        backgroundColor: mood.color + '20',
                        borderColor: mood.color,
                      },
                    ]}
                    onPress={() => {
                      setEditedMood(mood.value);
                      setShowMoodPicker(false);
                    }}
                  >
                    <MaterialCommunityIcons
                      name={mood.icon}
                      size={24}
                      color={editedMood === mood.value ? mood.color : Palette.textLight}
                    />
                    <Text
                      style={[
                        styles.moodPickerText,
                        editedMood === mood.value && { color: mood.color },
                      ]}
                    >
                      {mood.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Content */}
            {isEditing ? (
              <TextInput
                style={styles.contentInput}
                value={editedContent}
                onChangeText={setEditedContent}
                placeholder="Write your thoughts..."
                placeholderTextColor={Palette.textLight}
                multiline
                textAlignVertical="top"
              />
            ) : (
              <Text style={styles.contentText}>{entry.content}</Text>
            )}

            {/* Updated timestamp */}
            {entry.updatedAt && !isEditing && (
              <Text style={styles.updatedText}>
                Last edited: {formatDate(entry.updatedAt)}
              </Text>
            )}
          </ScrollView>

          {/* Footer Actions (when not editing) */}
          {!isEditing && (
            <View style={styles.footer}>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={shareAsText}
                  disabled={isLoading}
                >
                  <MaterialCommunityIcons
                    name="share-variant"
                    size={20}
                    color={Palette.secondaryPurple}
                  />
                  <Text style={[styles.actionText, { color: Palette.secondaryPurple }]}>
                    Share
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={exportAsPdf}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={Palette.secondaryBlue} />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="file-pdf-box"
                        size={20}
                        color={Palette.secondaryBlue}
                      />
                      <Text style={[styles.actionText, { color: Palette.secondaryBlue }]}>
                        Export PDF
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={deleteEntry}
                  disabled={isLoading}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={20}
                    color={Palette.secondaryRed}
                  />
                  <Text style={[styles.actionText, { color: Palette.secondaryRed }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  headerButton: {
    padding: spacing.sm,
    minWidth: 60,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: Palette.textDark,
    textAlign: 'center',
  },
  saveText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: Palette.primary,
    textAlign: 'right',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.h1.fontSize,
    fontWeight: typography.h1.fontWeight,
    color: Palette.textDark,
    marginBottom: spacing.md,
  },
  titleInput: {
    fontSize: typography.h1.fontSize,
    fontWeight: typography.h1.fontWeight,
    color: Palette.textDark,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    paddingBottom: spacing.sm,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: typography.caption.fontSize,
    color: Palette.textLight,
    marginLeft: spacing.xs,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  moodText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  moodPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: Palette.card,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  moodPickerItem: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: Palette.border,
    width: '23%',
    marginBottom: spacing.xs,
  },
  moodPickerText: {
    fontSize: typography.small.fontSize,
    color: Palette.textLight,
    marginTop: spacing.xs,
  },
  contentText: {
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
    lineHeight: 26,
  },
  contentInput: {
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
    lineHeight: 26,
    minHeight: 200,
    backgroundColor: Palette.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  updatedText: {
    fontSize: typography.small.fontSize,
    color: Palette.textLight,
    fontStyle: 'italic',
    marginTop: spacing.lg,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  actionText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
});