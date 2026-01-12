// components/Journal/NewEntryModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getAuth } from 'firebase/auth';
import { Palette, spacing, typography, borderRadius } from '../../theme/colors';
import { validation } from '../../utils/validation';

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

const prompts = [
  "What's one thing that went well today?",
  "Describe a challenge you faced and how you handled it.",
  "What are three things you're grateful for?",
  "If you could tell your past self one thing, what would it be?",
  "What's a goal you're working towards and what's your next step?",
  "How did you practice self-care today?",
  "What made you smile today?",
  "What's something you learned recently?",
  "Describe a moment of peace you experienced today.",
  "What are you looking forward to?",
];

export default function NewEntryModal({
  visible,
  onClose,
  journalEntries,
  setJournalEntries,
  encryptionUtils,
  trackActivity,
  syncQueue,
  isOnline,
}) {
  const [entryTitle, setEntryTitle] = useState('');
  const [currentEntry, setCurrentEntry] = useState('');
  const [mood, setMood] = useState(null);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const MAX_TITLE_LENGTH = 200;
  const MAX_CONTENT_LENGTH = 50000;

  useEffect(() => {
    if (visible) {
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      setCurrentPrompt(randomPrompt);
      trackActivity?.();
    }
  }, [visible]);

  useEffect(() => {
    setCharCount(currentEntry.length);
  }, [currentEntry]);

  const resetForm = () => {
    setEntryTitle('');
    setCurrentEntry('');
    setMood(null);
    setCurrentPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
  };

  const saveEntry = async () => {
    // Sanitize and validate input
    const preparedEntry = validation.prepareEntryForSave({
      title: entryTitle,
      content: currentEntry,
    });

    if (!preparedEntry.isValid) {
      Alert.alert('Validation Error', preparedEntry.errors.join('\n'));
      return;
    }

    if (!mood) {
      Alert.alert('Select Mood', 'Please select how you are feeling.');
      return;
    }

    setIsSaving(true);
    trackActivity?.();

    try {
      const auth = getAuth();
      const now = new Date();
      
      const newEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: preparedEntry.entry.title,
        content: preparedEntry.entry.content,
        date: now.toISOString(),
        mood,
        userId: auth.currentUser?.uid || 'local',
        createdAt: now.toISOString(),
        tags: [],
      };

      // Update local state immediately
      const updatedEntries = [newEntry, ...journalEntries];
      setJournalEntries(updatedEntries);

      // Encrypt and save to local storage
      const encryptedEntry = await encryptionUtils.encryptEntry(newEntry);
      const encryptedEntries = await Promise.all(
        updatedEntries.map((e) =>
          e.id === newEntry.id ? encryptedEntry : encryptionUtils.encryptEntry(e)
        )
      );
      await AsyncStorage.setItem('journalEntries', JSON.stringify(encryptedEntries));

      // Sync to Firebase
      if (auth.currentUser) {
        if (isOnline) {
          try {
            const docRef = await addDoc(collection(db, 'journals'), {
              ...encryptedEntry,
              date: Timestamp.fromDate(now),
              userId: auth.currentUser.uid,
            });
            
            // Update local entry with Firebase ID
            const finalEntry = { ...newEntry, id: docRef.id };
            const finalEntries = updatedEntries.map((e) =>
              e.id === newEntry.id ? finalEntry : e
            );
            setJournalEntries(finalEntries);
            
            // Update local storage with new ID
            const finalEncrypted = await Promise.all(
              finalEntries.map((e) => encryptionUtils.encryptEntry(e))
            );
            await AsyncStorage.setItem('journalEntries', JSON.stringify(finalEncrypted));
          } catch (firebaseError) {
            console.error('Firebase save error:', firebaseError);
            // Add to sync queue for later
            await syncQueue.addToQueue({
              type: 'CREATE',
              data: encryptedEntry,
            });
          }
        } else {
          // Offline - add to sync queue
          await syncQueue.addToQueue({
            type: 'CREATE',
            data: encryptedEntry,
          });
        }
      }

      Alert.alert('Success', 'Journal entry saved!');
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (entryTitle.trim() || currentEntry.trim()) {
      Alert.alert(
        'Discard Entry?',
        'You have unsaved changes. Are you sure you want to discard this entry?',
        [
          { text: 'Keep Writing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              resetForm();
              onClose();
            },
          },
        ]
      );
    } else {
      resetForm();
      onClose();
    }
  };

// components/Journal/NewEntryModal.js (continued)

  const refreshPrompt = () => {
    const otherPrompts = prompts.filter((p) => p !== currentPrompt);
    const randomPrompt = otherPrompts[Math.floor(Math.random() * otherPrompts.length)];
    setCurrentPrompt(randomPrompt);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
              <MaterialCommunityIcons name="close" size={24} color={Palette.textLight} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Entry</Text>
            <TouchableOpacity
              onPress={saveEntry}
              style={[styles.headerButton, styles.saveHeaderButton]}
              disabled={isSaving}
            >
              {isSaving ? (
                <Text style={styles.savingText}>Saving...</Text>
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title Input */}
            <View style={styles.titleContainer}>
              <TextInput
                style={styles.titleInput}
                placeholder="Entry title..."
                placeholderTextColor={Palette.textLight}
                value={entryTitle}
                onChangeText={(text) => {
                  if (text.length <= MAX_TITLE_LENGTH) {
                    setEntryTitle(text);
                  }
                }}
                maxLength={MAX_TITLE_LENGTH}
              />
              <Text style={styles.charCounter}>
                {entryTitle.length}/{MAX_TITLE_LENGTH}
              </Text>
            </View>

            {/* Writing Prompt */}
            <View style={styles.promptContainer}>
              <View style={styles.promptHeader}>
                <MaterialCommunityIcons
                  name="lightbulb-on-outline"
                  size={20}
                  color={Palette.secondaryOrange}
                />
                <Text style={styles.promptLabel}>Writing Prompt</Text>
                <TouchableOpacity onPress={refreshPrompt} style={styles.refreshButton}>
                  <MaterialCommunityIcons
                    name="refresh"
                    size={18}
                    color={Palette.secondaryOrange}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.promptText}>{currentPrompt}</Text>
            </View>

            {/* Content Input */}
            <View style={styles.contentContainer}>
              <TextInput
                style={styles.contentInput}
                placeholder="Write what's on your mind..."
                placeholderTextColor={Palette.textLight}
                value={currentEntry}
                onChangeText={(text) => {
                  if (text.length <= MAX_CONTENT_LENGTH) {
                    setCurrentEntry(text);
                  }
                }}
                multiline
                textAlignVertical="top"
                maxLength={MAX_CONTENT_LENGTH}
              />
              <Text style={[
                styles.charCounter,
                charCount > MAX_CONTENT_LENGTH * 0.9 && styles.charCounterWarning
              ]}>
                {charCount.toLocaleString()}/{MAX_CONTENT_LENGTH.toLocaleString()}
              </Text>
            </View>

            {/* Mood Selection */}
            <View style={styles.moodSection}>
              <Text style={styles.moodLabel}>How are you feeling?</Text>
              <View style={styles.moodContainer}>
                {moodOptions.map((moodOption) => (
                  <TouchableOpacity
                    key={moodOption.value}
                    style={[
                      styles.moodButton,
                      mood === moodOption.value && {
                        backgroundColor: moodOption.color + '25',
                        borderColor: moodOption.color,
                      },
                    ]}
                    onPress={() => setMood(moodOption.value)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={moodOption.icon}
                      size={28}
                      color={mood === moodOption.value ? moodOption.color : Palette.textLight}
                    />
                    <Text
                      style={[
                        styles.moodButtonText,
                        mood === moodOption.value && { color: moodOption.color },
                      ]}
                    >
                      {moodOption.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tips Section */}
            <View style={styles.tipsSection}>
              <Text style={styles.tipsTitle}>Tips for journaling:</Text>
              <Text style={styles.tipsText}>
                • Write freely without worrying about grammar{'\n'}
                • Be honest with yourself{'\n'}
                • Focus on how you feel, not just what happened{'\n'}
                • Even a few sentences count!
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (!entryTitle.trim() || !currentEntry.trim() || !mood || isSaving) &&
                  styles.saveButtonDisabled,
              ]}
              onPress={saveEntry}
              disabled={!entryTitle.trim() || !currentEntry.trim() || !mood || isSaving}
            >
              {isSaving ? (
                <Text style={styles.saveButtonText}>Saving...</Text>
              ) : (
                <>
                  <MaterialCommunityIcons name="content-save" size={20} color={Palette.white} />
                  <Text style={styles.saveButtonText}>Save Entry</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  headerButton: {
    padding: spacing.sm,
    minWidth: 60,
  },
  saveHeaderButton: {
    alignItems: 'flex-end',
  },
  modalTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: Palette.textDark,
  },
  saveText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: Palette.primary,
  },
  savingText: {
    fontSize: typography.body.fontSize,
    color: Palette.textLight,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  titleContainer: {
    marginBottom: spacing.md,
  },
  titleInput: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: Palette.textDark,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  charCounter: {
    fontSize: typography.small.fontSize,
    color: Palette.textLight,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  charCounterWarning: {
    color: Palette.secondaryOrange,
  },
  promptContainer: {
    backgroundColor: Palette.secondaryOrange + '15',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  promptLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: Palette.secondaryOrange,
    marginLeft: spacing.sm,
    flex: 1,
  },
  refreshButton: {
    padding: spacing.xs,
  },
  promptText: {
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  contentContainer: {
    marginBottom: spacing.lg,
  },
  contentInput: {
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
    minHeight: 200,
    lineHeight: 24,
    textAlignVertical: 'top',
    backgroundColor: Palette.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  moodSection: {
    marginBottom: spacing.lg,
  },
  moodLabel: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: Palette.textDark,
    marginBottom: spacing.md,
  },
  moodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moodButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: Palette.border,
    width: '23%',
    marginBottom: spacing.sm,
    backgroundColor: Palette.card,
  },
  moodButtonText: {
    fontSize: typography.small.fontSize,
    color: Palette.textLight,
    marginTop: spacing.xs,
  },
  tipsSection: {
    backgroundColor: Palette.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  tipsTitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: Palette.textDark,
    marginBottom: spacing.sm,
  },
  tipsText: {
    fontSize: typography.caption.fontSize,
    color: Palette.textLight,
    lineHeight: 20,
  },
  modalFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: Palette.primary,
    padding: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: Palette.textLight,
    opacity: 0.5,
  },
  saveButtonText: {
    color: Palette.white,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});