// components/Journal/FilterBar.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Palette, spacing, typography, borderRadius, shadows } from '../../theme/colors';

const MOOD_OPTIONS = [
  { label: 'All', value: null, icon: 'emoticon-outline', color: Palette.textLight },
  { label: 'Great', value: 'great', icon: 'emoticon-excited-outline', color: '#58D68D' },
  { label: 'Good', value: 'good', icon: 'emoticon-happy-outline', color: Palette.primary },
  { label: 'Neutral', value: 'neutral', icon: 'emoticon-neutral-outline', color: Palette.textLight },
  { label: 'Down', value: 'down', icon: 'emoticon-sad-outline', color: Palette.secondaryBlue },
  { label: 'Sad', value: 'sad', icon: 'emoticon-frown-outline', color: Palette.secondaryBlue },
  { label: 'Anxious', value: 'anxious', icon: 'emoticon-confused-outline', color: Palette.secondaryOrange },
  { label: 'Angry', value: 'angry', icon: 'emoticon-angry-outline', color: Palette.secondaryRed },
  { label: 'Tired', value: 'tired', icon: 'emoticon-dead-outline', color: Palette.secondaryPurple },
];

const DATE_RANGE_OPTIONS = [
  { label: 'All Time', value: null },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Last 3 Months', value: '3months' },
];

export default function FilterBar({
  selectedMood,
  onMoodChange,
  selectedDateRange,
  onDateRangeChange,
}) {
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedMood) count++;
    if (selectedDateRange) count++;
    return count;
  };

  const selectedMoodOption = MOOD_OPTIONS.find(m => m.value === selectedMood);
  const selectedDateOption = DATE_RANGE_OPTIONS.find(d => d.value === selectedDateRange);

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Mood Filter */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedMood && styles.filterChipActive
          ]}
          onPress={() => setShowMoodModal(true)}
        >
          <MaterialCommunityIcons
            name={selectedMoodOption?.icon || 'emoticon-outline'}
            size={18}
            color={selectedMood ? Palette.white : Palette.textDark}
          />
          <Text style={[
            styles.filterChipText,
            selectedMood && styles.filterChipTextActive
          ]}>
            {selectedMoodOption?.label || 'Mood'}
          </Text>
          <MaterialCommunityIcons
            name="chevron-down"
            size={16}
            color={selectedMood ? Palette.white : Palette.textLight}
          />
        </TouchableOpacity>

        {/* Date Range Filter */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedDateRange && styles.filterChipActive
          ]}
          onPress={() => setShowDateModal(true)}
        >
          <MaterialCommunityIcons
            name="calendar-range"
            size={18}
            color={selectedDateRange ? Palette.white : Palette.textDark}
          />
          <Text style={[
            styles.filterChipText,
            selectedDateRange && styles.filterChipTextActive
          ]}>
            {selectedDateOption?.label || 'Date'}
          </Text>
          <MaterialCommunityIcons
            name="chevron-down"
            size={16}
            color={selectedDateRange ? Palette.white : Palette.textLight}
          />
        </TouchableOpacity>

        {/* Clear Filters */}
        {getActiveFiltersCount() > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              onMoodChange(null);
              onDateRangeChange(null);
            }}
          >
            <MaterialCommunityIcons
              name="close"
              size={16}
              color={Palette.secondaryRed}
            />
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Mood Selection Modal */}
      <Modal
        visible={showMoodModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMoodModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter by Mood</Text>
            <TouchableOpacity onPress={() => setShowMoodModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color={Palette.textLight} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            {MOOD_OPTIONS.map((mood) => (
              <TouchableOpacity
                key={mood.value || 'all'}
                style={[
                  styles.moodOption,
                  selectedMood === mood.value && styles.moodOptionSelected
                ]}
                onPress={() => {
                  onMoodChange(mood.value);
                  setShowMoodModal(false);
                }}
              >
                <MaterialCommunityIcons
                  name={mood.icon}
                  size={32}
                  color={mood.color}
                />
                <Text style={[
                  styles.moodOptionText,
                  selectedMood === mood.value && styles.moodOptionTextSelected
                ]}>
                  {mood.label}
                </Text>
                {selectedMood === mood.value && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={Palette.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Date Range Selection Modal */}
      <Modal
        visible={showDateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDateModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter by Date</Text>
            <TouchableOpacity onPress={() => setShowDateModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color={Palette.textLight} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            {DATE_RANGE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value || 'all'}
                style={[
                  styles.dateOption,
                  selectedDateRange === option.value && styles.dateOptionSelected
                ]}
                onPress={() => {
                  onDateRangeChange(option.value);
                  setShowDateModal(false);
                }}
              >
                <Text style={[
                  styles.dateOptionText,
                  selectedDateRange === option.value && styles.dateOptionTextSelected
                ]}>
                  {option.label}
                </Text>
                {selectedDateRange === option.value && (
                  <MaterialCommunityIcons
                    name="check"
                    size={20}
                    color={Palette.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    ...shadows.low,
  },
  filterChipActive: {
    backgroundColor: Palette.primary,
  },
  filterChipText: {
    fontSize: typography.caption.fontSize,
    color: Palette.textDark,
    marginHorizontal: spacing.xs,
  },
  filterChipTextActive: {
    color: Palette.white,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  clearButtonText: {
    fontSize: typography.caption.fontSize,
    color: Palette.secondaryRed,
    marginLeft: spacing.xs,
  },
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
  },
  modalContent: {
    padding: spacing.lg,
  },
  moodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  moodOptionSelected: {
    backgroundColor: Palette.primary + '15',
  },
  moodOptionText: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
    marginLeft: spacing.md,
  },
  moodOptionTextSelected: {
    fontWeight: '600',
  },
  dateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  dateOptionSelected: {
    backgroundColor: Palette.primary + '15',
  },
  dateOptionText: {
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
  },
  dateOptionTextSelected: {
    fontWeight: '600',
    color: Palette.primary,
  },
});