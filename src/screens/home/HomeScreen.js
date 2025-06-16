import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Platform,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [selectedPR, setSelectedPR] = useState(null);
  
  const scaleValues = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1)
  ]).current;

  React.useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for start button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handlePressIn = (index) => {
    Animated.spring(scaleValues[index], {
      toValue: 0.95,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (index) => {
    Animated.spring(scaleValues[index], {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const prData = [
    { title: 'Squat', value: '250 lbs', increase: '+10 lbs', icon: 'weight-lifter' },
    { title: 'Bench Press', value: '180 lbs', increase: '+5 lbs', icon: 'arm-flex' },
    { title: 'Deadlift', value: '300 lbs', increase: '+15 lbs', icon: 'weight' },
  ];

  const QuickStat = ({ icon, value, label }) => (
    <View style={styles.quickStat}>
      <MaterialCommunityIcons name={icon} size={24} color="#000" />
      <Text style={styles.quickStatValue}>{value}</Text>
      <Text style={styles.quickStatLabel}>{label}</Text>
    </View>
  );

  const PRCard = ({ title, value, increase, icon, index }) => (
    <Animated.View
      style={[
        styles.prCard,
        { transform: [{ scale: scaleValues[index] }] },
        selectedPR === index && styles.selectedPRCard
      ]}
    >
      <TouchableOpacity
        style={styles.prCardContent}
        onPress={() => setSelectedPR(index)}
        onPressIn={() => handlePressIn(index)}
        onPressOut={() => handlePressOut(index)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(230, 57, 70, 0.1)', 'rgba(230, 57, 70, 0)']}
          style={styles.prGradient}
        />
        <View style={styles.prHeader}>
          <View style={styles.prIconContainer}>
            <MaterialCommunityIcons name={icon} size={24} color="#e63946" />
          </View>
          <View style={styles.prBadge}>
            <Text style={styles.prBadgeText}>{increase}</Text>
          </View>
        </View>
        <Text style={styles.prTitle}>{title}</Text>
        <Text style={styles.prValue}>{value}</Text>
        <View style={styles.prProgress}>
          <View style={[styles.prProgressBar, { width: `${(index + 1) * 30}%` }]} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.headerTitle}>LIFTWISE</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <MaterialCommunityIcons name="account-circle" size={32} color="#e63946" />
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <LinearGradient
          colors={['#e63946', '#d62828']}
          style={styles.heroSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroContent}>
            <View>
              <Text style={styles.heroTitle}>Ready to Crush It?</Text>
              <Text style={styles.heroSubtitle}>Squat & Bench Press Day</Text>
            </View>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => navigation.navigate('Workout')}
              >
                <MaterialCommunityIcons name="play" size={24} color="#e63946" />
              </TouchableOpacity>
            </Animated.View>
          </View>
          <View style={styles.heroStats}>
            <QuickStat icon="fire" value="5" label="Streak"  />
            <QuickStat icon="calendar-check" value="23" label="This Month" />
            <QuickStat icon="trophy" value="12" label="PRs" />
          </View>
        </LinearGradient>

        {/* Recent PRs Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Personal Records</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.prScrollContainer}
          >
            {prData.map((pr, index) => (
              <PRCard key={index} {...pr} index={index + 1} />
            ))}
          </ScrollView>
        </View>

        {/* Tip of the Day */}
        <LinearGradient
          colors={['rgba(230, 57, 70, 0.1)', 'rgba(230, 57, 70, 0.05)']}
          style={styles.tipContainer}
        >
          <View style={styles.tipHeader}>
            <MaterialCommunityIcons name="lightbulb-on" size={28} color="#e63946" />
            <Text style={styles.tipTitle}>Pro Tip</Text>
          </View>
          <Text style={styles.tipText}>
            Progressive overload is key. Add 2.5-5 lbs each week to maintain steady progress.
          </Text>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Academy')}
          >
            <LinearGradient
              colors={['#1a1a1a', '#222']}
              style={styles.actionGradient}
            >
              <MaterialCommunityIcons name="school" size={28} color="#e63946" />
              <Text style={styles.actionTitle}>Learn</Text>
              <Text style={styles.actionSubtitle}>Master the basics</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Progress')}
          >
            <LinearGradient
              colors={['#1a1a1a', '#222']}
              style={styles.actionGradient}
            >
              <MaterialCommunityIcons name="chart-line" size={28} color="#e63946" />
              <Text style={styles.actionTitle}>Progress</Text>
              <Text style={styles.actionSubtitle}>Track your gains</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: '#888',
    fontWeight: '400',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#e63946',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-medium',
  },
  profileButton: {
    padding: 4,
  },
  heroSection: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#e63946',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  startButton: {
    backgroundColor: '#fff',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  seeAllText: {
    fontSize: 14,
    color: '#e63946',
    fontWeight: '600',
  },
  prScrollContainer: {
    paddingHorizontal: 20,
  },
  prCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginRight: 12,
    width: screenWidth * 0.4,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
  },
  selectedPRCard: {
    borderColor: '#e63946',
  },
  prCardContent: {
    padding: 16,
  },
  prGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  prHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  prIconContainer: {
    backgroundColor: 'rgba(230, 57, 70, 0.1)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prBadge: {
    backgroundColor: '#2a9d8f',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  prBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  prTitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  prValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  prProgress: {
    height: 4,
    backgroundColor: '#222',
    borderRadius: 2,
    overflow: 'hidden',
  },
  prProgressBar: {
    height: '100%',
    backgroundColor: '#e63946',
    borderRadius: 2,
  },
  tipContainer: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.2)',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e63946',
    marginLeft: 8,
  },
  tipText: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 22,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
});