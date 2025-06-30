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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function GroundingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [responses, setResponses] = useState({ 5: [], 4: [], 3: [], 2: [], 1: [] });
  const [inputValue, setInputValue] = useState('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const groundingSteps = [
    { title: '5 Things You Can See', count: 5, icon: 'eye-outline', color: '#4DB6AC' },
    { title: '4 Things You Can Touch', count: 4, icon: 'gesture-tap', color: '#64B5F6' },
    { title: '3 Things You Can Hear', count: 3, icon: 'ear-hearing', color: '#FFB74D' },
    { title: '2 Things You Can Smell', count: 2, icon: 'scent', color: '#BA68C8' },
    { title: '1 Thing You Can Taste', count: 1, icon: 'food-apple-outline', color: '#E57373' },
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
    if (isActive) {
      runAnimation();
    }
  }, [isActive, currentStep]);

  const startGrounding = () => {
    setIsActive(true);
    setCurrentStep(0);
    setResponses({ 5: [], 4: [], 3: [], 2: [], 1: [] });
  };

  const nextStep = () => {
    if (currentStep < groundingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsActive(false);
      Keyboard.dismiss();
    }
  };
  
  const prevStep = () => {
      if (currentStep > 0) {
          setCurrentStep(currentStep - 1);
      }
  }

  const addResponse = () => {
    if (inputValue.trim() === '') return;
    const currentCount = groundingSteps[currentStep].count;
    setResponses(prev => ({
      ...prev,
      [currentCount]: [...prev[currentCount], inputValue.trim()],
    }));
    setInputValue('');
  };
  
  const removeResponse = (index) => {
    const currentCount = groundingSteps[currentStep].count;
    setResponses(prev => ({
        ...prev,
        [currentCount]: prev[currentCount].filter((_, i) => i !== index)
    }));
  }

  const currentStepData = groundingSteps[currentStep];
  const currentResponses = responses[currentStepData.count];
  const isStepComplete = currentResponses.length >= currentStepData.count;

  const renderStartScreen = () => (
      <View style={styles.startContainer}>
          <View style={[styles.card, styles.introCard]}>
            <MaterialCommunityIcons name="earth" size={60} color="#64B5F6" style={{marginBottom: 15}}/>
            <Text style={styles.title}>5-4-3-2-1 Grounding</Text>
            <Text style={styles.subtitle}>
                A simple technique to anchor you in the present moment during times of anxiety or distress.
            </Text>
            <TouchableOpacity style={styles.startButton} onPress={startGrounding}>
                <Text style={styles.startButtonText}>Begin Exercise</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
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
              <Text key={index} style={styles.summaryItem}>- {item}</Text>
            ))}
          </View>
        )
      ))}
    </View>
  );

  const renderExerciseScreen = () => (
    <Animated.View style={{opacity: fadeAnim, transform: [{translateY: slideAnim}]}}>
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

            {!isStepComplete && (
                <View style={styles.inputContainer}>
                <TextInput
                    style={styles.textInput}
                    placeholder={`Name something you can ${currentStepData.title.split(' ').pop().toLowerCase()}...`}
                    value={inputValue}
                    onChangeText={setInputValue}
                    onSubmitEditing={addResponse}
                />
                <TouchableOpacity style={[styles.addButton, {backgroundColor: currentStepData.color}]} onPress={addResponse}>
                    <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                </TouchableOpacity>
                </View>
            )}
        </View>

        <View style={styles.navigationContainer}>
            <TouchableOpacity 
                style={[styles.navButton, styles.prevButton, {opacity: currentStep === 0 ? 0.5 : 1}]} 
                onPress={prevStep}
                disabled={currentStep === 0}>
                <MaterialCommunityIcons name="arrow-left" size={20} color="#555" />
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.navButton, styles.nextButton, {backgroundColor: currentStepData.color}, !isStepComplete && styles.disabledButton]} 
                onPress={nextStep}
                disabled={!isStepComplete}
                >
                <Text style={styles.navButtonText}>{currentStep < groundingSteps.length - 1 ? 'Next' : 'Finish'}</Text>
                <MaterialCommunityIcons name={currentStep < groundingSteps.length - 1 ? 'arrow-right' : 'check'} size={20} color="#fff" />
            </TouchableOpacity>
        </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
          {!isActive ? renderStartScreen() : renderExerciseScreen()}
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
        flexGrow: 1,
    },
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
    },
    startButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 10,
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
    responseList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    responseChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
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
        borderColor: '#ddd'
    },
    nextButton: {
        paddingHorizontal: 20,
    },
    disabledButton: {
        backgroundColor: '#BDBDBD'
    },
    navButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginHorizontal: 8,
    },
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
    }
}); 