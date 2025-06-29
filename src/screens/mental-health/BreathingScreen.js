import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function BreathingScreen() {
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState('inhale'); // 'inhale' or 'exhale'
  const [sessionTime, setSessionTime] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  
  const circleScale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;
  const sessionTimer = useRef(null);

  const startBreathing = () => {
    setIsBreathing(true);
    setIsSessionActive(true);
    setSessionTime(0);
    
    // Start session timer
    sessionTimer.current = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
    
    breatheCycle();
  };

  const stopBreathing = () => {
    setIsBreathing(false);
    setIsSessionActive(false);
    setBreathPhase('inhale');
    
    // Reset animations
    Animated.parallel([
      Animated.timing(circleScale, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.7,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Clear timer
    if (sessionTimer.current) {
      clearInterval(sessionTimer.current);
    }
  };

  const breatheCycle = () => {
    if (!isBreathing) return;

    // Inhale animation (4 seconds)
    setBreathPhase('inhale');
    Animated.parallel([
      Animated.timing(circleScale, {
        toValue: 1.5,
        duration: 4000,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Exhale animation (6 seconds)
      setBreathPhase('exhale');
      Animated.parallel([
        Animated.timing(circleScale, {
          toValue: 1,
          duration: 6000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 6000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Continue cycle
        breatheCycle();
      });
    });
  };

  useEffect(() => {
    return () => {
      if (sessionTimer.current) {
        clearInterval(sessionTimer.current);
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Breathing Exercise</Text>
          <Text style={styles.subtitle}>4-7-8 Breathing Technique</Text>
        </View>

        {/* Breathing Circle */}
        <View style={styles.breathingContainer}>
          <Animated.View
            style={[
              styles.breathingCircle,
              {
                transform: [{ scale: circleScale }],
                opacity: opacity,
              },
            ]}
          >
            <Text style={styles.breathText}>
              {breathPhase === 'inhale' ? 'Inhale' : 'Exhale'}
            </Text>
            <Text style={styles.breathCount}>
              {breathPhase === 'inhale' ? '4' : '8'}
            </Text>
          </Animated.View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionTitle}>How to practice:</Text>
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons name="circle-small" size={24} color="#fff" />
            <Text style={styles.instructionText}>Inhale through your nose for 4 seconds</Text>
          </View>
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons name="circle-small" size={24} color="#fff" />
            <Text style={styles.instructionText}>Hold your breath for 7 seconds</Text>
          </View>
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons name="circle-small" size={24} color="#fff" />
            <Text style={styles.instructionText}>Exhale through your mouth for 8 seconds</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          {!isSessionActive ? (
            <TouchableOpacity style={styles.startButton} onPress={startBreathing}>
              <MaterialCommunityIcons name="play" size={32} color="#fff" />
              <Text style={styles.startButtonText}>Start Breathing</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.sessionControls}>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionTime}>{formatTime(sessionTime)}</Text>
                <Text style={styles.sessionLabel}>Session Time</Text>
              </View>
              <TouchableOpacity style={styles.stopButton} onPress={stopBreathing}>
                <MaterialCommunityIcons name="stop" size={32} color="#fff" />
                <Text style={styles.stopButtonText}>Stop</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
  breathingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  breathText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  breathCount: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
  },
  instructionsContainer: {
    marginBottom: 40,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    flex: 1,
  },
  controlsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 12,
  },
  sessionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  sessionInfo: {
    alignItems: 'center',
  },
  sessionTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  sessionLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
}); 