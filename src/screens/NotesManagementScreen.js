import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Alert, 
  KeyboardAvoidingView, 
  ScrollView, 
  Platform, 
  
  RefreshControl, 
  Animated 
} from 'react-native';
import { Title, TextInput, Button, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import NoteCard from '../components/NoteCard'; // Adjust path as necessary

const NotesManagementScreen = () => {
  const navigation = useNavigation();
  
  // State for list of notes (simulate API integration)
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Form state for adding/editing a note
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDescription, setNoteDescription] = useState('');
  const [noteSubject, setNoteSubject] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  
  // Animation value for form appearance/disappearance
  const formAnim = useRef(new Animated.Value(0)).current;
  const [showForm, setShowForm] = useState(false);

  // Simulate fetching notes (replace with real API call)
  useEffect(() => {
    setNotes([
      { id: '1', title: 'Math Notes', description: 'Notes on algebra and geometry', subject: 'Mathematics' },
      { id: '2', title: 'Science Notes', description: 'Notes on physics and chemistry', subject: 'Science' },
    ]);
  }, []);

  // Function to animate form appearance/disappearance
  const toggleForm = useCallback(() => {
    if (showForm) {
      Animated.timing(formAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        setShowForm(false);
        setEditingNote(null);
        setError('');
      });
    } else {
      setShowForm(true);
      Animated.timing(formAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [formAnim, showForm]);

  // Form validation function
  const validateForm = () => {
    if (!noteTitle || !noteDescription || !noteSubject) {
      setError('Please fill all fields.');
      return false;
    }
    return true;
  };

  // Handle adding or updating a note
  const handleSubmitNote = () => {
    if (!validateForm()) return;
    const newNote = {
      id: editingNote ? editingNote.id : Date.now().toString(),
      title: noteTitle,
      description: noteDescription,
      subject: noteSubject,
    };
    if (editingNote) {
      setNotes(prev => prev.map(note => note.id === editingNote.id ? newNote : note));
      Alert.alert('Success', 'Note updated successfully!');
    } else {
      setNotes(prev => [...prev, newNote]);
      Alert.alert('Success', 'New note added successfully!');
    }
    // Reset form state
    setNoteTitle('');
    setNoteDescription('');
    setNoteSubject('');
    setError('');
    setEditingNote(null);
    toggleForm();
  };

  // Handle editing: pre-fill form with selected note's data
  const handleEditNote = (note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteDescription(note.description);
    setNoteSubject(note.subject);
    if (!showForm) {
      toggleForm();
    }
  };

  // Handle deletion with confirmation
  const handleDeleteNote = (id) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => setNotes(prev => prev.filter(note => note.id !== id)) },
      ],
      { cancelable: false }
    );
  };

  // Pull-to-refresh handler (simulate re-fetching data)
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // In a real app, call API to fetch notes
    setTimeout(() => {
      setRefreshing(false);
      // Optionally update state if needed
    }, 1500);
  }, []);

  // Render each note using the NoteCard component
  const renderNote = ({ item }) => (
    <NoteCard note={item} onEdit={handleEditNote} onDelete={handleDeleteNote} />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            // Optional pull-to-refresh for re-fetching notes
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200ee']} />
          }
        >
          {/* Header Section */}
          <Title style={styles.header}>Notes Management</Title>

          {/* Note List */}
          <FlatList
            data={notes}
            keyExtractor={(item) => item.id}
            renderItem={renderNote}
            contentContainerStyle={styles.list}
          />

          {/* Sub-header for form */}
          <Title style={styles.subHeader}>{editingNote ? 'Edit Note' : 'Add New Note'}</Title>

          {/* Animated Form */}
          {showForm && (
            <Animated.View style={[styles.form, { opacity: formAnim, transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
              <TextInput
                label="Note Title"
                mode="outlined"
                value={noteTitle}
                onChangeText={setNoteTitle}
                style={styles.input}
              />
              <TextInput
                label="Note Description"
                mode="outlined"
                value={noteDescription}
                onChangeText={setNoteDescription}
                style={styles.input}
              />
              <TextInput
                label="Subject"
                mode="outlined"
                value={noteSubject}
                onChangeText={setNoteSubject}
                style={styles.input}
              />
              {error ? <HelperText type="error">{error}</HelperText> : null}
              <Button mode="contained" onPress={handleSubmitNote} style={styles.button}>
                {editingNote ? 'Update Note' : 'Add Note'}
              </Button>
            </Animated.View>
          )}

          {/* Toggle Form Button */}
          <Button mode="contained" onPress={toggleForm} style={styles.toggleButton}>
            {showForm ? 'Close Form' : 'Open Form'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 28,
    fontWeight: 'bold',
  },
  list: {
    paddingBottom: 20,
  },
  subHeader: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 20,
  },
  form: {
    marginVertical: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    elevation: 3,
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginTop: 10,
  },
  toggleButton: {
    marginVertical: 10,
  },
});

export default NotesManagementScreen;
