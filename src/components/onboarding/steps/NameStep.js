import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { TextInput, Title } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

export default function NameStep({ name, setName }) {
  return (
    <Animatable.View
      animation="fadeInUp"
      duration={600}
      style={styles.card}
    >
      <Title style={styles.label}>What is your name?</Title>
      <TextInput
        style={styles.textInput}
        label="Your name"
        value={name}
        onChangeText={setName}
        autoFocus
        mode="flat"
        theme={{
          colors: {
            primary: '#e63946',
            background: '#2b2b2b',
            placeholder: '#fff',
            text: '#fff',
            surface: 'transparent'
          },
          roundness: 10
        }}
        left={<TextInput.Icon name="account-outline" color="#fff" />}
      />
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
    color: '#fff',
  },
}); 