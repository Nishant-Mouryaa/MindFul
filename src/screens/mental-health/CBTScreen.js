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
import { LinearGradient } from 'expo-linear-gradient';

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
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const cbtSteps = [
    {
      title: 'The Situation',
      description: 'Describe what happened that triggered your negative emotion',
      field: 'situation',
      placeholder: 'What happened? Where? When? Who was involved?',
      icon: 'map-marker',
    },
    {
      title: 'Your Emotion',
      description: 'What emotion did you feel? Rate its intensity (1-10)',
      field: 'emotion',
      placeholder: 'e.g., Anxiety (8/10), Sadness (6/10), Anger (9/10)',
      icon: 'heart',
    },
    {
      title: 'Automatic Thought',
      description: 'What thought went through your mind?',
      field: 'automaticThought',
      placeholder: 'What did you think about the situation?',
      icon: 'brain',
    },
    {
      title: 'Evidence For',
      description: 'What evidence supports this thought?',
      field: 'evidenceFor',
      placeholder: 'What facts support this thought?',
      icon: 'check-circle',
    },
    {
      title: 'Evidence Against',
      description: 'What evidence contradicts this thought?',
      field: 'evidenceAgainst',
      placeholder: 'What facts contradict this thought?',
      icon: 'close-circle',
    },
    {
      title: 'Balanced Thought',
      description: 'What is a more balanced, realistic thought?',
      field: 'balancedThought',
      placeholder: 'What would be a more balanced perspective?',
      icon: 'scale-balance',
    },
    {
      title: 'New Emotion',
      description: 'How do you feel now? Rate the intensity (1-10)',
      field: 'newEmotion',
      placeholder: 'e.g., Calm (3/10), Hopeful (7/10)',
      icon: 'emoticon-happy',
    },
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [currentStep]);

  const updateField = (field, value) => {
    setThoughtRecord(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const nextStep = () => {
    if (currentStep < cbtSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      fadeAnim.setValue(0);
    } else {
      // Complete the thought record
      saveThoughtRecord();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      fadeAnim.setValue(0);
    }
  };

  const saveThoughtRecord = () => {
    const newRecord = {
      ...thoughtRecord,
      id: Date.now(),
      date: new Date().toISOString(),
    };
    setSavedRecords(prev => [newRecord, ...prev]);
    setThoughtRecord({
      situation: '',
      emotion: '',
      automaticThought: '',
      evidenceFor: '',
      evidenceAgainst: '',
      balancedThought: '',
      newEmotion: '',
    });
    setCurrentStep(0);
    Alert.alert('Success', 'Your thought record has been saved!');
  };

  const currentStepData = cbtSteps[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>CBT Thought Record</Text>
            <Text style={styles.subtitle}>Challenge Your Negative Thoughts</Text>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {cbtSteps.map((step, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index <= currentStep && styles.progressDotActive,
                ]}
              />
            ))}
          </View>

          {/* Current Step */}
          <Animated.View 
            style={[
              styles.stepContainer,
              { opacity: fadeAnim },
            ]}
          >
            <View style={styles.stepHeader}>
              <MaterialCommunityIcons 
                name={currentStepData.icon} 
                size={40} 
                color="#fff" 
              />
              <Text style={styles.stepTitle}>{currentStepData.title}</Text>
            </View>
            
            <Text style={styles.stepDescription}>{currentStepData.description}</Text>
            
            <TextInput
              style={styles.textInput}
              placeholder={currentStepData.placeholder}
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={thoughtRecord[currentStepData.field]}
              onChangeText={(text) => updateField(currentStepData.field, text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Animated.View>

          {/* Navigation */}
          <View style={styles.navigationContainer}>
            {currentStep > 0 && (
              <TouchableOpacity style={styles.prevButton} onPress={prevStep}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                <Text style={styles.prevButtonText}>Previous</Text>
              </TouchableOpacity>
            )}
            
            {currentStep < cbtSteps.length - 1 ? (
              <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
                <Text style={styles.nextButtonText}>Next</Text>
                <MaterialCommunityIcons name="arrow-right" size={24} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.completeButton} onPress={nextStep}>
                <Text style={styles.completeButtonText}>Complete</Text>
                <MaterialCommunityIcons name="check" size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {/* Saved Records */}
          {savedRecords.length > 0 && (
            <View style={styles.savedRecordsContainer}>
              <Text style={styles.savedRecordsTitle}>Previous Thought Records</Text>
              {savedRecords.slice(0, 3).map((record, index) => (
                <View key={record.id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <Text style={styles.recordDate}>
                      {new Date(record.date).toLocaleDateString()}
                    </Text>
                    <MaterialCommunityIcons name="file-document" size={20} color="#fff" />
                  </View>
                  <Text style={styles.recordSituation} numberOfLines={2}>
                    {record.situation}
                  </Text>
                  <Text style={styles.recordEmotion}>
                    {record.emotion} → {record.newEmotion}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 3,
  },
  progressDotActive: {
    backgroundColor: '#fff',
  },
  stepContainer: {
    flex: 1,
    marginBottom: 30,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  stepDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 20,
    lineHeight: 22,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minHeight: 120,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  prevButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  savedRecordsContainer: {
    marginTop: 20,
  },
  savedRecordsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  recordCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  recordSituation: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
    lineHeight: 18,
  },
  recordEmotion: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
  },
}); 