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

import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
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
        date: new Date()  // Use date instead of timestamp
      });
  
      // Update local session count
      setTotalSessions(prev => prev + 1);
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
      setSessionTime(prev => prev + 1);
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
          setCycleCount(prev => prev + 1);
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
        setSessionTime(prev => prev + 1);
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

        <View style={styles.card}>
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
                <MaterialCommunityIcons name="play" size={24} color="#fff" />
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
                      color="#fff"
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
                    <MaterialCommunityIcons name="stop" size={24} color="#E57373" />
                    <Text style={[styles.buttonText, { color: '#E57373' }]}>
                      Stop
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>How to Practice 4-7-8</Text>
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons name="numeric-1-circle" size={24} color="#4DB6AC" />
            <Text style={styles.instructionText}>Inhale through your nose for 4 seconds.</Text>
          </View>
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons name="numeric-2-circle" size={24} color="#4DB6AC" />
            <Text style={styles.instructionText}>Hold your breath for 7 seconds.</Text>
          </View>
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons name="numeric-3-circle" size={24} color="#4DB6AC" />
            <Text style={styles.instructionText}>Exhale completely through your mouth for 8 seconds.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Benefits of 4-7-8 Breathing</Text>
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#64B5F6" />
            <Text style={styles.benefitText}>Reduces anxiety and stress</Text>
          </View>
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#64B5F6" />
            <Text style={styles.benefitText}>Helps you fall asleep faster</Text>
          </View>
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#64B5F6" />
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
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  breathingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
    marginBottom: 20,
  },
  breathingCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#90CAF9',
  },
  breathText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1E88E5',
  },
  controlsContainer: {
    marginTop: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 25,
    marginBottom: 10,
  },
  startButton: {
    backgroundColor: '#4DB6AC',
  },
  pauseButton: {
    backgroundColor: '#90CAF9',
    flex: 1,
    marginRight: 8,
  },
  stopButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E57373',
    flex: 1,
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#fff',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  sessionStatValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  sessionStatLabel: {
    fontSize: 14,
    color: '#777',
  },
  sessionControls: {
    flexDirection: 'row',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 12,
    flex: 1,
  },
  benefitText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
});