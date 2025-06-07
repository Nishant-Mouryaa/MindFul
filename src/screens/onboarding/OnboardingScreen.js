import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import {
  TextInput,
  HelperText,
  Text,
  Title,
  ActivityIndicator
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

// Firebase imports
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  // State variables for each of the onboarding fields
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [trainingGoal, setTrainingGoal] = useState('');
  const [experience, setExperience] = useState('');

  // State variable for multi-step control
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Animation refs
  const buttonScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initially 0 (invisible)
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Fade in once component mounts
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true
    }).start();
  }, []);

  function handlePressIn() {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      speed: 12,
      useNativeDriver: true,
    }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handlePressOut() {
    Animated.spring(buttonScale, {
      toValue: 1,
      speed: 12,
      useNativeDriver: true,
    }).start();
  }

  function runShakeAnimation() {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  }

  // Write onboarding data to Firestore, including "onboardingComplete: true"
  async function storeUserData() {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        console.warn('No logged-in user found. Skipping Firestore write.');
        return;
      }
      const db = getFirestore();
      const userDocRef = doc(db, 'users', user.uid);

      await setDoc(
        userDocRef,
        {
          name,
          age,
          weight,
          trainingGoal,
          experience,
          onboardingComplete: true, // Mark as done
        },
        { merge: true }
      );
      console.log('User onboarding data saved and marked complete.');
    } catch (err) {
      console.error('Error saving user data: ', err);
    }
  }

  async function handleNext() {
    Keyboard.dismiss();
    setError('');

    // Validate
    if (step === 1 && !name.trim()) {
      setError('Please enter your name');
      runShakeAnimation();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (step === 2 && (!age.trim() || !weight.trim())) {
      setError('Please enter both age and weight');
      runShakeAnimation();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (step === 3 && !trainingGoal.trim()) {
      setError('Please select a training goal');
      runShakeAnimation();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (step === 4 && !experience.trim()) {
      setError('Please select your experience level');
      runShakeAnimation();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (step < 4) {
      // Next step
      setLoading(true);
      setTimeout(() => {
        setStep(step + 1);
        setLoading(false);
        Haptics.selectionAsync();
      }, 500);
    } else {
      // Final step - store data
      setLoading(true);
      try {
        await storeUserData(); 
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        alert('Onboarding complete! Please wait while app updates...');
        // Do not navigate manually; let top-level logic see "onboardingComplete" in Firestore
      } catch (err) {
        console.error('Error finishing onboarding:', err);
      } finally {
        setLoading(false);
      }
    }
  }

  function handleBack() {
    if (step > 1) {
      Haptics.selectionAsync();
      setStep(step - 1);
    }
  }

  // Options for goals & experience
  const goalOptions = ['Strength', 'Cut', 'Bulk', 'Endurance'];
  const experienceOptions = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];

  // Render based on step
  function renderStep() {
    switch (step) {
      case 1:
        return (
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            style={styles.card}
          >
            <Title style={styles.label}>What is your name?</Title>
            <TextInput
              style={styles.textInput}
              label="Your name"
              value={name}
              onChangeText={setName}
              autoFocus
              mode="flat"
              theme={{
                colors: {
                  primary: '#e63946',
                  background: '#2b2b2b',
                  placeholder: '#777',
                  text: '#fff',
                  surface: 'transparent'
                },
                roundness: 10
              }}
              left={<TextInput.Icon name="account-outline" color="#e63946" />}
            />
          </Animatable.View>
        );
      case 2:
        return (
          <Animatable.View
            animation="fadeInUp"
            duration={600}
          >
            <View style={styles.card}>
              <Title style={styles.label}>What is your age?</Title>
              <TextInput
                style={styles.textInput}
                label="Age (years)"
                keyboardType="numeric"
                value={age}
                onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
                maxLength={3}
                mode="flat"
                theme={{
                  colors: {
                    primary: '#e63946',
                    background: '#2b2b2b',
                    placeholder: '#777',
                    text: '#fff',
                    surface: 'transparent'
                  },
                  roundness: 10
                }}
                left={<TextInput.Icon name="calendar-blank-outline" color="#e63946" />}
              />
            </View>
            <View style={styles.card}>
              <Title style={styles.label}>What is your weight?</Title>
              <TextInput
                style={styles.textInput}
                label="Weight (kg)"
                keyboardType="numeric"
                value={weight}
                onChangeText={(text) => setWeight(text.replace(/[^0-9]/g, ''))}
                maxLength={3}
                mode="flat"
                theme={{
                  colors: {
                    primary: '#e63946',
                    background: '#2b2b2b',
                    placeholder: '#777',
                    text: '#fff',
                    surface: 'transparent'
                  },
                  roundness: 10
                }}
                left={<TextInput.Icon name="weight-kilogram" color="#e63946" />}
              />
            </View>
          </Animatable.View>
        );
      case 3:
        return (
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            style={styles.card}
          >
            <Title style={styles.label}>What's your primary training goal?</Title>
            <View style={styles.optionsContainer}>
              {goalOptions.map((goal, index) => (
                <Animatable.View
                  key={goal}
                  animation="fadeInUp"
                  duration={600}
                  delay={index * 100}
                  style={styles.optionWrapper}
                >
                  <TouchableWithoutFeedback
                    onPress={() => {
                      setTrainingGoal(goal);
                      Haptics.selectionAsync();
                    }}
                  >
                    <View style={[
                      styles.optionButton,
                      trainingGoal === goal && styles.optionButtonSelected,
                    ]}>
                      <MaterialCommunityIcons
                        name={
                          goal === 'Strength' ? 'arm-flex-outline' :
                          goal === 'Cut' ? 'fire' :
                          goal === 'Bulk' ? 'food-steak' : 'run-fast'
                        }
                        size={24}
                        color={trainingGoal === goal ? '#fff' : '#e63946'}
                        style={styles.optionIcon}
                      />
                      <Text style={[
                        styles.optionText,
                        trainingGoal === goal && styles.optionTextSelected,
                      ]}>
                        {goal}
                      </Text>
                    </View>
                  </TouchableWithoutFeedback>
                </Animatable.View>
              ))}
            </View>
          </Animatable.View>
        );
      case 4:
        return (
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            style={styles.card}
          >
            <Title style={styles.label}>What's your experience level?</Title>
            <View style={styles.optionsContainer}>
              {experienceOptions.map((level, index) => (
                <Animatable.View
                  key={level}
                  animation="fadeInUp"
                  duration={600}
                  delay={index * 100}
                  style={styles.optionWrapper}
                >
                  <TouchableWithoutFeedback
                    onPress={() => {
                      setExperience(level);
                      Haptics.selectionAsync();
                    }}
                  >
                    <View style={[
                      styles.optionButton,
                      experience === level && styles.optionButtonSelected,
                    ]}>
                      <MaterialCommunityIcons
                        name={
                          level === 'Beginner' ? 'human-male-board' :
                          level === 'Intermediate' ? 'human-male-board-poll' :
                          level === 'Advanced' ? 'trophy-outline' : 'crown-outline'
                        }
                        size={24}
                        color={experience === level ? '#fff' : '#e63946'}
                        style={styles.optionIcon}
                      />
                      <Text style={[
                        styles.optionText,
                        experience === level && styles.optionTextSelected,
                      ]}>
                        {level}
                      </Text>
                    </View>
                  </TouchableWithoutFeedback>
                </Animatable.View>
              ))}
            </View>
          </Animatable.View>
        );
      default:
        return null;
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <LinearGradient
        colors={['#0a0a0a', '#1a1a1a']}
        style={styles.gradientContainer}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <View style={styles.container}>
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateX: shakeAnim }]
                }
              ]}
            >
              <View style={styles.header}>
                <Animatable.View
                  animation="bounceIn"
                  duration={1000}
                  style={styles.logoContainer}
                >
                  <MaterialCommunityIcons
                    name="weight-lifter"
                    size={48}
                    color="#e63946"
                  />
                </Animatable.View>
                <Animatable.Text
                  animation="fadeInDown"
                  duration={600}
                  style={styles.title}
                >
                  POWERLIFT PRO
                </Animatable.Text>
                <Animatable.Text
                  animation="fadeInDown"
                  duration={600}
                  delay={200}
                  style={styles.subtitle}
                >
                  Let's get you set up
                </Animatable.Text>

                {/* Progress indicator */}
                <View style={styles.progressContainer}>
                  {[1, 2, 3, 4].map((i) => {
                    let stepStyle = styles.progressStep;
                    let stepIcon = null;

                    // Completed
                    if (i < step) {
                      stepStyle = { ...stepStyle, ...styles.progressStepCompleted };
                      stepIcon = (
                        <MaterialCommunityIcons
                          name="check"
                          size={16}
                          color="#fff"
                        />
                      );
                    }
                    // Active
                    if (i === step) {
                      stepStyle = { ...stepStyle, ...styles.progressStepActive };
                      stepIcon = <Text style={styles.progressStepText}>{i}</Text>;
                    }
                    // Inactive
                    if (i > step) {
                      stepIcon = <Text style={styles.progressStepText}>{i}</Text>;
                    }

                    return (
                      <Animatable.View
                        animation="zoomIn"
                        duration={500}
                        delay={i * 100}
                        key={i}
                        style={stepStyle}
                      >
                        {stepIcon}
                      </Animatable.View>
                    );
                  })}
                </View>
              </View>

              {renderStep()}

              {error ? (
                <HelperText type="error" style={styles.errorText} visible={!!error}>
                  {error}
                </HelperText>
              ) : null}

              {/* Navigation Buttons */}
              <Animatable.View
                animation="fadeInUp"
                duration={600}
                delay={400}
                style={styles.navigation}
              >
                {step > 1 && (
                  <TouchableWithoutFeedback
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handleBack}
                    disabled={loading}
                  >
                    <Animated.View
                      style={[
                        styles.backButton,
                        { transform: [{ scale: buttonScale }] }
                      ]}
                    >
                      <Text style={styles.backButtonText}>BACK</Text>
                    </Animated.View>
                  </TouchableWithoutFeedback>
                )}
                <TouchableWithoutFeedback
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={handleNext}
                  disabled={loading}
                >
                  <Animated.View
                    style={[
                      styles.nextButton,
                      {
                        transform: [{ scale: buttonScale }],
                        backgroundColor: loading ? '#c1121f' : '#e63946',
                        marginLeft: step > 1 ? 16 : 0
                      }
                    ]}
                  >
                    <View style={styles.buttonContent}>
                      {loading && (
                        <ActivityIndicator
                          color="#ffffff"
                          size="small"
                          style={styles.loadingIndicator}
                        />
                      )}
                      <Text style={styles.nextButtonText}>
                        {step < 4
                          ? loading
                            ? 'CONTINUING...'
                            : 'CONTINUE'
                          : loading
                          ? 'FINISHING...'
                          : 'GET STARTED'}
                      </Text>
                    </View>
                  </Animated.View>
                </TouchableWithoutFeedback>
              </Animatable.View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#1a1a1a',
    shadowColor: '#e63946',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: width * 0.7,
    marginBottom: 8,
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2b2b2b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#444',
  },
  progressStepActive: {
    backgroundColor: '#e63946',
    borderColor: '#e63946',
  },
  progressStepCompleted: {
    backgroundColor: '#e63946',
    borderColor: '#e63946',
  },
  progressStepText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  card: {
    width: width * 0.9,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    marginVertical: 8,
    alignSelf: 'center',
    shadowColor: '#e63946',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    color: '#fff',
    marginBottom: 16,
    fontSize: 20,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#2b2b2b',
    fontSize: 16,
    height: 60,
    marginBottom: 8,
  },
  optionsContainer: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionWrapper: {
    width: '48%',
    marginBottom: 12,
  },
  optionButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#2b2b2b',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    elevation: 3,
  },
  optionButtonSelected: {
    backgroundColor: '#e63946',
    borderColor: '#e63946',
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  optionTextSelected: {
    color: '#fff',
  },
  navigation: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  backButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#2b2b2b',
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  nextButton: {
    minWidth: 160,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#e63946',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    marginRight: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 8,
  },
});
