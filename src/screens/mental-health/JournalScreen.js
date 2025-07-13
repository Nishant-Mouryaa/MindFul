import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView,
  Alert, Animated, ActivityIndicator, AppState
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, addDoc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as ScreenCapture from 'expo-screen-capture';
import { Palette, spacing, typography, shadows, borderRadius } from '../../theme/colors';

// Import utilities
import { encryptionUtils } from '../../utils/encryption';
import { passwordUtils } from '../../utils/passwordUtils';

// Import components
import LockOverlay from '../../components/Journal/LockOverlay';
import PasswordModal from '../../components/Journal/PasswordModal';
import NewEntryModal from '../../components/Journal/NewEntryModal';
import ViewEntryModal from '../../components/Journal/ViewEntryModal';
import JournalEntryList from '../../components/Journal/JournalEntryList';

export default function JournalScreen() {
  // Existing state variables
  const [journalEntries, setJournalEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [journalLocked, setJournalLocked] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordModalType, setPasswordModalType] = useState('UNLOCK_JOURNAL');
  const [password, setPassword] = useState('');
  const [biometricSettings, setBiometricSettings] = useState({
    isAvailable: false,
    types: [],
    isEnabled: false,
    isChecking: true
  });
  const [resetEmailModalVisible, setResetEmailModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // New security state variables
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [appState, setAppState] = useState(AppState.currentState);
  const activityTimeoutRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Security constants
  const AUTO_LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  const BACKGROUND_LOCK_TIMEOUT = 30 * 1000; // 30 seconds

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

  // Auto-lock timer
  useEffect(() => {
    const checkInactivity = () => {
      const now = Date.now();
      if (now - lastActivityTime > AUTO_LOCK_TIMEOUT && !journalLocked && hasPassword) {
        setJournalLocked(true);
        Alert.alert('Session Expired', 'Journal locked due to inactivity');
      }
    };

    activityTimeoutRef.current = setInterval(checkInactivity, 30000);

    return () => {
      if (activityTimeoutRef.current) {
        clearInterval(activityTimeoutRef.current);
      }
    };
  }, [lastActivityTime, journalLocked, hasPassword]);

  // App state handler for background locking
  useEffect(() => {
    let backgroundTime = null;

    const handleAppStateChange = (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        if (backgroundTime && hasPassword) {
          const backgroundDuration = Date.now() - backgroundTime;
          if (backgroundDuration > BACKGROUND_LOCK_TIMEOUT) {
            setJournalLocked(true);
          }
        }
        backgroundTime = null;
      } else if (nextAppState.match(/inactive|background/)) {
        backgroundTime = Date.now();
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [appState, hasPassword]);

  // Screenshot prevention
  useEffect(() => {
    const preventScreenshots = async () => {
      if (!journalLocked && hasPassword) {
        await ScreenCapture.preventScreenCaptureAsync();
      } else {
        await ScreenCapture.allowScreenCaptureAsync();
      }
    };

    preventScreenshots();

    return () => {
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, [journalLocked, hasPassword]);

  // Animation effect
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
  // Activity Tracking
  // ---------------------------------------------------------------------------
  const trackActivity = () => {
    setLastActivityTime(Date.now());
  };

  const ActivityTracker = ({ children, onPress, ...props }) => {
    return (
      <TouchableOpacity
        onPress={() => {
          trackActivity();
          if (onPress) onPress();
        }}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  };

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
        trackActivity();
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
  // Loading Entries with Encryption
  // ---------------------------------------------------------------------------
  const loadJournalEntries = async () => {
    try {
      const localEntries = await AsyncStorage.getItem('journalEntries');
      let parsedLocalEntries = [];
      if (localEntries) {
        parsedLocalEntries = JSON.parse(localEntries);
        // Decrypt entries
        const decryptedEntries = await Promise.all(
          parsedLocalEntries.map(entry => 
            entry.encrypted ? encryptionUtils.decryptEntry(entry) : entry
          )
        );
        setJournalEntries(decryptedEntries);
      }
      
      const auth = getAuth();
      if (auth.currentUser) {
        const q = query(collection(db, "journals"), where("userId", "==", auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        const firebaseEntries = await Promise.all(
          querySnapshot.docs.map(async (docItem) => {
            const data = docItem.data();
            let dateValue;
            if (data.date && typeof data.date.toDate === 'function') {
              dateValue = data.date.toDate().toISOString();
            } else if (data.date) {
              dateValue = data.date;
            } else {
              dateValue = new Date().toISOString();
            }
            
            const entry = {
              id: docItem.id,
              ...data,
              date: dateValue
            };
            
            // Decrypt if encrypted
            return entry.encrypted ? await encryptionUtils.decryptEntry(entry) : entry;
          })
        );
        
        const mergedEntries = [
          ...firebaseEntries, 
          ...parsedLocalEntries
        ].filter((entry, index, self) => 
            index === self.findIndex(e => e.id === entry.id)
          )
         .sort((a,b) => new Date(b.date) - new Date(a.date));
        
        setJournalEntries(mergedEntries);
        
        // Encrypt before storing locally
        const encryptedForStorage = await Promise.all(
          mergedEntries.map(entry => encryptionUtils.encryptEntry(entry))
        );
        await AsyncStorage.setItem('journalEntries', JSON.stringify(encryptedForStorage));
      }
    } catch (error) {
      console.error("Error loading entries:", error);
    }
  };

  // ---------------------------------------------------------------------------
  // Password & Lock Functions
  // ---------------------------------------------------------------------------
  const unlockJournal = async () => {
    try {
      const storedPassword = await SecureStore.getItemAsync('journalPassword');
      if (password === storedPassword) {
        setJournalLocked(false);
        setPasswordModalVisible(false);
        setPassword('');
        trackActivity();
        Alert.alert('Unlocked', 'Your journal is now unlocked.');
      } else {
        Alert.alert('Incorrect Password', 'Please try again.');
      }
    } catch (error) {
      console.log('Error unlocking journal:', error);
      Alert.alert('Error', 'Could not unlock the journal. Please try again.');
    }
  };

  const setJournalPassword = async () => {
    const validation = passwordUtils.validatePassword(password);
    if (!validation.isValid) {
      Alert.alert(
        'Weak Password',
        `Password requirements:\n${validation.errors.join('\n')}`
      );
      return;
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
    const validation = passwordUtils.validatePassword(password);
    if (!validation.isValid) {
      Alert.alert(
        'Weak Password',
        `Password requirements:\n${validation.errors.join('\n')}`
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
    Alert.alert(
      'Remove Password',
      'Are you sure you want to remove the journal password? This will make your journal accessible without authentication.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync('journalPassword');
              await SecureStore.deleteItemAsync('biometricEnabled');
              setJournalLocked(false);
              setHasPassword(false);
              setBiometricSettings(prev => ({ ...prev, isEnabled: false }));
              Alert.alert('Success', 'Journal password removed.');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove password. Please try again.');
            }
          }
        }
      ]
    );
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
  // Handlers
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

  const handleForgotPassword = () => {
    setPasswordModalVisible(false);
    setResetEmailModalVisible(true);
  };

  const sendPasswordResetEmail = async () => {
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, resetEmail);
      Alert.alert(
        'Email Sent',
        'A password reset link has been sent to your email address.'
      );
      setResetEmailModalVisible(false);
      setResetEmail('');
    } catch (error) {
      console.error('Error sending reset email:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to send password reset email. Please try again.'
      );
    }
  };

  const openEntry = (entry) => {
    trackActivity();
    setSelectedEntry(entry);
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

  return (
    <SafeAreaView style={styles.container}>
      {journalLocked && renderLockedOverlay()}

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>My Journal</Text>
          <ActivityTracker 
            style={styles.newEntryHeaderButton}
            onPress={() => setShowNewEntry(true)}
            disabled={journalLocked}
          >
            <MaterialCommunityIcons name="plus" size={24} color={Palette.white} />
            <Text style={styles.newEntryHeaderButtonText}>New</Text>
          </ActivityTracker>
        </View>
        <Text style={styles.subtitle}>A space for your thoughts, feelings, and reflections.</Text>
        
        {/* PRIVACY BUTTONS */}
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.privacyContainer}
        >
          {!hasPassword ? (
            <ActivityTracker 
              style={styles.privacyButton}
              onPress={() => {
                setPasswordModalType('SET_PASSWORD');
                setPasswordModalVisible(true);
              }}
            >
              <MaterialCommunityIcons name="lock-open" size={20} color={Palette.white} />
              <Text style={styles.privacyButtonText}>Set Password</Text>
            </ActivityTracker>
          ) : (
            <>
              <ActivityTracker 
                style={styles.privacyButton}
                onPress={() => {
                  setPasswordModalType('CHANGE_PASSWORD');
                  setPasswordModalVisible(true);
                }}
              >
                <MaterialCommunityIcons name="lock-reset" size={20} color={Palette.white} />
                <Text style={styles.privacyButtonText}>Change Password</Text>
              </ActivityTracker>

              <ActivityTracker 
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
              </ActivityTracker>

              <ActivityTracker 
                style={styles.privacyButton}
                onPress={removeJournalPassword}
              >
                <MaterialCommunityIcons name="lock" size={20} color={Palette.white} />
                <Text style={styles.privacyButtonText}>Remove Password</Text>
              </ActivityTracker>
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
          trackActivity={trackActivity}
        />
      )}

      {/* NEW ENTRY MODAL */}
      <NewEntryModal
        visible={showNewEntry}
        onClose={() => {
          trackActivity();
          setShowNewEntry(false);
        }}
        journalEntries={journalEntries}
        setJournalEntries={setJournalEntries}
        encryptionUtils={encryptionUtils}
        trackActivity={trackActivity}
      />

      {/* VIEW ENTRY MODAL */}
      <ViewEntryModal
        entry={selectedEntry}
        isLoading={isLoading}
        onClose={() => {
          trackActivity();
          setSelectedEntry(null);
        }}
        onLoadingChange={setIsLoading}
        journalEntries={journalEntries}
        setJournalEntries={setJournalEntries}
        trackActivity={trackActivity}
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
    marginRight: spacing.sm,
    minWidth: 150,
    ...shadows.low,
  },
  privacyButtonText: {
    color: Palette.white,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.h3.fontWeight,
    marginLeft: spacing.sm,
  },
});