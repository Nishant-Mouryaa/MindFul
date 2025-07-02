
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
  StatusBar,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';

// Import your theme constants (adjust path as necessary)
import {
  Palette,
  spacing,
  typography,
  borderRadius,
  shadows,
} from '../../theme/colors'; // or wherever your theme file is located

const SignupScreen = () => {
  const navigation = useNavigation();
  const auth = getAuth();
  const db = getFirestore();  

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
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Send verification email
      await sendEmailVerification(userCredential.user);

      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        role: 'student', // or any default role
        createdAt: serverTimestamp(),
      });

      // Success haptic and navigation
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('Onboarding', {
        email,
        uid: userCredential.user.uid,
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
      <StatusBar barStyle="dark-content" backgroundColor={Palette.background} />
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
                  outlineColor={Palette.border}
                  activeOutlineColor={Palette.primary}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  left={<TextInput.Icon icon="email" color={Palette.textLight} />}
                  theme={{ roundness: borderRadius.sm }}
                />

                <TextInput
                  label="Password"
                  mode="outlined"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secureTextEntry}
                  style={styles.input}
                  outlineColor={Palette.border}
                  activeOutlineColor={Palette.primary}
                  returnKeyType="next"
                  ref={passwordInputRef}
                  left={<TextInput.Icon icon="lock" color={Palette.textLight} />}
                  theme={{ roundness: borderRadius.sm }}
                  right={
                    <TextInput.Icon
                      icon={secureTextEntry ? 'eye-off' : 'eye'}
                      color={Palette.textLight}
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
                  outlineColor={Palette.border}
                  activeOutlineColor={Palette.primary}
                  returnKeyType="done"
                  ref={confirmPasswordInputRef}
                  left={<TextInput.Icon icon="lock" color={Palette.textLight} />}
                  theme={{ roundness: borderRadius.sm }}
                  right={
                    <TextInput.Icon
                      icon={secureConfirmTextEntry ? 'eye-off' : 'eye'}
                      color={Palette.textLight}
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
                  buttonColor={Palette.primary}
                  labelStyle={styles.buttonLabel}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={Palette.white} animating={true} />
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

// Updated styles referencing theme constants
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  container: {
    flex: 1,
    backgroundColor: Palette.background,
    paddingHorizontal: spacing.lg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: Palette.textDark,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: Palette.textLight,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: Palette.white,
  },
  errorText: {
    ...typography.caption,
    color: Palette.secondaryRed,
    marginBottom: spacing.md,
  },
  button: {
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xl,
    elevation: 0, // remove if you want shadows
  },
  buttonLabel: {
    ...typography.body,
    fontWeight: '500',
    color: Palette.white,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  footerText: {
    ...typography.body,
    color: Palette.textLight,
    marginRight: spacing.xs,
  },
  footerLink: {
    ...typography.body,
    fontWeight: '500',
    color: Palette.primary,
  },
});

export default SignupScreen;
