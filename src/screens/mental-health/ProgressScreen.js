import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

export default function ProgressScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Mock data - in a real app, this would come from your data store
  const progressData = {
    week: {
      moodAverage: 7.2,
      journalEntries: 5,
      breathingSessions: 8,
      groundingSessions: 3,
      cbtSessions: 2,
      streak: 7,
    },
    month: {
      moodAverage: 6.8,
      journalEntries: 18,
      breathingSessions: 32,
      groundingSessions: 12,
      cbtSessions: 8,
      streak: 25,
    },
  };

  const currentData = progressData[selectedPeriod];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [selectedPeriod]);

  const StatCard = ({ title, value, subtitle, icon, color, gradient }) => (
    <View style={styles.statCard}>
      <LinearGradient
        colors={gradient}
        style={styles.statGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statHeader}>
          <MaterialCommunityIcons name={icon} size={24} color="#fff" />
          <Text style={styles.statTitle}>{title}</Text>
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </View>
  );

  const InsightCard = ({ title, description, icon, color }) => (
    <View style={styles.insightCard}>
      <View style={[styles.insightIcon, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={20} color="#fff" />
      </View>
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>{title}</Text>
        <Text style={styles.insightDescription}>{description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Your Progress</Text>
            <Text style={styles.subtitle}>
              Track your mental health journey
            </Text>
          </View>

          {/* Period Selector */}
          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'week' && styles.activePeriodButton,
              ]}
              onPress={() => setSelectedPeriod('week')}
            >
              <Text style={[
                styles.periodText,
                selectedPeriod === 'week' && styles.activePeriodText,
              ]}>
                This Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'month' && styles.activePeriodButton,
              ]}
              onPress={() => setSelectedPeriod('month')}
            >
              <Text style={[
                styles.periodText,
                selectedPeriod === 'month' && styles.activePeriodText,
              ]}>
                This Month
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats Grid */}
          <Animated.View style={[styles.statsContainer, { opacity: fadeAnim }]}>
            <View style={styles.statsRow}>
              <StatCard
                title="Mood Average"
                value={currentData.moodAverage}
                subtitle="out of 10"
                icon="emoticon-happy"
                color="#4cc9f0"
                gradient={['#4cc9f0', '#4895ef']}
              />
              <StatCard
                title="Current Streak"
                value={currentData.streak}
                subtitle="days"
                icon="fire"
                color="#f72585"
                gradient={['#f72585', '#7209b7']}
              />
            </View>
          </Animated.View>

          {/* Activity Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Breakdown</Text>
            <View style={styles.activityContainer}>
              <View style={styles.activityItem}>
                <MaterialCommunityIcons name="book-open" size={20} color="#4cc9f0" />
                <Text style={styles.activityLabel}>Journal Entries</Text>
                <Text style={styles.activityValue}>{currentData.journalEntries}</Text>
              </View>
              <View style={styles.activityItem}>
                <MaterialCommunityIcons name="weather-windy" size={20} color="#4895ef" />
                <Text style={styles.activityLabel}>Breathing Sessions</Text>
                <Text style={styles.activityValue}>{currentData.breathingSessions}</Text>
              </View>
              <View style={styles.activityItem}>
                <MaterialCommunityIcons name="earth" size={20} color="#4361ee" />
                <Text style={styles.activityLabel}>Grounding Sessions</Text>
                <Text style={styles.activityValue}>{currentData.groundingSessions}</Text>
              </View>
              <View style={styles.activityItem}>
                <MaterialCommunityIcons name="brain" size={20} color="#3f37c9" />
                <Text style={styles.activityLabel}>CBT Sessions</Text>
                <Text style={styles.activityValue}>{currentData.cbtSessions}</Text>
              </View>
            </View>
          </View>

          {/* Insights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insights</Text>
            <InsightCard
              title="Great Consistency!"
              description="You've maintained a 7-day streak of mental health practices."
              icon="trophy"
              color="#ffd700"
            />
            <InsightCard
              title="Mood Improvement"
              description="Your average mood has increased by 0.4 points this week."
              icon="trending-up"
              color="#4cc9f0"
            />
            <InsightCard
              title="Journaling Habit"
              description="You're writing in your journal 5 times per week on average."
              icon="book-open"
              color="#4895ef"
            />
          </View>

          {/* Goals */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This Week's Goals</Text>
            <View style={styles.goalsContainer}>
              <View style={styles.goalItem}>
                <MaterialCommunityIcons name="target" size={20} color="#fff" />
                <Text style={styles.goalText}>Complete 3 breathing sessions</Text>
                <View style={styles.goalProgress}>
                  <View style={[styles.goalProgressBar, { width: '60%' }]} />
                </View>
              </View>
              <View style={styles.goalItem}>
                <MaterialCommunityIcons name="target" size={20} color="#fff" />
                <Text style={styles.goalText}>Write 4 journal entries</Text>
                <View style={styles.goalProgress}>
                  <View style={[styles.goalProgressBar, { width: '80%' }]} />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    padding: 4,
    marginBottom: 24,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 21,
    alignItems: 'center',
  },
  activePeriodButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  activePeriodText: {
    color: '#fff',
  },
  statsContainer: {
    marginBottom: 30,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  statGradient: {
    padding: 20,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  activityContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityLabel: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
    marginLeft: 12,
  },
  activityValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightContent: {
    flex: 1,
    marginLeft: 12,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 16,
  },
  goalsContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
  },
  goalItem: {
    marginBottom: 16,
  },
  goalText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 12,
    marginBottom: 8,
  },
  goalProgress: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginLeft: 32,
  },
  goalProgressBar: {
    height: '100%',
    backgroundColor: '#4cc9f0',
    borderRadius: 2,
  },
}); 