// components/Journal/ReminderSettings.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Modal,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Palette, spacing, typography, borderRadius, shadows } from '../../theme/colors';
import { notificationUtils } from '../../utils/notifications';


// Custom Time Picker Component
function CustomTimePicker({ visible, currentHour, currentMinute, onConfirm, onCancel }) {
  const [selectedHour, setSelectedHour] = useState(currentHour);
  const [selectedMinute, setSelectedMinute] = useState(currentMinute);
  const [isPM, setIsPM] = useState(currentHour >= 12);

  useEffect(() => {
    setSelectedHour(currentHour);
    setSelectedMinute(currentMinute);
    setIsPM(currentHour >= 12);
  }, [currentHour, currentMinute, visible]);

  const hours = Array.from({ length: 12 }, (_, i) => i === 0 ? 12 : i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const get24Hour = () => {
    let hour = selectedHour;
    if (selectedHour === 12) {
      hour = isPM ? 12 : 0;
    } else {
      hour = isPM ? selectedHour + 12 : selectedHour;
    }
    return hour;
  };

  const handleConfirm = () => {
    onConfirm(get24Hour(), selectedMinute);
  };

  const formatMinute = (min) => min.toString().padStart(2, '0');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={timePickerStyles.overlay}>
        <View style={timePickerStyles.container}>
          <Text style={timePickerStyles.title}>Select Time</Text>

          <View style={timePickerStyles.pickerContainer}>
            {/* Hours */}
            <View style={timePickerStyles.pickerColumn}>
              <Text style={timePickerStyles.pickerLabel}>Hour</Text>
              <ScrollView 
                style={timePickerStyles.scrollView}
                showsVerticalScrollIndicator={false}
              >
                {hours.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      timePickerStyles.pickerItem,
                      selectedHour === hour && timePickerStyles.pickerItemSelected,
                    ]}
                    onPress={() => setSelectedHour(hour)}
                  >
                    <Text
                      style={[
                        timePickerStyles.pickerItemText,
                        selectedHour === hour && timePickerStyles.pickerItemTextSelected,
                      ]}
                    >
                      {hour}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Separator */}
            <Text style={timePickerStyles.separator}>:</Text>

            {/* Minutes */}
            <View style={timePickerStyles.pickerColumn}>
              <Text style={timePickerStyles.pickerLabel}>Min</Text>
              <ScrollView 
                style={timePickerStyles.scrollView}
                showsVerticalScrollIndicator={false}
              >
                {minutes.map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      timePickerStyles.pickerItem,
                      selectedMinute === minute && timePickerStyles.pickerItemSelected,
                    ]}
                    onPress={() => setSelectedMinute(minute)}
                  >
                    <Text
                      style={[
                        timePickerStyles.pickerItemText,
                        selectedMinute === minute && timePickerStyles.pickerItemTextSelected,
                      ]}
                    >
                      {formatMinute(minute)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* AM/PM */}
            <View style={timePickerStyles.pickerColumn}>
              <Text style={timePickerStyles.pickerLabel}>Period</Text>
              <View style={timePickerStyles.ampmContainer}>
                <TouchableOpacity
                  style={[
                    timePickerStyles.ampmButton,
                    !isPM && timePickerStyles.ampmButtonSelected,
                  ]}
                  onPress={() => setIsPM(false)}
                >
                  <Text
                    style={[
                      timePickerStyles.ampmText,
                      !isPM && timePickerStyles.ampmTextSelected,
                    ]}
                  >
                    AM
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    timePickerStyles.ampmButton,
                    isPM && timePickerStyles.ampmButtonSelected,
                  ]}
                  onPress={() => setIsPM(true)}
                >
                  <Text
                    style={[
                      timePickerStyles.ampmText,
                      isPM && timePickerStyles.ampmTextSelected,
                    ]}
                  >
                    PM
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Preview */}
          <View style={timePickerStyles.previewContainer}>
            <Text style={timePickerStyles.previewLabel}>Selected Time:</Text>
            <Text style={timePickerStyles.previewTime}>
              {selectedHour}:{formatMinute(selectedMinute)} {isPM ? 'PM' : 'AM'}
            </Text>
          </View>

          {/* Buttons */}
          <View style={timePickerStyles.buttonContainer}>
            <TouchableOpacity
              style={[timePickerStyles.button, timePickerStyles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={timePickerStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[timePickerStyles.button, timePickerStyles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={timePickerStyles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const timePickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: Palette.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '85%',
    maxWidth: 350,
    ...shadows.medium,
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: Palette.textDark,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  pickerColumn: {
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  pickerLabel: {
    fontSize: typography.caption.fontSize,
    color: Palette.textLight,
    marginBottom: spacing.sm,
  },
  scrollView: {
    height: 150,
    width: 60,
  },
  pickerItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    marginVertical: 2,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: Palette.primary + '20',
  },
  pickerItemText: {
    fontSize: typography.h3.fontSize,
    color: Palette.textDark,
  },
  pickerItemTextSelected: {
    color: Palette.primary,
    fontWeight: '600',
  },
  separator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Palette.textDark,
    marginTop: 60,
  },
  ampmContainer: {
    marginTop: spacing.sm,
  },
  ampmButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  ampmButtonSelected: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  ampmText: {
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
    fontWeight: '500',
  },
  ampmTextSelected: {
    color: Palette.white,
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    marginBottom: spacing.md,
  },
  previewLabel: {
    fontSize: typography.caption.fontSize,
    color: Palette.textLight,
  },
  previewTime: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: Palette.primary,
    marginTop: spacing.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: spacing.sm,
    backgroundColor: Palette.background,
  },
  confirmButton: {
    marginLeft: spacing.sm,
    backgroundColor: Palette.primary,
  },
  cancelButtonText: {
    fontSize: typography.body.fontSize,
    color: Palette.textLight,
    fontWeight: '500',
  },
  confirmButtonText: {
    fontSize: typography.body.fontSize,
    color: Palette.white,
    fontWeight: '600',
  },
});

// Main Reminder Settings Component
export default function ReminderSettings({ visible, onClose }) {
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(20);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const settings = await notificationUtils.getReminderSettings();
      if (settings) {
        setReminderEnabled(settings.enabled || false);
        setReminderHour(settings.hour ?? 20);
        setReminderMinute(settings.minute ?? 0);
      }
    } catch (error) {
      console.error('Error loading reminder settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleReminder = async (enabled) => {
    try {
      setReminderEnabled(enabled);

      if (enabled) {
        const hasPermission = await notificationUtils.requestPermissions();
        if (!hasPermission) {
          Alert.alert(
            'Permissions Required',
            'Please enable notifications in your device settings to use reminders.',
            [{ text: 'OK' }]
          );
          setReminderEnabled(false);
          return;
        }

        await notificationUtils.scheduleJournalReminder({
          hour: reminderHour,
          minute: reminderMinute,
        });

        Alert.alert(
          'Reminder Set! 🔔',
          `You'll receive a daily reminder at ${formatTime(reminderHour, reminderMinute)}`
        );
      } else {
        await notificationUtils.cancelAllReminders();
        Alert.alert('Reminder Disabled', 'Daily reminders have been turned off.');
      }
    } catch (error) {
      console.error('Error toggling reminder:', error);
      Alert.alert('Error', 'Failed to update reminder settings.');
      setReminderEnabled(!enabled);
    }
  };

  const handleTimeConfirm = async (hour, minute) => {
    setShowTimePicker(false);
    setReminderHour(hour);
    setReminderMinute(minute);

    if (reminderEnabled) {
      try {
        await notificationUtils.scheduleJournalReminder({
          hour: hour,
          minute: minute,
        });
        Alert.alert(
          'Time Updated',
          `Reminder time changed to ${formatTime(hour, minute)}`
        );
      } catch (error) {
        console.error('Error updating reminder time:', error);
        Alert.alert('Error', 'Failed to update reminder time.');
      }
    }
  };

  const formatTime = (hour, minute) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  // Quick time presets
  const timePresets = [
    { label: 'Morning', hour: 8, minute: 0, icon: 'weather-sunny' },
    { label: 'Afternoon', hour: 14, minute: 0, icon: 'weather-partly-cloudy' },
    { label: 'Evening', hour: 20, minute: 0, icon: 'weather-night' },
    { label: 'Before Bed', hour: 22, minute: 0, icon: 'bed' },
  ];

  const handlePresetSelect = async (hour, minute) => {
    setReminderHour(hour);
    setReminderMinute(minute);

    if (reminderEnabled) {
      try {
        await notificationUtils.scheduleJournalReminder({ hour, minute });
        Alert.alert('Time Updated', `Reminder time changed to ${formatTime(hour, minute)}`);
      } catch (error) {
        console.error('Error updating reminder time:', error);
      }
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
          <Text style={styles.title}>Reminder Settings</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color={Palette.textLight} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Daily Reminder Toggle */}
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={24}
                  color={Palette.primary}
                />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Daily Reminder</Text>
                  <Text style={styles.settingDescription}>
                    Get a gentle nudge to journal every day
                  </Text>
                </View>
              </View>
              <Switch
                value={reminderEnabled}
                onValueChange={handleToggleReminder}
                trackColor={{
                  false: Palette.border,
                  true: Palette.primary + '50',
                }}
                thumbColor={reminderEnabled ? Palette.primary : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Time Selection */}
          <View
            style={[
              styles.settingCard,
              !reminderEnabled && styles.settingCardDisabled,
            ]}
          >
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => reminderEnabled && setShowTimePicker(true)}
              disabled={!reminderEnabled}
            >
              <View style={styles.settingInfo}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={24}
                  color={reminderEnabled ? Palette.primary : Palette.textLight}
                />
                <View style={styles.settingTextContainer}>
                  <Text
                    style={[
                      styles.settingTitle,
                      !reminderEnabled && styles.settingTitleDisabled,
                    ]}
                  >
                    Reminder Time
                  </Text>
                  <Text style={styles.settingDescription}>
                    Tap to change when you receive reminders
                  </Text>
                </View>
              </View>
              <View style={styles.timeDisplay}>
                <Text
                  style={[
                    styles.timeText,
                    !reminderEnabled && styles.timeTextDisabled,
                  ]}
                >
                  {formatTime(reminderHour, reminderMinute)}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={reminderEnabled ? Palette.textLight : Palette.border}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick Time Presets */}
          <Text style={styles.sectionTitle}>Quick Presets</Text>
          <View style={styles.presetsContainer}>
            {timePresets.map((preset, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.presetButton,
                  !reminderEnabled && styles.presetButtonDisabled,
                  reminderHour === preset.hour &&
                    reminderMinute === preset.minute &&
                    styles.presetButtonActive,
                ]}
                onPress={() => handlePresetSelect(preset.hour, preset.minute)}
                disabled={!reminderEnabled}
              >
                <MaterialCommunityIcons
                  name={preset.icon}
                  size={24}
                  color={
                    reminderHour === preset.hour && reminderMinute === preset.minute
                      ? Palette.primary
                      : reminderEnabled
                      ? Palette.textDark
                      : Palette.textLight
                  }
                />
                <Text
                  style={[
                    styles.presetLabel,
                    !reminderEnabled && styles.presetLabelDisabled,
                    reminderHour === preset.hour &&
                      reminderMinute === preset.minute &&
                      styles.presetLabelActive,
                  ]}
                >
                  {preset.label}
                </Text>
                <Text
                  style={[
                    styles.presetTime,
                    !reminderEnabled && styles.presetTimeDisabled,
                  ]}
                >
                  {formatTime(preset.hour, preset.minute)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tips Card */}
          <View style={styles.tipsCard}>
            <MaterialCommunityIcons
              name="lightbulb-outline"
              size={24}
              color={Palette.secondaryOrange}
            />
            <View style={styles.tipsContent}>
              <Text style={styles.tipsTitle}>Tips for Building a Habit</Text>
              <Text style={styles.tipsText}>
                • Set your reminder for a time when you're usually free{'\n'}
                • Many people find evening journaling helps them wind down{'\n'}
                • Start with just 5 minutes of writing{'\n'}
                • Don't worry about perfect grammar or structure
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Custom Time Picker Modal */}
        <CustomTimePicker
          visible={showTimePicker}
          currentHour={reminderHour}
          currentMinute={reminderMinute}
          onConfirm={handleTimeConfirm}
          onCancel={() => setShowTimePicker(false)}
        />
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
    flex: 1,
    padding: spacing.lg,
  },
  settingCard: {
    backgroundColor: Palette.card,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    ...shadows.low,
  },
  settingCardDisabled: {
    opacity: 0.6,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: Palette.textDark,
  },
  settingTitleDisabled: {
    color: Palette.textLight,
  },
  settingDescription: {
    fontSize: typography.caption.fontSize,
    color: Palette.textLight,
    marginTop: spacing.xs,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: typography.body.fontSize,
    color: Palette.primary,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  timeTextDisabled: {
    color: Palette.textLight,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: Palette.textDark,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  presetButton: {
    width: '48%',
    backgroundColor: Palette.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    ...shadows.low,
  },
  presetButtonDisabled: {
    opacity: 0.5,
  },
  presetButtonActive: {
    borderColor: Palette.primary,
    backgroundColor: Palette.primary + '10',
  },
  presetLabel: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
    color: Palette.textDark,
    marginTop: spacing.sm,
  },
  presetLabelDisabled: {
    color: Palette.textLight,
  },
  presetLabelActive: {
    color: Palette.primary,
  },
  presetTime: {
    fontSize: typography.caption.fontSize,
    color: Palette.textLight,
    marginTop: spacing.xs,
  },
  presetTimeDisabled: {
    color: Palette.border,
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: Palette.secondaryOrange + '15',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  tipsContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  tipsTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: Palette.textDark,
    marginBottom: spacing.sm,
  },
  tipsText: {
    fontSize: typography.caption.fontSize,
    color: Palette.textDark,
    lineHeight: 20,
  },
});