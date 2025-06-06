import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView, Dimensions, StatusBar } from 'react-native';
import { 
  Appbar, 
  Searchbar, 
  Button, 
  Modal, 
  Portal, 
  TextInput, 
  HelperText, 
  Chip, 
  ActivityIndicator, 
  Text,
  Card,
  IconButton,
  RadioButton,
  Badge,
  Avatar,
  Title,
} from 'react-native-paper';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const TestManagementScreen = ({ navigation }) => {
  const [tests, setTests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTest, setCurrentTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [formData, setFormData] = useState({
    board: 'CBSE',
    standard: '',
    subject: '',
    chapter: '',
  });
  const [questions, setQuestions] = useState([
    {
      questionText: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
    }
  ]);
  const [errors, setErrors] = useState({});

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Science', 'English', 'History'];
  const boards = ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE'];
  const standards = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'tests'));
      const snapshot = await getDocs(q);
      
      const testData = [];
      snapshot.forEach(doc => {
        testData.push({ id: doc.id, ...doc.data() });
      });
      
      setTests(testData);
    } catch (err) {
      console.error("Error loading tests:", err);
      Alert.alert("Error", "Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const filteredTests = tests.filter(test => {
    const subject = test.subject?.toLowerCase() || '';
    const chapter = test.chapter?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    return subject.includes(query) || chapter.includes(query);
  });

  const handleAddTest = () => {
    setIsEditing(false);
    setCurrentTest(null);
    setFormData({
      board: 'CBSE',
      standard: '',
      subject: '',
      chapter: '',
    });
    setQuestions([
      {
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: '',
      }
    ]);
    setCurrentQuestionIndex(0);
    setVisible(true);
  };

  const handleEditTest = (test) => {
    setIsEditing(true);
    setCurrentTest(test);
    setFormData({
      board: test.board,
      standard: test.standard.toString(),
      subject: test.subject,
      chapter: test.chapter,
    });
    setQuestions(test.questions);
    setCurrentQuestionIndex(0);
    setVisible(true);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.board) newErrors.board = 'Board is required';
    if (!formData.standard) newErrors.standard = 'Standard is required';
    if (!formData.subject) newErrors.subject = 'Subject is required';
    if (!formData.chapter) newErrors.chapter = 'Chapter is required';
    
    const questionErrors = [];
    questions.forEach((q, index) => {
      const qErrors = {};
      if (!q.questionText) qErrors.questionText = 'Question text is required';
      if (q.options.some(opt => !opt)) qErrors.options = 'All options are required';
      if (!q.correctAnswer) qErrors.correctAnswer = 'Correct answer is required';
      
      if (Object.keys(qErrors).length > 0) {
        questionErrors[index] = qErrors;
      }
    });
    
    if (questionErrors.length > 0) {
      newErrors.questions = questionErrors;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const testData = {
        board: formData.board,
        standard: Number(formData.standard),
        subject: formData.subject,
        chapter: formData.chapter,
        questions: questions,
        createdAt: new Date(),
      };

      if (isEditing && currentTest) {
        await updateDoc(doc(db, 'tests', currentTest.id), testData);
        Alert.alert("Success", "Test updated successfully");
      } else {
        await addDoc(collection(db, 'tests'), testData);
        Alert.alert("Success", "Test added successfully");
      }

      loadTests();
      setVisible(false);
    } catch (err) {
      console.error("Error saving test:", err);
      Alert.alert("Error", "Failed to save test");
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this test?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'tests', id));
              loadTests();
              Alert.alert("Success", "Test deleted successfully");
            } catch (err) {
              console.error("Error deleting test:", err);
              Alert.alert("Error", "Failed to delete test");
            }
          }
        }
      ]
    );
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: '',
      }
    ]);
    setCurrentQuestionIndex(questions.length);
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) {
      Alert.alert("Warning", "A test must have at least one question");
      return;
    }
    
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
    
    if (currentQuestionIndex >= index) {
      setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
    }
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value
    };
    setQuestions(newQuestions);
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#3B2454" barStyle="light-content" />
      
      <LinearGradient
        colors={['#3B2454', '#5D3A8E']}
        style={styles.headerContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => navigation.goBack()} color="#fff" />
          <Appbar.Content 
            title="Test Management" 
            titleStyle={styles.headerTitle} 
          />
          <Appbar.Action 
            icon="plus" 
            onPress={handleAddTest} 
            color="#fff"
          />
        </Appbar.Header>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search tests..."
            onChangeText={handleSearch}
            value={searchQuery}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
            iconColor="#7c4dff"
            placeholderTextColor="#9e9e9e"
            elevation={1}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7c4dff" />
            <Text style={styles.loadingText}>Loading tests...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTests}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Card 
                style={styles.card} 
                onPress={() => navigation.navigate('TestPreview', { test: item })}
              >
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardBadge}>
                      <Badge size={24} style={styles.badge}>
                        {item.questions.length}
                      </Badge>
                      <Text style={styles.cardBadgeText}>
                        {item.questions.length === 1 ? 'Question' : 'Questions'}
                      </Text>
                    </View>
                    <View style={styles.cardActions}>
                      <IconButton 
                        icon="pencil-outline" 
                        size={20}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleEditTest(item);
                        }}
                        iconColor="#7c4dff"
                      />
                      <IconButton 
                        icon="delete-outline" 
                        size={20}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        iconColor="#ff5252"
                      />
                    </View>
                  </View>
                  <Text style={styles.cardTitle}>
                    {item.subject} - {item.chapter}
                  </Text>
                  <View style={styles.cardFooter}>
                    <Chip 
                      mode="outlined" 
                      style={styles.boardChip}
                      textStyle={styles.boardChipText}
                    >
                      {item.board}
                    </Chip>
                    <Chip 
                      mode="outlined" 
                      style={styles.classChip}
                      textStyle={styles.classChipText}
                    >
                      Class {item.standard}
                    </Chip>
                  </View>
                </Card.Content>
              </Card>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="file-question-outline" size={48} color="#9e9e9e" />
                <Title style={styles.emptyTitle}>No Tests Found</Title>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'Try a different search' : 'Create your first test'}
                </Text>
                <Button 
                  mode="contained" 
                  onPress={handleAddTest}
                  style={styles.addButton}
                  labelStyle={styles.addButtonLabel}
                  icon="plus"
                >
                  Add Test
                </Button>
              </View>
            }
          />
        )}
      </View>

      <Portal>
        <Modal 
          visible={visible} 
          onDismiss={() => setVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView 
            style={styles.modalScroll} 
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalHeader}>
              <Icon 
                name={isEditing ? "file-edit-outline" : "file-plus-outline"} 
                size={32} 
                color="#7c4dff" 
                style={styles.modalIcon}
              />
              <Title style={styles.modalTitle}>
                {isEditing ? 'Edit Test' : 'Create New Test'}
              </Title>
            </View>
            
            <Text style={styles.sectionTitle}>Test Information</Text>
            
            <View style={styles.formRow}>
              <View style={styles.dropdownContainer}>
                <Text style={styles.dropdownLabel}>Education Board</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.board}
                    onValueChange={(value) => setFormData({...formData, board: value})}
                    dropdownIconColor="#7c4dff"
                  >
                    {boards.map(board => (
                      <Picker.Item 
                        key={board} 
                        label={board} 
                        value={board} 
                      />
                    ))}
                  </Picker>
                </View>
                {errors.board && <HelperText type="error">{errors.board}</HelperText>}
              </View>
              
              <View style={styles.dropdownContainer}>
                <Text style={styles.dropdownLabel}>Class</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.standard}
                    onValueChange={(value) => setFormData({...formData, standard: value})}
                    dropdownIconColor="#7c4dff"
                  >
                    <Picker.Item label="Select Class" value="" />
                    {standards.map(std => (
                      <Picker.Item key={std} label={`Class ${std}`} value={std} />
                    ))}
                  </Picker>
                </View>
                {errors.standard && <HelperText type="error">{errors.standard}</HelperText>}
              </View>
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.dropdownContainer, { flex: 1 }]}>
                <Text style={styles.dropdownLabel}>Subject</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.subject}
                    onValueChange={(value) => setFormData({...formData, subject: value})}
                    dropdownIconColor="#7c4dff"
                  >
                    <Picker.Item label="Select Subject" value="" />
                    {subjects.map(subject => (
                      <Picker.Item key={subject} label={subject} value={subject} />
                    ))}
                  </Picker>
                </View>
                {errors.subject && <HelperText type="error">{errors.subject}</HelperText>}
              </View>
            </View>
            
            <TextInput
              label="Chapter Name"
              value={formData.chapter}
              onChangeText={(text) => setFormData({...formData, chapter: text})}
              style={styles.input}
              mode="outlined"
              error={!!errors.chapter}
              theme={{ colors: { primary: '#7c4dff' } }}
              left={<TextInput.Icon icon="bookmark-outline" color="#9e9e9e" />}
            />
            {errors.chapter && <HelperText type="error">{errors.chapter}</HelperText>}
            
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Questions</Text>
              <Button 
                mode="text" 
                onPress={addQuestion}
                icon="plus"
                labelStyle={styles.addQuestionButtonLabel}
              >
                Add Question
              </Button>
            </View>
            
            <ScrollView 
              horizontal 
              style={styles.questionsNavScroll}
              showsHorizontalScrollIndicator={false}
            >
              <View style={styles.questionsNav}>
                {questions.map((_, index) => (
                  <Chip
                    key={index}
                    style={[
                      styles.questionChip,
                      index === currentQuestionIndex && styles.questionChipActive
                    ]}
                    textStyle={[
                      styles.questionChipText,
                      index === currentQuestionIndex && styles.questionChipTextActive
                    ]}
                    onPress={() => setCurrentQuestionIndex(index)}
                  >
                    {index + 1}
                  </Chip>
                ))}
              </View>
            </ScrollView>
            
            {questions.length > 0 && (
              <View style={styles.questionContainer}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionNumber}>
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </Text>
                  {questions.length > 1 && (
                    <Button 
                      mode="text" 
                      icon="delete-outline" 
                      onPress={() => removeQuestion(currentQuestionIndex)}
                      labelStyle={styles.deleteQuestionButtonLabel}
                    >
                      Remove
                    </Button>
                  )}
                </View>
                
                <TextInput
                  label="Question Text"
                  value={questions[currentQuestionIndex].questionText}
                  onChangeText={(text) => updateQuestion(currentQuestionIndex, 'questionText', text)}
                  style={styles.input}
                  mode="outlined"
                  error={errors.questions?.[currentQuestionIndex]?.questionText}
                  multiline
                  theme={{ colors: { primary: '#7c4dff' } }}
                  left={<TextInput.Icon icon="format-question" color="#9e9e9e" />}
                />
                {errors.questions?.[currentQuestionIndex]?.questionText && (
                  <HelperText type="error">
                    {errors.questions[currentQuestionIndex].questionText}
                  </HelperText>
                )}
                
                <Text style={styles.optionsLabel}>Options (Select the correct one)</Text>
                {[0, 1, 2, 3].map(optIndex => (
                  <View key={optIndex} style={styles.optionRow}>
                    <RadioButton
                      value={optIndex.toString()}
                      status={
                        questions[currentQuestionIndex].correctAnswer === optIndex.toString() 
                          ? 'checked' 
                          : 'unchecked'
                      }
                      color="#7c4dff"
                      onPress={() => updateQuestion(
                        currentQuestionIndex, 
                        'correctAnswer', 
                        optIndex.toString()
                      )}
                    />
                    <TextInput
                      placeholder={`Option ${optIndex + 1}`}
                      value={questions[currentQuestionIndex].options[optIndex]}
                      onChangeText={(text) => updateOption(currentQuestionIndex, optIndex, text)}
                      style={styles.optionInput}
                      mode="outlined"
                      error={errors.questions?.[currentQuestionIndex]?.options}
                      theme={{ colors: { primary: '#7c4dff' } } }
                    />
                  </View>
                ))}
                {errors.questions?.[currentQuestionIndex]?.options && (
                  <HelperText type="error">
                    {errors.questions[currentQuestionIndex].options}
                  </HelperText>
                )}
                
                <TextInput
                  label="Explanation (Optional)"
                  value={questions[currentQuestionIndex].explanation}
                  onChangeText={(text) => updateQuestion(currentQuestionIndex, 'explanation', text)}
                  style={styles.input}
                  mode="outlined"
                  multiline
                  theme={{ colors: { primary: '#7c4dff' } }}
                  left={<TextInput.Icon icon="information-outline" color="#9e9e9e" />}
                />
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <Button 
                mode="outlined" 
                onPress={() => setVisible(false)}
                style={styles.cancelButton}
                labelStyle={styles.cancelButtonLabel}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={handleSubmit}
                style={styles.saveButton}
                labelStyle={styles.saveButtonLabel}
              >
                {isEditing ? 'Update Test' : 'Create Test'}
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  headerContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 10,
  },
  header: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    marginTop: StatusBar.currentHeight,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchbar: {
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 1,
  },
  searchInput: {
    color: '#2d3436',
    minHeight: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#636e72',
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    backgroundColor: '#fff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#7c4dff',
    marginRight: 8,
  },
  cardBadgeText: {
    fontSize: 14,
    color: '#636e72',
  },
  cardTitle: {
    fontWeight: '600',
    fontSize: 16,
    color: '#2d3436',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
  },
  boardChip: {
    marginRight: 8,
    backgroundColor: '#f3e5ff',
    borderColor: '#d1c4e9',
  },
  boardChipText: {
    color: '#7c4dff',
    fontSize: 12,
    fontWeight: '500',
  },
  classChip: {
    backgroundColor: '#e1f5fe',
    borderColor: '#b3e5fc',
  },
  classChipText: {
    color: '#0288d1',
    fontSize: 12,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d3436',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#636e72',
    textAlign: 'center',
  },
  addButton: {
    borderRadius: 12,
    backgroundColor: '#7c4dff',
    paddingHorizontal: 24,
  },
  addButtonLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 0,
    margin: 24,
    alignSelf: 'center',
    width: width - 48,
  },
  modalContent: {
    padding: 24,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIcon: {
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2d3436',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3436',
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dropdownContainer: {
    flex: 0.48,
  },
  dropdownLabel: {
    marginBottom: 8,
    fontSize: 14,
    color: '#636e72',
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  questionsNavScroll: {
    marginBottom: 16,
  },
  questionsNav: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  questionChip: {
    marginRight: 8,
    backgroundColor: '#f1f3f5',
  },
  questionChipActive: {
    backgroundColor: '#7c4dff',
  },
  questionChipText: {
    color: '#636e72',
    fontSize: 14,
    fontWeight: '600',
  },
  questionChipTextActive: {
    color: '#fff',
  },
  addQuestionButtonLabel: {
    color: '#7c4dff',
  },
  questionContainer: {
    marginBottom: 16,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
  },
  deleteQuestionButtonLabel: {
    color: '#ff5252',
  },
  optionsLabel: {
    fontSize: 14,
    marginBottom: 12,
    color: '#636e72',
    fontWeight: '500',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionInput: {
    flex: 1,
    marginLeft: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 0.48,
    borderRadius: 12,
    borderColor: '#b2bec3',
  },
  cancelButtonLabel: {
    color: '#636e72',
    fontWeight: '500',
  },
  saveButton: {
    flex: 0.48,
    borderRadius: 12,
    backgroundColor: '#7c4dff',
  },
  saveButtonLabel: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default TestManagementScreen;