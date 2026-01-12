// screens/JournalScreen.js
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Animated,
  AppState,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import {
  doc,
  addDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as ScreenCapture from 'expo-screen-capture';
import NetInfo from '@react-native-community/netinfo';
import { Palette, spacing, typography, shadows, borderRadius } from '../../theme/colors';

// Import utilities
import { encryptionUtils } from '../../utils/encryption';
console.log('encryptionUtils:', encryptionUtils);
console.log('decryptEntry function:', encryptionUtils?.decryptEntry);
import { passwordUtils } from '../../utils/passwordUtils';

import { validation } from '../../utils/validation';
import { syncQueue } from '../../utils/syncQueue';
import { notificationUtils } from '../../utils/notifications';

// Import components
import ErrorBoundary from '../../components/ErrorBoundary';
import LockOverlay from '../../components/Journal/LockOverlay';
import PasswordModal from '../../components/Journal/PasswordModal';
import NewEntryModal from '../../components/Journal/NewEntryModal';
import ViewEntryModal from '../../components/Journal/ViewEntryModal';
import JournalEntryItem from '../../components/Journal/JournalEntryItem';
import SearchBar from '../../components/Journal/SearchBar';
import FilterBar from '../../components/Journal/FilterBar';
import MoodAnalytics from '../../components/Journal/MoodAnalytics';
import CrisisSupport from '../../components/Journal/CrisisSupport';
import ReminderSettings from '../../components/Journal/ReminderSettings';
import BackupSettings from '../../components/Journal/BackupSettings';

// Security constants
const AUTO_LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const BACKGROUND_LOCK_TIMEOUT = 30 * 1000; // 30 seconds

function JournalScreenContent() {
  // -------------------------------------------------------------------------
  // State Variables
  // -------------------------------------------------------------------------
  const [journalEntries, setJournalEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [journalLocked, setJournalLocked] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordModalType, setPasswordModalType] = useState('UNLOCK_JOURNAL');
  const [password, setPassword] = useState('');
  const [showBackupSettings, setShowBackupSettings] = useState(false);
  const [biometricSettings, setBiometricSettings] = useState({
    isAvailable: false,
    types: [],
    isEnabled: false,
    isChecking: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // New feature states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState(null);
  const [filterDateRange, setFilterDateRange] = useState(null);
  const [activeTab, setActiveTab] = useState('entries'); // 'entries' | 'insights'
  const [showCrisisSupport, setShowCrisisSupport] = useState(false);
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Security state
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [appState, setAppState] = useState(AppState.currentState);
  
  // Refs
  const activityTimeoutRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // -------------------------------------------------------------------------
  // Filtered and Sorted Entries
  // -------------------------------------------------------------------------
  const filteredEntries = useMemo(() => {
    let entries = [...journalEntries];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      entries = entries.filter(
        (entry) =>
          entry.title?.toLowerCase().includes(query) ||
          entry.content?.toLowerCase().includes(query)
      );
    }

    // Apply mood filter
    if (filterMood) {
      entries = entries.filter((entry) => entry.mood === filterMood);
    }

    // Apply date range filter
    if (filterDateRange) {
      const now = new Date();
      let startDate;

      switch (filterDateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3months':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        entries = entries.filter((entry) => new Date(entry.date) >= startDate);
      }
    }

    // Sort by date (newest first)
    return entries.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [journalEntries, searchQuery, filterMood, filterDateRange]);

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------
  
  // Initial load
  useEffect(() => {
    const initializeApp = async () => {
      await loadSecuritySettings();
      await loadJournalEntries();
      await checkPendingSync();
      setupNotificationListeners();
    };

    initializeApp();
  }, []);

  // Network status monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected);
      if (state.isConnected) {
        syncQueue.processQueue();
        checkPendingSync();
      }
    });

    return () => unsubscribe();
  }, []);

  // Auto-lock timer
  useEffect(() => {
    const checkInactivity = () => {
      const now = Date.now();
      if (
        now - lastActivityTime > AUTO_LOCK_TIMEOUT &&
        !journalLocked &&
        hasPassword
      ) {
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
      if (
        appState.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
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

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

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

  // Crisis support check
  useEffect(() => {
    checkForCrisisIndicators();
  }, [journalEntries]);

  // -------------------------------------------------------------------------
  // Helper Functions
  // -------------------------------------------------------------------------

  const setupNotificationListeners = () => {
    const subscription = notificationUtils.addNotificationResponseListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.action === 'newEntry') {
          setShowNewEntry(true);
        }
      }
    );

    return () => subscription.remove();
  };

  const checkPendingSync = async () => {
    const count = await syncQueue.getPendingCount();
    setPendingSyncCount(count);
  };

  const checkForCrisisIndicators = () => {
    if (journalEntries.length === 0) return;

    const recentEntries = journalEntries.filter((e) => {
      const entryDate = new Date(e.date);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return entryDate >= sevenDaysAgo;
    });

    const negativeMoods = ['sad', 'anxious', 'angry'];
    const negativeCount = recentEntries.filter((e) =>
      negativeMoods.includes(e.mood)
    ).length;

    if (negativeCount >= 5 && recentEntries.length >= 5) {
      // Show crisis support after a delay to not be intrusive
      setTimeout(() => {
        setShowCrisisSupport(true);
      }, 2000);
    }
  };

  const trackActivity = useCallback(() => {
    setLastActivityTime(Date.now());
  }, []);

  // -------------------------------------------------------------------------
  // Security Functions
  // -------------------------------------------------------------------------

  const loadSecuritySettings = async () => {
    try {
      const storedPasswordHash = await SecureStore.getItemAsync('journalPassword');
      const biometricEnabled = await SecureStore.getItemAsync('biometricEnabled');

      if (storedPasswordHash) {
        setJournalLocked(true);
        setHasPassword(true);

        setBiometricSettings((prev) => ({ ...prev, isChecking: true }));
        const biometricInfo = await checkBiometrics();
        setBiometricSettings({
          ...biometricInfo,
          isEnabled: biometricEnabled === 'true',
          isChecking: false,
        });

        if (biometricEnabled === 'true' && biometricInfo.isAvailable) {
          await authenticateWithBiometrics();
        }
      } else {
        setHasPassword(false);
        setBiometricSettings((prev) => ({ ...prev, isChecking: false }));
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
      setBiometricSettings((prev) => ({ ...prev, isChecking: false }));
    }
  };

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

      const authTypes = supportedTypes
        .map((type) => {
          switch (type) {
            case LocalAuthentication.AuthenticationType.FINGERPRINT:
              return 'fingerprint';
            case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
              return 'face';
            default:
              return 'unknown';
          }
        })
        .filter(Boolean);

      return {
        isAvailable: hasBiometrics && isEnrolled,
        types: authTypes,
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
          [
            {
              text: 'OK',
              onPress: () => {
                setPasswordModalType('UNLOCK_JOURNAL');
                setPasswordModalVisible(true);
              },
            },
          ]
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
        [
          {
            text: 'OK',
            onPress: () => {
              setPasswordModalType('UNLOCK_JOURNAL');
              setPasswordModalVisible(true);
            },
          },
        ]
      );
    }
  };

  // -------------------------------------------------------------------------
  // Password Functions
  // -------------------------------------------------------------------------

  const unlockJournal = async () => {
    try {
      const storedHash = await SecureStore.getItemAsync('journalPassword');
      const isValid = await passwordUtils.verifyPassword(password, storedHash);

      if (isValid) {
        setJournalLocked(false);
        setPasswordModalVisible(false);
        setPassword('');
        trackActivity();
        Alert.alert('Unlocked', 'Your journal is now unlocked.');
      } else {
        Alert.alert('Incorrect Password', 'Please try again.');
      }
    } catch (error) {
      console.error('Error unlocking journal:', error);
      Alert.alert('Error', 'Could not unlock the journal. Please try again.');
    }
  };

  const setJournalPassword = async () => {
    const validationResult = passwordUtils.validatePassword(password);
    if (!validationResult.isValid) {
      Alert.alert(
        'Weak Password',
        `Password requirements:\n${validationResult.errors.join('\n')}`
      );
      return;
    }

    try {
      const hashedPassword = await passwordUtils.hashPassword(password);
      await SecureStore.setItemAsync('journalPassword', hashedPassword);
      setJournalLocked(true);
      setHasPassword(true);
      setPassword('');
      setPasswordModalVisible(false);
      Alert.alert('Success', 'Journal password set successfully.');
    } catch (error) {
      console.error('Error setting password:', error);
      Alert.alert('Error', 'Failed to set password. Please try again.');
    }
  };

  const changeJournalPassword = async () => {
    const validationResult = passwordUtils.validatePassword(password);
    if (!validationResult.isValid) {
      Alert.alert(
        'Weak Password',
        `Password requirements:\n${validationResult.errors.join('\n')}`
      );
      return;
    }

    try {
      const hashedPassword = await passwordUtils.hashPassword(password);
      await SecureStore.setItemAsync('journalPassword', hashedPassword);
      setHasPassword(true);
      setPassword('');
      setPasswordModalVisible(false);
      Alert.alert('Success', 'Journal password updated.');
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Failed to change password. Please try again.');
    }
  };

  const removeJournalPassword = async () => {
    Alert.alert(
      'Remove Password',
      'Are you sure you want to remove the journal password? This will make your journal accessible without authentication.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync('journalPassword');
              await SecureStore.deleteItemAsync('biometricEnabled');
              setJournalLocked(false);
              setHasPassword(false);
              setBiometricSettings((prev) => ({ ...prev, isEnabled: false }));
              Alert.alert('Success', 'Journal password removed.');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove password. Please try again.');
            }
          },
        },
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

  const handleToggleBiometric = async () => {
    if (biometricSettings.isAvailable) {
      const newValue = !biometricSettings.isEnabled;
      await SecureStore.setItemAsync('biometricEnabled', String(newValue));
      setBiometricSettings((prev) => ({
        ...prev,
        isEnabled: newValue,
      }));
      Alert.alert(
        newValue ? 'Biometric Enabled' : 'Biometric Disabled',
        newValue
          ? 'You can now unlock your journal with biometrics'
          : 'Journal will require password to unlock'
      );
    } else {
      Alert.alert(
        'Not Available',
        'Biometric authentication is not available on this device'
      );
    }
  };

  // -------------------------------------------------------------------------
  // Data Loading Functions
  // -------------------------------------------------------------------------

  const loadJournalEntries = async () => {
    try {
      setIsLoading(true);

      // Load from local storage first
      const localEntries = await AsyncStorage.getItem('journalEntries');
      let parsedLocalEntries = [];

      if (localEntries) {
        parsedLocalEntries = JSON.parse(localEntries);
        // Decrypt entries
        const decryptedEntries = await Promise.all(
          parsedLocalEntries.map((entry) =>
            entry.encrypted ? encryptionUtils.decryptEntry(entry) : entry
          )
        );
        setJournalEntries(decryptedEntries);
      }

      // Try to sync with Firebase if online and authenticated
      const auth = getAuth();
      if (auth.currentUser && isOnline) {
        const q = query(
          collection(db, 'journals'),
          where('userId', '==', auth.currentUser.uid)
        );
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
              date: dateValue,
            };

            return entry.encrypted
              ? await encryptionUtils.decryptEntry(entry)
              : entry;
          })
        );

        // Merge entries
        const mergedEntries = [...firebaseEntries, ...parsedLocalEntries]
          .filter(
            (entry, index, self) =>
              index === self.findIndex((e) => e.id === entry.id)
          )
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        setJournalEntries(mergedEntries);

        // Save merged entries locally (encrypted)
        const encryptedForStorage = await Promise.all(
          mergedEntries.map((entry) => encryptionUtils.encryptEntry(entry))
        );
        await AsyncStorage.setItem(
          'journalEntries',
          JSON.stringify(encryptedForStorage)
        );
      }
    } catch (error) {
      console.error('Error loading entries:', error);
      Alert.alert('Error', 'Failed to load journal entries.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadJournalEntries();
    await checkPendingSync();
  };

  // -------------------------------------------------------------------------
  // Entry Actions
  // -------------------------------------------------------------------------

  const openEntry = useCallback(
    (entry) => {
      trackActivity();
      setSelectedEntry(entry);
    },
    [trackActivity]
  );

  const renderEntryItem = useCallback(
    ({ item }) => (
      <JournalEntryItem entry={item} onPress={() => openEntry(item)} />
    ),
    [openEntry]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  // -------------------------------------------------------------------------
  // Render Functions
  // -------------------------------------------------------------------------

  const renderLockedOverlay = () => {
    if (biometricSettings.isChecking) {
      return <LockOverlay checkingSecurity={true} message="Checking security..." />;
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

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Title Row */}
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.title}>My Journal</Text>
          <Text style={styles.subtitle}>
            A space for your thoughts and reflections
          </Text>
        </View>
        <TouchableOpacity
          style={styles.newEntryButton}
          onPress={() => {
            trackActivity();
            setShowNewEntry(true);
          }}
          disabled={journalLocked}
        >
          <MaterialCommunityIcons name="plus" size={24} color={Palette.white} />
        </TouchableOpacity>
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        {!isOnline && (
          <View style={styles.offlineIndicator}>
            <MaterialCommunityIcons
              name="cloud-off-outline"
              size={16}
              color={Palette.secondaryOrange}
            />
            <Text style={styles.offlineText}>Offline</Text>
          </View>
        )}
        {pendingSyncCount > 0 && (
          <View style={styles.syncIndicator}>
            <MaterialCommunityIcons
              name="sync"
              size={16}
              color={Palette.secondaryBlue}
            />
            <Text style={styles.syncText}>{pendingSyncCount} pending</Text>
          </View>
        )}
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'entries' && styles.tabActive]}
          onPress={() => setActiveTab('entries')}
        >
          <MaterialCommunityIcons
            name="notebook-outline"
            size={20}
            color={activeTab === 'entries' ? Palette.primary : Palette.textLight}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'entries' && styles.tabTextActive,
            ]}
          >
            Entries
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'insights' && styles.tabActive]}
          onPress={() => setActiveTab('insights')}
        >
          <MaterialCommunityIcons
            name="chart-line"
            size={20}
            color={activeTab === 'insights' ? Palette.primary : Palette.textLight}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'insights' && styles.tabTextActive,
            ]}
          >
            Insights
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {!hasPassword ? (
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              setPasswordModalType('SET_PASSWORD');
              setPasswordModalVisible(true);
            }}
          >
            <MaterialCommunityIcons
              name="lock-open"
              size={18}
              color={Palette.white}
            />
            <Text style={styles.quickActionText}>Set Password</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              setPasswordModalType('CHANGE_PASSWORD');
              setPasswordModalVisible(true);
            }}
          >
            <MaterialCommunityIcons
              name="lock-reset"
              size={18}
              color={Palette.white}
            />
            <Text style={styles.quickActionText}>Security</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setShowReminderSettings(true)}
        >
          <MaterialCommunityIcons name="bell-outline" size={18} color={Palette.white} />
          <Text style={styles.quickActionText}>Reminders</Text>
        </TouchableOpacity>

        <TouchableOpacity
  style={[styles.quickActionButton, { backgroundColor: Palette.secondaryBlue }]}
  onPress={() => setShowBackupSettings(true)}
>
  <MaterialCommunityIcons name="cloud-sync" size={18} color={Palette.white} />
  <Text style={styles.quickActionText}>Backup</Text>
</TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionButton, styles.crisisButton]}
          onPress={() => setShowCrisisSupport(true)}
        >
          <MaterialCommunityIcons name="heart-outline" size={18} color={Palette.white} />
          <Text style={styles.quickActionText}>Get Help</Text>
        </TouchableOpacity>
      </View>

      {/* Search & Filter (only for entries tab) */}
      {activeTab === 'entries' && (
        <>
          <SearchBar
            onSearch={setSearchQuery}
            placeholder="Search your entries..."
          />
          <FilterBar
            selectedMood={filterMood}
            onMoodChange={setFilterMood}
            selectedDateRange={filterDateRange}
            onDateRangeChange={setFilterDateRange}
          />
        </>
      )}
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="notebook-outline"
        size={64}
        color={Palette.textLight}
      />
      <Text style={styles.emptyTitle}>No entries yet</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || filterMood || filterDateRange
          ? 'No entries match your filters'
          : 'Start journaling to track your thoughts and moods'}
      </Text>
      {!searchQuery && !filterMood && !filterDateRange && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => setShowNewEntry(true)}
        >
          <Text style={styles.emptyButtonText}>Write Your First Entry</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // -------------------------------------------------------------------------
  // Main Render
  // -------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      {journalLocked && renderLockedOverlay()}

      {!journalLocked && (
        <>
          {activeTab === 'entries' ? (
            <FlatList
              data={filteredEntries}
              renderItem={renderEntryItem}
              keyExtractor={keyExtractor}
              ListHeaderComponent={renderHeader}
              ListEmptyComponent={renderEmptyList}
              contentContainerStyle={styles.listContent}
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              initialNumToRender={10}
              maxToRenderPerBatch={5}
              windowSize={5}
              removeClippedSubviews={true}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <>
              {renderHeader()}
              <MoodAnalytics entries={journalEntries} />
            </>
          )}
        </>
      )}

      {/* Modals */}
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
        syncQueue={syncQueue}
        isOnline={isOnline}
      />

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
        syncQueue={syncQueue}
        isOnline={isOnline}
      />

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

      <CrisisSupport
        visible={showCrisisSupport}
        onClose={() => setShowCrisisSupport(false)}
      />

      <ReminderSettings
        visible={showReminderSettings}
        onClose={() => setShowReminderSettings(false)}
      />

      <BackupSettings
  visible={showBackupSettings}
  onClose={() => setShowBackupSettings(false)}
  journalEntries={journalEntries}
  setJournalEntries={setJournalEntries}
  onRefresh={handleRefresh}
/>
    </SafeAreaView>
  );
}

// Wrap with Error Boundary
export default function JournalScreen() {
  return (
    <ErrorBoundary>
      <JournalScreenContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  headerContainer: {
    paddingTop: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.h1.fontSize,
    fontWeight: typography.h1.fontWeight,
    color: Palette.textDark,
  },
  subtitle: {
    fontSize: typography.caption.fontSize,
    color: Palette.textLight,
    marginTop: spacing.xs,
  },
  newEntryButton: {
    backgroundColor: Palette.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
  },
  statusBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.secondaryOrange + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  offlineText: {
    fontSize: typography.small.fontSize,
    color: Palette.secondaryOrange,
    marginLeft: spacing.xs,
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.secondaryBlue + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  syncText: {
    fontSize: typography.small.fontSize,
    color: Palette.secondaryBlue,
    marginLeft: spacing.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: Palette.card,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  tabActive: {
    backgroundColor: Palette.primary + '15',
  },
  tabText: {
    fontSize: typography.body.fontSize,
    color: Palette.textLight,
    marginLeft: spacing.xs,
  },
  tabTextActive: {
    color: Palette.primary,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.secondaryPurple,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  quickActionText: {
    color: Palette.white,
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
  crisisButton: {
    backgroundColor: Palette.secondaryRed,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: Palette.textDark,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.body.fontSize,
    color: Palette.textLight,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emptyButton: {
    backgroundColor: Palette.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    marginTop: spacing.lg,
  },
  emptyButtonText: {
    color: Palette.white,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
});