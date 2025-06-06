import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet, FlatList, ActivityIndicator, Text, RefreshControl } from 'react-native';
import { Title, TextInput } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import SubjectCard from '../components/SubjectCard'; // Adjust path if necessary

/**
 * TestSubjectsScreen Component
 * Displays a list of test subjects for a selected board.
 * Supports search/filtering, loading & error states, and navigation to ChaptersScreen.
 */
const TestSubjectsScreen = () => {
  const navigation = useNavigation();
  const { board } = useRoute().params; // board object with at least { id, name, ... }
  
  // State management for subjects data, loading, error, search query, and refreshing state
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Simulate fetching subjects from an API
  const fetchSubjects = useCallback(() => {
    setLoading(true);
    setError('');
    // Simulate an API call delay
    setTimeout(() => {
      try {
        // Replace with real API call when available.
        const fetchedSubjects = [
          { id: '1', name: 'Mathematics', thumbnail: 'https://via.placeholder.com/50?text=Math' },
          { id: '2', name: 'Science', thumbnail: 'https://via.placeholder.com/50?text=Science' },
          { id: '3', name: 'English', thumbnail: 'https://via.placeholder.com/50?text=Eng' },
          // Additional subjects can be added here.
        ];
        setSubjects(fetchedSubjects);
        setFilteredSubjects(fetchedSubjects);
      } catch (err) {
        setError('Failed to load subjects. Please try again later.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, 1500);
  }, []);

  // Fetch subjects on mount
  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // Update filtered subjects when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSubjects(subjects);
    } else {
      const filtered = subjects.filter(subject =>
        subject.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSubjects(filtered);
    }
  }, [searchQuery, subjects]);

  // Handler for pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSubjects();
  }, [fetchSubjects]);

  // Render each subject card using the reusable SubjectCard component.
  const renderSubject = ({ item }) => (
    <SubjectCard 
      subject={item} 
      board={board} 
      onPress={() => navigation.navigate('ChaptersScreen', { board, subject: item })}
    />
  );

  // Render an empty state if no subjects match the filter.
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No subjects found.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header displaying the selected board's name */}
        <Title style={styles.header}>Test Subjects for {board.name}</Title>
        
        {/* Search Bar to filter subjects */}
        <TextInput
          placeholder="Search subjects..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          mode="outlined"
          style={styles.searchBar}
          accessibilityLabel="Search subjects"
        />

        {/* Display loading indicator, error message, or list of subjects */}
        {loading ? (
          <ActivityIndicator size="large" color="#6200ee" style={styles.loader} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <FlatList
            data={filteredSubjects}
            keyExtractor={(item) => item.id}
            renderItem={renderSubject}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200ee']} />
            }
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 24,
    fontWeight: '600',
  },
  searchBar: {
    marginBottom: 20,
  },
  loader: {
    marginTop: 50,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  list: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
});

export default TestSubjectsScreen;
