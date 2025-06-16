import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * WorkoutScreen Component
 * 
 * This screen displays the user's workout for the day, including:
 * - Exercise list with details
 * - Sets and reps tracking
 * - Weight tracking
 * - Rest timer
 * - Progress tracking
 * 
 * Implementation Notes:
 * 1. Uses Animated API for smooth transitions
 * 2. Implements exercise completion tracking
 * 3. Includes rest timer functionality
 * 4. Maintains consistent design with HomeScreen
 * 
 * To implement in production:
 * 1. Connect to backend API for workout data
 * 2. Implement proper state management
 * 3. Add data persistence
 * 4. Implement proper error handling
 * 5. Add user progress tracking
 */

const ExerciseCard = ({ exercise, onComplete, isCompleted }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [currentSet, setCurrentSet] = useState(0);
  const [restTime, setRestTime] = useState(0);
  const [restTimerActive, setRestTimerActive] = useState(false);

  const startRestTimer = () => {
    setRestTimerActive(true);
    setRestTime(90); // 90 seconds rest
    const timer = setInterval(() => {
      setRestTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setRestTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <TouchableOpacity
      style={[styles.exerciseCard, isCompleted && styles.completedCard]}
      onPress={() => setShowDetails(!showDetails)}
      activeOpacity={0.7}
    >
      <View style={styles.exerciseHeader}>
        <MaterialCommunityIcons
          name={exercise.icon}
          size={24}
          color="#e63946"
        />
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <MaterialCommunityIcons
          name={isCompleted ? 'check-circle' : 'circle-outline'}
          size={24}
          color={isCompleted ? '#4CAF50' : '#ccc'}
          onPress={() => onComplete(exercise.id)}
        />
      </View>

      {showDetails && (
        <View style={styles.exerciseDetails}>
          <Text style={styles.exerciseDescription}>{exercise.description}</Text>
          
          <View style={styles.setsContainer}>
            {exercise.sets.map((set, index) => (
              <View
                key={index}
                style={[
                  styles.setCard,
                  currentSet === index && styles.currentSet,
                ]}
              >
                <Text style={styles.setNumber}>Set {index + 1}</Text>
                <Text style={styles.setDetails}>
                  {set.reps} reps × {set.weight}kg
                </Text>
                {currentSet === index && !isCompleted && (
                  <TouchableOpacity
                    style={styles.completeSetButton}
                    onPress={() => {
                      if (index < exercise.sets.length - 1) {
                        setCurrentSet(index + 1);
                        startRestTimer();
                      } else {
                        onComplete(exercise.id);
                      }
                    }}
                  >
                    <Text style={styles.completeSetText}>Complete Set</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {restTimerActive && (
            <View style={styles.restTimer}>
              <MaterialCommunityIcons name="timer" size={20} color="#e63946" />
              <Text style={styles.restTimerText}>
                Rest: {Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function WorkoutScreen() {
  const [completedExercises, setCompletedExercises] = useState(new Set());

  // Sample workout data - Replace with API call in production
  const workoutData = {
    name: "Upper Body Power",
    exercises: [
      {
        id: 1,
        name: "Bench Press",
        icon: "weight-lifter",
        description: "Focus on explosive power and proper form",
        sets: [
          { reps: 5, weight: 80 },
          { reps: 5, weight: 85 },
          { reps: 5, weight: 90 },
        ],
      },
      {
        id: 2,
        name: "Overhead Press",
        icon: "weight",
        description: "Maintain strict form and full range of motion",
        sets: [
          { reps: 8, weight: 50 },
          { reps: 8, weight: 55 },
          { reps: 8, weight: 60 },
        ],
      },
      {
        id: 3,
        name: "Barbell Rows",
        icon: "weight-lifter",
        description: "Focus on back contraction and proper hip hinge",
        sets: [
          { reps: 10, weight: 70 },
          { reps: 10, weight: 75 },
          { reps: 10, weight: 80 },
        ],
      },
    ],
  };

  const handleExerciseComplete = (exerciseId) => {
    setCompletedExercises((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
      } else {
        newSet.add(exerciseId);
      }
      return newSet;
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{workoutData.name}</Text>
        <Text style={styles.subtitle}>
          {completedExercises.size} of {workoutData.exercises.length} exercises completed
        </Text>
      </View>

      <View style={styles.exercisesContainer}>
        {workoutData.exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onComplete={handleExerciseComplete}
            isCompleted={completedExercises.has(exercise.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101010',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
  },
  exercisesContainer: {
    padding: 16,
    gap: 16,
  },
  exerciseCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  completedCard: {
    opacity: 0.7,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseName: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  exerciseDetails: {
    marginTop: 16,
  },
  exerciseDescription: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 16,
  },
  setsContainer: {
    gap: 12,
  },
  setCard: {
    backgroundColor: '#252525',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentSet: {
    borderColor: '#e63946',
    borderWidth: 1,
  },
  setNumber: {
    color: '#fff',
    fontWeight: '600',
    width: 60,
  },
  setDetails: {
    color: '#ccc',
    flex: 1,
  },
  completeSetButton: {
    backgroundColor: '#e63946',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  completeSetText: {
    color: '#fff',
    fontWeight: '600',
  },
  restTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    justifyContent: 'center',
  },
  restTimerText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
}); 