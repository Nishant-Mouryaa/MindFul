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

const { width } = Dimensions.get('window');

// We'll do 4 seconds inhale, 7 seconds hold, 8 seconds exhale.
const BREATHING_STEPS = [
  { label: 'Inhale', duration: 4000 },
  { label: 'Hold',   duration: 7000 },
  { label: 'Exhale', duration: 8000 },
];

export default function BreathingScreen() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Track which of the three phases we're on: 0=Inhale, 1=Hold, 2=Exhale
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);

  // Track total session time
  const [sessionTime, setSessionTime] = useState(0);

  // How many complete cycles of (Inhale → Hold → Exhale) we have done
  const [cycleCount, setCycleCount] = useState(0);

  // Animated values
  const circleScale = useRef(new Animated.Value(1)).current;
  const circleOpacity = useRef(new Animated.Value(0.7)).current;

  // Timers
  const sessionTimerRef = useRef(null);
  const animationRef = useRef(null);

  // For convenience
  const currentPhase = BREATHING_STEPS[currentPhaseIndex].label;

  // Format mm:ss for the session timer
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  //---------------------------------------------------------------------------
  // Start the entire session
  //---------------------------------------------------------------------------
  const startSession = () => {
    setIsSessionActive(true);
    setIsPaused(false);
    setSessionTime(0);
    setCycleCount(0);
    setCurrentPhaseIndex(0);

    // Start counting total session time
    sessionTimerRef.current = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    // Begin animation at phase index 0 (Inhale)
    runAnimationForPhase(0);
  };

  //---------------------------------------------------------------------------
  // Animates one phase, then schedules the next
  //---------------------------------------------------------------------------
  const runAnimationForPhase = (phaseIndex) => {
    // Double-check if user has stopped or paused in the meantime
    if (!isSessionActive || isPaused) return;

    // Retrieve the properties of the current phase
    const { label, duration } = BREATHING_STEPS[phaseIndex];

    // Decide the target scale/opacity
    let targetScale = 1;
    let targetOpacity = 0.7;

    if (label === 'Inhale' || label === 'Hold') {
      // Inhale & Hold both expand the circle
      targetScale = 1.5;
      targetOpacity = 1;
    } else if (label === 'Exhale') {
      // Exhale contracts the circle
      targetScale = 1;
      targetOpacity = 0.7;
    }

    // Create and start the parallel animation
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
      // Only proceed if it finished normally, without being stopped
      // and if the session is still active and not paused
      if (finished && isSessionActive && !isPaused) {
        // If we just completed the "Exhale" phase, we completed a cycle
        if (phaseIndex === BREATHING_STEPS.length - 1) {
          setCycleCount(prev => prev + 1);
        }
        // Move to the next phase in 0,1,2 -> wrap around
        const nextIndex = (phaseIndex + 1) % BREATHING_STEPS.length;
        setCurrentPhaseIndex(nextIndex);
        // DO NOT call runAnimationForPhase(nextIndex) here
      }
    });
  };

  //---------------------------------------------------------------------------
  // Stop the session altogether
  //---------------------------------------------------------------------------
  const stopSession = () => {
    setIsSessionActive(false);
    setIsPaused(false);
    setCurrentPhaseIndex(0);
    setSessionTime(0);

    // Reset animation
    if (animationRef.current) {
      animationRef.current.stop();
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

    // Stop the session timer
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  };

  //---------------------------------------------------------------------------
  // Pause or resume the session
  //---------------------------------------------------------------------------
  const togglePause = () => {
    if (!isSessionActive) return;

    if (!isPaused) {
      // Pause: stop timer and animation
      setIsPaused(true);
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      if (animationRef.current) animationRef.current.stop();
    } else {
      // Resume: re-start the timer and animation from current phase
      setIsPaused(false);

      // Resume the session timer
      sessionTimerRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);

      // Continue animation from currentPhaseIndex
      runAnimationForPhase(currentPhaseIndex);
    }
  };

  //---------------------------------------------------------------------------
  // Cleanup on unmount
  //---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      if (animationRef.current) animationRef.current.stop();
    };
  }, []);

  // Add this useEffect after runAnimationForPhase and before the render
  useEffect(() => {
    if (isSessionActive && !isPaused) {
      runAnimationForPhase(currentPhaseIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPhaseIndex, isSessionActive, isPaused]);

  //---------------------------------------------------------------------------
  // Render
  //---------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Breathing Exercise</Text>
          <Text style={styles.subtitle}>Use the 4-7-8 technique to calm your mind.</Text>
        </View>

        {/* Breathing Visualizer Card */}
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

              


              {/* Phase Label */}
              {isSessionActive && !isPaused ? (
                <Text style={styles.breathText}>{currentPhase}</Text>
              ) : (
                <Text style={[styles.breathText, { fontSize: 20 }]}>
                  {!isSessionActive
                    ? 'Press Start'
                    : isPaused
                    ? 'Paused'
                    : 'Inhale'}
                </Text>
              )}
            </Animated.View>
          </View>
          
          {/* Session Controls & Info */}
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
                {/* Time & Cycle Count */}
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

                {/* Pause/Resume & Stop */}
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
                          { text: 'Stop', style: 'destructive', onPress: stopSession },
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

        {/* Instructions Card */}
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

        {/* Benefits Card */}
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
  // Container
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 20,
  },
  // Header
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
  // Card Container
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
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  // Breathing Circle
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
  // Controls
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
  // Session Stats
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
  // Instructions & Benefits
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
});

