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
  Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase'; // Your Firebase config
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function JournalScreen() {
  const [journalEntries, setJournalEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState('');
  const [entryTitle, setEntryTitle] = useState('');
  const [mood, setMood] = useState(null);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const moodOptions = [
    { label: 'Great', value: 'great', icon: 'emoticon-excited-outline', color: '#58D68D' },
    { label: 'Good', value: 'good', icon: 'emoticon-happy-outline', color: '#81C784' },
    { label: 'Neutral', value: 'neutral', icon: 'emoticon-neutral-outline', color: '#AAB7B8' },
    { label: 'Down', value: 'down', icon: 'emoticon-sad-outline', color: '#7FB3D5' },
    { label: 'Sad', value: 'sad', icon: 'emoticon-frown-outline', color: '#5DADE2' },
    { label: 'Anxious', value: 'anxious', icon: 'emoticon-confused-outline', color: '#F1948A' },
    { label: 'Angry', value: 'angry', icon: 'emoticon-angry-outline', color: '#EC7063' },
    { label: 'Tired', value: 'tired', icon: 'emoticon-tired-outline', color: '#BB8FCE' },
  ];

  const prompts = [
    "What's one thing that went well today?",
    "Describe a challenge you faced and how you handled it.",
    "What are three things you're grateful for right now?",
    "If you could tell your past self one thing, what would it be?",
    "What's a goal you're working towards and what's your next step?",
  ];
  const [currentPrompt, setCurrentPrompt] = useState('');



  

  useEffect(() => {
    Animated.stagger(100,
        journalEntries.map((_, i) =>
        Animated.spring(fadeAnim, {
            toValue: 1,
            useNativeDriver: true,
            delay: i * 100
        }))
    ).start();
  }, [journalEntries]);

  useEffect(() => {
    if(showNewEntry){
        setCurrentPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
    }
  }, [showNewEntry])


// Add these useEffect hooks
useEffect(() => {
  loadJournalEntries();
}, []);

const loadJournalEntries = async () => {
  try {
    // First try to load from local storage for instant display
    const localEntries = await AsyncStorage.getItem('journalEntries');
    if (localEntries) {
      setJournalEntries(JSON.parse(localEntries));
    }
    
    // Then sync with Firebase
    const auth = getAuth();
    if (auth.currentUser) {
      const q = query(collection(db, "journals"), where("userId", "==", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      const firebaseEntries = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamp to ISO string if needed
        date: doc.data().date?.toDate()?.toISOString() || doc.data().date
      }));
      
      // Merge and deduplicate entries
      const mergedEntries = [...firebaseEntries, ...(localEntries ? JSON.parse(localEntries) : [])]
        .filter((entry, index, self) => 
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
    id: Date.now().toString(), // Use string ID for Firestore
    title: entryTitle.trim() || 'Untitled Entry',
    content: currentEntry,
    mood: mood,
    date: new Date().toISOString(),
    userId: getAuth().currentUser?.uid
  };

  try {
    // Save to local storage first for instant feedback
    const updatedEntries = [newEntry, ...journalEntries];
    setJournalEntries(updatedEntries);
    await AsyncStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
    
    // Save to Firebase if user is authenticated
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
            // Remove from local storage
            const updatedEntries = journalEntries.filter(entry => entry.id !== entryId);
            setJournalEntries(updatedEntries);
            await AsyncStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
            
            // Remove from Firebase if user is authenticated
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

  const openEntry = (entry) => {
    setSelectedEntry(entry);
  };

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
        <TouchableOpacity key={entry.id} style={styles.entryCard} onPress={() => openEntry(entry)}>
            <View style={[styles.dateBadge, {backgroundColor: mood ? mood.color : '#AAB7B8'}]}>
                <Text style={styles.dateDay}>{day}</Text>
                <Text style={styles.dateMonth}>{month.toUpperCase()}</Text>
            </View>
            <View style={styles.entryContent}>
                <Text style={styles.entryTitle} numberOfLines={1}>{entry.title}</Text>
                <Text style={styles.entrySnippet} numberOfLines={2}>
                    {entry.content || 'No additional text.'}
                </Text>
            </View>
            {mood && <MaterialCommunityIcons name={mood.icon} size={28} color={mood.color} style={styles.moodIcon} />}
            <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
      )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Modified Header with New Entry Button */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>My Journal</Text>
          <TouchableOpacity 
            style={styles.newEntryHeaderButton}
            onPress={() => setShowNewEntry(true)}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#fff" />
            <Text style={styles.newEntryHeaderButtonText}>New</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>A space for your thoughts, feelings, and reflections.</Text>
      </View>
      
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


      {/* New/Edit Entry Modal */}
      <Modal
        visible={showNewEntry}
        animationType="slide"
        onRequestClose={() => setShowNewEntry(false)}
      >
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.modalContainer}>
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
                  style={[ styles.moodButton, mood === moodOption.value && { backgroundColor: moodOption.color + '30', borderColor: moodOption.color }]}
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
            <Text style={styles.modalTitle} numberOfLines={1}>{selectedEntry?.title}</Text>
            <TouchableOpacity onPress={() => setSelectedEntry(null)}>
                <MaterialCommunityIcons name="close" size={28} color="#999" />
            </TouchableOpacity>
          </View>
          {selectedEntry && 
            <ScrollView style={styles.modalContent}>
                <View style={styles.viewHeader}>
                    <Text style={styles.viewDate}>
                        {new Date(selectedEntry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </Text>
                    {getMood(selectedEntry.mood) && 
                        <View style={[styles.viewMoodBadge, {backgroundColor: getMood(selectedEntry.mood).color + '20'}]}>
                            <MaterialCommunityIcons name={getMood(selectedEntry.mood).icon} size={18} color={getMood(selectedEntry.mood).color}/>
                            <Text style={[styles.viewMoodText, {color: getMood(selectedEntry.mood).color}]}>{getMood(selectedEntry.mood).label}</Text>
                        </View>
                    }
                </View>
                <Text style={styles.viewContent}>{selectedEntry.content}</Text>
            </ScrollView>
          }
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.deleteButton} onPress={() => deleteEntry(selectedEntry.id)}>
                <MaterialCommunityIcons name="trash-can-outline" size={22} color="#E57373" />
                <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}


  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F8F9FA',
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
      paddingBottom: 100, // Added to prevent content from being hidden behind FAB
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
  
    // Adjust empty state text since button moved
    emptyStateText: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
      lineHeight: 22,
      marginTop: 8,
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
        marginBottom: 5,
    },
    entrySnippet: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    moodIcon: {
        marginLeft: 10,
    },
    // Modal Styles
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
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0'
    },
    saveButton: {
        backgroundColor: '#64B5F6',
        padding: 15,
        borderRadius: 30,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // View Entry Modal
    viewHeader: {
        paddingBottom: 15,
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    viewDate: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    viewMoodBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
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
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFEBEE',
        padding: 15,
        borderRadius: 30,
    },
    deleteButtonText: {
        color: '#E57373',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8
    }
});