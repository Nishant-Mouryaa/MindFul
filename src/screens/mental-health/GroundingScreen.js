
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

// Import theme constants
import {
  Palette,
  spacing,
  typography,
  shadows,
  borderRadius,
} from '../../theme/colors'; // Adjust the import path as needed

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
    { title: '5 Things You Can See',    count: 5, icon: 'eye-outline',        color: Palette.primary },
    { title: '4 Things You Can Touch',  count: 4, icon: 'gesture-tap',        color: Palette.secondaryBlue },
    { title: '3 Things You Can Hear',   count: 3, icon: 'ear-hearing',        color: Palette.secondaryOrange },
    { title: '2 Things You Can Smell',  count: 2, icon: 'scent',              color: Palette.secondaryPink },
    { title: '1 Thing You Can Taste',   count: 1, icon: 'food-apple-outline', color: Palette.secondaryRed },
  ];

  // ========================
  // Data Management
  // ========================
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
      moodAfter: moodAfter || moodBefore,
      timestamp: new Date()
    };
    // 1. Save locally
    await AsyncStorage.setItem('lastGroundingSession', JSON.stringify(sessionData));

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
    setResponses({ 5: [], 4: [], 3: [], 2: [], 1: [] });
    setInputValue('');
    setCurrentStep(0);
    setMoodAfter(null);
    setIsActive(true);
  };

  const finishGrounding = async () => {
    setIsActive(false);
    await saveSession();
    fetchPastSessions();
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
            currentMood === num && styles.moodButtonSelected
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
          <MaterialCommunityIcons name="close" size={24} color={Palette.textLight} />
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

  // Animation Helpers
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

  // Step Navigation
  const nextStep = () => {
    if (currentStep < groundingSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishGrounding();
    }
  };
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Response Handlers
  const addResponse = () => {
    if (inputValue.trim() === '') return;
    const count = groundingSteps[currentStep].count;
    setResponses(prev => ({
      ...prev,
      [count]: [...prev[count], inputValue.trim()],
    }));
    setInputValue('');
  };

  const removeResponse = (index) => {
    const count = groundingSteps[currentStep].count;
    setResponses(prev => ({
      ...prev,
      [count]: prev[count].filter((_, i) => i !== index),
    }));
  };

  // Rendering Logic
  const currentStepData = groundingSteps[currentStep];
  const currentResponses = responses[currentStepData.count];
  const isStepComplete = currentResponses.length >= currentStepData.count;

  const renderStartScreen = () => (
    <View style={styles.startContainer}>
      <View style={[styles.card, styles.introCard, shadows.medium]}>
        <MaterialCommunityIcons name="earth" size={60} color={Palette.secondaryBlue} style={{ marginBottom: spacing.md }}/>
        <Text style={styles.title}>5-4-3-2-1 Grounding</Text>
        <Text style={styles.subtitle}>
          A simple technique to anchor you in the present moment during times of anxiety or distress.
        </Text>
        <TouchableOpacity style={styles.startButton} onPress={startGrounding}>
          <Text style={styles.startButtonText}>Begin Exercise</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color={Palette.white} />
        </TouchableOpacity>
      </View>

      {Object.values(responses).some(r => r.length > 0) && renderSummary()}
    </View>
  );

  const renderSummary = () => (
    <View style={[styles.card, shadows.low]}>
      <Text style={styles.cardTitle}>Last Session Summary</Text>
      {groundingSteps.map(step => (
        responses[step.count].length > 0 && (
          <View key={step.count} style={styles.summarySection}>
            <Text style={[styles.summaryCategory, { color: step.color }]}>
              {step.title}
            </Text>
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
        {groundingSteps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          return (
            <View
              key={index}
              style={[
                styles.progressSegment,
                isCompleted && { backgroundColor: step.color, opacity: 0.5 },
                isCurrent && { backgroundColor: step.color },
              ]}
            />
          );
        })}
      </View>

      {/* Main Card for current step */}
      <View style={[
        styles.card,
        shadows.medium,
        { borderColor: currentStepData.color }
      ]}>
        <View style={styles.stepHeader}>
          <View style={[
            styles.stepIconContainer, 
            { backgroundColor: currentStepData.color + '20' }
          ]}>
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
        
        {/* Responses */}
        <View style={styles.responseList}>
          {currentResponses.map((item, index) => (
            <View key={index} style={styles.responseChip}>
              <Text style={styles.responseChipText}>{item}</Text>
              <TouchableOpacity onPress={() => removeResponse(index)}>
                <MaterialCommunityIcons 
                  name="close-circle"
                  size={18}
                  color={currentStepData.color}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Input (only if step isn't complete) */}
        {!isStepComplete && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={`Name something you can ${
                currentStepData.title.split(' ').pop().toLowerCase()}...`}
              value={inputValue}
              onChangeText={setInputValue}
              onSubmitEditing={addResponse}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: currentStepData.color }]}
              onPress={addResponse}
            >
              <MaterialCommunityIcons name="plus" size={24} color={Palette.white} />
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
            { opacity: currentStep === 0 ? 0.5 : 1 }
          ]}
          onPress={prevStep}
          disabled={currentStep === 0}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={Palette.textMedium} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            { backgroundColor: currentStepData.color },
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
            color={Palette.white}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!isActive ? renderStartScreen() : renderExerciseScreen()}
      </ScrollView>
      {renderHistoryModal()}
    </SafeAreaView>
  );
}

// Updated styles referencing the theme constants
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scrollContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },

  // Intro / Start screen
  startContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  introCard: {
    alignItems: 'center',
    padding: spacing.xxl,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: Palette.textDark,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: Palette.textLight,
    lineHeight: 22, // or typography.body.lineHeight
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: Palette.secondaryBlue,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  startButtonText: {
    ...typography.body,
    color: Palette.white,
    fontWeight: 'bold',
    marginRight: spacing.xs,
    fontSize: 18, // Larger text for the button
  },

  // Shadow card
  card: {
    backgroundColor: Palette.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  cardTitle: {
    ...typography.h2,
    color: Palette.textDark,
    marginBottom: spacing.md,
  },

  // Summary
  summarySection: {
    marginBottom: spacing.md,
  },
  summaryCategory: {
    ...typography.body,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  summaryItem: {
    ...typography.small,
    color: Palette.textMedium,
    marginLeft: spacing.xs,
  },

  // Progress indicator
  progressContainer: {
    flexDirection: 'row',
    height: 8,
    borderRadius: borderRadius.sm,
    backgroundColor: Palette.border,
    marginBottom: spacing.lg,
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
    marginBottom: spacing.md,
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  stepTitle: {
    ...typography.h3,
    fontWeight: 'bold',
    color: Palette.textDark,
  },
  stepCount: {
    ...typography.small,
    color: Palette.textLight,
  },

  // Responses
  responseList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  responseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.background,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  responseChipText: {
    ...typography.small,
    color: Palette.textDark,
    marginRight: spacing.xs,
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: Palette.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
    borderWidth: 1,
    borderColor: Palette.border,
    marginRight: spacing.sm,
  },
  addButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
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
    padding: spacing.md,
    borderRadius: borderRadius.full,
  },
  prevButton: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  nextButton: {
    paddingHorizontal: spacing.xl,
  },
  disabledButton: {
    backgroundColor: '#BDBDBD',
  },
  navButtonText: {
    ...typography.body,
    fontWeight: 'bold',
    color: Palette.white,
    marginHorizontal: spacing.xs,
  },

  // Mood Selector
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.lg,
  },
  moodButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBDEFB', // Or switch to a palette color
  },
  moodButtonSelected: {
    backgroundColor: '#E3F2FD', // Or switch to a palette color
  },
  moodText: {
    ...typography.body,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2', // Or switch to a palette color
  },
  moodLabel: {
    ...typography.small,
    color: Palette.textLight,
    marginTop: 4,
  },
  
  // History Modal
  modalContainer: {
    flex: 1,
    backgroundColor: Palette.white,
    padding: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  sessionCard: {
    backgroundColor: Palette.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  sessionDate: {
    ...typography.body,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  moodComparison: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: Palette.textLight,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
