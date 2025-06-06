import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { getAuth } from 'firebase/auth';

const SettingsScreen = () => {
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

  const SettingsItem = ({ icon, title, value, onPress, type = 'switch' }) => (
    <TouchableOpacity
      style={styles.settingsItem}
      onPress={onPress}
      disabled={type === 'switch'}
    >
      <View style={styles.settingsItemLeft}>
        <MaterialCommunityIcons name={icon} size={24} color="#6C63FF" />
        <Text style={styles.settingsItemText}>{title}</Text>
      </View>
      {type === 'switch' ? (
        <Switch
          value={value}
          onValueChange={onPress}
          trackColor={{ false: '#767577', true: '#6C63FF' }}
          thumbColor={value ? '#fff' : '#f4f3f4'}
        />
      ) : (
        <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
      )}
    </TouchableOpacity>
  );

  const handleNotificationToggle = async (value) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive updates.'
        );
        return;
      }
    }
    setNotifications(value);
    await AsyncStorage.setItem('notifications', value.toString());
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the app cache? This will sign you out.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              await auth.signOut();
            } catch (error) {
              console.error('Error clearing cache:', error);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await user.delete();
            } catch (error) {
              console.error('Error deleting account:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <SettingsItem
          icon="account"
          title="Edit Profile"
          type="link"
          onPress={() => {/* Navigate to profile edit screen */}}
        />
        <SettingsItem
          icon="lock"
          title="Change Password"
          type="link"
          onPress={() => {/* Navigate to password change screen */}}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <SettingsItem
          icon="bell"
          title="Push Notifications"
          value={notifications}
          onPress={handleNotificationToggle}
        />
        <SettingsItem
          icon="email"
          title="Email Notifications"
          value={emailNotifications}
          onPress={setEmailNotifications}
        />
        <SettingsItem
          icon="theme-light-dark"
          title="Dark Mode"
          value={darkMode}
          onPress={setDarkMode}
        />
        <SettingsItem
          icon="play-circle"
          title="Auto-play Videos"
          value={autoPlay}
          onPress={setAutoPlay}
        />
        <SettingsItem
          icon="data-matrix"
          title="Data Saver"
          value={dataSaver}
          onPress={setDataSaver}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage</Text>
        <SettingsItem
          icon="cached"
          title="Clear Cache"
          type="link"
          onPress={handleClearCache}
        />
        <SettingsItem
          icon="download"
          title="Download Settings"
          type="link"
          onPress={() => {/* Navigate to download settings */}}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <SettingsItem
          icon="help-circle"
          title="Help Center"
          type="link"
          onPress={() => {/* Navigate to help center */}}
        />
        <SettingsItem
          icon="file-document"
          title="Terms of Service"
          type="link"
          onPress={() => {/* Navigate to terms */}}
        />
        <SettingsItem
          icon="shield"
          title="Privacy Policy"
          type="link"
          onPress={() => {/* Navigate to privacy policy */}}
        />
      </View>

      <TouchableOpacity
        style={styles.deleteAccount}
        onPress={handleDeleteAccount}
      >
        <Text style={styles.deleteAccountText}>Delete Account</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#fff',
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 15,
    marginBottom: 10,
    marginTop: 5,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsItemText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  deleteAccount: {
    padding: 15,
    alignItems: 'center',
    marginVertical: 20,
  },
  deleteAccountText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
});

export default SettingsScreen;