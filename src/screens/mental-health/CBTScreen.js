import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
// Firebase imports
import { getAuth } from 'firebase/auth';
import { db } from '../../config/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

export default function CBTScreen() {
  const [thoughtRecord, setThoughtRecord] = useState({
    situation: '',
    emotion: '',
    automaticThought: '',
    evidenceFor: '',
    evidenceAgainst: '',
    balancedThought: '',
    newEmotion: '',
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [savedRecords, setSavedRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Fallback if cbtSteps[currentStep] is ever out of range or undefined
  const defaultStepData = {
    title: 'Loading…',
    description: '',
    field: '',
    placeholder: '',
    icon: 'help-circle-outline',
    color: '#CCCCCC',
  };

  const cbtSteps = [
    {
      title: 'The Situation',
      description: 'Describe what happened that triggered your negative emotion.',
      field: 'situation',
      placeholder: 'e.g., I made a mistake on a work project.',
      icon: 'map-marker-outline',
      color: '#4DB6AC'
    },
    {
      title: 'Your Emotion(s)',
      description: 'What emotion(s) did you feel? Rate their intensity (1-10).',
      field: 'emotion',
      placeholder: 'e.g., Anxiety (8/10), Shame (6/10)',
      icon: 'emoticon-sad-outline',
      color: '#FFB74D'
    },
    {
      title: 'Automatic Thought(s)',
      description: 'What thought(s) went through your mind?',
      field: 'automaticThought',
      placeholder: 'e.g., "I\'m a failure", "I always mess things up."',
      icon: 'brain',
      color: '#7986CB'
    },
    {
      title: 'Evidence For',
      description: 'List objective facts that support your automatic thought(s).',
      field: 'evidenceFor',
      placeholder: 'Focus on facts, not interpretations.',
      icon: 'check-circle-outline',
      color: '#64B5F6'
    },
    {
      title: 'Evidence Against',
      description: 'List objective facts that contradict your automatic thought(s).',
      field: 'evidenceAgainst',
      placeholder: 'Is there another way to see this?',
      icon: 'close-circle-outline',
      color: '#E57373'
    },
    {
      title: 'Balanced Thought',
      description: 'Create a more balanced, realistic thought based on the evidence.',
      field: 'balancedThought',
      placeholder: 'e.g., "I made a mistake, but it doesn\'t mean I\'m a failure."',
      icon: 'scale-balance',
      color: '#BA68C8'
    },
    {
      title: 'New Emotion(s)',
      description: 'How do you feel now? Rate the new intensity (1-10).',
      field: 'newEmotion',
      placeholder: 'e.g., Relief (4/10).',
      icon: 'emoticon-happy-outline',
      color: '#81C784'
    },
  ];

  // Safely retrieve the step data by bounding currentStep
  const stepCount = cbtSteps.length;
  const safeStepIndex = currentStep >= 0 && currentStep < stepCount ? currentStep : 0;
  const currentStepData = cbtSteps[safeStepIndex] || defaultStepData;

  // Animate when the step changes
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
    runAnimation();
  }, [currentStep]);

  // Update a specific field in thoughtRecord
  const updateField = (field, value) => {
    setThoughtRecord(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Navigation handlers
  const nextStep = () => {
    if (safeStepIndex < stepCount - 1) {
      setCurrentStep(safeStepIndex + 1);
    } else {
      // If we're on the last step, attempt to save
      saveThoughtRecord();
    }
  };

  const prevStep = () => {
    if (safeStepIndex > 0) {
      setCurrentStep(safeStepIndex - 1);
    }
  };

  // ========================
  // Firestore Integration
  // ========================
  // On component mount, load existing records
  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const auth = getAuth();
      if (auth.currentUser) {
        const q = query(
          collection(db, 'cbtRecords'),
          where('userId', '==', auth.currentUser.uid),
          where('timestamp', '!=', null)
        );
        const querySnapshot = await getDocs(q);
        const firestoreRecords = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().timestamp?.toDate() || new Date()
        }));
        setSavedRecords(firestoreRecords);
        await AsyncStorage.setItem('cbtRecords', JSON.stringify(firestoreRecords));
      } else {
        // If user not authenticated, use AsyncStorage
        const localRecords = await AsyncStorage.getItem('cbtRecords');
        if (localRecords) {
          setSavedRecords(JSON.parse(localRecords));
        }
      }
    } catch (error) {
      console.error("Error loading records:", error);
      // Fallback to local if Firestore fails
      const localRecords = await AsyncStorage.getItem('cbtRecords');
      if (localRecords) {
        setSavedRecords(JSON.parse(localRecords));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveThoughtRecord = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
  
    if (!user) {
      Alert.alert("Not logged in", "Please sign in to save your records.");
      return;
    }
  
    const newRecord = {
      ...thoughtRecord,
      userId: user.uid, // Make sure this is included
      date: new Date().toISOString(),
      timestamp: serverTimestamp(),
    };
  
    try {
      setIsLoading(true);
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'cbtRecords'), newRecord);
      console.log("Document written with ID: ", docRef.id);
      
      // Update local state
      setSavedRecords(prev => [{
        ...newRecord,
        id: docRef.id // Include Firestore ID
      }, ...prev]);
      
      // Reset form
      setThoughtRecord({ /* reset all fields */ });
      setCurrentStep(0);
      
      Alert.alert('Success', 'Record saved successfully!');
      
    } catch (error) {
      console.error("Error saving record:", error);
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ========================
  // UI Renderers
  // ========================

  // Button to handle either "Next" or "Complete" based on the step
  const renderSaveButton = () => {
    if (isLoading) {
      return (
        <TouchableOpacity 
          style={[styles.navButton, styles.nextButton, { backgroundColor: '#BDBDBD' }]}
          disabled
        >
          <MaterialCommunityIcons name="loading" size={20} color="#fff" />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity 
        style={[styles.navButton, styles.nextButton, { backgroundColor: currentStepData.color }]} 
        onPress={nextStep}
      >
        <Text style={[styles.navButtonText, { color: '#fff' }]}>
          {safeStepIndex < stepCount - 1 ? 'Next' : 'Complete'}
        </Text>
        <MaterialCommunityIcons
          name={safeStepIndex < stepCount - 1 ? 'arrow-right' : 'check'}
          size={20}
          color="#fff"
        />
      </TouchableOpacity>
    );
  };

  const navigationContainer = (
    <View style={styles.navigationContainer}>
      <TouchableOpacity
        style={[styles.navButton, styles.prevButton, { opacity: safeStepIndex === 0 ? 0.5 : 1 }]} 
        onPress={prevStep}
        disabled={safeStepIndex === 0}
      >
        <MaterialCommunityIcons name="arrow-left" size={20} color="#555" />
        <Text style={styles.navButtonText}>Prev</Text>
      </TouchableOpacity>

      {renderSaveButton()}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>CBT Thought Record</Text>
          <Text style={styles.subtitle}>
            A tool to identify and challenge negative thinking patterns.
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          {cbtSteps.map((step, index) => (
            <View
              key={index}
              style={[
                styles.progressSegment,
                index <= safeStepIndex && {
                  backgroundColor: step?.color ?? defaultStepData.color
                },
              ]}
            />
          ))}
        </View>

        {/* Current Step Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              borderColor: currentStepData?.color ?? defaultStepData.color,
            },
          ]}
        >
          <View style={styles.stepHeader}>
            <View style={[
              styles.stepIconContainer,
              { backgroundColor: (currentStepData?.color ?? defaultStepData.color) + '20' }
            ]}>
              <MaterialCommunityIcons
                name={currentStepData?.icon ?? defaultStepData.icon}
                size={28}
                color={currentStepData?.color ?? defaultStepData.color}
              />
            </View>
            <Text style={styles.stepTitle}>
              {currentStepData?.title ?? defaultStepData.title}
            </Text>
          </View>

          <Text style={styles.stepDescription}>
            {currentStepData?.description ?? ''}
          </Text>

          <TextInput
            style={styles.textInput}
            placeholder={currentStepData?.placeholder ?? ''}
            placeholderTextColor="#999"
            value={thoughtRecord[currentStepData?.field] ?? ''}
            onChangeText={(text) => updateField(currentStepData?.field, text)}
            multiline
            textAlignVertical="top"
          />
        </Animated.View>

        {/* Navigation Buttons */}
        {navigationContainer}

        {/* Recent Saved Records (Optional) */}
        {savedRecords.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Records</Text>
            <View style={{ alignItems: 'flex-end', marginBottom: 8 }}>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('SavedRecordsScreen')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="eye" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.viewAllButtonText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {savedRecords.slice(0, 2).map((record) => (
              <View key={record.id ?? record.date} style={styles.recordItem}>
                <MaterialCommunityIcons name="file-document-outline" size={24} color="#7986CB" />
                <View style={styles.recordTextContainer}>
                  <Text style={styles.recordSituation} numberOfLines={1}>
                    {record.situation || 'Untitled Record'}
                  </Text>
                  <Text style={styles.recordDate}>
                    {new Date(record.date).toLocaleDateString()}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

////////////////////////////////////////////////////////////////////////////////
// Styles
////////////////////////////////////////////////////////////////////////////////

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
    marginBottom: 25,
    overflow: 'hidden',
  },
  progressSegment: {
    flex: 1,
    backgroundColor: '#E0E0E0',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    flex: 1,
  },
  stepDescription: {
    fontSize: 15,
    color: '#555',
    marginBottom: 20,
    lineHeight: 22,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  prevButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  nextButton: {
    // The dynamic backgroundColor is set in renderSaveButton()
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  recordTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  recordSituation: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  recordDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7986CB',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    elevation: 2,
  },
  viewAllButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
