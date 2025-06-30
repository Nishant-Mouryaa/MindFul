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
import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';

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
    { label: 'Good', value: 'good', icon: 'emoticon-happy-outline', color: '#81C784' },
    { label: 'Neutral', value: 'neutral', icon: 'emoticon-neutral-outline', color: '#AAB7B8' },
    { label: 'Down', value: 'down', icon: 'emoticon-sad-outline', color: '#7FB3D5' },
    { label: 'Sad', value: 'sad', icon: 'emoticon-frown-outline', color: '#5DADE2' },
    { label: 'Anxious', value: 'anxious', icon: 'emoticon-confused-outline', color: '#F1948A' },
    { label: 'Angry', value: 'angry', icon: 'emoticon-angry-outline', color: '#EC7063' },
    { label: 'Tired', value: 'tired', icon: 'emoticon-dead-outline', color: '#BB8FCE' },
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

    const newEntry = {
      id: Date.now().toString(),
      title: entryTitle.trim() || 'Untitled Entry',
      content: currentEntry,
      mood: mood,
      date: new Date().toISOString(),
      userId: getAuth().currentUser?.uid,
    };

    try {
      const updatedEntries = [newEntry, ...journalEntries];
      setJournalEntries(updatedEntries);
      await AsyncStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
      
      if (getAuth().currentUser) {
        await setDoc(doc(db, "journals", newEntry.id), newEntry);
      }

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
            <MaterialCommunityIcons name="plus" size={24} color="#fff" />
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
              <MaterialCommunityIcons name="lock-open" size={20} color="#fff" />
              <Text style={styles.privacyButtonText}>Set Password</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.privacyButton, { marginRight: 10 }]}
                onPress={() => {
                  setPasswordModalType('CHANGE_PASSWORD');
                  setPasswordModalVisible(true);
                }}
              >
                <MaterialCommunityIcons name="lock-reset" size={20} color="#fff" />
                <Text style={styles.privacyButtonText}>Change Password</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.privacyButton}
                onPress={() => removeJournalPassword()}
              >
                <MaterialCommunityIcons name="lock" size={20} color="#fff" />
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
              <MaterialCommunityIcons name="notebook-edit-outline" size={80} color="#CED4DA" />
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
                <MaterialCommunityIcons name="close" size={28} color="#999" />
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
                <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color="#FFB74D" />
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
              <MaterialCommunityIcons name="close" size={28} color="#999" />
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
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="share-variant" size={20} color="#fff" />
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
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="file-pdf-box" size={20} color="#fff" />
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
              <MaterialCommunityIcons name="trash-can-outline" size={22} color="#E57373" />
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
    backgroundColor: '#F8F9FA',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 999, // Ensure it appears on top
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockOverlayText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 20,
  },
  lockOverlayButton: {
    backgroundColor: '#64B5F6',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  lockOverlayButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  header: {
    padding: 20,
    paddingBottom: 15,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  newEntryHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#64B5F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
  },
  newEntryHeaderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  privacyContainer: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7986CB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  privacyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
  },
  entriesContainer: {},
  entryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    height: 60,
    width: 60,
  },
  dateDay: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  entryContent: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  entrySnippet: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  moodIcon: {
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  modalContent: {
    padding: 20,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    paddingBottom: 10,
    marginBottom: 20,
  },
  promptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  promptText: {
    flex: 1,
    fontSize: 15,
    color: '#6D4C41',
    marginLeft: 10,
    fontStyle: 'italic',
  },
  contentInput: {
    fontSize: 17,
    color: '#333',
    minHeight: 200,
    lineHeight: 24,
  },
  moodLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  moodButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    width: '22%',
    marginBottom: 10,
  },
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  privacyToggleText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  saveButton: {
    backgroundColor: '#64B5F6',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  shareButton: {
    backgroundColor: '#7986CB',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    flex: 1,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    padding: 15,
    borderRadius: 30,
    flex: 1,
    marginHorizontal: 5,
  },
  deleteButtonText: {
    color: '#E57373',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  viewHeader: {
    paddingBottom: 15,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewDate: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  viewMoodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  viewMoodText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  viewContent: {
    fontSize: 17,
    color: '#333',
    lineHeight: 26,
  },
  passwordModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  passwordModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  passwordModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 15,
  },
  passwordNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  passwordButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#64B5F6',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

