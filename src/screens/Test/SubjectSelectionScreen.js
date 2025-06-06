import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList,
  ActivityIndicator,
  Dimensions,
  Animated
} from 'react-native';
import { 
  Title, 
  Text, 
  Button, 
  useTheme,
  Avatar,
  TouchableRipple
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase'; 
import { Palette } from '../../theme/colors';

import { TouchableOpacity } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

const SubjectSelectionScreen = ({ route }) => {
  const { colors } = useTheme();
const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  
  const { boardId, standardId } = route.params;
  
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const scaleValue = new Animated.Value(1);

  // Subject icons and colors mapping
  const subjectData = {
    'Mathematics': { icon: 'calculator-variant', color: '#5D53F0' },
    'Science': { icon: 'flask', color: '#00B894' },
    'English': { icon: 'book-alphabet', color: '#FD79A8' },
    'History': { icon: 'history', color: '#FDCB6E' },
    'Physics': { icon: 'atom', color: '#0984E3' },
    'Chemistry': { icon: 'flask', color: '#00CEC9' },
    'Biology': { icon: 'leaf', color: '#E17055' },
    'Geography': { icon: 'earth', color: '#6C5CE7' },
    'Economics': { icon: 'finance', color: '#FF7675' },
    'default': { icon: 'book-open-variant', color: '#A5A5A5' }
  };

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const subjectsRef = collection(db, `boards/${boardId}/standards/${standardId}/subjects`);
        const querySnapshot = await getDocs(subjectsRef);
        
        const subjectsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          chapterCount: doc.data().chapterCount || 0
        }));
        
        setSubjects(subjectsData);
      } catch (err) {
        console.error("Error fetching subjects:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [boardId, standardId]);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleSelectSubject = (subject) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedId(subject.id);
    setTimeout(() => {
      navigation.navigate('ChapterSelection', {
        boardId,
        standardId,
        subjectId: subject.id,
        subjectName: subject.name
      });
    }, 200);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5D53F0" />
        <Text style={styles.loadingText}>Loading subjects...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons 
          name="alert-circle-outline" 
          size={48} 
          color="#FF5252" 
        />
        <Text style={styles.errorText}>Failed to load subjects</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={styles.retryButton}
          labelStyle={styles.buttonLabel}
        >
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      {/* Decorative background elements */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <View style={styles.headerContainer}>
        <MaterialCommunityIcons 
          name="book-education" 
          size={36} 
          color="#FFFFFF" 
          style={styles.headerIcon} 
        />
        <Title style={styles.header}>Select Subject</Title>
        <Text style={styles.subHeader}>
          Choose a subject to view available chapters
        </Text>
      </View>

      <FlatList
        data={subjects}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const subjectInfo = subjectData[item.name] || subjectData.default;
          return (
            <Animated.View
              style={[
                styles.subjectCard,
                { 
                  backgroundColor: subjectInfo.color + '20',
                  borderColor: subjectInfo.color,
                  transform: [{ scale: selectedId === item.id ? scaleValue : 1 }]
                }
              ]}
            >
              <TouchableRipple
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={() => handleSelectSubject(item)}
                rippleColor="rgba(255,255,255,0.2)"
                style={styles.touchable}
              >
                <View style={styles.cardContent}>
                  <View style={[styles.avatarContainer, { backgroundColor: subjectInfo.color }]}>
                    <MaterialCommunityIcons 
                      name={subjectInfo.icon} 
                      size={24} 
                      color="#FFFFFF" 
                    />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.subjectName}>{item.name}</Text>
                    <Text style={styles.chapterCount}>
                      {item.chapterCount} {item.chapterCount === 1 ? 'chapter' : 'chapters'} available
                    </Text>
                  </View>
                  <MaterialCommunityIcons 
                    name="chevron-right" 
                    size={24} 
                    color={subjectInfo.color} 
                  />
                </View>
              </TouchableRipple>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name="book-remove-outline" 
              size={48} 
              color="rgba(255,255,255,0.7)" 
            />
            <Text style={styles.emptyText}>No subjects available</Text>
            <Text style={styles.emptySubtext}>
              Please check back later or contact your institution
            </Text>
          </View>
        }
      />
    </View>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
    paddingTop: 60,
  },
  circle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Palette.primaryLight,
    top: -100,
    left: -100,
  },
  circle2: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: Palette.primaryXLight,
    bottom: -150,
    right: -100,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 15,
  },
  header: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.onBackground,
    marginBottom: 8,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 16,
    color: colors.onSurface,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  subjectCard: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  touchable: {
    padding: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.onBackground,
    marginBottom: 4,
  },
  chapterCount: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.onBackground,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: colors.onBackground,
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: Palette.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    marginVertical: 16,
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: colors.surface,
  },
  buttonLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
});


export default SubjectSelectionScreen;