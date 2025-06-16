import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { TextInput, Title } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

export default function StatsStep({ age, setAge, weight, setWeight }) {
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
  textInput: {
    backgroundColor: '#2b2b2b',
    fontSize: 16,
    height: 60,
    marginBottom: 8,
  },
}); 