import React, { useState, useEffect } from 'react';
import { 
  View, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert 
} from 'react-native';
import { Text, Button, RadioButton, Title } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const TestScreen = ({ route, navigation }) => {
  const { testId } = route.params;
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
// Update the fetchTest function in your useEffect
const fetchTest = async () => {
  try {
    const docRef = doc(db, 'tests', testId);
    const docSnap = await getDoc(docRef);
    
    console.log('Firestore document snapshot exists:', docSnap.exists());
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('Raw Firestore data:', data);
      
      // Transform the data to match your expected structure
      const fetchedTest = {
        id: docSnap.id,
        title: data.title || 'Untitled Test',
        description: data.Description || '', // Note capital D in Description
        duration: data.Duration || 30,
        createdAt: data.createdAt || serverTimestamp(),
        questions: data.questions.map(question => ({
          ...question,
          // Ensure options are strings for display
          options: question.options.map(option => option.toString()),
          // Verify correctAnswer is a number
          correctAnswer: Number(question.correctAnswer) || 0
        }))
      };
      
      console.log('Processed test data:', fetchedTest);
      setTest(fetchedTest);
      setTimeLeft(fetchedTest.duration ? fetchedTest.duration * 60 : 1800); // default 30 mins
    } else {
      Alert.alert('Test not found');
      navigation.goBack();
    }
  } catch (error) {
    console.error('Error fetching test: ', error);
    Alert.alert('Error', `Failed to load test: ${error.message}`);
    navigation.goBack();
  } finally {
    setLoading(false);
  }
};
    fetchTest();
  }, [testId, navigation]);    

  useEffect(() => {
    if (timeLeft <= 0 || completed) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, completed]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!test) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Test not found.</Text>
      </View>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];

  const handleOptionSelect = (questionId, optionIndex) => {
    Haptics.selectionAsync();
    setSelectedOptions(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    let correctAnswers = 0;
    test.questions.forEach(question => {
      if (selectedOptions[question._id] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    setScore(correctAnswers);
    setCompleted(true);
    try {
      await addDoc(collection(db, 'testResults'), {
        testId: test.id,
        score: correctAnswers,
        totalQuestions: test.questions.length,
        answers: selectedOptions,
        submittedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error submitting test results:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (completed) {
    return (
      <View style={styles.container}>
        <Title style={styles.resultTitle}>Test Completed!</Title>
        <Text style={styles.resultText}>
          You scored {score} out of {test.questions.length}
        </Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Back to Tests
        </Button>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
      // Add this below the header in your ScrollView
      <Text style={styles.descriptionText}>{test.description}</Text>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {test.questions.length}
        </Text>
        {timeLeft > 0 && (
          <Text style={styles.timerText}>Time left: {formatTime(timeLeft)}</Text>
        )}
      </View>
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
        {currentQuestion.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleOptionSelect(currentQuestion._id, index)}
            style={styles.option}
          >
            <RadioButton.Android
              value={index.toString()}
              status={
                selectedOptions[currentQuestion._id] === index 
                ? 'checked' 
                : 'unchecked'
              }
              onPress={() => handleOptionSelect(currentQuestion._id, index)}
            />
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.navigationButtons}>
        <Button 
          mode="outlined" 
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        {currentQuestionIndex < test.questions.length - 1 ? (
          <Button mode="contained" onPress={handleNext}>
            Next
          </Button>
        ) : (
          <Button mode="contained" onPress={handleSubmit}>
            Submit
          </Button>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  progressText: {
    fontSize: 16,
    color: '#666',
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff5722',
  },
  questionContainer: {
    marginBottom: 30,
  },
  questionText: {
    fontSize: 18,
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#f5f5f5',
  },
  optionText: {
    marginLeft: 10,
    fontSize: 16,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  resultTitle: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  resultText: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    marginTop: 20,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  // Add any additional styles you need for the description text
});

export default TestScreen;
