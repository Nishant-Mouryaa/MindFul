import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * LogWorkoutScreen Component
 * 
 * This screen allows users to log their completed workouts, including:
 * - Exercise selection
 * - Set details (reps, weight)
 * - Notes and feedback
 * - Date and duration
 * 
 * Implementation Notes:
 * 1. Form-based interface for workout logging
 * 2. Exercise selection with common exercises
 * 3. Set tracking with weight and reps
 * 4. Notes and feedback system
 */

export default function LogWorkoutScreen() {
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');

  const commonExercises = [
    { id: 1, name: 'Bench Press', category: 'Chest' },
    { id: 2, name: 'Squat', category: 'Legs' },
    { id: 3, name: 'Deadlift', category: 'Back' },
    { id: 4, name: 'Overhead Press', category: 'Shoulders' },
    { id: 5, name: 'Barbell Rows', category: 'Back' },
    { id: 6, name: 'Pull-ups', category: 'Back' },
    { id: 7, name: 'Dips', category: 'Chest' },
    { id: 8, name: 'Lunges', category: 'Legs' },
  ];

  const addExercise = (exercise) => {
    setSelectedExercises([
      ...selectedExercises,
      {
        ...exercise,
        sets: [{ reps: '', weight: '' }],
      },
    ]);
  };

  const removeExercise = (exerciseId) => {
    setSelectedExercises(selectedExercises.filter(ex => ex.id !== exerciseId));
  };

  const updateSet = (exerciseId, setIndex, field, value) => {
    setSelectedExercises(selectedExercises.map(exercise => {
      if (exercise.id === exerciseId) {
        const newSets = [...exercise.sets];
        newSets[setIndex] = { ...newSets[setIndex], [field]: value };
        return { ...exercise, sets: newSets };
      }
      return exercise;
    }));
  };

  const addSet = (exerciseId) => {
    setSelectedExercises(selectedExercises.map(exercise => {
      if (exercise.id === exerciseId) {
        return {
          ...exercise,
          sets: [...exercise.sets, { reps: '', weight: '' }],
        };
      }
      return exercise;
    }));
  };

  const removeSet = (exerciseId, setIndex) => {
    setSelectedExercises(selectedExercises.map(exercise => {
      if (exercise.id === exerciseId) {
        const newSets = exercise.sets.filter((_, index) => index !== setIndex);
        return { ...exercise, sets: newSets };
      }
      return exercise;
    }));
  };

  const handleSaveWorkout = () => {
    // Validate workout data
    const isValid = selectedExercises.every(exercise =>
      exercise.sets.every(set => set.reps && set.weight)
    );

    if (!isValid) {
      Alert.alert('Error', 'Please fill in all sets with reps and weight');
      return;
    }

    // TODO: Save workout data to backend
    Alert.alert('Success', 'Workout logged successfully!');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Log Workout</Text>
        <Text style={styles.subtitle}>Record your completed exercises</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add Exercises</Text>
        <View style={styles.exerciseGrid}>
          {commonExercises.map(exercise => (
            <TouchableOpacity
              key={exercise.id}
              style={styles.exerciseButton}
              onPress={() => addExercise(exercise)}
            >
              <Text style={styles.exerciseButtonText}>{exercise.name}</Text>
              <Text style={styles.exerciseCategory}>{exercise.category}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedExercises.map(exercise => (
        <View key={exercise.id} style={styles.exerciseCard}>
          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <TouchableOpacity
              onPress={() => removeExercise(exercise.id)}
              style={styles.removeButton}
            >
              <MaterialCommunityIcons name="close" size={24} color="#e63946" />
            </TouchableOpacity>
          </View>

          {exercise.sets.map((set, setIndex) => (
            <View key={setIndex} style={styles.setRow}>
              <Text style={styles.setNumber}>Set {setIndex + 1}</Text>
              <TextInput
                style={styles.input}
                placeholder="Reps"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={set.reps}
                onChangeText={(value) => updateSet(exercise.id, setIndex, 'reps', value)}
              />
              <TextInput
                style={styles.input}
                placeholder="Weight (kg)"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={set.weight}
                onChangeText={(value) => updateSet(exercise.id, setIndex, 'weight', value)}
              />
              <TouchableOpacity
                onPress={() => removeSet(exercise.id, setIndex)}
                style={styles.removeSetButton}
              >
                <MaterialCommunityIcons name="delete" size={20} color="#e63946" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addSetButton}
            onPress={() => addSet(exercise.id)}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
            <Text style={styles.addSetText}>Add Set</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workout Details</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Workout Notes (optional)"
          placeholderTextColor="#666"
          multiline
          value={workoutNotes}
          onChangeText={setWorkoutNotes}
        />
        <TextInput
          style={styles.input}
          placeholder="Duration (minutes)"
          placeholderTextColor="#666"
          keyboardType="numeric"
          value={workoutDuration}
          onChangeText={setWorkoutDuration}
        />
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSaveWorkout}
      >
        <Text style={styles.saveButtonText}>Save Workout</Text>
      </TouchableOpacity>
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 16,
  },
  exerciseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  exerciseButton: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    width: '48%',
  },
  exerciseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  exerciseCategory: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  exerciseCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  removeButton: {
    padding: 4,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  setNumber: {
    color: '#fff',
    width: 60,
  },
  input: {
    backgroundColor: '#252525',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    flex: 1,
  },
  removeSetButton: {
    padding: 8,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    justifyContent: 'center',
  },
  addSetText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  notesInput: {
    backgroundColor: '#252525',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#e63946',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
}); 