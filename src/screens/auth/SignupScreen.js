import React, { useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated
} from 'react-native';
import { 
  TextInput, 
  Button, 
  HelperText, 
  Text, 
  useTheme,
  ActivityIndicator
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const SignupScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  
  // Refs
  const passwordInput = useRef();
  const auth = getAuth();
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleSignUp = async () => {
    Keyboard.dismiss();
    setError('');
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      
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
      }
      setError(errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <LinearGradient
        colors={['#0a0a0a', '#1a1a1a']}
        style={styles.container}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <MaterialCommunityIcons 
                name="weight-lifter" 
                size={64} 
                color="#e63946" 
                style={styles.icon}
              />
              <Text style={styles.title}>JOIN POWERLIFT PRO</Text>
              <Text style={styles.subtitle}>Create your account to get started</Text>
            </View>

            <View style={styles.form}>
              <TextInput
                label="Email"
                mode="flat"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                left={<TextInput.Icon name="email-outline" color="#e63946" />}
                returnKeyType="next"
                onSubmitEditing={() => passwordInput.current?.focus()}
                theme={{
                  colors: {
                    primary: '#e63946',
                    background: '#2b2b2b',
                    placeholder: '#777',
                    text: '#fff'
                  },
                  roundness: 10
                }}
              />

              <TextInput
                label="Password"
                mode="flat"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureTextEntry}
                style={styles.input}
                left={<TextInput.Icon name="lock-outline" color="#e63946" />}
                right={
                  <TextInput.Icon 
                    name={secureTextEntry ? "eye-off" : "eye"} 
                    color="#e63946"
                    onPress={() => {
                      setSecureTextEntry(!secureTextEntry);
                      Haptics.selectionAsync();
                    }}
                  />
                }
                ref={passwordInput}
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
                theme={{
                  colors: {
                    primary: '#e63946',
                    background: '#2b2b2b',
                    placeholder: '#777',
                    text: '#fff'
                  },
                  roundness: 10
                }}
              />

              {error ? (
                <HelperText type="error" style={styles.errorText}>
                  {error}
                </HelperText>
              ) : null}

              <TouchableWithoutFeedback
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handleSignUp}
                disabled={loading}
              >
                <Animated.View style={[
                  styles.button,
                  { 
                    transform: [{ scale: buttonScale }],
                    backgroundColor: loading ? '#c1121f' : '#e63946',
                  }
                ]}>
                  <View style={styles.buttonContent}>
                    {loading && (
                      <ActivityIndicator 
                        color="#ffffff" 
                        size="small" 
                        style={styles.loadingIndicator}
                      />
                    )}
                    <Text style={styles.buttonText}>
                      {loading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
                    </Text>
                  </View>
                </Animated.View>
              </TouchableWithoutFeedback>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Already have an account?{' '}
                  <Text 
                    style={styles.loginLink}
                    onPress={() => navigation.navigate('Login')}
                  >
                    Sign in
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Roboto-Bold',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    fontFamily: 'Roboto-Regular',
  },
  form: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#e63946',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  input: {
    marginBottom: 20,
    backgroundColor: '#2b2b2b',
    fontSize: 16,
    height: 60,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 24,
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: 'Roboto-Bold',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    color: '#aaa',
    fontFamily: 'Roboto-Regular',
  },
  loginLink: {
    color: '#e63946',
    fontWeight: '800',
    fontFamily: 'Roboto-Bold',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#ff6b6b',
    textAlign: 'center',
    fontFamily: 'Roboto-Medium',
  },
});

export default SignupScreen;