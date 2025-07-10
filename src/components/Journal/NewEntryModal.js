import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getAuth } from 'firebase/auth';
import { Palette, spacing, typography, borderRadius } from '../../theme/colors';

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
];

export default function NewEntryModal({
  visible,
  onClose,
  journalEntries,
  setJournalEntries
}) {
  const [currentEntry, setCurrentEntry] = useState('');
  const [entryTitle, setEntryTitle] = useState('');
  const [mood, setMood] = useState(null);
  const [currentPrompt, setCurrentPrompt] = useState('');

  useEffect(() => {
    if (visible) {
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      setCurrentPrompt(randomPrompt);
    }
  }, [visible]);

  const saveEntry = async () => {
    if (!currentEntry.trim() && !entryTitle.trim()) {
      Alert.alert('Empty Entry', 'Please write something or add a title before saving.');
      return;
    }
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        Alert.alert('Error', 'You need to be logged in to save entries');
        return;
      }

      const newEntry = {
        title: entryTitle.trim() || 'Untitled Entry',
        content: currentEntry,
        mood: mood,
        date: new Date(),
        userId: user.uid,
      };

      // Save locally first
      const updatedEntries = [
        {
          ...newEntry,
          id: Date.now().toString(),
          date: new Date().toISOString()
        },
        ...journalEntries
      ];
      setJournalEntries(updatedEntries);
      await AsyncStorage.setItem('journalEntries', JSON.stringify(updatedEntries));

      // Save to Firestore
      await addDoc(collection(db, "journals"), newEntry);

      setCurrentEntry('');
      setEntryTitle('');
      setMood(null);
      onClose();
      Alert.alert('Saved!', 'Your journal entry has been saved.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save your entry. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <SafeAreaView style={{flex: 1}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Entry</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={28} color={Palette.textLight} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.titleInput}
              placeholder="Give your entry a title..."
              placeholderTextColor="#B0B0B0"
              value={entryTitle}
              onChangeText={setEntryTitle}
            />

            <View style={styles.promptContainer}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color={Palette.secondaryOrange} />
              <Text style={styles.promptText}>{currentPrompt}</Text>
            </View>

            <TextInput
              style={styles.contentInput}
              placeholder="Write what's on your mind..."
              placeholderTextColor="#B0B0B0"
              value={currentEntry}
              onChangeText={setCurrentEntry}
              multiline
            />
            
            <Text style={styles.moodLabel}>How are you feeling right now?</Text>
            <View style={styles.moodContainer}>
              {moodOptions.map((moodOption) => (
                <TouchableOpacity
                  key={moodOption.value}
                  style={[
                    styles.moodButton,
                    mood === moodOption.value && { 
                      backgroundColor: moodOption.color + '30', 
                      borderColor: moodOption.color 
                    }
                  ]}
                  onPress={() => setMood(moodOption.value)}
                >
                  <MaterialCommunityIcons name={moodOption.icon} size={32} color={moodOption.color} />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.saveButton} onPress={saveEntry}>
              <Text style={styles.saveButtonText}>Save Entry</Text>
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
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  modalTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: Palette.textDark,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  modalContent: {
    padding: spacing.lg,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: typography.h1.fontWeight,
    color: Palette.textDark,
    paddingBottom: spacing.sm,
    marginBottom: spacing.lg,
  },
  promptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.secondaryOrange + '20',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  promptText: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
    marginLeft: spacing.sm,
    fontStyle: 'italic',
  },
  contentInput: {
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
    minHeight: 200,
    lineHeight: typography.body.lineHeight,
  },
  moodLabel: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: Palette.textDark,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  moodButton: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    width: '22%',
    marginBottom: spacing.sm,
  },
  modalFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: Palette.secondaryBlue,
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    flex: 1,
  },
  saveButtonText: {
    color: Palette.white,
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
  },
});
