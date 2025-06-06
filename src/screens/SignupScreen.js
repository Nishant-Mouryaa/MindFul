import React, { useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Title, 
  TextInput, 
  Button, 
  HelperText, 
  Text, 
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Palette } from '../theme/colors';

const SignupScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  
  // Form state
  const [role, setRole] = useState('Student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolBoard, setSchoolBoard] = useState('');
  const [grade, setGrade] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [adminCode, setAdminCode] = useState('');
  const [showAdminCode, setShowAdminCode] = useState(false);
  
  // Refs for input fields
  const emailInput = useRef();
  const passwordInput = useRef();
  const schoolBoardInput = useRef();
  const gradeInput = useRef();
  const mobileInput = useRef();
  const adminCodeInput = useRef();
  
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
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleSendOtp = () => {
    Keyboard.dismiss();
    if (!mobileNumber || mobileNumber.length < 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setOtpSent(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSignUp = async () => {
    Keyboard.dismiss();
    setError('');
    
    if (!fullName || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (role === 'Student') {
      if (!schoolBoard || !grade || !mobileNumber || !otp) {
        setError('Please fill all student information');
        return;
      }
      if (otp !== '123456') {
        setError('Invalid OTP. Please try again.');
        return;
      }
    }
    
    const isAdmin = adminCode === 'ADMIN123';
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, {
        displayName: fullName
      });
      
      const userData = {
        uid: user.uid,
        email: user.email,
        name: fullName,
        fullName,
        role,
        isAdmin: adminCode === 'ADMIN123',
        createdAt: new Date(),
        emailVerified: false,
        activeCourses: 0,
        completedTests: 0,
        avgScore: 0
      };
      
      if (role === 'Student') {
        userData.schoolBoard = schoolBoard;
        userData.grade = grade;
        userData.mobileNumber = mobileNumber;
      }
      
      await setDoc(doc(db, 'users', user.uid), userData);
      await sendEmailVerification(user);
      
      Alert.alert(
        'Verification Sent',
        `A verification email has been sent to ${email}. Please verify to continue.`,
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
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

  // Input theme using the palette
  const inputTheme = {
    colors: {
      primary: colors.primary,
      background: colors.surface,
      placeholder: colors.textMuted,
      text: colors.text,
      surface: 'transparent'
    },
    roundness: 10
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <LinearGradient
        colors={[colors.background, colors.primaryXXLight]}
        style={styles.container}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <SafeAreaView style={styles.safeArea}>
            <ScrollView 
              contentContainerStyle={styles.scrollContainer}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <MaterialCommunityIcons 
                    name="account-plus" 
                    size={48} 
                    color={colors.primary} 
                  />
                </View>
                <Title style={styles.title}>Create Your Account</Title>
                <Text style={styles.subtitle}>Join us to continue your learning journey</Text>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.roleContainer}>
                  <Text style={styles.roleLabel}>Select Your Role</Text>
                  <View style={styles.roleCardsContainer}>
                    <TouchableWithoutFeedback onPress={() => setRole('Student')}>
                      <View style={[
                        styles.roleCard,
                        role === 'Student' && styles.selectedRoleCard
                      ]}>
                        <MaterialCommunityIcons 
                          name="school-outline" 
                          size={32} 
                          color={role === 'Student' ? colors.primary : colors.textMuted}
                          style={styles.roleIcon}
                        />
                        <Text style={[
                          styles.roleCardText,
                          role === 'Student' && styles.selectedRoleCardText
                        ]}>
                          Student
                        </Text>
                        {role === 'Student' && (
                          <View style={styles.roleCheckmark}>
                            <MaterialCommunityIcons 
                              name="check-circle" 
                              size={24} 
                              color={colors.primary} 
                            />
                          </View>
                        )}
                      </View>
                    </TouchableWithoutFeedback>

                    <TouchableWithoutFeedback onPress={() => setRole('Teacher')}>
                      <View style={[
                        styles.roleCard,
                        role === 'Teacher' && styles.selectedRoleCard
                      ]}>
                        <MaterialCommunityIcons 
                          name="teach" 
                          size={32} 
                          color={role === 'Teacher' ? colors.primary : colors.textMuted}
                          style={styles.roleIcon}
                        />
                        <Text style={[
                          styles.roleCardText,
                          role === 'Teacher' && styles.selectedRoleCardText
                        ]}>
                          Teacher
                        </Text>
                        {role === 'Teacher' && (
                          <View style={styles.roleCheckmark}>
                            <MaterialCommunityIcons 
                              name="check-circle" 
                              size={24} 
                              color={colors.primary} 
                            />
                          </View>
                        )}
                      </View>
                    </TouchableWithoutFeedback>
                  </View>
                </View>

                {/* Common Fields */}
                <TextInput
                  label="Full Name"
                  mode="flat"
                  value={fullName}
                  onChangeText={setFullName}
                  style={styles.input}
                  left={<TextInput.Icon name="account-outline" color={colors.primary} />}
                  returnKeyType="next"
                  onSubmitEditing={() => emailInput.current?.focus()}
                  theme={inputTheme}
                />

                <TextInput
                  label="Email"
                  mode="flat"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  left={<TextInput.Icon name="email-outline" color={colors.primary} />}
                  ref={emailInput}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInput.current?.focus()}
                  theme={inputTheme}
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
                  ref={passwordInput}
                  returnKeyType={role === 'Student' ? 'next' : 'done'}
                  onSubmitEditing={role === 'Student' ? () => schoolBoardInput.current?.focus() : handleSignUp}
                  theme={inputTheme}
                />

                {/* Admin Registration Field */}
                <TouchableOpacity 
                  style={styles.adminToggle}
                  onPress={() => setShowAdminCode(!showAdminCode)}
                >
                  <Text style={[styles.adminToggleText, { color: colors.primary }]}>
                    Are you an administrator? Click here
                  </Text>
                </TouchableOpacity>

                {showAdminCode && (
                  <TextInput
                    label="Admin Access Code"
                    mode="flat"
                    value={adminCode}
                    onChangeText={setAdminCode}
                    secureTextEntry={true}
                    style={styles.input}
                    left={<TextInput.Icon name="shield-key" color={colors.primary} />}
                    ref={adminCodeInput}
                    returnKeyType="done"
                    theme={inputTheme}
                  />
                )}

                {/* Student-Specific Fields */}
                {role === 'Student' && (
                  <>
                    <TextInput
                      label="School Board"
                      mode="flat"
                      value={schoolBoard}
                      onChangeText={setSchoolBoard}
                      style={styles.input}
                      left={<TextInput.Icon name="school-outline" color={colors.primary} />}
                      ref={schoolBoardInput}
                      returnKeyType="next"
                      onSubmitEditing={() => gradeInput.current?.focus()}
                      theme={inputTheme}
                    />

                    <TextInput
                      label="Class/Grade"
                      mode="flat"
                      value={grade}
                      onChangeText={setGrade}
                      style={styles.input}
                      left={<TextInput.Icon name="numeric" color={colors.primary} />}
                      ref={gradeInput}
                      returnKeyType="next"
                      onSubmitEditing={() => mobileInput.current?.focus()}
                      theme={inputTheme}
                    />

                    <TextInput
                      label="Mobile Number"
                      mode="flat"
                      value={mobileNumber}
                      onChangeText={setMobileNumber}
                      keyboardType="phone-pad"
                      style={styles.input}
                      left={<TextInput.Icon name="phone-outline" color={colors.primary} />}
                      ref={mobileInput}
                      returnKeyType="next"
                      onSubmitEditing={handleSendOtp}
                      theme={inputTheme}
                    />

                    <Button 
                      mode="outlined" 
                      onPress={handleSendOtp} 
                      style={[styles.otpButton, { borderColor: colors.primary }]}
                      icon={otpSent ? "reload" : "send"}
                      labelStyle={[styles.otpButtonText, { color: colors.primary }]}
                    >
                      {otpSent ? 'Resend OTP' : 'Send OTP'}
                    </Button>

                    <TextInput
                      label="Enter OTP"
                      mode="flat"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      style={styles.input}
                      left={<TextInput.Icon name="message-text-outline" color={colors.primary} />}
                      returnKeyType="done"
                      onSubmitEditing={handleSignUp}
                      theme={inputTheme}
                    />
                  </>
                )}

                {error ? (
                  <HelperText 
                    type="error" 
                    style={[styles.errorText, { color: colors.error }]}
                    visible={!!error}
                  >
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
                        {loading ? 'Creating Account...' : 'Sign Up'}
                      </Text>
                    </View>
                  </Animated.View>
                </TouchableWithoutFeedback>

                <View style={styles.footer}>
                  <Text style={[styles.footerText, { color: colors.textMuted }]}>
                    Already have an account?
                  </Text>
                  <Button 
                    mode="text" 
                    onPress={() => {
                      Haptics.selectionAsync();
                      navigation.navigate('Login');
                    }}
                    labelStyle={[styles.loginLink, { color: colors.primary }]}
                    compact
                  >
                    Sign In
                  </Button>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
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
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
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
  roleContainer: {
    marginBottom: 25,
  },
  roleLabel: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: 15,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  roleCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -8,
  },
  roleCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryXXLight,
    height: 120,
  },
  selectedRoleCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryXXLight,
    shadowColor: colors.primaryXLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  roleIcon: {
    marginBottom: 10,
  },
  roleCardText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  selectedRoleCardText: {
    color: colors.primary,
    fontWeight: '600',
  },
  roleCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  input: {
    marginBottom: 20,
    backgroundColor: colors.surface,
    fontSize: 16,
    height: 60,
  },
  otpButton: {
    marginBottom: 20,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  otpButtonText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  adminToggle: {
    marginBottom: 20,
    alignItems: 'center',
  },
  adminToggleText: {
    textDecorationLine: 'underline',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    marginRight: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  loginLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});

export default SignupScreen;