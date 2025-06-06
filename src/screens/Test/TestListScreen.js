import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator,
  Dimensions,
  Animated
} from 'react-native';
import { 
  Title, 
  Text, 
  Button, 
  useTheme,
  TouchableRipple,
  Badge
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Palette } from '../../theme/colors';

const { width } = Dimensions.get('window');

const TestListScreen = ({ route }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const { boardId, standardId, subjectId, chapterId, chapterName } = route.params;
  
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const scaleValue = new Animated.Value(1);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const testsRef = collection(db,
          `boards/${boardId}/standards/${standardId}/subjects/${subjectId}/chapters/${chapterId}/tests`
        );
        const querySnapshot = await getDocs(testsRef);
        
        const testsData = await Promise.all(querySnapshot.docs.map(async (testDoc) => {
          const questionsRef = collection(db,
            `boards/${boardId}/standards/${standardId}/subjects/${subjectId}/chapters/${chapterId}/tests/${testDoc.id}/questions`
          );
          const questionsSnapshot = await getDocs(questionsRef);
          
          return {
            id: testDoc.id,
            name: testDoc.data().name || `Test ${testDoc.id}`,
            duration: testDoc.data().duration || 30,
            difficulty: testDoc.data().difficulty || 'Medium',
            questionCount: questionsSnapshot.size,
            lastScore: Math.floor(Math.random() * 100) // Example score for demo
          };
        }));
        
        setTests(testsData.filter(test => test.questionCount > 0));
      } catch (err) {
        console.error("Error fetching tests:", err);
        setError("Failed to load tests. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [boardId, standardId, subjectId, chapterId]);

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

  const startTest = (test) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedId(test.id);
    setTimeout(() => {
      navigation.navigate('TestScreen', {
        boardId,
        standardId,
        subjectId,
        chapterId,
        testId: test.id,
        duration: test.duration * 60,
        testName: test.name
      });
    }, 200);
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty.toLowerCase()) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FFC107';
      case 'hard': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5D53F0" />
        <Text style={styles.loadingText}>Loading tests...</Text>
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
        <Text style={styles.errorText}>{error}</Text>
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
          name="clipboard-text"
          size={36}
          color="#FFFFFF"
          style={styles.headerIcon}
        />
        <Title style={styles.header}>Chapter: {chapterName}</Title>
        <Text style={styles.subHeader}>Select a test to begin</Text>
      </View>

      <View style={styles.contentContainer}>
        {tests.length > 0 ? (
          tests.map((test) => (
            <Animated.View
              key={test.id}
              style={[
                styles.testCard,
                { transform: [{ scale: selectedId === test.id ? scaleValue : 1 }] }
              ]}
            >
              <TouchableRipple
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={() => startTest(test)}
                rippleColor="rgba(255,255,255,0.2)"
                style={styles.touchable}
              >
                <View style={styles.cardContent}>
                  <View style={styles.testIcon}>
                    <MaterialCommunityIcons
                      name="clipboard-text-outline"
                      size={24}
                      color="#5D53F0"
                    />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.testName}>{test.name}</Text>
                    <View style={styles.detailsContainer}>
                      <View style={styles.detailItem}>
                        <MaterialCommunityIcons
                          name="clock-outline"
                          size={16}
                          color="rgba(255,255,255,0.7)"
                        />
                        <Text style={styles.detailText}>{test.duration} mins</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <MaterialCommunityIcons
                          name="help-circle-outline"
                          size={16}
                          color="rgba(255,255,255,0.7)"
                        />
                        <Text style={styles.detailText}>{test.questionCount} Qs</Text>
                      </View>
                      <View style={[
                        styles.difficultyBadge,
                        { backgroundColor: getDifficultyColor(test.difficulty) + '40' }
                      ]}>
                        <Text style={[
                          styles.difficultyText,
                          { color: getDifficultyColor(test.difficulty) }
                        ]}>
                          {test.difficulty}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.rightContent}>
                    {test.lastScore !== undefined && (
                      <View style={styles.scoreContainer}>
                        <Text style={styles.scoreText}>Last Score</Text>
                        <Text style={styles.scoreValue}>{test.lastScore}%</Text>
                      </View>
                    )}
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={24}
                      color="#5D53F0"
                    />
                  </View>
                </View>
              </TouchableRipple>
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="clipboard-remove-outline"
              size={48}
              color="rgba(255,255,255,0.7)"
            />
            <Text style={styles.emptyText}>No tests available</Text>
            <Text style={styles.emptySubtext}>
              Check back later or contact your instructor
            </Text>
          </View>
        )}
      </View>
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
    fontSize: 24,
    fontWeight: '700',
    color: colors.onBackground,
    marginBottom: 8,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 16,
    color: Palette.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  testCard: {
    backgroundColor: Palette.surfaceLight,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    overflow: 'hidden',
    elevation: 3,
  },
  touchable: {
    padding: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.primaryXLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
    marginBottom: 8,
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: Palette.textMuted,
    marginLeft: 4,
  },
  difficultyBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreContainer: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  scoreText: {
    fontSize: 10,
    color: Palette.textMuted,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onBackground,
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


export default TestListScreen;