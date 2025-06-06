import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Title, 
  Text, 
  TextInput, 
  useTheme,
  Avatar
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const SubjectsScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { board } = useRoute().params;
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Subject icons mapping
  const subjectIcons = {
    'Mathematics': 'calculator-variant',
    'Science': 'flask',
    'English': 'book-alphabet',
    'History': 'history',
    'Geography': 'earth',
    'Physics': 'atom',
    'Chemistry': 'periodic-table',
    'Biology': 'dna',
    default: 'book-open-page-variant'
  };

  // Simulate fetching subjects
  useEffect(() => {
    setTimeout(() => {
      try {
        const mockSubjects = [
          { id: '1', name: 'Mathematics', chapters: 15, pdfUrl: 'https://example.com/math.pdf' },
          { id: '2', name: 'Science', chapters: 12, pdfUrl: 'https://example.com/science.pdf' },
          { id: '3', name: 'English', chapters: 10, pdfUrl: 'https://example.com/english.pdf' },
          { id: '4', name: 'History', chapters: 8, pdfUrl: 'https://example.com/history.pdf' },
          { id: '5', name: 'Geography', chapters: 7, pdfUrl: 'https://example.com/geography.pdf' },
        ];
        setSubjects(mockSubjects);
        setFilteredSubjects(mockSubjects);
        setLoading(false);
      } catch (err) {
        setError('Failed to load subjects. Please try again later.');
        setLoading(false);
      }
    }, 1000);
  }, []);

  // Filter subjects
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

  const renderSubject = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate('SubjectDetailScreen', { 
          subject: item, 
          board 
        });
      }}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        style={styles.subjectCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.subjectContent}>
          <Avatar.Icon 
            size={48} 
            icon={subjectIcons[item.name] || subjectIcons.default} 
            style={styles.subjectIcon}
            color={colors.primary}
          />
          <View style={styles.subjectTextContainer}>
            <Text style={styles.subjectName}>{item.name}</Text>
            <Text style={styles.subjectChapters}>{item.chapters} chapters</Text>
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

  return (
    <LinearGradient
      colors={['#f5f7fa', '#e4e8f0']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <Title style={styles.header}>{board.name} Subjects</Title>
          <Text style={styles.subHeader}>Select a subject to view study materials</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search subjects..."
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

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator animating={true} size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading Subjects...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons 
              name="alert-circle" 
              size={48} 
              color="#d32f2f" 
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : filteredSubjects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name="book-remove" 
              size={48} 
              color="#757575" 
            />
            <Text style={styles.emptyText}>No subjects found</Text>
            {searchQuery && (
              <Text style={styles.emptySubText}>Try a different search term</Text>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredSubjects}
            keyExtractor={(item) => item.id}
            renderItem={renderSubject}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    color: '#d32f2f',
    textAlign: 'center',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    color: '#757575',
    fontSize: 18,
    fontWeight: '500',
  },
  emptySubText: {
    color: '#9e9e9e',
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  subjectCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subjectContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectIcon: {
    backgroundColor: 'rgba(94, 53, 177, 0.1)',
    marginRight: 16,
  },
  subjectTextContainer: {
    flex: 1,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  subjectChapters: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default SubjectsScreen;