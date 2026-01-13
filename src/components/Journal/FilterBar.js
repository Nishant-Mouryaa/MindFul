// components/Journal/FilterBar.js - Compact Mobile-Optimized Version
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Palette, spacing, typography, borderRadius, shadows } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_SMALL_DEVICE = SCREEN_WIDTH < 375;

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
  { label: 'All', value: null, short: 'All' },
  { label: 'Today', value: 'today', short: 'Today' },
  { label: 'This Week', value: 'week', short: 'Week' },
  { label: 'This Month', value: 'month', short: 'Month' },
  { label: 'Last 3 Months', value: '3months', short: '3 Mo' },
];

export default function FilterBar({
  selectedMood,
  onMoodChange,
  selectedDateRange,
  onDateRangeChange,
  compact = false,
}) {
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  const hasActiveFilters = selectedMood || selectedDateRange;
  const selectedMoodOption = MOOD_OPTIONS.find(m => m.value === selectedMood);
  const selectedDateOption = DATE_RANGE_OPTIONS.find(d => d.value === selectedDateRange);

  const clearAllFilters = () => {
    onMoodChange(null);
    onDateRangeChange(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Filter Icon/Label */}
        <View style={styles.filterLabel}>
          <MaterialCommunityIcons
            name="filter-variant"
            size={16}
            color={hasActiveFilters ? Palette.primary : Palette.textLight}
          />
        </View>

        {/* Mood Filter Chip */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedMood && styles.filterChipActive
          ]}
          onPress={() => setShowMoodModal(true)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={selectedMoodOption?.icon || 'emoticon-outline'}
            size={16}
            color={selectedMood ? Palette.white : selectedMoodOption?.color || Palette.textLight}
          />
          {!IS_SMALL_DEVICE && (
            <Text style={[
              styles.filterChipText,
              selectedMood && styles.filterChipTextActive
            ]}>
              {selectedMoodOption?.label || 'Mood'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Date Range Filter Chip */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedDateRange && styles.filterChipActive
          ]}
          onPress={() => setShowDateModal(true)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="calendar-range"
            size={16}
            color={selectedDateRange ? Palette.white : Palette.textLight}
          />
          <Text style={[
            styles.filterChipText,
            selectedDateRange && styles.filterChipTextActive
          ]}>
            {IS_SMALL_DEVICE 
              ? (selectedDateOption?.short || 'Date')
              : (selectedDateOption?.label || 'Date')
            }
          </Text>
        </TouchableOpacity>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearAllFilters}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={16}
              color={Palette.secondaryRed}
            />
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
            <TouchableOpacity 
              onPress={() => setShowMoodModal(false)}
              style={styles.modalCloseButton}
            >
              <MaterialCommunityIcons name="close" size={24} color={Palette.textLight} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filter by Mood</Text>
            <View style={styles.modalCloseButton} />
          </View>
          
          <View style={styles.moodGrid}>
            {MOOD_OPTIONS.map((mood) => (
              <TouchableOpacity
                key={mood.value || 'all'}
                style={[
                  styles.moodGridItem,
                  selectedMood === mood.value && styles.moodGridItemSelected
                ]}
                onPress={() => {
                  onMoodChange(mood.value);
                  setShowMoodModal(false);
                }}
              >
                <View style={[
                  styles.moodIconContainer,
                  { backgroundColor: mood.color + '20' }
                ]}>
                  <MaterialCommunityIcons
                    name={mood.icon}
                    size={28}
                    color={mood.color}
                  />
                </View>
                <Text style={[
                  styles.moodGridLabel,
                  selectedMood === mood.value && styles.moodGridLabelSelected
                ]}>
                  {mood.label}
                </Text>
                {selectedMood === mood.value && (
                  <View style={styles.selectedIndicator}>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={16}
                      color={Palette.primary}
                    />
                  </View>
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
            <TouchableOpacity 
              onPress={() => setShowDateModal(false)}
              style={styles.modalCloseButton}
            >
              <MaterialCommunityIcons name="close" size={24} color={Palette.textLight} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filter by Date</Text>
            <View style={styles.modalCloseButton} />
          </View>
          
          <View style={styles.dateList}>
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
                <MaterialCommunityIcons
                  name={option.value ? 'calendar-check' : 'calendar-blank'}
                  size={22}
                  color={selectedDateRange === option.value ? Palette.primary : Palette.textLight}
                />
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
    alignItems: 'center',
    paddingRight: spacing.sm,
  },
  filterLabel: {
    marginRight: spacing.xs,
    opacity: 0.7,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: Palette.border,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  filterChipText: {
    fontSize: typography.small.fontSize,
    color: Palette.textDark,
  },
  filterChipTextActive: {
    color: Palette.white,
    fontWeight: '500',
  },
  clearButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  
  // Modal Styles
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
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
    color: Palette.textDark,
  },
  
  // Mood Grid Styles
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  moodGridItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    position: 'relative',
  },
  moodGridItemSelected: {
    backgroundColor: Palette.primary + '10',
  },
  moodIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  moodGridLabel: {
    fontSize: typography.caption.fontSize,
    color: Palette.textDark,
    textAlign: 'center',
  },
  moodGridLabelSelected: {
    fontWeight: '600',
    color: Palette.primary,
  },
  selectedIndicator: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
  },

  // Date List Styles
  dateList: {
    padding: spacing.md,
  },
  dateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    gap: spacing.md,
  },
  dateOptionSelected: {
    backgroundColor: Palette.primary + '10',
  },
  dateOptionText: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
  },
  dateOptionTextSelected: {
    fontWeight: '600',
    color: Palette.primary,
  },
});