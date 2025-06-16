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
  Image,
  SafeAreaView
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  HelperText,
  ActivityIndicator
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

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

  // Check user type in Firestore
  const checkUserType = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userRef);
      return docSnap.exists() ? docSnap.data().userType : 'athlete';
    } catch (err) {
      console.error('Error checking user type:', err);
      return 'athlete';
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
      if (userType === 'coach') {
        navigation.navigate('CoachDashboard');
      } else {
        navigation.navigate('AthleteDashboard');
      }
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.headerContainer}>
                <Text style={styles.loginTitle}>Welcome Back!</Text>
                <Text style={styles.loginSubtitle}>Sign in to continue</Text>
              </View>

              <View style={styles.formContainer}>
                <TextInput
                  label="Email"
                  mode="outlined"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#FF4F79"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  left={<TextInput.Icon icon="email" color="#999" />}
                  theme={{ roundness: 12 }}
                />

                <TextInput
                  label="Password"
                  mode="outlined"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secureTextEntry}
                  style={styles.input}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#FF4F79"
                  returnKeyType="done"
                  ref={passwordInputRef}
                  left={<TextInput.Icon icon="lock" color="#999" />}
                  theme={{ roundness: 12 }}
                  right={
                    <TextInput.Icon
                      icon={secureTextEntry ? 'eye-off' : 'eye'}
                      color="#999"
                      onPress={() => {
                        setSecureTextEntry(!secureTextEntry);
                        Haptics.selectionAsync();
                      }}
                    />
                  }
                  onSubmitEditing={handleSignIn}
                />

                <TouchableOpacity
                  style={styles.forgotPasswordButton}
                  onPress={() => {
                    Haptics.selectionAsync();
                  }}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                {error ? (
                  <HelperText type="error" style={styles.errorText} visible={!!error}>
                    {error}
                  </HelperText>
                ) : null}

                <Button
                  mode="contained"
                  onPress={handleSignIn}
                  style={styles.signInButton}
                  buttonColor="#FF4F79"
                  labelStyle={styles.signInLabel}
                  disabled={loading}
                  contentStyle={styles.signInButtonContent}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" animating={true} style={{ marginRight: 8 }} />
                  ) : null}
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>

                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.socialContainer}>
                  <TouchableOpacity
                    onPress={() => Haptics.selectionAsync()}
                    style={styles.socialButton}
                  >
                    <View style={[styles.socialIconContainer, { backgroundColor: '#FFFFFF' }]}>
                      {/* <Image 
                        source={require('../../assets/google-icon.png')}
                        style={styles.socialIcon}
                      /> */}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => Haptics.selectionAsync()}
                    style={styles.socialButton}
                  >
                    <View style={[styles.socialIconContainer, { backgroundColor: '#FFFFFF' }]}>
                      {/* <Image 
                        source={require('../../assets/apple-icon.png')}
                        style={styles.socialIcon}
                      /> */}
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.createAccountContainer}>
                  <Text style={styles.createAccountPrompt}>Don't have an account?</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      navigation.navigate('Signup');
                    }}
                  >
                    <Text style={styles.createAccountText}>Sign up</Text>
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
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  headerContainer: {
    marginBottom: 32,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#FF4F79',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    marginBottom: 16,
    color: '#FF4F79',
  },
  signInButton: {
    borderRadius: 12,
    marginBottom: 24,
  },
  signInButtonContent: {
    height: 56,
  },
  signInLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666666',
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  socialButton: {
    marginHorizontal: 12,
  },
  socialIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
  createAccountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createAccountPrompt: {
    color: '#666666',
    fontSize: 14,
    marginRight: 4,
  },
  createAccountText: {
    color: '#FF4F79',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;