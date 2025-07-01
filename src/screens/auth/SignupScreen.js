
import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  HelperText,
  ActivityIndicator
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

// 1) IMPORT FIRESTORE FUNCTIONS
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

import * as Haptics from 'expo-haptics';

const SignupScreen = () => {
  const navigation = useNavigation();
  
  // 2) INITIALIZE AUTH AND FIRESTORE REFERENCES
  const auth = getAuth();
  const db = getFirestore();  // Make sure Firebase is initialized elsewhere in your app
  
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);

  const handleSignUp = async () => {
    Keyboard.dismiss();
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('All fields are required');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (password.length < 6) {
      setError('Password should be at least 6 characters');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    try {
      // 3) CREATE FIREBASE AUTH USER
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 4) SEND VERIFICATION EMAIL
      await sendEmailVerification(userCredential.user);

      // 5) CREATE USER DOCUMENT IN FIRESTORE
      // Here we store basic fields: email, role, createdAt, etc.
      // The doc ID matches the user's UID to ensure easy lookups.
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        role: 'student', // or any default role you wish
        createdAt: serverTimestamp(),
      });

      // 6) Success: Provide user feedback and navigate
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Example: Navigate to "Onboarding" screen, passing email and uid
      navigation.navigate('Onboarding', { 
        email,
        uid: userCredential.user.uid
      });
      
    } catch (err) {
      let errorMessage = 'Signup failed. Please try again.';
      switch (err.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
      }
      setError(errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.header}>
                <Text style={styles.title}>Begin your journey</Text>
                <Text style={styles.subtitle}>Create an account to get started</Text>
              </View>

              <View style={styles.form}>
                <TextInput
                  label="Email"
                  mode="outlined"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                  outlineColor="#CBD5E1"
                  activeOutlineColor="#5B6ABF"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  left={<TextInput.Icon icon="email" color="#94A3B8" />}
                  theme={{ roundness: 10 }}
                />

                <TextInput
                  label="Password"
                  mode="outlined"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secureTextEntry}
                  style={styles.input}
                  outlineColor="#CBD5E1"
                  activeOutlineColor="#5B6ABF"
                  returnKeyType="next"
                  ref={passwordInputRef}
                  left={<TextInput.Icon icon="lock" color="#94A3B8" />}
                  theme={{ roundness: 10 }}
                  right={
                    <TextInput.Icon
                      icon={secureTextEntry ? 'eye-off' : 'eye'}
                      color="#94A3B8"
                      onPress={() => {
                        setSecureTextEntry(!secureTextEntry);
                        Haptics.selectionAsync();
                      }}
                    />
                  }
                  onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                />

                <TextInput
                  label="Confirm Password"
                  mode="outlined"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={secureConfirmTextEntry}
                  style={styles.input}
                  outlineColor="#CBD5E1"
                  activeOutlineColor="#5B6ABF"
                  returnKeyType="done"
                  ref={confirmPasswordInputRef}
                  left={<TextInput.Icon icon="lock" color="#94A3B8" />}
                  theme={{ roundness: 10 }}
                  right={
                    <TextInput.Icon
                      icon={secureConfirmTextEntry ? 'eye-off' : 'eye'}
                      color="#94A3B8"
                      onPress={() => {
                        setSecureConfirmTextEntry(!secureConfirmTextEntry);
                        Haptics.selectionAsync();
                      }}
                    />
                  }
                  onSubmitEditing={handleSignUp}
                />

                {error ? (
                  <HelperText type="error" style={styles.errorText} visible={!!error}>
                    {error}
                  </HelperText>
                ) : null}

                <Button
                  mode="contained"
                  onPress={handleSignUp}
                  style={styles.button}
                  buttonColor="#5B6ABF"
                  labelStyle={styles.buttonLabel}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" animating={true} />
                  ) : (
                    'Create Account'
                  )}
                </Button>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Already have an account?</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      navigation.navigate('Login');
                    }}
                  >
                    <Text style={styles.footerLink}>Sign in</Text>
                  </TouchableOpacity>
                </View>
              </View>

            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 24,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    marginBottom: 16,
    color: '#EF4444',
  },
  button: {
    borderRadius: 10,
    paddingVertical: 8,
    marginBottom: 24,
    elevation: 0,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#64748B',
    marginRight: 4,
  },
  footerLink: {
    color: '#5B6ABF',
    fontWeight: '500',
  },
});

export default SignupScreen;

