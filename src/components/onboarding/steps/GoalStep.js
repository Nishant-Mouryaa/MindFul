import React from 'react';
import { View, StyleSheet, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { Title, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const goalOptions = ['Strength', 'Cut', 'Bulk', 'Endurance'];

export default function GoalStep({ trainingGoal, setTrainingGoal }) {
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
}

const styles = StyleSheet.create({
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
}); 