import React from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Animated } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import * as Haptics from 'expo-haptics';

export default function OnboardingNavigation({
  step,
  loading,
  onBack,
  onNext,
  buttonScale,
  onPressIn,
  onPressOut,
}) {
  return (
    <View style={styles.navigation}>
      {step > 1 && (
        <TouchableWithoutFeedback
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={onBack}
          disabled={loading}
        >
          <Animated.View
            style={[
              styles.backButton,
              { transform: [{ scale: buttonScale }] }
            ]}
          >
            <Text style={styles.backButtonText}>BACK</Text>
          </Animated.View>
        </TouchableWithoutFeedback>
      )}
      <TouchableWithoutFeedback
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onNext}
        disabled={loading}
      >
        <Animated.View
          style={[
            styles.nextButton,
            {
              transform: [{ scale: buttonScale }],
              backgroundColor: loading ? '#c1121f' : '#e63946',
              marginLeft: step > 1 ? 16 : 0
            }
          ]}
        >
          <View style={styles.buttonContent}>
            {loading && (
              <ActivityIndicator
                color="#ffffff"
                size="small"
                style={styles.loadingIndicator}
              />
            )}
            <Text style={styles.nextButtonText}>
              {step < 4
                ? loading
                  ? 'CONTINUING...'
                  : 'CONTINUE'
                : loading
                ? 'FINISHING...'
                : 'GET STARTED'}
            </Text>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  navigation: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  backButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#2b2b2b',
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  nextButton: {
    minWidth: 160,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#e63946',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    marginRight: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
}); 