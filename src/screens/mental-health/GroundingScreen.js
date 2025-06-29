import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function GroundingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [responses, setResponses] = useState({
    see: [],
    touch: [],
    hear: [],
    smell: [],
    taste: [],
  });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const groundingSteps = [
    {
      title: '5 Things You Can See',
      description: 'Look around and name 5 things you can see',
      icon: 'eye',
      category: 'see',
      examples: ['A blue sky', 'A red car', 'A green tree', 'A white wall', 'A black phone'],
    },
    {
      title: '4 Things You Can Touch',
      description: 'Name 4 things you can touch or feel',
      icon: 'hand',
      category: 'touch',
      examples: ['Your clothes', 'A chair', 'Your hair', 'A table'],
    },
    {
      title: '3 Things You Can Hear',
      description: 'Listen and name 3 things you can hear',
      icon: 'ear',
      category: 'hear',
      examples: ['Birds chirping', 'Traffic noise', 'Your breathing'],
    },
    {
      title: '2 Things You Can Smell',
      description: 'Name 2 things you can smell',
      icon: 'nose',
      category: 'smell',
      examples: ['Fresh air', 'Coffee', 'Perfume'],
    },
    {
      title: '1 Thing You Can Taste',
      description: 'Name 1 thing you can taste',
      icon: 'food',
      category: 'taste',
      examples: ['Your toothpaste', 'Coffee', 'Gum'],
    },
  ];

  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isActive, currentStep]);

  const startGrounding = () => {
    setIsActive(true);
    setCurrentStep(0);
    setResponses({
      see: [],
      touch: [],
      hear: [],
      smell: [],
      taste: [],
    });
  };

  const nextStep = () => {
    if (currentStep < groundingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    } else {
      // Complete the exercise
      setIsActive(false);
    }
  };

  const addResponse = (text) => {
    const category = groundingSteps[currentStep].category;
    setResponses(prev => ({
      ...prev,
      [category]: [...prev[category], text],
    }));
  };

  const currentStepData = groundingSteps[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#4facfe', '#00f2fe']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Grounding Exercise</Text>
            <Text style={styles.subtitle}>5-4-3-2-1 Sensory Technique</Text>
          </View>

          {!isActive ? (
            /* Start Screen */
            <View style={styles.startContainer}>
              <MaterialCommunityIcons name="earth" size={80} color="#fff" />
              <Text style={styles.startTitle}>Feeling Overwhelmed?</Text>
              <Text style={styles.startDescription}>
                This grounding exercise will help you reconnect with the present moment 
                by engaging your five senses. It's a simple but powerful way to reduce 
                anxiety and stress.
              </Text>
              <TouchableOpacity style={styles.startButton} onPress={startGrounding}>
                <Text style={styles.startButtonText}>Begin Grounding</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Exercise Screen */
            <Animated.View 
              style={[
                styles.exerciseContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Progress Indicator */}
              <View style={styles.progressContainer}>
                {groundingSteps.map((step, index) => (
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
              <View style={styles.stepContainer}>
                <MaterialCommunityIcons 
                  name={currentStepData.icon} 
                  size={60} 
                  color="#fff" 
                />
                <Text style={styles.stepTitle}>{currentStepData.title}</Text>
                <Text style={styles.stepDescription}>{currentStepData.description}</Text>
              </View>

              {/* Examples */}
              <View style={styles.examplesContainer}>
                <Text style={styles.examplesTitle}>Examples:</Text>
                {currentStepData.examples.map((example, index) => (
                  <Text key={index} style={styles.exampleText}>• {example}</Text>
                ))}
              </View>

              {/* Response Input */}
              <View style={styles.responseContainer}>
                <Text style={styles.responseTitle}>
                  What {currentStepData.category} you? ({responses[currentStepData.category].length}/{
                    currentStepData.category === 'see' ? 5 : 
                    currentStepData.category === 'touch' ? 4 :
                    currentStepData.category === 'hear' ? 3 :
                    currentStepData.category === 'smell' ? 2 : 1
                  })
                </Text>
                <View style={styles.responseList}>
                  {responses[currentStepData.category].map((response, index) => (
                    <View key={index} style={styles.responseItem}>
                      <Text style={styles.responseText}>{response}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => addResponse(`Item ${responses[currentStepData.category].length + 1}`)}
                >
                  <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                  <Text style={styles.addButtonText}>Add Item</Text>
                </TouchableOpacity>
              </View>

              {/* Navigation */}
              <View style={styles.navigationContainer}>
                {currentStep < groundingSteps.length - 1 ? (
                  <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
                    <Text style={styles.nextButtonText}>Next Step</Text>
                    <MaterialCommunityIcons name="arrow-right" size={24} color="#fff" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.completeButton} onPress={nextStep}>
                    <Text style={styles.completeButtonText}>Complete Exercise</Text>
                    <MaterialCommunityIcons name="check" size={24} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          )}

          {/* Summary */}
          {!isActive && responses.see.length > 0 && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Your Grounding Summary</Text>
              {Object.entries(responses).map(([category, items]) => (
                <View key={category} style={styles.summaryItem}>
                  <Text style={styles.summaryCategory}>{category.toUpperCase()}:</Text>
                  {items.map((item, index) => (
                    <Text key={index} style={styles.summaryText}>• {item}</Text>
                  ))}
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
    marginBottom: 40,
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
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  startTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 16,
  },
  startDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  startButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  exerciseContainer: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#fff',
  },
  stepContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  examplesContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  responseContainer: {
    marginBottom: 30,
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  responseList: {
    marginBottom: 16,
  },
  responseItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  responseText: {
    fontSize: 14,
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  navigationContainer: {
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  summaryContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryItem: {
    marginBottom: 16,
  },
  summaryCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 8,
    marginBottom: 2,
  },
}); 