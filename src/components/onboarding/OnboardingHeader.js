import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

export default function OnboardingHeader({ step }) {
  return (
    <View style={styles.header}>
      <Animatable.View
        animation="bounceIn"
        duration={1000}
        style={styles.logoContainer}
      >
        <MaterialCommunityIcons
          name="weight-lifter"
          size={48}
          color="#e63946"
        />
      </Animatable.View>
      <Animatable.Text
        animation="fadeInDown"
        duration={600}
        style={styles.title}
      >
        POWERLIFT PRO
      </Animatable.Text>
      <Animatable.Text
        animation="fadeInDown"
        duration={600}
        delay={200}
        style={styles.subtitle}
      >
        Let's get you set up
      </Animatable.Text>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map((i) => {
          let stepStyle = styles.progressStep;
          let stepIcon = null;

          // Completed
          if (i < step) {
            stepStyle = { ...stepStyle, ...styles.progressStepCompleted };
            stepIcon = (
              <MaterialCommunityIcons
                name="check"
                size={16}
                color="#fff"
              />
            );
          }
          // Active
          if (i === step) {
            stepStyle = { ...stepStyle, ...styles.progressStepActive };
            stepIcon = <Text style={styles.progressStepText}>{i}</Text>;
          }
          // Inactive
          if (i > step) {
            stepIcon = <Text style={styles.progressStepText}>{i}</Text>;
          }

          return (
            <Animatable.View
              animation="zoomIn"
              duration={500}
              delay={i * 100}
              key={i}
              style={stepStyle}
            >
              {stepIcon}
            </Animatable.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#1a1a1a',
    shadowColor: '#e63946',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: width * 0.7,
    marginBottom: 8,
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2b2b2b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#444',
  },
  progressStepActive: {
    backgroundColor: '#e63946',
    borderColor: '#e63946',
  },
  progressStepCompleted: {
    backgroundColor: '#e63946',
    borderColor: '#e63946',
  },
  progressStepText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 