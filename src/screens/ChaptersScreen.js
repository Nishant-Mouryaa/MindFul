import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet, FlatList, ActivityIndicator, Text, RefreshControl } from 'react-native';
import { Title } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import ChapterCard from '../components/ChapterCard'; // Adjust the import path as needed

/**
 * ChaptersScreen Component
 * Displays a list of chapters for a selected subject.
 * Simulates data fetching and handles loading/error states.
 */
const ChaptersScreen = () => {
  const navigation = useNavigation();
  const { board, subject } = useRoute().params; // board and subject are objects
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Simulate fetching chapters from an API
  const fetchChapters = useCallback(() => {
    setLoading(true);
    setError('');
    // Simulate an API call delay
    setTimeout(() => {
      try {
        // Replace with actual API call when available.
        const fetchedChapters = [
          { id: '1', name: 'Chapter 1: Introduction', thumbnail: 'https://via.placeholder.com/50?text=Ch1' },
          { id: '2', name: 'Chapter 2: Basics', thumbnail: 'https://via.placeholder.com/50?text=Ch2' },
          { id: '3', name: 'Chapter 3: Advanced Topics', thumbnail: 'https://via.placeholder.com/50?text=Ch3' },
        ];
        setChapters(fetchedChapters);
      } catch (err) {
        setError('Failed to load chapters. Please try again later.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, 1500);
  }, []);

  // Fetch chapters on component mount
  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChapters();
  }, [fetchChapters]);

  // Render each chapter card using the reusable ChapterCard component.
  const renderChapter = ({ item }) => (
    <ChapterCard
      chapter={item}
      board={board}
      subject={subject}
      onPress={() => {
        // Validate parameters if necessary before navigation
        if (!board || !subject || !item) {
          alert('Missing chapter data.');
          return;
        }
        navigation.navigate('TestScreen', { board, subject, chapter: item });
      }}
    />
  );

  // Render an empty state if no chapters are found.
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No chapters available.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header displays subject name */}
        <Title style={styles.header}>Chapters in {subject.name}</Title>
        {loading ? (
          <ActivityIndicator size="large" color="#6200ee" style={styles.loader} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <FlatList
            data={chapters}
            keyExtractor={(item) => item.id}
            renderItem={renderChapter}
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

export default ChaptersScreen;
