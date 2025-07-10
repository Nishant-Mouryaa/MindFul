import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView,
  Alert, Animated, ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, addDoc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication'; 
import { Palette, spacing, typography, shadows, borderRadius } from '../../theme/colors';

import LockOverlay from '../../components/Journal/LockOverlay';
import PasswordModal from '../../components/Journal/PasswordModal';
import NewEntryModal from '../../components/Journal/NewEntryModal';
import ViewEntryModal from '../../components/Journal/ViewEntryModal';
import JournalEntryList from '../../components/Journal/JournalEntryList';

export default function JournalScreen() {
  // All the state variables for controlling modals and data
  const [journalEntries, setJournalEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const [showNewEntry, setShowNewEntry] = useState(false);

  // Privacy/password state
  const [journalLocked, setJournalLocked] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordModalType, setPasswordModalType] = useState('UNLOCK_JOURNAL');
  const [password, setPassword] = useState('');
  
  // Biometric
  const [biometricSettings, setBiometricSettings] = useState({
    isAvailable: false,
    types: [],
    isEnabled: false,
    isChecking: true
  });

  // For handling shared loading states (e.g. for PDF generation, etc.)
  const [isLoading, setIsLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const loadAppData = async () => {
      try {
        const storedPassword = await SecureStore.getItemAsync('journalPassword');
        const biometricEnabled = await SecureStore.getItemAsync('biometricEnabled');
        
        if (storedPassword) {
          setJournalLocked(true);
          setHasPassword(true);
          
          // Check biometrics
          setBiometricSettings(prev => ({...prev, isChecking: true}));
          const biometricInfo = await checkBiometrics();
          setBiometricSettings({
            ...biometricInfo,
            isEnabled: biometricEnabled === 'true',
            isChecking: false
          });
          
          if (biometricEnabled === 'true' && biometricInfo.isAvailable) {
            await authenticateWithBiometrics();
          }
        } else {
          setHasPassword(false);
          setBiometricSettings(prev => ({...prev, isChecking: false}));
        }
      } catch (error) {
        console.log('Error loading privacy settings:', error);
        setBiometricSettings(prev => ({...prev, isChecking: false}));
      }
      await loadJournalEntries();
    };
    
    loadAppData();
  }, []);

  useEffect(() => {
    Animated.stagger(100,
      journalEntries.map(() =>
        Animated.spring(fadeAnim, {
          toValue: 1,
          useNativeDriver: true,
        })
      )
    ).start();
  }, [journalEntries, fadeAnim]);

  // ---------------------------------------------------------------------------
  // Biometrics
  // ---------------------------------------------------------------------------
  const checkBiometrics = async () => {
    try {
      const hasBiometrics = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      let supportedTypes = [];
      try {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        supportedTypes = Array.isArray(types) ? types : [];
      } catch (error) {
        supportedTypes = [];
      }
      
      const authTypes = supportedTypes.map(type => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return 'fingerprint';
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return 'face';
          default:
            return 'unknown';
        }
      }).filter(Boolean);
      
      return {
        isAvailable: hasBiometrics && isEnrolled,
        types: authTypes
      };
    } catch (error) {
      console.error('Biometric check failed:', error);
      return { isAvailable: false, types: [] };
    }
  };

  const authenticateWithBiometrics = async () => {
    try {
      const biometricInfo = await checkBiometrics();
      if (!biometricInfo.isAvailable) {
        Alert.alert(
          'Biometrics Unavailable',
          'Biometric authentication is no longer available. Please use your password.',
          [{ text: 'OK', onPress: () => {
            setPasswordModalType('UNLOCK_JOURNAL');
            setPasswordModalVisible(true);
          }}]
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to unlock your journal',
        fallbackLabel: 'Enter Password',
        disableDeviceFallback: false,
      });
      if (result.success) {
        setJournalLocked(false);
        setPasswordModalVisible(false);
      } else {
        setPasswordModalType('UNLOCK_JOURNAL');
        setPasswordModalVisible(true);
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      Alert.alert(
        'Authentication Error',
        'Could not authenticate. Please use your password.',
        [{ text: 'OK', onPress: () => {
          setPasswordModalType('UNLOCK_JOURNAL');
          setPasswordModalVisible(true);
        }}]
      );
    }
  };

  // ---------------------------------------------------------------------------
  // Loading Entries Functions
  // ---------------------------------------------------------------------------
  const loadJournalEntries = async () => {
    try {
      const localEntries = await AsyncStorage.getItem('journalEntries');
      let parsedLocalEntries = [];
      if (localEntries) {
        parsedLocalEntries = JSON.parse(localEntries);
        setJournalEntries(parsedLocalEntries);
      }
      
      const auth = getAuth();
      if (auth.currentUser) {
        const q = query(collection(db, "journals"), where("userId", "==", auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        const firebaseEntries = querySnapshot.docs.map(docItem => {
          const data = docItem.data();
          let dateValue;
          if (data.date && typeof data.date.toDate === 'function') {
            dateValue = data.date.toDate().toISOString();
          } else if (data.date) {
            dateValue = data.date;
          } else {
            dateValue = new Date().toISOString();
          }
          return {
            id: docItem.id,
            ...data,
            date: dateValue
          };
        });
        
        // Merge local and Firebase entries, removing duplicates
        const mergedEntries = [
          ...firebaseEntries, 
          ...parsedLocalEntries
        ].filter((entry, index, self) => 
            index === self.findIndex(e => e.id === entry.id)
          )
         .sort((a,b) => new Date(b.date) - new Date(a.date));
        
        setJournalEntries(mergedEntries);
        await AsyncStorage.setItem('journalEntries', JSON.stringify(mergedEntries));
      }
    } catch (error) {
      console.error("Error loading entries:", error);
    }
  };

  // ---------------------------------------------------------------------------
  // Password & Lock
  // ---------------------------------------------------------------------------
  const unlockJournal = async () => {
    try {
      const storedPassword = await SecureStore.getItemAsync('journalPassword');
      if (password === storedPassword) {
        setJournalLocked(false);
        setPasswordModalVisible(false);
        setPassword('');
        Alert.alert('Unlocked', 'Your journal is now unlocked.');
      } else {
        Alert.alert('Incorrect Password', 'Please try again.');
      }
    } catch (error) {
      console.log('Error unlocking journal:', error);
      Alert.alert('Error', 'Could not unlock the journal. Please try again.');
    }
  };

  function validatePassword(password) {
    // Correct regex pattern:
    // At least 6 characters, with at least one digit and one special character
    const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{6,}$/;
    return regex.test(password);
  }
  

  const setJournalPassword = async () => {
    if (!validatePassword(password)) {
      Alert.alert(
        'Weak Password',
        'Password must be at least 6 characters long and include a number and special character.'
        );      return;
    }
    try {
      await SecureStore.setItemAsync('journalPassword', password);
      setJournalLocked(true);
      setHasPassword(true);
      setPassword('');
      setPasswordModalVisible(false);
      Alert.alert('Success', 'Journal password set successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to set password. Please try again.');
    }
  };

  const changeJournalPassword = async () => {
    if (!validatePassword(password)) {
      Alert.alert(
        'Weak Password',
        'Password must be at least 6 characters long and include a number and special character.'
        );
      return;
    }
    try {
      await SecureStore.setItemAsync('journalPassword', password);
      setHasPassword(true);
      setPassword('');
      setPasswordModalVisible(false);
      Alert.alert('Success', 'Journal password updated.');
    } catch (error) {
      Alert.alert('Error', 'Failed to change password. Please try again.');
    }
  };

  const removeJournalPassword = async () => {
    try {
      await SecureStore.deleteItemAsync('journalPassword');
      setJournalLocked(false);
      setHasPassword(false);
      Alert.alert('Success', 'Journal password removed.');
    } catch (error) {
      Alert.alert('Error', 'Failed to remove password. Please try again.');
    }
  };

  const onPasswordModalConfirm = () => {
    switch (passwordModalType) {
      case 'UNLOCK_JOURNAL':
        unlockJournal();
        break;
      case 'SET_PASSWORD':
        setJournalPassword();
        break;
      case 'CHANGE_PASSWORD':
        changeJournalPassword();
        break;
      default:
        break;
    }
  };

  // ---------------------------------------------------------------------------
  // Handlers for toggling biometric
  // ---------------------------------------------------------------------------
  const handleToggleBiometric = async () => {
    if (biometricSettings.isAvailable) {
      const newValue = !biometricSettings.isEnabled;
      await SecureStore.setItemAsync('biometricEnabled', String(newValue));
      setBiometricSettings(prev => ({
        ...prev,
        isEnabled: newValue
      }));
      Alert.alert(
        newValue ? 'Biometric Enabled' : 'Biometric Disabled',
        newValue 
          ? 'You can now unlock your journal with biometrics' 
          : 'Journal will require password to unlock'
      );
    } else {
      Alert.alert('Not Available', 'Biometric authentication is not available on this device');
    }
  };

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  const renderLockedOverlay = () => {
    if (biometricSettings.isChecking) {
      return (
        <LockOverlay 
          checkingSecurity={true} 
          message="Checking security..." 
        />
      );
    }
    return (
      <LockOverlay
        checkingSecurity={false}
        isEnabled={biometricSettings.isEnabled}
        isAvailable={biometricSettings.isAvailable}
        types={biometricSettings.types}
        onPressBiometric={authenticateWithBiometrics}
        onPressPassword={() => {
          setPasswordModalType('UNLOCK_JOURNAL');
          setPasswordModalVisible(true);
        }}
      />
    );
  };

  const openEntry = (entry) => {
    setSelectedEntry(entry);
  };

  return (
    <SafeAreaView style={styles.container}>
      {journalLocked && renderLockedOverlay()}

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>My Journal</Text>
          <TouchableOpacity 
            style={styles.newEntryHeaderButton}
            onPress={() => setShowNewEntry(true)}
            disabled={journalLocked}
          >
            <MaterialCommunityIcons name="plus" size={24} color={Palette.white} />
            <Text style={styles.newEntryHeaderButtonText}>New</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>A space for your thoughts, feelings, and reflections.</Text>
        
        {/* PRIVACY BUTTONS */}
      
<ScrollView 
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.privacyContainer}
>
  {!hasPassword ? (
    <TouchableOpacity 
      style={styles.privacyButton}
      onPress={() => {
        setPasswordModalType('SET_PASSWORD');
        setPasswordModalVisible(true);
      }}
    >
      <MaterialCommunityIcons name="lock-open" size={20} color={Palette.white} />
      <Text style={styles.privacyButtonText}>Set Password</Text>
    </TouchableOpacity>
  ) : (
    <>
      <TouchableOpacity 
        style={styles.privacyButton}
        onPress={() => {
          setPasswordModalType('CHANGE_PASSWORD');
          setPasswordModalVisible(true);
        }}
      >
        <MaterialCommunityIcons name="lock-reset" size={20} color={Palette.white} />
        <Text style={styles.privacyButtonText}>Change Password</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.privacyButton}
        onPress={handleToggleBiometric}
      >
        <MaterialCommunityIcons 
          name={biometricSettings.isEnabled ? 'fingerprint-off' : 'fingerprint'} 
          size={20} 
          color={Palette.white} 
        />
        <Text style={styles.privacyButtonText}>
          {biometricSettings.isEnabled ? 'Disable Biometric' : 'Enable Biometric'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.privacyButton}
        onPress={removeJournalPassword}
      >
        <MaterialCommunityIcons name="lock" size={20} color={Palette.white} />
        <Text style={styles.privacyButtonText}>Remove Password</Text>
      </TouchableOpacity>
    </>
  )}
</ScrollView>
      </View>
      
      {/* JOURNAL ENTRIES LIST */}
      {!journalLocked && (
        <JournalEntryList 
          fadeAnim={fadeAnim}
          journalEntries={journalEntries}
          onOpenEntry={openEntry}
        />
      )}

      {/* NEW ENTRY MODAL */}
      <NewEntryModal
        visible={showNewEntry}
        onClose={() => setShowNewEntry(false)}
        journalEntries={journalEntries}
        setJournalEntries={setJournalEntries}
      />

      {/* VIEW ENTRY MODAL */}
      <ViewEntryModal
        entry={selectedEntry}
        isLoading={isLoading}
        onClose={() => setSelectedEntry(null)}
        onLoadingChange={setIsLoading}
        journalEntries={journalEntries}
        setJournalEntries={setJournalEntries}
      />

      {/* PASSWORD MODAL */}
      <PasswordModal
        visible={passwordModalVisible}
        password={password}
        setPassword={setPassword}
        modalType={passwordModalType}
        isEnabled={biometricSettings.isEnabled}
        isChecking={biometricSettings.isChecking}
        onClose={() => {
          setPasswordModalVisible(false);
          setPassword('');
        }}
        onConfirm={onPasswordModalConfirm}
        onBiometricPress={authenticateWithBiometrics}
        biometricTypes={biometricSettings.types}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  // Lock Overlay is replaced by LockOverlay.js
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.h1.fontSize,
    fontWeight: typography.h1.fontWeight,
    color: Palette.textDark,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    color: Palette.textLight,
    marginTop: spacing.xs,
  },
  newEntryHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.secondaryBlue,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    ...shadows.low,
  },
  newEntryHeaderButtonText: {
    color: Palette.white,
    fontSize: typography.body.fontSize,
    fontWeight: typography.h3.fontWeight,
    marginLeft: spacing.xs,
  },
  privacyContainer: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.secondaryPurple,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm, // Only right margin now
    minWidth: 150, // Set a minimum width for buttons
    ...shadows.low,
  },
  privacyButtonText: {
    color: Palette.white,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.h3.fontWeight,
    marginLeft: spacing.sm,
  },
});
