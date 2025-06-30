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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
    
    sessionTimer.current = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
    
    breatheCycle();
  };

  const stopBreathing = () => {
    setIsBreathing(false);
    setIsSessionActive(false);
    setBreathPhase('inhale');
    
    Animated.parallel([
      Animated.timing(circleScale, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.7, duration: 500, useNativeDriver: true }),
    ]).start();
    
    if (sessionTimer.current) clearInterval(sessionTimer.current);
  };

  const breatheCycle = () => {
    // Inhale animation (4 seconds)
    setBreathPhase('inhale');
    Animated.parallel([
      Animated.timing(circleScale, { toValue: 1.5, duration: 4000, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 4000, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (!finished) return;
      // Hold breath (7 seconds)
      setBreathPhase('hold');
      setTimeout(() => {
        // Exhale animation (8 seconds)
        setBreathPhase('exhale');
        Animated.parallel([
          Animated.timing(circleScale, { toValue: 1, duration: 8000, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.7, duration: 8000, useNativeDriver: true }),
        ]).start(({ finished: exhaleFinished }) => {
          if (exhaleFinished) {
            breatheCycle();
          }
        });
      }, 7000)
    });
  };

  useEffect(() => {
    if (isBreathing) {
      breatheCycle();
    }
    return () => {
      if (sessionTimer.current) clearInterval(sessionTimer.current);
    };
  }, [isBreathing]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  let phaseText = 'Inhale';
  if (breathPhase === 'hold') phaseText = 'Hold';
  if (breathPhase === 'exhale') phaseText = 'Exhale';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Breathing Exercise</Text>
          <Text style={styles.subtitle}>Calm your mind with the 4-7-8 technique.</Text>
        </View>

        {/* Breathing Visualizer Card */}
        <View style={styles.card}>
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
                <Text style={styles.breathText}>{phaseText}</Text>
            </Animated.View>
            </View>
            
            {/* Controls */}
            <View style={styles.controlsContainer}>
            {!isSessionActive ? (
                <TouchableOpacity style={[styles.button, styles.startButton]} onPress={startBreathing}>
                <MaterialCommunityIcons name="play" size={24} color="#fff" />
                <Text style={styles.buttonText}>Start</Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.sessionControls}>
                <View style={styles.sessionInfo}>
                    <Text style={styles.sessionTime}>{formatTime(sessionTime)}</Text>
                </View>
                <TouchableOpacity style={[styles.button, styles.stopButton]} onPress={stopBreathing}>
                    <MaterialCommunityIcons name="stop" size={24} color="#E57373" />
                    <Text style={[styles.buttonText, {color: '#E57373'}]}>Stop</Text>
                </TouchableOpacity>
                </View>
            )}
            </View>
        </View>


        {/* Instructions Card */}
        <View style={styles.card}>
            <Text style={styles.cardTitle}>How to Practice</Text>
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
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
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
    },
    startButton: {
        backgroundColor: '#4DB6AC',
    },
    stopButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E57373',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    sessionControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sessionInfo: {
        alignItems: 'center',
    },
    sessionTime: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
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
    }
}); 