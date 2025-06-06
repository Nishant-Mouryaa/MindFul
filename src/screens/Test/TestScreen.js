Copy
import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Alert,
  Dimensions,
  Animated,
  Copy
} from 'react-native';
import { 
  Title, 
  ActivityIndicator, 
  Button, 
  Card, 
  RadioButton, 
  Text,
  ProgressBar,
  useTheme,
  TouchableRipple // Add this
} from 'react-native-paper';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const TestScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { boardId, standardId, subjectId, chapterId, testId, duration, testName } = route.params;
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [testCompleted, setTestCompleted] = useState(false);
  const [answered, setAnswered] = useState([]);
  const scaleValue = new Animated.Value(1);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const questionsRef = collection(db,
          `boards/${boardId}/standards/${standardId}/subjects/${subjectId}/chapters/${chapterId}/tests/${testId}/questions`
        );
        const querySnapshot = await getDocs(questionsRef);
        
        const questionsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setQuestions(questionsData);
        setAnswered(new Array(questionsData.length).fill(false));
      } catch (error) {
        console.error("Error fetching questions:", error);
        Alert.alert("Error", "Failed to load questions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [boardId, standardId, subjectId, chapterId, testId]);

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0 && !testCompleted) {
      completeTest();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, testCompleted]);

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

  const completeTest = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTestCompleted(true);
  };

  const handleNextQuestion = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Check if answer is correct
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      setScore(prevScore => prevScore + 1);
    }

    // Update answered array
    const newAnswered = [...answered];
    newAnswered[currentQuestionIndex] = true;
    setAnswered(newAnswered);

    // Move to next question or finish test
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setSelectedOption(null);
    } else {
      completeTest();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progress = questions.length > 0 ? (currentQuestionIndex + 1) / questions.length : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5D53F0" />
        <Text style={styles.loadingText}>Preparing your test...</Text>
      </View>
    );
  }

  if (testCompleted) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <View style={styles.screenContainer}>
        <View style={styles.resultContainer}>
          <MaterialCommunityIcons
            name={percentage >= 70 ? "emoticon-happy-outline" : "emoticon-sad-outline"}
            size={60}
            color={percentage >= 70 ? "#4CAF50" : "#F44336"}
          />
          <Title style={styles.resultTitle}>Test Completed!</Title>
          <Text style={styles.resultText}>{testName}</Text>
          
          <View style={styles.scoreContainer}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Your Score</Text>
              <Text style={styles.scoreValue}>{score}/{questions.length}</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Percentage</Text>
              <Text style={[
                styles.scoreValue,
                { color: percentage >= 70 ? "#4CAF50" : percentage >= 50 ? "#FFC107" : "#F44336" }
              ]}>
                {percentage}%
              </Text>
            </View>
          </View>

          <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <TouchableRipple
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={() => navigation.goBack()}
              style={styles.resultButton}
              rippleColor="rgba(93, 83, 240, 0.1)"
            >
              <Text style={styles.resultButtonText}>Back to Tests</Text>
            </TouchableRipple>
          </Animated.View>
        </View>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.screenContainer}>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="book-remove-outline"
            size={48}
            color="rgba(255,255,255,0.7)"
          />
          <Title style={styles.emptyTitle}>No Questions Found</Title>
          <Text style={styles.emptyText}>This test doesn't contain any questions yet.</Text>
          
          <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <TouchableRipple
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={() => navigation.goBack()}
              style={styles.emptyButton}
              rippleColor="rgba(93, 83, 240, 0.1)"
            >
              <Text style={styles.emptyButtonText}>Go Back</Text>
            </TouchableRipple>
          </Animated.View>
        </View>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <View style={styles.screenContainer}>
      {/* Header with progress and timer */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <ProgressBar 
            progress={progress} 
            color="#5D53F0" 
            style={styles.progressBar}
          />
          <Text style={styles.progressText}>
            {currentQuestionIndex + 1}/{questions.length}
          </Text>
        </View>
        
        <View style={styles.timerContainer}>
          <MaterialCommunityIcons
            name="timer-outline"
            size={20}
            color="#FF5252"
          />
          <Text style={styles.timerText}>
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>

      {/* Question Card */}
      <Card style={styles.questionCard}>
        <Card.Content>
          <Text style={styles.questionNumber}>
            Question {currentQuestionIndex + 1}
          </Text>
          <Title style={styles.questionText}>
            {currentQuestion.questionText}
          </Title>
          
          {/* Options */}
          {currentQuestion.options.map((option, index) => (
            <TouchableRipple
              key={index}
              onPress={() => setSelectedOption(option.toString())}
              style={[
                styles.option,
                selectedOption === option.toString() && styles.selectedOption
              ]}
              rippleColor="rgba(93, 83, 240, 0.1)"
            >
              <View style={styles.optionContent}>
                <RadioButton
                  value={option.toString()}
                  status={selectedOption === option.toString() ? 'checked' : 'unchecked'}
                  color="#5D53F0"
                  uncheckedColor="#5D53F0"
                />
                <Text style={styles.optionText}>{option}</Text>
              </View>
            </TouchableRipple>
          ))}
        </Card.Content>
      </Card>

      {/* Navigation */}
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <TouchableRipple
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handleNextQuestion}
          disabled={!selectedOption}
          style={[
            styles.nextButton,
            !selectedOption && styles.disabledButton
          ]}
          rippleColor="rgba(93, 83, 240, 0.1)"
        >
          <Text style={styles.nextButtonText}>
            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Test'}
          </Text>
        </TouchableRipple>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#3B2454',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3B2454',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 10,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerText: {
    fontSize: 14,
    color: '#FF5252',
    fontWeight: '600',
    marginLeft: 6,
  },
  questionCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 20,
  },
  questionNumber: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
    lineHeight: 26,
  },
  option: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  selectedOption: {
    backgroundColor: 'rgba(93, 83, 240, 0.2)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
    flex: 1,
  },
  nextButton: {
    backgroundColor: '#5D53F0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: 'rgba(93, 83, 240, 0.5)',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: 16,
  },
  resultText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 24,
    textAlign: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 32,
  },
  scoreItem: {
    alignItems: 'center',
    padding: 16,
    minWidth: 120,
  },
  scoreLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resultButton: {
    backgroundColor: '#5D53F0',
    borderRadius: 12,
    padding: 16,
    width: 200,
    alignItems: 'center',
    marginTop: 20,
  },
  resultButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginVertical: 16,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#5D53F0',
    borderRadius: 12,
    padding: 16,
    width: 200,
    alignItems: 'center',
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default TestScreen;