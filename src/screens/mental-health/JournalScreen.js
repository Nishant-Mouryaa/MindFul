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
  Animated
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function JournalScreen() {
  const [journalEntries, setJournalEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState('');
  const [entryTitle, setEntryTitle] = useState('');
  const [mood, setMood] = useState(null);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const moodOptions = [
    { icon: 'emoticon-sad-outline', label: 'Sad', value: 'sad', color: '#5DADE2' },
    { icon: 'emoticon-frown-outline', label: 'Down', value: 'down', color: '#7FB3D5' },
    { icon: 'emoticon-neutral-outline', label: 'Neutral', value: 'neutral', color: '#AAB7B8' },
    { icon: 'emoticon-happy-outline', label: 'Good', value: 'good', color: '#58D68D' },
    { icon: 'emoticon-excited-outline', label: 'Great', value: 'great', color: '#52BE80' },
    { icon: 'emoticon-angry-outline', label: 'Angry', value: 'angry', color: '#EC7063' },
    { icon: 'emoticon-confused-outline', label: 'Anxious', value: 'anxious', color: '#F1948A' },
    { icon: 'emoticon-tired-outline', label: 'Tired', value: 'tired', color: '#BB8FCE' },
  ];

  const prompts = [
    "How are you feeling today?",
    "What's been on your mind lately?",
    "What made you smile today?",
    "What's challenging you right now?",
    "What are you grateful for?",
    "What would you like to improve about yourself?",
    "Describe your perfect day...",
    "What's something you're looking forward to?",
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const saveEntry = () => {
    if (!currentEntry.trim()) {
      Alert.alert('Empty Entry', 'Please write something before saving.');
      return;
    }

    const newEntry = {
      id: Date.now(),
      title: entryTitle.trim() || `Journal Entry ${journalEntries.length + 1}`,
      content: currentEntry,
      mood: mood,
      date: new Date().toISOString(),
      prompt: prompts[Math.floor(Math.random() * prompts.length)],
    };

    setJournalEntries(prev => [newEntry, ...prev]);
    setCurrentEntry('');
    setEntryTitle('');
    setMood(null);
    setShowNewEntry(false);
    Alert.alert('Saved!', 'Your journal entry has been saved.');
  };

  const deleteEntry = (entryId) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setJournalEntries(prev => prev.filter(entry => entry.id !== entryId));
            setShowEntryModal(false);
          },
        },
      ]
    );
  };

  const openEntry = (entry) => {
    setSelectedEntry(entry);
    setShowEntryModal(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMoodIcon = (moodValue) => {
    const moodOption = moodOptions.find(option => option.value === moodValue);
    return moodOption ? moodOption.icon : 'book-open';
  };

  const getMoodColor = (moodValue) => {
    const moodOption = moodOptions.find(option => option.value === moodValue);
    return moodOption ? moodOption.color : '#AAB7B8';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Journal</Text>
          <Text style={styles.subtitle}>Write your thoughts and feelings</Text>
        </View>

        {/* New Entry Button */}
        <TouchableOpacity 
          style={styles.newEntryButton}
          onPress={() => setShowNewEntry(true)}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
          <Text style={styles.newEntryButtonText}>New Entry</Text>
        </TouchableOpacity>

        {/* Journal Entries */}
        <Animated.View style={[styles.entriesContainer, { opacity: fadeAnim }]}>
          {journalEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="book-open-variant" size={60} color="#AAB7B8" />
              <Text style={styles.emptyStateTitle}>No entries yet</Text>
              <Text style={styles.emptyStateText}>
                Start writing to track your thoughts and feelings
              </Text>
            </View>
          ) : (
            journalEntries.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryCard}
                onPress={() => openEntry(entry)}
              >
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{entry.title}</Text>
                  <MaterialCommunityIcons 
                    name={getMoodIcon(entry.mood)} 
                    size={24} 
                    color={getMoodColor(entry.mood)} 
                  />
                </View>
                <Text style={styles.entryContent} numberOfLines={3}>
                  {entry.content}
                </Text>
                <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
              </TouchableOpacity>
            ))
          )}
        </Animated.View>
      </ScrollView>

      {/* New Entry Modal */}
      <Modal
        visible={showNewEntry}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNewEntry(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Journal Entry</Text>
            <TouchableOpacity onPress={saveEntry}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Title Input */}
            <TextInput
              style={styles.titleInput}
              placeholder="Entry title (optional)"
              placeholderTextColor="#999"
              value={entryTitle}
              onChangeText={setEntryTitle}
            />

            {/* Mood Selection */}
            <Text style={styles.moodLabel}>How are you feeling?</Text>
            <View style={styles.moodContainer}>
              {moodOptions.map((moodOption) => (
                <TouchableOpacity
                  key={moodOption.value}
                  style={[
                    styles.moodButton,
                    mood === moodOption.value && { 
                      backgroundColor: moodOption.color + '20',
                      borderColor: moodOption.color
                    },
                  ]}
                  onPress={() => setMood(moodOption.value)}
                >
                  <MaterialCommunityIcons 
                    name={moodOption.icon} 
                    size={28} 
                    color={moodOption.color} 
                  />
                  <Text style={styles.moodText}>{moodOption.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Content Input */}
            <TextInput
              style={styles.contentInput}
              placeholder="Write your thoughts here..."
              placeholderTextColor="#999"
              value={currentEntry}
              onChangeText={setCurrentEntry}
              multiline
              textAlignVertical="top"
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Entry Detail Modal */}
      <Modal
        visible={showEntryModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEntryModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Journal Entry</Text>
            <TouchableOpacity onPress={() => deleteEntry(selectedEntry?.id)}>
              <MaterialCommunityIcons name="delete" size={24} color="#E74C3C" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedEntry && (
              <>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailTitle}>{selectedEntry.title}</Text>
                  <MaterialCommunityIcons 
                    name={getMoodIcon(selectedEntry.mood)} 
                    size={28} 
                    color={getMoodColor(selectedEntry.mood)} 
                  />
                </View>
                <Text style={styles.detailDate}>{formatDate(selectedEntry.date)}</Text>
                <Text style={styles.detailContent}>{selectedEntry.content}</Text>
              </>
            )}
          </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  newEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4DB6AC',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  newEntryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  entriesContainer: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  entryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDEDED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  entryContent: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 8,
  },
  entryDate: {
    fontSize: 12,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDED',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4DB6AC',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  titleInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EDEDED',
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  moodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  moodButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    width: '23%',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EDEDED',
  },
  moodText: {
    fontSize: 12,
    color: '#333',
    marginTop: 4,
  },
  contentInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#EDEDED',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  detailDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  detailContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
});