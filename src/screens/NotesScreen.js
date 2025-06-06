import React, { useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  Dimensions,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Title, 
  Text, 
  TextInput, 
  Chip, 
  Button, 
  useTheme,
  Avatar
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Mock data for notes with more details
const mockNotes = [
  { 
    id: '1', 
    title: 'Algebra Basics', 
    description: 'Introduction to algebraic expressions and equations.', 
    subject: 'Mathematics',
    date: '2 days ago',
    pages: 5,
    color: '#4a148c'
  },
  { 
    id: '2', 
    title: 'Photosynthesis', 
    description: 'Overview of photosynthesis process in plants with diagrams.', 
    subject: 'Science',
    date: '1 week ago',
    pages: 8,
    color: '#00695c'
  },
  { 
    id: '3', 
    title: 'Shakespearean Sonnets', 
    description: 'Analysis of themes and literary devices in selected sonnets.', 
    subject: 'English Literature',
    date: '3 days ago',
    pages: 6,
    color: '#ad1457'
  },
  { 
    id: '4', 
    title: 'World War II Timeline', 
    description: 'Key events from 1939-1945 with important figures.', 
    subject: 'History',
    date: '2 weeks ago',
    pages: 12,
    color: '#5e35b1'
  },
];

// Subject icons mapping
const subjectIcons = {
  'Mathematics': 'calculator-variant',
  'Science': 'flask',
  'English Literature': 'book-alphabet',
  'History': 'history',
  default: 'notebook'
};

const NotesScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notes, setNotes] = useState(mockNotes);
  const [error, setError] = useState('');

  // Get unique subjects for filtering
  const allSubjects = Array.from(new Set(mockNotes.map(note => note.subject)));

  // Filter notes based on search and selected category
  const getFilteredNotes = useCallback(() => {
    return notes.filter(note => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? note.subject === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [notes, searchQuery, selectedCategory]);

  const filteredNotes = getFilteredNotes();

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // Render category chips
  const renderCategoryChips = () => (
    <FlatList
      horizontal
      data={allSubjects}
      keyExtractor={(item) => item}
      showsHorizontalScrollIndicator={false}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedCategory(selectedCategory === item ? null : item);
          }}
          activeOpacity={0.8}
        >
          <View style={[
            styles.chipContainer,
            selectedCategory === item && styles.selectedChipContainer
          ]}>
            <Text style={[
              styles.chipText,
              selectedCategory === item && styles.selectedChipText
            ]}>
              {item}
            </Text>
          </View>
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.chipsContainer}
    />
  );

  // Render note card
  const renderNoteCard = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate('NoteDetailScreen', { note: item });
      }}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        style={styles.noteCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.noteHeader}>
          <Avatar.Icon 
            size={40} 
            icon={subjectIcons[item.subject] || subjectIcons.default} 
            style={[styles.noteIcon, { backgroundColor: item.color + '20' }]}
            color={item.color}
          />
          <View style={styles.noteTitleContainer}>
            <Text style={styles.noteTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.noteSubject}>{item.subject}</Text>
          </View>
          <Text style={styles.noteDate}>{item.date}</Text>
        </View>
        <Text style={styles.noteDescription} numberOfLines={2}>{item.description}</Text>
        <View style={styles.noteFooter}>
          <View style={styles.notePages}>
            <MaterialCommunityIcons name="file-document" size={16} color="#666" />
            <Text style={styles.notePagesText}>{item.pages} pages</Text>
          </View>
          <MaterialCommunityIcons 
            name="chevron-right" 
            size={24} 
            color={colors.primary} 
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons 
        name="notebook-remove" 
        size={48} 
        color="#9e9e9e" 
      />
      <Text style={styles.emptyText}>No notes found</Text>
      {searchQuery || selectedCategory ? (
        <Text style={styles.emptySubText}>Try adjusting your search or filters</Text>
      ) : null}
    </View>
  );

  return (
    <LinearGradient
      colors={['#f5f7fa', '#e4e8f0']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <Title style={styles.header}>My Notes</Title>
          <Text style={styles.subHeader}>Access and manage your study notes</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search notes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            mode="outlined"
            style={styles.searchBar}
            left={<TextInput.Icon name="magnify" />}
            theme={{
              colors: {
                primary: colors.primary,
                background: '#fff'
              }
            }}
          />
        </View>

        {renderCategoryChips()}

        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          renderItem={renderNoteCard}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[colors.primary]} 
            />
          }
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />

        <Button
          mode="contained"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('NewNoteScreen');
          }}
          style={styles.addButton}
          labelStyle={styles.addButtonLabel}
          icon="plus"
        >
          New Note
        </Button>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    padding: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: 8,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 16,
    color: '#5c6bc0',
    textAlign: 'center',
    opacity: 0.9,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  chipsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  chipContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedChipContainer: {
    backgroundColor: '#f0e8ff',
    borderColor: '#5e35b1',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
  },
  selectedChipText: {
    color: '#5e35b1',
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  noteCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteIcon: {
    marginRight: 12,
  },
  noteTitleContainer: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  noteSubject: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  noteDate: {
    fontSize: 12,
    color: '#999',
  },
  noteDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notePages: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notePagesText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#757575',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubText: {
    fontSize: 14,
    color: '#9e9e9e',
    marginTop: 8,
  },
  addButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addButtonLabel: {
    color: '#fff',
    fontWeight: '600',
    paddingVertical: 6,
  },
});

export default NotesScreen;