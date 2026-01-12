
// utils/notifications.js
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDER_SETTINGS_KEY = 'journalReminderSettings';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const notificationUtils = {
  /**
   * Request notification permissions
   */
  async requestPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  },

  /**
   * Schedule daily journal reminder
   */
  async scheduleJournalReminder(settings = { hour: 20, minute: 0 }) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Notification permissions not granted');
      }

      // Cancel existing reminders first
      await this.cancelAllReminders();

      // Schedule new reminder
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time for your daily reflection 📝",
          body: "Take a moment to journal about your day. How are you feeling?",
          data: { screen: 'Journal', action: 'newEntry' },
          sound: true,
        },
        trigger: {
          hour: settings.hour,
          minute: settings.minute,
          repeats: true,
        },
      });

      // Save settings
      await this.saveReminderSettings({
        enabled: true,
        hour: settings.hour,
        minute: settings.minute,
        notificationId: identifier
      });

      return identifier;
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      throw error;
    }
  },

  /**
   * Cancel all scheduled reminders
   */
  async cancelAllReminders() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      // Update settings
      const settings = await this.getReminderSettings();
      if (settings) {
        await this.saveReminderSettings({
          ...settings,
          enabled: false,
          notificationId: null
        });
      }
    } catch (error) {
      console.error('Error canceling reminders:', error);
    }
  },

  /**
   * Get reminder settings
   */
  async getReminderSettings() {
    try {
      const settings = await AsyncStorage.getItem(REMINDER_SETTINGS_KEY);
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Error getting reminder settings:', error);
      return null;
    }
  },

  /**
   * Save reminder settings
   */
  async saveReminderSettings(settings) {
    try {
      await AsyncStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving reminder settings:', error);
    }
  },

  /**
   * Schedule a motivational notification
   */
  async scheduleMotivationalNotification(delayMinutes = 60) {
    try {
      const messages = [
        "Remember: Every journal entry is a step towards self-understanding 💫",
        "Your thoughts matter. Take a moment to reflect today 🌟",
        "Writing helps process emotions. How are you feeling? 💭",
        "Self-reflection is self-care. You deserve this moment 🌸",
      ];

      const randomMessage = messages[Math.floor(Math.random() * messages.length)];

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "A gentle reminder",
          body: randomMessage,
          data: { screen: 'Journal' },
        },
        trigger: {
          seconds: delayMinutes * 60,
        },
      });
    } catch (error) {
      console.error('Error scheduling motivational notification:', error);
    }
  },

  /**
   * Add notification response listener
   */
  addNotificationResponseListener(callback) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },

  /**
   * Add notification received listener
   */
  addNotificationReceivedListener(callback) {
    return Notifications.addNotificationReceivedListener(callback);
  }
};