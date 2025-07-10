import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import JournalEntryItem from './JournalEntryItem';
import { Palette, spacing } from '../../theme/colors';

export default function JournalEntryList({ fadeAnim, journalEntries, onOpenEntry }) {
  if (!journalEntries?.length) {
    // You can choose to handle empty state here or in the parent
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
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
    paddingBottom: 100,
  },
  entriesContainer: {},
});

