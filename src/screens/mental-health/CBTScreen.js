import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
// Firebase imports
import { getAuth } from 'firebase/auth';
import { db } from '../../config/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
} from 'firebase/firestore';

// Import your theme constants
import {
  Palette,
  spacing,
  typography,
  shadows,
  borderRadius,
} from '../../theme/colors'; // Adjust import path as needed

export default function CBTScreen() {
  const [thoughtRecord, setThoughtRecord] = useState({
    situation: '',
    emotion: '',
    automaticThought: '',
    evidenceFor: '',
    evidenceAgainst: '',
    balancedThought: '',
    newEmotion: '',
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [savedRecords, setSavedRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Default step data (in case of out-of-range index)
  const defaultStepData = {
    title: 'Loading…',
    description: '',
    field: '',
    placeholder: '',
    icon: 'help-circle-outline',
    color: '#CCCCCC',
  };

  // cbtSteps array (replace or map these colors to your theme if you wish)
  const cbtSteps = [
    {
      title: 'The Situation',
      description: 'Describe what happened that triggered your negative emotion.',
      field: 'situation',
      placeholder: 'e.g., I made a mistake on a work project.',
      icon: 'map-marker-outline',
      color: Palette.primary, // #4DB6AC
    },
    {
      title: 'Your Emotion(s)',
      description: 'What emotion(s) did you feel? Rate their intensity (1-10).',
      field: 'emotion',
      placeholder: 'e.g., Anxiety (8/10), Shame (6/10)',
      icon: 'emoticon-sad-outline',
      color: Palette.secondaryOrange, // #FFB74D
    },
    {
      title: 'Automatic Thought(s)',
      description: 'What thought(s) went through your mind?',
      field: 'automaticThought',
      placeholder: 'e.g., "I\'m a failure", "I always mess things up."',
      icon: 'brain',
      color: Palette.secondaryPurple, // #7986CB
    },
    {
      title: 'Evidence For',
      description: 'List objective facts that support your automatic thought(s).',
      field: 'evidenceFor',
      placeholder: 'Focus on facts, not interpretations.',
      icon: 'check-circle-outline',
      color: Palette.secondaryBlue, // #64B5F6
    },
    {
      title: 'Evidence Against',
      description: 'List objective facts that contradict your automatic thought(s).',
      field: 'evidenceAgainst',
      placeholder: 'Is there another way to see this?',
      icon: 'close-circle-outline',
      color: Palette.secondaryRed, // #E57373
    },
    {
      title: 'Balanced Thought',
      description: 'Create a more balanced, realistic thought based on the evidence.',
      field: 'balancedThought',
      placeholder: 'e.g., "I made a mistake, but it doesn\'t mean I\'m a failure."',
      icon: 'scale-balance',
      color: Palette.secondaryPink, // #BA68C8
    },
    {
      title: 'New Emotion(s)',
      description: 'How do you feel now? Rate the new intensity (1-10).',
      field: 'newEmotion',
      placeholder: 'e.g., Relief (4/10).',
      icon: 'emoticon-happy-outline',
      color: '#81C784', // Not in palette; keep or replace as desired
    },
  ];

  // Safely retrieve the step data
  const stepCount = cbtSteps.length;
  const safeStepIndex = currentStep >= 0 && currentStep < stepCount ? currentStep : 0;
  const currentStepData = cbtSteps[safeStepIndex] || defaultStepData;

  // Animate on step change
  const runAnimation = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    runAnimation();
  }, [currentStep]);

  // Update a specific field in thoughtRecord
  const updateField = (field, value) => {
    setThoughtRecord((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Step navigation
  const nextStep = () => {
    if (safeStepIndex < stepCount - 1) {
      setCurrentStep(safeStepIndex + 1);
    } else {
      // If on the last step, save
      saveThoughtRecord();
    }
  };

  const prevStep = () => {
    if (safeStepIndex > 0) {
      setCurrentStep(safeStepIndex - 1);
    }
  };

  // ========================
  // Firestore Integration
  // ========================
  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const auth = getAuth();
      if (auth.currentUser) {
        const q = query(
          collection(db, 'cbtRecords'),
          where('userId', '==', auth.currentUser.uid),
          where('timestamp', '!=', null)
        );
        const querySnapshot = await getDocs(q);
        const firestoreRecords = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().timestamp?.toDate() || new Date(),
        }));
        setSavedRecords(firestoreRecords);
        await AsyncStorage.setItem('cbtRecords', JSON.stringify(firestoreRecords));
      } else {
        // If not logged in, use AsyncStorage
        const localRecords = await AsyncStorage.getItem('cbtRecords');
        if (localRecords) {
          setSavedRecords(JSON.parse(localRecords));
        }
      }
    } catch (error) {
      console.error('Error loading records:', error);
      // Fallback to local if Firestore fails
      const localRecords = await AsyncStorage.getItem('cbtRecords');
      if (localRecords) {
        setSavedRecords(JSON.parse(localRecords));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveThoughtRecord = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      Alert.alert('Not logged in', 'Please sign in to save your records.');
      return;
    }

    const newRecord = {
      ...thoughtRecord,
      userId: user.uid,
      date: new Date().toISOString(),
      timestamp: serverTimestamp(),
    };

    try {
      setIsLoading(true);

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'cbtRecords'), newRecord);

      // Increment cbtSessions in user document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        cbtSessions: increment(1),
      });

      // Update local records
      setSavedRecords((prev) => [
        { ...newRecord, id: docRef.id },
        ...prev,
      ]);

      // Reset form
      setThoughtRecord({
        situation: '',
        emotion: '',
        automaticThought: '',
        evidenceFor: '',
        evidenceAgainst: '',
        balancedThought: '',
        newEmotion: '',
      });
      setCurrentStep(0);

      Alert.alert('Success', 'Record saved successfully!');
    } catch (error) {
      console.error('Error saving record:', error);
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ========================
  // UI Renderers
  // ========================
  const renderSaveButton = () => {
    if (isLoading) {
      return (
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            { backgroundColor: Palette.border }, // disabled style
          ]}
          disabled
        >
          <MaterialCommunityIcons name="loading" size={20} color={Palette.white} />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.navButton,
          styles.nextButton,
          { backgroundColor: currentStepData.color },
        ]}
        onPress={nextStep}
      >
        <Text style={[styles.navButtonText, { color: Palette.white }]}>
          {safeStepIndex < stepCount - 1 ? 'Next' : 'Complete'}
        </Text>
        <MaterialCommunityIcons
          name={safeStepIndex < stepCount - 1 ? 'arrow-right' : 'check'}
          size={20}
          color={Palette.white}
        />
      </TouchableOpacity>
    );
  };

  const navigationContainer = (
    <View style={styles.navigationContainer}>
      <TouchableOpacity
        style={[
          styles.navButton,
          styles.prevButton,
          { opacity: safeStepIndex === 0 ? 0.5 : 1 },
        ]}
        onPress={prevStep}
        disabled={safeStepIndex === 0}
      >
        <MaterialCommunityIcons name="arrow-left" size={20} color={Palette.textMedium} />
        <Text style={styles.navButtonText}>Prev</Text>
      </TouchableOpacity>

      {renderSaveButton()}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>CBT Thought Record</Text>
          <Text style={styles.subtitle}>
            A tool to identify and challenge negative thinking patterns.
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          {cbtSteps.map((step, index) => (
            <View
              key={index}
              style={[
                styles.progressSegment,
                index <= safeStepIndex && {
                  backgroundColor: step?.color ?? defaultStepData.color,
                },
              ]}
            />
          ))}
        </View>

        {/* Current Step Card */}
        <Animated.View
          style={[
            styles.card,
            shadows.medium,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              borderColor: currentStepData?.color ?? defaultStepData.color,
            },
          ]}
        >
          <View style={styles.stepHeader}>
            <View
              style={[
                styles.stepIconContainer,
                {
                  backgroundColor:
                    (currentStepData?.color ?? defaultStepData.color) + '20',
                },
              ]}
            >
              <MaterialCommunityIcons
                name={currentStepData?.icon ?? defaultStepData.icon}
                size={28}
                color={currentStepData?.color ?? defaultStepData.color}
              />
            </View>
            <Text style={styles.stepTitle}>
              {currentStepData?.title ?? defaultStepData.title}
            </Text>
          </View>

          <Text style={styles.stepDescription}>
            {currentStepData?.description ?? ''}
          </Text>

          <TextInput
            style={styles.textInput}
            placeholder={currentStepData?.placeholder ?? ''}
            placeholderTextColor={Palette.textLight}
            value={thoughtRecord[currentStepData?.field] ?? ''}
            onChangeText={(text) => updateField(currentStepData?.field, text)}
            multiline
            textAlignVertical="top"
          />
        </Animated.View>

        {/* Navigation Buttons */}
        {navigationContainer}

        {/* Recent Saved Records (Optional) */}
        {savedRecords.length > 0 && (
          <View style={[styles.card, shadows.low]}>
            <Text style={styles.cardTitle}>Recent Records</Text>
            <View style={{ alignItems: 'flex-end', marginBottom: spacing.sm }}>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('SavedRecordsScreen')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="eye"
                  size={18}
                  color={Palette.white}
                  style={{ marginRight: spacing.xs }}
                />
                <Text style={styles.viewAllButtonText}>View All</Text>
              </TouchableOpacity>
            </View>

            {savedRecords.slice(0, 2).map((record) => (
              <View key={record.id ?? record.date} style={styles.recordItem}>
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={24}
                  color={Palette.secondaryPurple}
                />
                <View style={styles.recordTextContainer}>
                  <Text style={styles.recordSituation} numberOfLines={1}>
                    {record.situation || 'Untitled Record'}
                  </Text>
                  <Text style={styles.recordDate}>
                    {new Date(record.date).toLocaleDateString()}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={Palette.textLight}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Updated styles using theme constants
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
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
  progressContainer: {
    flexDirection: 'row',
    height: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: Palette.border,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  progressSegment: {
    flex: 1,
    backgroundColor: Palette.border,
  },
  card: {
    backgroundColor: Palette.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
  },
  cardTitle: {
    ...typography.h2,
    color: Palette.textDark,
    marginBottom: spacing.md,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  stepTitle: {
    ...typography.h3,
    fontWeight: 'bold',
    color: Palette.textDark,
    flex: 1,
  },
  stepDescription: {
    ...typography.body,
    color: Palette.textMedium,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  textInput: {
    backgroundColor: Palette.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
    minHeight: 120,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
  },
  prevButton: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  nextButton: {
    // backgroundColor set dynamically
  },
  navButtonText: {
    ...typography.body,
    fontWeight: 'bold',
    marginHorizontal: spacing.xs,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  recordTextContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  recordSituation: {
    ...typography.body,
    fontWeight: '500',
    color: Palette.textDark,
  },
  recordDate: {
    ...typography.small,
    color: Palette.textLight,
    marginTop: spacing.xs,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.secondaryPurple,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    elevation: 2, // or shadows.low if you prefer
  },
  viewAllButtonText: {
    ...typography.body,
    color: Palette.white,
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
