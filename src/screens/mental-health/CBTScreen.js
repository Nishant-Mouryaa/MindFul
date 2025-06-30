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
  const slideAnim = useRef(new Animated.Value(30)).current;

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
      description: 'List the objective facts that support your automatic thought(s).',
      field: 'evidenceFor',
      placeholder: 'Focus on facts, not interpretations.',
      icon: 'check-circle-outline',
      color: '#64B5F6'
    },
    {
      title: 'Evidence Against',
      description: 'List the objective facts that contradict your automatic thought(s).',
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
      placeholder: 'e.g., Relief (4/10), More realistic (5/10)',
      icon: 'emoticon-happy-outline',
      color: '#81C784'
    },
  ];

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
  }

  useEffect(() => {
    runAnimation();
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
    } else {
      saveThoughtRecord();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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
    Alert.alert('Success!', 'Your thought record has been saved. You can view it in your progress tab.');
  };

  const currentStepData = cbtSteps[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>CBT Thought Record</Text>
          <Text style={styles.subtitle}>A tool to identify and challenge negative thinking patterns.</Text>
        </View>

        <View style={styles.progressContainer}>
          {cbtSteps.map((step, index) => (
            <View
              key={index}
              style={[
                styles.progressSegment,
                index <= currentStep && { backgroundColor: cbtSteps[index].color },
              ]}
            />
          ))}
        </View>

        <Animated.View 
          style={[
            styles.card,
            { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                borderColor: currentStepData.color
            },
          ]}
        >
          <View style={styles.stepHeader}>
            <View style={[styles.stepIconContainer, {backgroundColor: currentStepData.color + '20'}]}>
                <MaterialCommunityIcons 
                    name={currentStepData.icon} 
                    size={28} 
                    color={currentStepData.color} 
                />
            </View>
            <Text style={styles.stepTitle}>{currentStepData.title}</Text>
          </View>
          
          <Text style={styles.stepDescription}>{currentStepData.description}</Text>
          
          <TextInput
            style={styles.textInput}
            placeholder={currentStepData.placeholder}
            placeholderTextColor="#999"
            value={thoughtRecord[currentStepData.field]}
            onChangeText={(text) => updateField(currentStepData.field, text)}
            multiline
            textAlignVertical="top"
          />
        </Animated.View>

        <View style={styles.navigationContainer}>
          <TouchableOpacity 
            style={[styles.navButton, styles.prevButton, {opacity: currentStep === 0 ? 0.5 : 1}]} 
            onPress={prevStep}
            disabled={currentStep === 0}
            >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#555" />
            <Text style={styles.navButtonText}>Prev</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navButton, styles.nextButton, {backgroundColor: currentStepData.color}]} 
            onPress={nextStep}
            >
            <Text style={[styles.navButtonText, {color: '#fff'}]}>
                {currentStep < cbtSteps.length - 1 ? 'Next' : 'Complete'}
            </Text>
            <MaterialCommunityIcons 
                name={currentStep < cbtSteps.length - 1 ? "arrow-right" : "check"} 
                size={20} 
                color="#fff" 
            />
          </TouchableOpacity>
        </View>

        {savedRecords.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Records</Text>
            {savedRecords.slice(0, 2).map((record) => (
              <View key={record.id} style={styles.recordItem}>
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
        borderColor: '#E0E0E0'
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
        borderColor: '#ddd'
    },
    nextButton: {
        // backgroundColor is set dynamically
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
        borderBottomColor: '#F0F0F0'
    },
    recordTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    recordSituation: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500'
    },
    recordDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 2
    }
}); 