import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated
} from 'react-native';
import { HelperText } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// Firebase imports
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Custom components
import OnboardingHeader from '../../components/onboarding/OnboardingHeader';
import OnboardingNavigation from '../../components/onboarding/OnboardingNavigation';
import NameStep from '../../components/onboarding/steps/NameStep';
import StatsStep from '../../components/onboarding/steps/StatsStep';
import GoalStep from '../../components/onboarding/steps/GoalStep';
import ExperienceStep from '../../components/onboarding/steps/ExperienceStep';

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
  const fadeAnim = useRef(new Animated.Value(0)).current;
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

  // Write onboarding data to Firestore
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
          onboardingComplete: true,
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

  // Render based on step
  function renderStep() {
    switch (step) {
      case 1:
        return <NameStep name={name} setName={setName} />;
      case 2:
        return <StatsStep age={age} setAge={setAge} weight={weight} setWeight={setWeight} />;
      case 3:
        return <GoalStep trainingGoal={trainingGoal} setTrainingGoal={setTrainingGoal} />;
      case 4:
        return <ExperienceStep experience={experience} setExperience={setExperience} />;
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
              <OnboardingHeader step={step} />
              {renderStep()}

              {error ? (
                <HelperText type="error" style={styles.errorText} visible={!!error}>
                  {error}
                </HelperText>
              ) : null}

              <OnboardingNavigation
                step={step}
                loading={loading}
                onBack={handleBack}
                onNext={handleNext}
                buttonScale={buttonScale}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
              />
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
  errorText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 8,
  },
  textInput: {
    marginBottom: 20,
    backgroundColor: '#2b2b2b',
    fontSize: 16,
    height: 60,
    color: '#fff',
  },
});
