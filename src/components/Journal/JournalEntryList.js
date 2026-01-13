// components/Journal/JournalEntryList.js
import React from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import JournalEntryItem from './JournalEntryItem';
import { Palette, spacing } from '../../theme/colors';

// Adjust this value based on your actual navigation bar height
const BOTTOM_NAV_HEIGHT = Platform.OS === 'ios' ? 90 : 70;
const EXTRA_PADDING = 20;

export default function JournalEntryList({ fadeAnim, journalEntries, onOpenEntry }) {
  if (!journalEntries?.length) {
    return null;
  }

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.entriesContainer}>
        {journalEntries.map(entry => (
          <JournalEntryItem 
            key={entry.id} 
            entry={entry}
            onPress={() => onOpenEntry(entry)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    // Add enough padding for the navigation bar plus some extra space
    paddingBottom: BOTTOM_NAV_HEIGHT + EXTRA_PADDING,
  },
  entriesContainer: {
    flexDirection: 'column',
    gap: spacing.md,
  },
});