import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableWithoutFeedback, 
  Keyboard,
  Dimensions,
  Animated
} from 'react-native';
import { 
  Title, 
  TextInput, 
  Button, 
  HelperText, 
  Text, 
  useTheme
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Palette } from '../theme/colors';
import { ActivityIndicator } from 'react-native-paper';

const { width } = Dimensions.get('window');

const LoginScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const auth = getAuth();
  const passwordInputRef = useRef(null);
  
  // State for form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  // Animation refs
  const buttonScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      speed: 12,
      useNativeDriver: true,
    }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      speed: 12,
      useNativeDriver: true,
    }).start();
  };

  const runShakeAnimation = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  const checkAdminStatus = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userRef);
      return docSnap.exists() && docSnap.data().isAdmin;
    } catch (err) {
      console.error("Error checking admin status:", err);
      return false;
    }
  };

  const handleSignIn = async () => {
    Keyboard.dismiss();
    setError('');
    
    if (!email || !password) {
      setError('Email and password are required');
      runShakeAnimation();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (!user.emailVerified) {
        setError('Please verify your email address before signing in');
        runShakeAnimation();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setLoading(false);
        return;
      }
      
      const isAdmin = await checkAdminStatus(user.uid);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      if (isAdmin) {
        navigation.navigate('Admin', { screen: 'AdminPanel' });
      } else {
        navigation.navigate('Main');
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
      runShakeAnimation();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <LinearGradient
        colors={[colors.background, colors.primaryXXLight]}
        style={styles.container}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
          enabled
        >
          <View style={styles.container}>
            <Animated.View 
              style={[
                styles.content,
                { 
                  opacity: fadeAnim,
                  transform: [
                    { translateX: shakeAnim }
                  ] 
                }
              ]}
            >
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <MaterialCommunityIcons 
                    name="book-education" 
                    size={48} 
                    color={colors.primary} 
                  />
                </View>
                <Title style={styles.title}>Welcome Back</Title>
                <Text style={styles.subtitle}>Sign in to continue your learning journey</Text>
              </View>

              <View style={styles.formContainer}>
                <TextInput
                  label="Email"
                  mode="flat"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                  left={<TextInput.Icon name="email-outline" color={colors.primary} />}
                  theme={{
                    colors: {
                      primary: colors.primary,
                      background: colors.surface,
                      placeholder: colors.textMuted,
                      text: colors.text,
                      surface: 'transparent'
                    },
                    roundness: 10
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                />

                <TextInput
                  label="Password"
                  mode="flat"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secureTextEntry}
                  style={styles.input}
                  left={<TextInput.Icon name="lock-outline" color={colors.primary} />}
                  right={
                    <TextInput.Icon 
                      name={secureTextEntry ? "eye-off" : "eye"} 
                      color={colors.primary}
                      onPress={() => {
                        setSecureTextEntry(!secureTextEntry);
                        Haptics.selectionAsync();
                      }}
                    />
                  }
                  theme={{
                    colors: {
                      primary: colors.primary,
                      background: colors.surface,
                      placeholder: colors.textMuted,
                      text: colors.text,
                      surface: 'transparent'
                    },
                    roundness: 10
                  }}
                  ref={passwordInputRef}
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                />

                {error ? (
                  <HelperText type="error" style={styles.errorText} visible={!!error}>
                    {error}
                  </HelperText>
                ) : null}

            
<TouchableWithoutFeedback
  onPressIn={handlePressIn}
  onPressOut={handlePressOut}
  onPress={handleSignIn}
  disabled={loading}
>
  <Animated.View style={[
    styles.buttonContainer,
    { 
      transform: [{ scale: buttonScale }],
      backgroundColor: loading ? colors.primaryLight : colors.primary,
    }
  ]}>
    <View style={styles.buttonContent}>
      {loading && (
        <ActivityIndicator 
          color={colors.iconlight} 
          size="small" 
          style={styles.loadingIndicator}
        />
      )}
      <Text style={styles.buttonText}>
        {loading ? 'Signing In' : 'Sign In'}
      </Text>
    </View>
  </Animated.View>
</TouchableWithoutFeedback>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Don't have an account?</Text>
                  <Button 
                    mode="text" 
                    onPress={() => {
                      Haptics.selectionAsync();
                      navigation.navigate('Signup');
                    }}
                    labelStyle={styles.signupLink}
                    compact
                  >
                    Sign Up
                  </Button>
                </View>
              </View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: colors.surface,
    shadowColor: colors.primaryXLight,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.onBackground,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    lineHeight: 24,
  },
  formContainer: {
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: colors.primaryXLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  input: {
    marginBottom: 20,
    backgroundColor: colors.surface,
    fontSize: 16,
    height: 60,
  },
buttonContainer: {
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 24,
    shadowColor: colors.primaryXLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    backgroundColor: colors.primary,
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
    color: colors.iconlight,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: colors.textMuted,
    marginRight: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  signupLink: {
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 8,
    color: colors.error,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});

export default LoginScreen;