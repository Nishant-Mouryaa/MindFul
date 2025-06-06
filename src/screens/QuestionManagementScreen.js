import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
  Platform,
  RefreshControl,
  Animated,
} from 'react-native';
import { Title, TextInput, Button, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  fetchQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../apiService'; // Adjust path accordingly

// Reusable component for rendering a question card
const QuestionCard = ({ question, onEdit, onDelete }) => {
  return (
    <View style={cardStyles.wrapper}>
      <View style={cardStyles.card}>
        <Title style={cardStyles.title}>{question.questionText}</Title>
        <HelperText type="info">
          Options: {question.options.join(', ')}
        </HelperText>
        <HelperText type="info">
          Correct Answer: {question.correctAnswer}
        </HelperText>
        <View style={cardStyles.actions}>
          <Button
            mode="outlined"
            onPress={() => onEdit(question)}
            accessibilityLabel={`Edit question: ${question.questionText}`}
          >
            Edit
          </Button>
          <Button
            mode="outlined"
            onPress={() => onDelete(question.id)}
            accessibilityLabel={`Delete question: ${question.questionText}`}
          >
            Delete
          </Button>
        </View>
      </View>
    </View>
  );
};

const cardStyles = StyleSheet.create({
  wrapper: {
    marginVertical: 10,
  },
  card: {
    padding: 15,
    borderRadius: 10,
    elevation: 4,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
});

const QuestionManagementScreen = () => {
  const navigation = useNavigation();
  const { testId } = useRoute().params; // Assume testId is passed from TestManagementScreen

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Form state for adding/editing a question
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(''); // comma-separated string
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Animation for form appearance/disappearance
  const formAnim = useRef(new Animated.Value(0)).current;

  // Fetch questions when the component mounts or testId changes
  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await fetchQuestions(testId);
      setQuestions(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadQuestions();
  }, [testId]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadQuestions().then(() => setRefreshing(false));
  }, []);

  // Toggle form visibility with animation
  const toggleForm = useCallback(() => {
    if (showForm) {
      Animated.timing(formAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        setShowForm(false);
        setEditingQuestion(null);
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

  // Validate form fields
  const validateForm = () => {
    if (!questionText || !options || !correctAnswer) {
      setError('Please fill in all fields.');
      return false;
    }
    // Ensure that the correct answer is one of the provided options
    const optionsArray = options.split(',').map(opt => opt.trim());
    if (!optionsArray.includes(correctAnswer.trim())) {
      setError('Correct answer must be one of the provided options.');
      return false;
    }
    return true;
  };

  // Handle add or update question
  const handleSubmitQuestion = async () => {
    if (!validateForm()) return;

    // Prepare question data
    const questionData = {
      questionText,
      options: options.split(',').map(opt => opt.trim()),
      correctAnswer: correctAnswer.trim(),
    };

    try {
      if (editingQuestion) {
        // Update question via API call
        const updatedQuestion = await updateQuestion(editingQuestion.id, questionData);
        setQuestions(prev => prev.map(q => (q.id === editingQuestion.id ? updatedQuestion : q)));
        Alert.alert('Success', 'Question updated successfully!');
      } else {
        // Create new question via API call
        const createdQuestion = await createQuestion(testId, questionData);
        setQuestions(prev => [...prev, createdQuestion]);
        Alert.alert('Success', 'Question added successfully!');
      }
      // Reset form fields and close form
      setQuestionText('');
      setOptions('');
      setCorrectAnswer('');
      setEditingQuestion(null);
      toggleForm();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle editing: pre-fill the form with question data
  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setQuestionText(question.questionText);
    setOptions(question.options.join(', '));
    setCorrectAnswer(question.correctAnswer);
    if (!showForm) toggleForm();
  };

  // Handle deletion with confirmation
  const handleDeleteQuestion = (questionId) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this question?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: async () => {
            try {
              await deleteQuestion(questionId);
              setQuestions(prev => prev.filter(q => q.id !== questionId));
              Alert.alert('Success', 'Question deleted successfully!');
            } catch (err) {
              setError(err.message);
            }
          }
        },
      ],
      { cancelable: false }
    );
  };

  // Render each question using the QuestionCard component
  const renderQuestion = ({ item }) => (
    <QuestionCard 
      question={item}
      onEdit={handleEditQuestion}
      onDelete={handleDeleteQuestion}
    />
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200ee']} />
          }
        >
          <Title style={styles.header}>Manage Questions</Title>
          {/* List of Questions */}
          <FlatList
            data={questions}
            keyExtractor={(item) => item.id}
            renderItem={renderQuestion}
            contentContainerStyle={styles.list}
          />
          {/* Form Header */}
          <Title style={styles.subHeader}>{editingQuestion ? 'Edit Question' : 'Add New Question'}</Title>
          {/* Animated Form for Adding/Editing */}
          {showForm && (
            <Animated.View
              style={[
                styles.form,
                { opacity: formAnim, transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] },
              ]}
            >
              <TextInput
                label="Question Text"
                mode="outlined"
                value={questionText}
                onChangeText={setQuestionText}
                style={styles.input}
              />
              <TextInput
                label="Options (comma-separated)"
                mode="outlined"
                value={options}
                onChangeText={setOptions}
                style={styles.input}
              />
              <TextInput
                label="Correct Answer"
                mode="outlined"
                value={correctAnswer}
                onChangeText={setCorrectAnswer}
                style={styles.input}
              />
              {error ? <HelperText type="error">{error}</HelperText> : null}
              <Button mode="contained" onPress={handleSubmitQuestion} style={styles.button}>
                {editingQuestion ? 'Update Question' : 'Submit Question'}
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

export default QuestionManagementScreen;
 
