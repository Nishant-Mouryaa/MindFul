
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

import {
  Palette,
  spacing,
  typography,
  shadows,
  borderRadius,
} from '../../theme/colors'; // Adjust path as needed

const { width } = Dimensions.get('window');

const BREATHING_STEPS = [
  { label: 'Inhale', duration: 4000 },
  { label: 'Hold', duration: 7000 },
  { label: 'Exhale', duration: 8000 },
];

export default function BreathingScreen() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);

  const circleScale = useRef(new Animated.Value(1)).current;
  const circleOpacity = useRef(new Animated.Value(0.7)).current;
  const sessionTimerRef = useRef(null);
  const animationRef = useRef(null);

  const currentPhase = BREATHING_STEPS[currentPhaseIndex].label;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Save session to Firebase
  const saveSessionToFirebase = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        console.log("User not logged in - session not saved");
        return;
      }
  
      await addDoc(collection(db, 'activities'), {
        userId: user.uid,
        type: 'breathing',
        cycles: cycleCount,
        duration: sessionTime,
        date: new Date(), // Use date instead of timestamp
      });
  
      // Update local session count
      setTotalSessions((prev) => prev + 1);
    } catch (error) {
      console.error("Error saving breathing session:", error);
    }
  };

  // Load user's total sessions count
  useEffect(() => {
    const loadSessionCount = async () => {
      try {
        const auth = getAuth();
        if (auth.currentUser) {
          const q = query(
            collection(db, 'activities'),
            where('userId', '==', auth.currentUser.uid),
            where('type', '==', 'breathing')
          );
          const querySnapshot = await getDocs(q);
          setTotalSessions(querySnapshot.size);
        }
      } catch (error) {
        console.error("Error loading session count:", error);
      }
    };
    loadSessionCount();
  }, []);

  const startSession = () => {
    setIsSessionActive(true);
    setIsPaused(false);
    setSessionTime(0);
    setCycleCount(0);
    setCurrentPhaseIndex(0);

    sessionTimerRef.current = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);

    runAnimationForPhase(0);
  };

  const runAnimationForPhase = (phaseIndex) => {
    if (!isSessionActive || isPaused) return;

    const { label, duration } = BREATHING_STEPS[phaseIndex];
    const nextIndex = (phaseIndex + 1) % BREATHING_STEPS.length;

    let targetScale = 1.5;
    let targetOpacity = 1;

    if (label === 'Exhale') {
      targetScale = 1;
      targetOpacity = 0.7;
    }

    animationRef.current = Animated.parallel([
      Animated.timing(circleScale, {
        toValue: targetScale,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(circleOpacity, {
        toValue: targetOpacity,
        duration: duration,
        useNativeDriver: true,
      }),
    ]);

    animationRef.current.start(({ finished }) => {
      if (finished && isSessionActive && !isPaused) {
        if (phaseIndex === BREATHING_STEPS.length - 1) {
          setCycleCount((prev) => prev + 1);
        }
        setCurrentPhaseIndex(nextIndex);
      }
    });
  };

  const stopSession = async () => {
    setIsSessionActive(false);
    setIsPaused(false);
    setCurrentPhaseIndex(0);

    if (cycleCount > 0) {
      await saveSessionToFirebase();
    }

    Animated.parallel([
      Animated.timing(circleScale, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(circleOpacity, {
        toValue: 0.7,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  };

  const togglePause = () => {
    if (!isSessionActive) return;

    if (!isPaused) {
      setIsPaused(true);
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      if (animationRef.current) animationRef.current.stop();
    } else {
      setIsPaused(false);
      sessionTimerRef.current = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
      runAnimationForPhase(currentPhaseIndex);
    }
  };

  useEffect(() => {
    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      if (animationRef.current) animationRef.current.stop();
    };
  }, []);

  useEffect(() => {
    if (isSessionActive && !isPaused) {
      runAnimationForPhase(currentPhaseIndex);
    }
  }, [currentPhaseIndex, isSessionActive, isPaused]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Breathing Exercise</Text>
          <Text style={styles.subtitle}>
            {totalSessions > 0 
              ? `You've completed ${totalSessions} sessions` 
              : 'Start your first session today!'}
          </Text>
        </View>

        <View style={[styles.card, shadows.medium]}>
          <View style={styles.breathingContainer}>
            <Animated.View
              style={[
                styles.breathingCircle,
                {
                  transform: [{ scale: circleScale }],
                  opacity: circleOpacity,
                },
              ]}
            >
              {isSessionActive && !isPaused ? (
                <Text style={styles.breathText}>{currentPhase}</Text>
              ) : (
                <Text style={[styles.breathText, { fontSize: 20 }]}>
                  {!isSessionActive ? 'Press Start' : isPaused ? 'Paused' : 'Inhale'}
                </Text>
              )}
            </Animated.View>
          </View>
          
          <View style={styles.controlsContainer}>
            {!isSessionActive ? (
              <TouchableOpacity
                style={[styles.button, styles.startButton]}
                onPress={startSession}
              >
                <MaterialCommunityIcons name="play" size={24} color={Palette.white} />
                <Text style={styles.buttonText}>Start</Text>
              </TouchableOpacity>
            ) : (
              <View>
                <View style={styles.sessionStats}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.sessionStatValue}>
                      {formatTime(sessionTime)}
                    </Text>
                    <Text style={styles.sessionStatLabel}>Time (mm:ss)</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.sessionStatValue}>{cycleCount}</Text>
                    <Text style={styles.sessionStatLabel}>Cycles</Text>
                  </View>
                </View>

                <View style={styles.sessionControls}>
                  <TouchableOpacity
                    style={[styles.button, styles.pauseButton]}
                    onPress={togglePause}
                  >
                    <MaterialCommunityIcons
                      name={isPaused ? 'play' : 'pause'}
                      size={24}
                      color={Palette.white}
                    />
                    <Text style={styles.buttonText}>
                      {isPaused ? 'Resume' : 'Pause'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.stopButton]}
                    onPress={() => {
                      Alert.alert(
                        'Stop Session',
                        'Are you sure you want to end this session?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Stop', onPress: stopSession },
                        ]
                      );
                    }}
                  >
                    <MaterialCommunityIcons name="stop" size={24} color={Palette.secondaryRed} />
                    <Text style={[styles.buttonText, { color: Palette.secondaryRed }]}>
                      Stop
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.card, shadows.medium]}>
          <Text style={styles.cardTitle}>How to Practice 4-7-8</Text>
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons name="numeric-1-circle" size={24} color={Palette.primary} />
            <Text style={styles.instructionText}>Inhale through your nose for 4 seconds.</Text>
          </View>
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons name="numeric-2-circle" size={24} color={Palette.primary} />
            <Text style={styles.instructionText}>Hold your breath for 7 seconds.</Text>
          </View>
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons name="numeric-3-circle" size={24} color={Palette.primary} />
            <Text style={styles.instructionText}>Exhale completely through your mouth for 8 seconds.</Text>
          </View>
        </View>

        <View style={[styles.card, shadows.medium]}>
          <Text style={styles.cardTitle}>Benefits of 4-7-8 Breathing</Text>
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons name="check-circle" size={20} color={Palette.secondaryBlue} />
            <Text style={styles.benefitText}>Reduces anxiety and stress</Text>
          </View>
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons name="check-circle" size={20} color={Palette.secondaryBlue} />
            <Text style={styles.benefitText}>Helps you fall asleep faster</Text>
          </View>
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons name="check-circle" size={20} color={Palette.secondaryBlue} />
            <Text style={styles.benefitText}>Improves focus and mindfulness</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: Palette.textDark,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: Palette.textLight,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Palette.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  breathingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
    marginBottom: spacing.lg,
  },
  breathingCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    // You can keep your custom color or swap these for your theme colors
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#90CAF9',
  },
  breathText: {
    fontSize: 24,
    fontWeight: '600',
    // Adjust color to match your theme if desired
    color: '#1E88E5',
  },
  controlsContainer: {
    marginTop: spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  startButton: {
    backgroundColor: Palette.primary,
  },
  pauseButton: {
    backgroundColor: '#90CAF9', // Or Palette.secondaryBlue
    flex: 1,
    marginRight: spacing.sm,
  },
  stopButton: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.secondaryRed,
    flex: 1,
    marginLeft: spacing.sm,
  },
  buttonText: {
    ...typography.body,
    fontWeight: 'bold',
    marginLeft: spacing.xs,
    color: Palette.white,
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  sessionStatValue: {
    ...typography.h3,
    color: Palette.textDark,
  },
  sessionStatLabel: {
    ...typography.small,
    color: Palette.textMedium,
  },
  sessionControls: {
    flexDirection: 'row',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  instructionText: {
    ...typography.body,
    color: Palette.textMedium,
    marginLeft: spacing.sm,
    flex: 1,
  },
  benefitText: {
    ...typography.body,
    color: Palette.textMedium,
    marginLeft: spacing.sm,
    flex: 1,
  },
  cardTitle: {
    ...typography.h2,
    color: Palette.textDark,
    marginBottom: spacing.md,
  },
});
