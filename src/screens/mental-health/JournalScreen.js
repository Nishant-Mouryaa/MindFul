import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, addDoc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { Palette, spacing, typography, shadows, borderRadius } from '../../theme/colors';

export default function JournalScreen() {
  const [journalEntries, setJournalEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState('');
  const [entryTitle, setEntryTitle] = useState('');
  const [mood, setMood] = useState(null);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  
  // Whether the entire journal is locked behind a password
  const [journalLocked, setJournalLocked] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  
  // For controlling the various password modals
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordModalType, setPasswordModalType] = useState('UNLOCK_JOURNAL'); 
  // possible types: 'UNLOCK_JOURNAL', 'SET_PASSWORD', 'CHANGE_PASSWORD'
  
  // The user's typed password in a modal
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const moodOptions = [
    { label: 'Great', value: 'great', icon: 'emoticon-excited-outline', color: '#58D68D' },
    { label: 'Good', value: 'good', icon: 'emoticon-happy-outline', color: Palette.primary },
    { label: 'Neutral', value: 'neutral', icon: 'emoticon-neutral-outline', color: Palette.textLight },
    { label: 'Down', value: 'down', icon: 'emoticon-sad-outline', color: Palette.secondaryBlue },
    { label: 'Sad', value: 'sad', icon: 'emoticon-frown-outline', color: Palette.secondaryBlue },
    { label: 'Anxious', value: 'anxious', icon: 'emoticon-confused-outline', color: Palette.secondaryOrange },
    { label: 'Angry', value: 'angry', icon: 'emoticon-angry-outline', color: Palette.secondaryRed },
    { label: 'Tired', value: 'tired', icon: 'emoticon-dead-outline', color: Palette.secondaryPurple },
  ];

  const prompts = [
    "What's one thing that went well today?",
    "Describe a challenge you faced and how you handled it.",
    "What are three things you're grateful for right now?",
    "If you could tell your past self one thing, what would it be?",
    "What's a goal you're working towards and what's your next step?",
  ];
  const [currentPrompt, setCurrentPrompt] = useState('');

  //---------------------------------------------------------------------------
  // Effects
  //---------------------------------------------------------------------------
  // On mount, load entries and check for an existing password. 
  // If password is set, lock the journal and require user to unlock on load.
  useEffect(() => {
    const loadAppData = async () => {
      try {
        const storedPassword = await SecureStore.getItemAsync('journalPassword');
        if (storedPassword) {
          setJournalLocked(true);
          setHasPassword(true);
        } else {
          setHasPassword(false);
        }
      } catch (error) {
        console.log('Error loading privacy settings:', error);
      }
      await loadJournalEntries();
    };
    
    loadAppData();
  }, []);

  // Animate entries on load
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

  // Update a random prompt anytime we open the "New Entry" screen
  useEffect(() => {
    if (showNewEntry) {
      setCurrentPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
    }
  }, [showNewEntry]);

  //---------------------------------------------------------------------------
  // Load/Save/Remove Journal Entries
  //---------------------------------------------------------------------------
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
  const saveEntry = async () => {
    if (!currentEntry.trim() && !entryTitle.trim()) {
      Alert.alert('Empty Entry', 'Your entry is empty. Please write something or add a title before saving.');
      return;
    }
  
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        Alert.alert('Error', 'You need to be logged in to save entries');
        return;
      }
  
      const newEntry = {
        title: entryTitle.trim() || 'Untitled Entry',
        content: currentEntry,
        mood: mood,
        date: new Date(), // This will be converted to Firestore timestamp automatically
        userId: user.uid,
      };
  
      // Save to local state first
      const updatedEntries = [{
        ...newEntry,
        id: Date.now().toString(),
        date: new Date().toISOString() // For local storage
      }, ...journalEntries];
      
      setJournalEntries(updatedEntries);
      await AsyncStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, "journals"), newEntry);
  
      setCurrentEntry('');
      setEntryTitle('');
      setMood(null);
      setShowNewEntry(false);
      Alert.alert('Saved!', 'Your journal entry has been saved.');
    } catch (error) {
      console.error("Error saving entry:", error);
      Alert.alert('Error', 'Failed to save your entry. Please try again.');
    }
  };
  const deleteEntry = async (entryId) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to permanently delete this journal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedEntries = journalEntries.filter(entry => entry.id !== entryId);
              setJournalEntries(updatedEntries);
              await AsyncStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
              
              if (getAuth().currentUser) {
                await deleteDoc(doc(db, "journals", entryId));
              }
              
              setSelectedEntry(null);
            } catch (error) {
              console.error("Error deleting entry:", error);
              Alert.alert('Error', 'Failed to delete the entry. Please try again.');
            }
          },
        },
      ]
    );
  };

  //---------------------------------------------------------------------------
  // Password & Journal Locking
  //---------------------------------------------------------------------------
  const unlockJournal = async () => {
    // The user wants to unlock the entire journal
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

  const setJournalPassword = async () => {
    // For the first time setting a password (or resetting after removing)
    if (password.length < 4) {
      Alert.alert('Weak Password', 'Please use at least 4 characters.');
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
      console.log('Error setting password:', error);
      Alert.alert('Error', 'Failed to set password. Please try again.');
    }
  };

  const changeJournalPassword = async () => {
    // For changing an existing password to a new one
    if (password.length < 4) {
      Alert.alert('Weak Password', 'Please use at least 4 characters.');
      return;
    }
    try {
      await SecureStore.setItemAsync('journalPassword', password);
      setHasPassword(true);
      setPassword('');
      setPasswordModalVisible(false);
      Alert.alert('Success', 'Journal password updated.');
    } catch (error) {
      console.log('Error changing password:', error);
      Alert.alert('Error', 'Failed to change password. Please try again.');
    }
  };

  const removeJournalPassword = async () => {
    // Removes the password altogether
    try {
      await SecureStore.deleteItemAsync('journalPassword');
      setJournalLocked(false);
      setHasPassword(false);
      Alert.alert('Success', 'Journal password removed.');
    } catch (error) {
      console.log('Error removing password:', error);
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

  //---------------------------------------------------------------------------
  // Entry Sharing
  //---------------------------------------------------------------------------
  const shareEntry = async (entry) => {
    try {
      setIsLoading(true);
      const filename = `${entry.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      // Create HTML content for PDF
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              .date { color: #666; font-size: 14px; margin-bottom: 20px; }
              .content { line-height: 1.6; }
            </style>
          </head>
          <body>
            <h1>${entry.title}</h1>
            <div class="date">${new Date(entry.date).toLocaleDateString('en-US', { 
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            })}</div>
            <div class="content">${entry.content.replace(/\n/g, '<br>')}</div>
          </body>
        </html>
      `;
      
      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      // Copy to persistent location
      await FileSystem.copyAsync({
        from: uri,
        to: fileUri
      });
      
      // Share the file
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Journal Entry',
        UTI: 'com.adobe.pdf'
      });
    } catch (error) {
      console.error('Sharing failed:', error);
      Alert.alert('Error', 'Failed to share entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const shareAsText = (entry) => {
    const shareContent = `
${entry.title}
${new Date(entry.date).toLocaleDateString()}

${entry.content}

Shared from Mindful Journal App
    `;
    
    Sharing.shareAsync(shareContent, {
      dialogTitle: 'Share Journal Entry',
    });
  };

  //---------------------------------------------------------------------------
  // Helper Rendering Functions
  //---------------------------------------------------------------------------
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.toLocaleDateString('en-US', { day: 'numeric' });
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return { day, month };
  };

  const getMood = (moodValue) => {
    return moodOptions.find(option => option.value === moodValue);
  };

  const renderJournalEntry = (entry) => {
    const { day, month } = formatDate(entry.date);
    const mood = getMood(entry.mood);
    return (
      <TouchableOpacity 
        key={entry.id} 
        style={styles.entryCard} 
        onPress={() => openEntry(entry)}
      >
        <View style={[styles.dateBadge, {backgroundColor: mood ? mood.color : '#AAB7B8'}]}>
          <Text style={styles.dateDay}>{day}</Text>
          <Text style={styles.dateMonth}>{month.toUpperCase()}</Text>
        </View>
        <View style={styles.entryContent}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryTitle} numberOfLines={1}>{entry.title}</Text>
          </View>
          <Text style={styles.entrySnippet} numberOfLines={2}>
            {entry.content || 'No additional text.'}
          </Text>
        </View>
        {mood && (
          <MaterialCommunityIcons
            name={mood.icon}
            size={28}
            color={mood.color}
            style={styles.moodIcon}
          />
        )}
        <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
      </TouchableOpacity>
    );
  };

  //---------------------------------------------------------------------------
  // Render
  //---------------------------------------------------------------------------
  // If the journal is locked, we show a modal right away. Or we can block the screen 
  // behind a "journal locked" overlay and force the user to unlock. 
  // For example, let's do a simple overlay if journalLocked == true.
  const renderLockedOverlay = () => {
    return (
      <View style={styles.lockOverlay}>
        <MaterialCommunityIcons name="lock" size={80} color="#fff" />
        <Text style={styles.lockOverlayText}>Journal is Locked</Text>
        <TouchableOpacity
          style={styles.lockOverlayButton}
          onPress={() => {
            setPasswordModalType('UNLOCK_JOURNAL');
            setPasswordModalVisible(true);
          }}
        >
          <Text style={styles.lockOverlayButtonText}>Unlock Journal</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Open entry directly (no private entries)
  const openEntry = (entry) => {
    setSelectedEntry(entry);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* If the journal is locked, dim out the entire screen and show an overlay */}
      {journalLocked && renderLockedOverlay()}

      {/* Header */}
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
        
        {/* Privacy Quick Actions */}
        <View style={styles.privacyContainer}>
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
                style={[styles.privacyButton, { marginRight: spacing.sm }]}
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
                onPress={() => removeJournalPassword()}
              >
                <MaterialCommunityIcons name="lock" size={20} color={Palette.white} />
                <Text style={styles.privacyButtonText}>Remove Password</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      
      {/* Journal Entries List */}
      {!journalLocked && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {journalEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="notebook-edit-outline" size={80} color={Palette.border} />
              <Text style={styles.emptyStateTitle}>Your journal is empty</Text>
              <Text style={styles.emptyStateText}>
                Tap the "New" button above to start writing
              </Text>
            </View>
          ) : (
            <View style={styles.entriesContainer}>
              {journalEntries.map(entry => renderJournalEntry(entry))}
            </View>
          )}
        </ScrollView>
      )}

      {/* New Entry Modal */}
      <Modal
        visible={showNewEntry}
        animationType="slide"
        onRequestClose={() => setShowNewEntry(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.modalContainer}
        >
          <SafeAreaView style={{flex: 1}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Entry</Text>
              <TouchableOpacity onPress={() => setShowNewEntry(false)}>
                <MaterialCommunityIcons name="close" size={28} color={Palette.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <TextInput
                style={styles.titleInput}
                placeholder="Give your entry a title..."
                placeholderTextColor="#B0B0B0"
                value={entryTitle}
                onChangeText={setEntryTitle}
              />

              <View style={styles.promptContainer}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color={Palette.secondaryOrange} />
                <Text style={styles.promptText}>{currentPrompt}</Text>
              </View>

              <TextInput
                style={styles.contentInput}
                placeholder="Write what's on your mind..."
                placeholderTextColor="#B0B0B0"
                value={currentEntry}
                onChangeText={setCurrentEntry}
                multiline
              />
              
              <Text style={styles.moodLabel}>How are you feeling right now?</Text>
              <View style={styles.moodContainer}>
                {moodOptions.map((moodOption) => (
                  <TouchableOpacity
                    key={moodOption.value}
                    style={[ 
                      styles.moodButton, 
                      mood === moodOption.value && { 
                        backgroundColor: moodOption.color + '30', 
                        borderColor: moodOption.color 
                      }
                    ]}
                    onPress={() => setMood(moodOption.value)}
                  >
                    <MaterialCommunityIcons name={moodOption.icon} size={32} color={moodOption.color} />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.saveButton} onPress={saveEntry}>
                <Text style={styles.saveButtonText}>Save Entry</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* View Entry Modal */}
      <Modal
        visible={!!selectedEntry}
        animationType="slide"
        onRequestClose={() => setSelectedEntry(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {selectedEntry?.title}
            </Text>
            <TouchableOpacity onPress={() => setSelectedEntry(null)}>
              <MaterialCommunityIcons name="close" size={28} color={Palette.textLight} />
            </TouchableOpacity>
          </View>
          
          {selectedEntry && 
            <ScrollView style={styles.modalContent}>
              <View style={styles.viewHeader}>
                <Text style={styles.viewDate}>
                  {new Date(selectedEntry.date).toLocaleDateString('en-US', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                  })}
                </Text>
                {getMood(selectedEntry.mood) && 
                  <View style={[styles.viewMoodBadge, {backgroundColor: getMood(selectedEntry.mood).color + '20'}]}>
                    <MaterialCommunityIcons 
                      name={getMood(selectedEntry.mood).icon} 
                      size={18} 
                      color={getMood(selectedEntry.mood).color}
                    />
                    <Text style={[styles.viewMoodText, {color: getMood(selectedEntry.mood).color}]}>
                      {getMood(selectedEntry.mood).label}
                    </Text>
                  </View>
                }
              </View>
              <Text style={styles.viewContent}>{selectedEntry.content}</Text>
            </ScrollView>
          }
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.shareButton, { marginRight: 5 }]}
              onPress={() => shareAsText(selectedEntry)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Palette.white} />
              ) : (
                <>
                  <MaterialCommunityIcons name="share-variant" size={20} color={Palette.white} />
                  <Text style={styles.shareButtonText}>Share as Text</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.shareButton, { marginLeft: 5 }]}
              onPress={() => shareEntry(selectedEntry)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Palette.white} />
              ) : (
                <>
                  <MaterialCommunityIcons name="file-pdf-box" size={20} color={Palette.white} />
                  <Text style={styles.shareButtonText}>Export as PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Delete button row is separate for clarity */}
          <View style={[styles.modalFooter, { borderTopWidth: 0 }]}>
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={() => deleteEntry(selectedEntry?.id)}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={22} color={Palette.secondaryRed} />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Password Modal */}
      <Modal
        visible={passwordModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.passwordModalContainer}>
          <View style={styles.passwordModalContent}>
 

            <Text style={styles.passwordModalTitle}>
              {passwordModalType === 'UNLOCK_JOURNAL' && 'Unlock Journal'}
              {passwordModalType === 'SET_PASSWORD' && 'Set Journal Password'}
              {passwordModalType === 'CHANGE_PASSWORD' && 'Change Journal Password'}
            </Text>

            <TextInput
              style={styles.passwordInput}
              placeholder="Enter password"
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
              autoFocus={true}
            />

            {/* A short informative message depending on context */}
            {passwordModalType === 'UNLOCK_JOURNAL' && (
              <Text style={styles.passwordNote}>
                Enter your existing journal password to unlock your entries.
              </Text>
            )}
            {passwordModalType === 'SET_PASSWORD' && (
              <Text style={styles.passwordNote}>
                Set a new password to protect your journal. You must use at least 4 characters.
              </Text>
            )}
            {passwordModalType === 'CHANGE_PASSWORD' && (
              <Text style={styles.passwordNote}>
                Enter a new password for your journal. If you forget it, you can't unlock your journal.
              </Text>
            )}

            <View style={styles.passwordButtonContainer}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setPasswordModalVisible(false);
                  setPassword('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={onPasswordModalConfirm}
              >
                <Text style={styles.confirmButtonText}>
                  {passwordModalType === 'UNLOCK_JOURNAL' && 'Unlock'}
                  {passwordModalType === 'SET_PASSWORD' && 'Set Password'}
                  {passwordModalType === 'CHANGE_PASSWORD' && 'Change'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 999, // Ensure it appears on top
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockOverlayText: {
    fontSize: typography.h1.fontSize,
    fontWeight: typography.h1.fontWeight,
    color: Palette.white,
    marginVertical: spacing.lg,
  },
  lockOverlayButton: {
    backgroundColor: Palette.secondaryBlue,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  lockOverlayButtonText: {
    color: Palette.white,
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
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
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 100,
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
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.secondaryPurple,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  privacyButtonText: {
    color: Palette.white,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.h3.fontWeight,
    marginLeft: spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: 50,
  },
  emptyStateTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: Palette.textMedium,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.body.fontSize,
    color: Palette.textLight,
    textAlign: 'center',
    lineHeight: typography.body.lineHeight,
    marginTop: spacing.sm,
  },
  entriesContainer: {},
  entryCard: {
    flexDirection: 'row',
    backgroundColor: Palette.card,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'center',
    ...shadows.low,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  lockIcon: {
    marginLeft: 8,
  },
  modalLockIcon: {
    marginLeft: 8,
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  modalContent: {
    padding: spacing.lg,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: typography.h1.fontWeight,
    color: Palette.textDark,
    paddingBottom: spacing.sm,
    marginBottom: spacing.lg,
  },
  promptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.secondaryOrange + '20',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  promptText: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
    marginLeft: spacing.sm,
    fontStyle: 'italic',
  },
  contentInput: {
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
    minHeight: 200,
    lineHeight: typography.body.lineHeight,
  },
  moodLabel: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: Palette.textDark,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  moodButton: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    width: '22%',
    marginBottom: spacing.sm,
  },
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: Palette.background,
    borderRadius: borderRadius.sm,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  privacyToggleText: {
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
    marginLeft: spacing.sm,
  },
  modalFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  saveButton: {
    backgroundColor: Palette.secondaryBlue,
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  saveButtonText: {
    color: Palette.white,
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
  },
  shareButton: {
    backgroundColor: Palette.secondaryPurple,
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    flex: 1,
  },
  shareButtonText: {
    color: Palette.white,
    fontSize: typography.body.fontSize,
    fontWeight: typography.h2.fontWeight,
    marginLeft: spacing.sm,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.secondaryRed + '20',
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  deleteButtonText: {
    color: Palette.secondaryRed,
    fontSize: typography.body.fontSize,
    fontWeight: typography.h2.fontWeight,
    marginLeft: spacing.sm,
  },
  viewHeader: {
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewDate: {
    fontSize: typography.caption.fontSize,
    color: Palette.textLight,
    flex: 1,
  },
  viewMoodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  viewMoodText: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.h2.fontWeight,
    marginLeft: spacing.xs,
  },
  viewContent: {
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
    lineHeight: typography.body.lineHeight,
  },
  passwordModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  passwordModalContent: {
    backgroundColor: Palette.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '85%',
    maxWidth: 400,
  },
  passwordModalTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: Palette.textDark,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: typography.body.fontSize,
    marginBottom: spacing.sm,
  },
  passwordNote: {
    fontSize: typography.caption.fontSize,
    color: Palette.textLight,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: typography.caption.lineHeight,
  },
  passwordButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: Palette.border,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    flex: 1,
    marginRight: spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Palette.textDark,
    fontWeight: typography.h2.fontWeight,
  },
  confirmButton: {
    backgroundColor: Palette.secondaryBlue,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    flex: 1,
    marginLeft: spacing.sm,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: Palette.white,
    fontWeight: typography.h2.fontWeight,
  },
});

