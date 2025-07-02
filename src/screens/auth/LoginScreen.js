
import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase'; // Adjust path if needed
import * as Haptics from 'expo-haptics';

// Import your theme constants
import {
  Palette,
  spacing,
  typography,
  shadows,
  borderRadius,
} from '../../theme/colors'; // Adjust path if needed

const LoginScreen = () => {
  const navigation = useNavigation();
  const auth = getAuth();
  const passwordInputRef = useRef(null);

  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const checkUserType = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userRef);
      return docSnap.exists() ? docSnap.data().userType : 'user';
    } catch (err) {
      console.error('Error checking user type:', err);
      return 'user';
    }
  };

  const handleSignIn = async () => {
    Keyboard.dismiss();
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setError('Please verify your email address before signing in');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setLoading(false);
        return;
      }

      const userType = await checkUserType(user.uid);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate(userType === 'therapist' ? 'TherapistHome' : 'UserHome');
    } catch (err) {
      let errorMessage = 'Login failed. Please try again.';
      switch (err.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Account temporarily disabled due to many failed attempts';
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
                <Text style={styles.title}>Welcome back</Text>
                <Text style={styles.subtitle}>Take a deep breath and sign in</Text>
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
                  returnKeyType="done"
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
                  onSubmitEditing={handleSignIn}
                />

                {error ? (
                  <HelperText type="error" style={styles.errorText} visible={!!error}>
                    {error}
                  </HelperText>
                ) : null}

                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => {
                    Haptics.selectionAsync();
                    navigation.navigate('ForgotPassword');
                  }}
                >
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </TouchableOpacity>

                <Button
                  mode="contained"
                  onPress={handleSignIn}
                  style={styles.button}
                  buttonColor={Palette.primary}
                  labelStyle={styles.buttonLabel}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={Palette.white} animating={true} />
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Don't have an account?</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      navigation.navigate('Signup');
                    }}
                  >
                    <Text style={styles.footerLink}>Create one</Text>
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    ...typography.small,
    color: Palette.primary,
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
    elevation: 0,
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

export default LoginScreen;
