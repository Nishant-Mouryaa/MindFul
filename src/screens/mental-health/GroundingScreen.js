import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  SafeAreaView,
  TextInput,
  Keyboard,
  Alert,
  Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase imports (adjust paths to your project structure)
import { getAuth } from 'firebase/auth';
import { db } from '../../config/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

export default function GroundingScreen() {
  // Exercise state
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [responses, setResponses] = useState({ 5: [], 4: [], 3: [], 2: [], 1: [] });
  const [inputValue, setInputValue] = useState('');
  
  // Mood tracking
  const [moodBefore, setMoodBefore] = useState(3); // 1-5 scale
  const [moodAfter, setMoodAfter] = useState(null);
  
  // Session history
  const [pastSessions, setPastSessions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const groundingSteps = [
    { title: '5 Things You Can See',    count: 5, icon: 'eye-outline',      color: '#4DB6AC' },
    { title: '4 Things You Can Touch',  count: 4, icon: 'gesture-tap',      color: '#64B5F6' },
    { title: '3 Things You Can Hear',   count: 3, icon: 'ear-hearing',      color: '#FFB74D' },
    { title: '2 Things You Can Smell',  count: 2, icon: 'scent',            color: '#BA68C8' },
    { title: '1 Thing You Can Taste',   count: 1, icon: 'food-apple-outline', color: '#E57373' },
  ];

  // ========================
  // Data Management
  // ========================

  // Load last session on mount
  useEffect(() => {
    loadLastSession();
    fetchPastSessions();
  }, []);

  const loadLastSession = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('lastGroundingSession');
      if (jsonValue) {
        const data = JSON.parse(jsonValue);
        setResponses(data.responses || { 5: [], 4: [], 3: [], 2: [], 1: [] });
      }
    } catch (e) {
      console.error("Failed to load session", e);
    }
  };

  const fetchPastSessions = async () => {
    const auth = getAuth();
    if (!auth.currentUser) return;

    try {
      const q = query(
        collection(db, 'groundingSessions'),
        where('userId', '==', auth.currentUser.uid),
        where('timestamp', '!=', null)
      );
      const querySnapshot = await getDocs(q);
      setPastSessions(querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().timestamp?.toDate() || new Date()
      })));
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const saveSession = async () => {
    const sessionData = {
      responses,
      moodBefore,
      moodAfter: moodAfter || moodBefore, // Default to before if not set
      timestamp: new Date()
    };

    // 1. Save locally
    await AsyncStorage.setItem(
      'lastGroundingSession',
      JSON.stringify(sessionData)
    );

    // 2. Save to Firestore if logged in
    const auth = getAuth();
    if (auth.currentUser) {
      try {
        await addDoc(collection(db, 'groundingSessions'), {
          userId: auth.currentUser.uid,
          ...sessionData,
          timestamp: serverTimestamp()
        });
      } catch (error) {
        console.error("Firestore save error:", error);
      }
    }
  };

  // ========================
  // Exercise Flow
  // ========================

  const startGrounding = () => {
    // Reset all exercise-related states
    setResponses({ 5: [], 4: [], 3: [], 2: [], 1: [] }); // Clear previous responses
    setInputValue(''); // Clear any input text
    setCurrentStep(0); // Reset to first step
    setMoodAfter(null); // Reset after-mood
    setIsActive(true); // Start exercise
  };

  const finishGrounding = async () => {
    setIsActive(false);
    await saveSession();
    fetchPastSessions(); // Refresh history
  };

  // ========================
  // UI Components
  // ========================

  const renderMoodSelector = (currentMood, setMood) => (
    <View style={styles.moodContainer}>
      {[1, 2, 3, 4, 5].map(num => (
        <TouchableOpacity
          key={num}
          onPress={() => setMood(num)}
          style={[
            styles.moodButton,
            currentMood === num && { backgroundColor: '#E3F2FD' }
          ]}
        >
          <Text style={styles.moodText}>{num}</Text>
          {num === 1 && <Text style={styles.moodLabel}>Worst</Text>}
          {num === 5 && <Text style={styles.moodLabel}>Best</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderHistoryModal = () => (
    <Modal visible={showHistory} animationType="slide">
      <SafeAreaView style={styles.modalContainer}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => setShowHistory(false)}
        >
          <MaterialCommunityIcons name="close" size={24} color="#666" />
        </TouchableOpacity>

        <Text style={styles.modalTitle}>Past Sessions</Text>
        
        {pastSessions.length === 0 ? (
          <Text style={styles.emptyText}>No past sessions found</Text>
        ) : (
          <ScrollView>
            {pastSessions.map(session => (
              <View key={session.id} style={styles.sessionCard}>
                <Text style={styles.sessionDate}>
                  {session.date.toLocaleDateString()}
                </Text>
                <View style={styles.moodComparison}>
                  <Text>Before: {session.moodBefore}/5</Text>
                  <Text>After: {session.moodAfter}/5</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  //---------------------------------------------------------------------------
  // Animation Helpers
  //---------------------------------------------------------------------------
  const runAnimation = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
  };

  useEffect(() => {
    if (isActive) {
      runAnimation();
    }
  }, [isActive, currentStep]);

  //---------------------------------------------------------------------------
  // Step Navigation
  //---------------------------------------------------------------------------
  const nextStep = () => {
    if (currentStep < groundingSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      finishGrounding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  //---------------------------------------------------------------------------
  // Response Handlers
  //---------------------------------------------------------------------------
  const addResponse = () => {
    if (inputValue.trim() === '') return;
    const count = groundingSteps[currentStep].count;
    setResponses((prev) => ({
      ...prev,
      [count]: [...prev[count], inputValue.trim()],
    }));
    setInputValue('');
  };

  const removeResponse = (index) => {
    const count = groundingSteps[currentStep].count;
    setResponses((prev) => ({
      ...prev,
      [count]: prev[count].filter((_, i) => i !== index),
    }));
  };

  //---------------------------------------------------------------------------
  // Rendering Logic
  //---------------------------------------------------------------------------
  const currentStepData = groundingSteps[currentStep];
  const currentResponses = responses[currentStepData.count];
  const isStepComplete = currentResponses.length >= currentStepData.count;

  const renderStartScreen = () => (
    <View style={styles.startContainer}>
      <View style={[styles.card, styles.introCard]}>
        <MaterialCommunityIcons name="earth" size={60} color="#64B5F6" style={{ marginBottom: 15 }}/>
        <Text style={styles.title}>5-4-3-2-1 Grounding</Text>
        <Text style={styles.subtitle}>
          A simple technique to anchor you in the present moment during times of anxiety or distress.
        </Text>
        <TouchableOpacity style={styles.startButton} onPress={startGrounding}>
          <Text style={styles.startButtonText}>Begin Exercise</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Conditionally show summary if there is any data */}
      {Object.values(responses).some(r => r.length > 0) && renderSummary()}
    </View>
  );

  const renderSummary = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Last Session Summary</Text>
      {groundingSteps.map(step => (
        responses[step.count].length > 0 && (
          <View key={step.count} style={styles.summarySection}>
            <Text style={[styles.summaryCategory, {color: step.color}]}>{step.title}</Text>
            {responses[step.count].map((item, index) => (
              <Text key={index} style={styles.summaryItem}>• {item}</Text>
            ))}
          </View>
        )
      ))}
    </View>
  );

  const renderExerciseScreen = () => (
    <Animated.View style={{opacity: fadeAnim, transform: [{translateY: slideAnim}]}}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        {groundingSteps.map((step, index) => (
          <View
            key={index}
            style={[
              styles.progressSegment,
              index < currentStep && { backgroundColor: groundingSteps[index].color, opacity: 0.5 },
              index === currentStep && { backgroundColor: groundingSteps[index].color },
            ]}
          />
        ))}
      </View>

      {/* Main Card for the current step */}
      <View style={[styles.card, {borderColor: currentStepData.color}]}>
        <View style={styles.stepHeader}>
          <View style={[styles.stepIconContainer, {backgroundColor: currentStepData.color + '20'}]}>
            <MaterialCommunityIcons 
              name={currentStepData.icon} 
              size={28} 
              color={currentStepData.color} 
            />
          </View>
          <View>
            <Text style={styles.stepTitle}>{currentStepData.title}</Text>
            <Text style={styles.stepCount}>
              ({currentResponses.length}/{currentStepData.count})
            </Text>
          </View>
        </View>
        
        {/* Responses for the current step */}
        <View style={styles.responseList}>
          {currentResponses.map((item, index) => (
            <View key={index} style={styles.responseChip}>
              <Text style={styles.responseChipText}>{item}</Text>
              <TouchableOpacity onPress={() => removeResponse(index)}>
                <MaterialCommunityIcons name="close-circle" size={18} color={currentStepData.color} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Input for new response (only if step isn't complete) */}
        {!isStepComplete && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={`Name something you can ${currentStepData.title.split(' ').pop().toLowerCase()}...`}
              value={inputValue}
              onChangeText={setInputValue}
              onSubmitEditing={addResponse}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.addButton, {backgroundColor: currentStepData.color}]}
              onPress={addResponse}
            >
              <MaterialCommunityIcons name="plus" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          style={[
            styles.navButton,
            styles.prevButton,
            {opacity: currentStep === 0 ? 0.5 : 1}
          ]}
          onPress={prevStep}
          disabled={currentStep === 0}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#555" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.navButton,
            styles.nextButton,
            {backgroundColor: currentStepData.color},
            !isStepComplete && styles.disabledButton
          ]}
          onPress={nextStep}
          disabled={!isStepComplete}
        >
          <Text style={styles.navButtonText}>
            {currentStep < groundingSteps.length - 1 ? 'Next' : 'Finish'}
          </Text>
          <MaterialCommunityIcons
            name={currentStep < groundingSteps.length - 1 ? 'arrow-right' : 'check'}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  //---------------------------------------------------------------------------
  // Render
  //---------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!isActive ? renderStartScreen() : renderExerciseScreen()}
      </ScrollView>
      {renderHistoryModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },

  // Intro / Start screen
  startContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  introCard: {
    alignItems: 'center',
    padding: 30,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: '#64B5F6',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },

  // Summary
  summarySection: {
    marginBottom: 15,
  },
  summaryCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  summaryItem: {
    fontSize: 15,
    color: '#555',
    marginLeft: 10,
  },

  // Progress indicator
  progressContainer: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginBottom: 25,
    overflow: 'hidden',
  },
  progressSegment: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // Step header
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  stepCount: {
    fontSize: 14,
    color: '#999',
  },

  // Responses list
  responseList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  responseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  responseChipText: {
    fontSize: 15,
    color: '#333',
    marginRight: 6,
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 10,
  },
  addButton: {
    padding: 15,
    borderRadius: 10,
  },

  // Navigation
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 25,
  },
  prevButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  nextButton: {
    paddingHorizontal: 20,
  },
  disabledButton: {
    backgroundColor: '#BDBDBD',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },

  // Mood Selector
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  moodButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBDEFB'
  },
  moodText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2'
  },
  moodLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4
  },
  
  // History Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  sessionCard: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10
  },
  sessionDate: {
    fontWeight: 'bold',
    marginBottom: 5
  },
  moodComparison: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20
  }
});

