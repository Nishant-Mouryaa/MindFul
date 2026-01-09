
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Palette, spacing, typography, borderRadius, shadows } from '../../theme/colors';

export default function JournalEntryItem({ entry, onPress }) {
 const formatDate = (dateInput) => {
    let date;
    
    // Handle Firestore Timestamp
    if (dateInput && typeof dateInput === 'object' && dateInput.toDate) {
      date = dateInput.toDate();
    }
    // Handle ISO string
    else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    }
    // Handle regular Date object
    else if (dateInput instanceof Date) {
      date = dateInput;
    }
    // If none of the above, use current date
    else {
      date = new Date();
    }
    
    const day = date.getDate().toString();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return { day, month };
  };

  const { day, month } = formatDate(entry.date);




  const moodMap = {
    great: { label: 'Great', icon: 'emoticon-excited-outline', color: '#58D68D' },
    good: { label: 'Good', icon: 'emoticon-happy-outline', color: Palette.primary },
    neutral: { label: 'Neutral', icon: 'emoticon-neutral-outline', color: Palette.textLight },
    down: { label: 'Down', icon: 'emoticon-sad-outline', color: Palette.secondaryBlue },
    sad: { label: 'Sad', icon: 'emoticon-frown-outline', color: Palette.secondaryBlue },
    anxious: { label: 'Anxious', icon: 'emoticon-confused-outline', color: Palette.secondaryOrange },
    angry: { label: 'Angry', icon: 'emoticon-angry-outline', color: Palette.secondaryRed },
    tired: { label: 'Tired', icon: 'emoticon-dead-outline', color: Palette.secondaryPurple },
  };

  const moodData = moodMap[entry.mood];

  return (
    <TouchableOpacity style={styles.entryCard} onPress={onPress}>
      <View style={[styles.dateBadge, { backgroundColor: moodData ? moodData.color : '#AAB7B8' }]}>
        <Text style={styles.dateDay}>{day}</Text>
        <Text style={styles.dateMonth}>{month.toUpperCase()}</Text>
      </View>
      <View style={styles.entryContent}>
        <View style={styles.entryHeader}>
          <Text style={styles.entryTitle} numberOfLines={1}>
            {entry.title}
          </Text>
        </View>
        <Text style={styles.entrySnippet} numberOfLines={2}>
          {entry.content || 'No additional text.'}
        </Text>
      </View>
      {moodData && (
        <MaterialCommunityIcons
          name={moodData.icon}
          size={28}
          color={moodData.color}
          style={styles.moodIcon}
        />
      )}
      <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  entryCard: {
    flexDirection: 'row',
    backgroundColor: Palette.card,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'center',
    ...shadows.low,
  },
  dateBadge: {
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    height: 60,
    width: 60,
  },
  dateDay: {
    fontSize: 22,
    fontWeight: typography.h2.fontWeight,
    color: Palette.white,
  },
  dateMonth: {
    fontSize: typography.small.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: Palette.white,
    marginTop: spacing.xs,
  },
  entryContent: {
    flex: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  entryTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: Palette.textDark,
  },
  entrySnippet: {
    fontSize: typography.caption.fontSize,
    color: Palette.textLight,
    lineHeight: typography.caption.lineHeight,
  },
  moodIcon: {
    marginLeft: 10,
  },
});
