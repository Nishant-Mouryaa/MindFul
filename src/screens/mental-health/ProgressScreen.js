// screens/ProgressScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  Palette,
  spacing,
  typography,
  shadows,
  borderRadius,
} from '../../theme/colors';

const { width: screenWidth } = Dimensions.get('window');

// Mood score mapping for journal entries
const MOOD_SCORES = {
  great: 10,
  good: 8,
  neutral: 6,
  down: 4,
  sad: 2,
  anxious: 3,
  angry: 2,
  tired: 4,
};

export default function ProgressScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [progressData, setProgressData] = useState({ week: null, month: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const auth = getAuth();
      if (!auth.currentUser) {
        // Try to load from local storage
        await loadLocalData();
        return;
      }

      setLoading(true);
      setIsOffline(false);

      const [weekData, monthData] = await Promise.all([
        fetchPeriodData('week'),
        fetchPeriodData('month'),
      ]);

      const newProgressData = {
        week: weekData,
        month: monthData,
      };

      setProgressData(newProgressData);

      // Cache the data locally
      await AsyncStorage.setItem('progressData', JSON.stringify(newProgressData));
      await AsyncStorage.setItem('progressDataTimestamp', Date.now().toString());
    } catch (error) {
      console.error('Error fetching progress data:', error);
      // Try to load cached data
      await loadLocalData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadLocalData = async () => {
    try {
      const cachedData = await AsyncStorage.getItem('progressData');
      if (cachedData) {
        setProgressData(JSON.parse(cachedData));
        setIsOffline(true);
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const fetchPeriodData = async (period) => {
    const auth = getAuth();
    if (!auth.currentUser) return getDefaultData(period);

    const now = new Date();
    let startDate = new Date();

    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    try {
      // Build queries for each collection
      const queries = {
        moods: query(
          collection(db, 'moodEntries'),
          where('userId', '==', auth.currentUser.uid),
          where('date', '>=', startDate),
          orderBy('date', 'asc')
        ),
        activities: query(
          collection(db, 'activities'),
          where('userId', '==', auth.currentUser.uid),
          where('date', '>=', startDate)
        ),
        journals: query(
          collection(db, 'journals'),
          where('userId', '==', auth.currentUser.uid),
          where('date', '>=', startDate)
        ),
        grounding: query(
          collection(db, 'groundingSessions'),
          where('userId', '==', auth.currentUser.uid),
          where('timestamp', '>=', startDate)
        ),
        cbt: query(
          collection(db, 'cbtRecords'),
          where('userId', '==', auth.currentUser.uid),
          where('timestamp', '>=', startDate)
        ),
      };

      const [moodSnapshot, activitiesSnapshot, journalSnapshot, groundingSnapshot, cbtSnapshot] =
        await Promise.all([
          getDocs(queries.moods).catch(() => ({ docs: [], size: 0 })),
          getDocs(queries.activities).catch(() => ({ docs: [], size: 0 })),
          getDocs(queries.journals).catch(() => ({ docs: [], size: 0 })),
          getDocs(queries.grounding).catch(() => ({ docs: [], size: 0 })),
          getDocs(queries.cbt).catch(() => ({ docs: [], size: 0 })),
        ]);

      // Process mood entries
      const moodEntries = moodSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
          rating: data.rating || 5,
        };
      });

      // Process journal entries (convert mood to rating)
      const journalMoodEntries = journalSnapshot.docs.map((doc) => {
        const data = doc.data();
        const date = data.date?.toDate ? data.date.toDate() : new Date(data.date);
        return {
          date,
          rating: MOOD_SCORES[data.mood] || 5,
        };
      });

      // Combine mood entries
      const allMoodEntries = [...moodEntries, ...journalMoodEntries].sort(
        (a, b) => a.date - b.date
      );

      // Activities summary
      const activities = {
        journalEntries: journalSnapshot.size,
        breathingSessions: 0,
        groundingSessions: groundingSnapshot.size,
        cbtSessions: cbtSnapshot.size,
        totalActivities: 0,
      };

      // Count breathing from activities
      activitiesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.type === 'breathing') activities.breathingSessions++;
      });

      activities.totalActivities =
        activities.journalEntries +
        activities.breathingSessions +
        activities.groundingSessions +
        activities.cbtSessions;

      // Calculate stats
      const moodAverage = calculateMoodAverage(allMoodEntries);
      const moodData = generateMoodData(allMoodEntries, period);
      const streak = await calculateStreak();
      const insights = generateInsights(activities, moodAverage, allMoodEntries, period);
      const completionRate = calculateCompletionRate(activities, period);

      return {
        moodAverage,
        moodData,
        ...activities,
        streak,
        insights,
        completionRate,
        entriesCount: allMoodEntries.length,
      };
    } catch (error) {
      console.error(`Error fetching ${period} data:`, error);
      return getDefaultData(period);
    }
  };

  const calculateMoodAverage = (entries) => {
    if (entries.length === 0) return 5;
    const sum = entries.reduce((total, entry) => total + (entry.rating || 5), 0);
    return sum / entries.length;
  };

  const generateMoodData = (entries, period) => {
    const dataPoints = period === 'week' ? 7 : 4;
    const data = Array(dataPoints).fill(5); // Default to neutral

    if (entries.length === 0) return data;

    if (period === 'week') {
      const dailyTotals = Array(7).fill(0);
      const dailyCounts = Array(7).fill(0);

      entries.forEach((entry) => {
        const day = entry.date.getDay();
        dailyTotals[day] += entry.rating || 5;
        dailyCounts[day]++;
      });

      return dailyTotals.map((sum, i) => (dailyCounts[i] > 0 ? sum / dailyCounts[i] : 5));
    } else {
      // Monthly - group by weeks
      const now = new Date();
      return Array(4)
        .fill(0)
        .map((_, i) => {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - 7 * (4 - i));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 7);

          const weekEntries = entries.filter(
            (entry) => entry.date >= weekStart && entry.date < weekEnd
          );

          if (weekEntries.length === 0) return 5;
          return (
            weekEntries.reduce((sum, entry) => sum + (entry.rating || 5), 0) / weekEntries.length
          );
        });
    }
  };

  const calculateStreak = async () => {
    try {
      const auth = getAuth();
      if (!auth.currentUser) return 0;

      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 365);

      // Check multiple collections for activity
      const collections = ['activities', 'journals', 'moodEntries'];
      const uniqueDates = new Set();

      for (const collectionName of collections) {
        try {
          const q = query(
            collection(db, collectionName),
            where('userId', '==', auth.currentUser.uid),
            where(collectionName === 'activities' ? 'date' : 'date', '>=', startDate)
          );

          const snapshot = await getDocs(q);
          snapshot.forEach((doc) => {
            const data = doc.data();
            const dateField = data.date || data.timestamp;
            if (dateField) {
              const date = dateField.toDate ? dateField.toDate() : new Date(dateField);
              const dateString = date.toISOString().split('T')[0];
              uniqueDates.add(dateString);
            }
          });
        } catch (error) {
          // Continue with other collections
        }
      }

      const sortedDates = Array.from(uniqueDates).sort().reverse();
      let streak = 0;
      let currentDate = new Date();

      const todayString = currentDate.toISOString().split('T')[0];
      if (sortedDates.includes(todayString)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        currentDate.setDate(currentDate.getDate() - 1);
      }

      for (let i = 0; i < 365; i++) {
        const dateString = currentDate.toISOString().split('T')[0];
        if (sortedDates.includes(dateString)) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  };

  const calculateCompletionRate = (activities, period) => {
    const targetDays = period === 'week' ? 7 : 30;
    const activeDays = Math.min(activities.totalActivities, targetDays);
    return Math.round((activeDays / targetDays) * 100);
  };

  const generateInsights = (activities, moodAverage, moodEntries, period) => {
    const insights = [];
    const periodText = period === 'week' ? 'week' : 'month';

    // Mood trend insight
    if (moodEntries.length >= 3) {
      const recentEntries = moodEntries.slice(-3);
      const olderEntries = moodEntries.slice(0, Math.max(moodEntries.length - 3, 1));
      const recentAvg =
        recentEntries.reduce((sum, e) => sum + e.rating, 0) / recentEntries.length;
      const olderAvg = olderEntries.reduce((sum, e) => sum + e.rating, 0) / olderEntries.length;

      if (recentAvg > olderAvg + 1) {
        insights.push({
          title: 'Mood Improving',
          description: 'Your recent mood scores are trending upward. Great progress!',
          icon: 'trending-up',
          color: '#4CAF50',
        });
      } else if (recentAvg < olderAvg - 1) {
        insights.push({
          title: 'Check In With Yourself',
          description:
            "Your mood has dipped recently. Remember, it's okay to have difficult days.",
          icon: 'heart-pulse',
          color: '#E57373',
        });
      }
    }

    // Activity insights
    if (moodAverage >= 7) {
      insights.push({
        title: 'Positive Outlook',
        description: `Your average mood was ${moodAverage.toFixed(1)}/10 this ${periodText}. Keep up the great work!`,
        icon: 'emoticon-happy-outline',
        color: '#4CAF50',
      });
    } else if (moodAverage < 4) {
      insights.push({
        title: 'We\'re Here For You',
        description: `It seems like this ${periodText} has been challenging. Consider trying some breathing exercises or reaching out for support.`,
        icon: 'hand-heart',
        color: '#9B59B6',
      });
    }

    if (activities.journalEntries >= (period === 'week' ? 5 : 15)) {
      insights.push({
        title: 'Consistent Journaler',
        description: `You wrote ${activities.journalEntries} journal entries. Reflection is key to self-awareness!`,
        icon: 'notebook-check',
        color: '#5C6BC0',
      });
    }

    if (activities.breathingSessions >= (period === 'week' ? 7 : 20)) {
      insights.push({
        title: 'Mindful Breather',
        description: `${activities.breathingSessions} breathing sessions completed. Your dedication to mindfulness is paying off!`,
        icon: 'weather-windy',
        color: '#26A69A',
      });
    }

    if (activities.cbtSessions >= (period === 'week' ? 3 : 10)) {
      insights.push({
        title: 'Thought Champion',
        description: `You completed ${activities.cbtSessions} CBT exercises. You're building strong mental skills!`,
        icon: 'brain',
        color: '#AB47BC',
      });
    }

    // Default insight if none generated
    if (insights.length === 0) {
      insights.push({
        title: 'Keep Going!',
        description: `Every small step counts. Try to engage with at least one activity each day this ${periodText}.`,
        icon: 'star-outline',
        color: '#FFB74D',
      });
    }

    return insights;
  };

  const getDefaultData = (period) => ({
    moodAverage: 5,
    moodData: Array(period === 'week' ? 7 : 4).fill(5),
    journalEntries: 0,
    breathingSessions: 0,
    groundingSessions: 0,
    cbtSessions: 0,
    totalActivities: 0,
    streak: 0,
    completionRate: 0,
    entriesCount: 0,
    insights: [
      {
        title: 'Start Your Journey',
        description: `Complete some activities to see your ${period === 'week' ? 'weekly' : 'monthly'} progress.`,
        icon: 'rocket-launch-outline',
        color: '#64B5F6',
      },
    ],
  });

  // UI Components
  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statTextContainer}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  const getMoodColor = (value) => {
    if (value <= 3) return '#E57373';
    if (value <= 5) return '#FFB74D';
    if (value <= 7) return '#81C784';
    return '#4CAF50';
  };

  const getMoodEmoji = (value) => {
    if (value <= 3) return 'emoticon-sad-outline';
    if (value <= 5) return 'emoticon-neutral-outline';
    if (value <= 7) return 'emoticon-happy-outline';
    return 'emoticon-excited-outline';
  };

  const ActivityItem = ({ icon, label, value, color, target }) => (
    <View style={styles.activityItem}>
      <View style={[styles.activityIconContainer, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <View style={styles.activityTextContainer}>
        <Text style={styles.activityLabel}>{label}</Text>
        {target && (
          <Text style={styles.activityTarget}>
            Target: {target}/{selectedPeriod === 'week' ? 'week' : 'month'}
          </Text>
        )}
      </View>
      <Text style={[styles.activityValue, { color }]}>{value}</Text>
    </View>
  );

  const InsightCard = ({ title, description, icon, color }) => (
    <View style={[styles.insightCard, { borderLeftColor: color }]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} style={styles.insightIcon} />
      <View style={styles.insightContent}>
        <Text style={[styles.insightTitle, { color }]}>{title}</Text>
        <Text style={styles.insightDescription}>{description}</Text>
      </View>
    </View>
  );

  // Loading State
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Palette.secondaryBlue} />
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentData = progressData[selectedPeriod] || getDefaultData(selectedPeriod);
  const labels =
    selectedPeriod === 'week'
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Palette.secondaryBlue]}
            tintColor={Palette.secondaryBlue}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Your Progress</Text>
              <Text style={styles.subtitle}>Track your mental wellness journey</Text>
            </View>
            {isOffline && (
              <View style={styles.offlineBadge}>
                <MaterialCommunityIcons name="cloud-off-outline" size={14} color="#F57C00" />
                <Text style={styles.offlineText}>Offline</Text>
              </View>
            )}
          </View>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'week' && styles.activePeriodButton]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text
              style={[styles.periodText, selectedPeriod === 'week' && styles.activePeriodText]}
            >
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'month' && styles.activePeriodButton]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text
              style={[styles.periodText, selectedPeriod === 'month' && styles.activePeriodText]}
            >
              This Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Key Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            title="Avg. Mood"
            value={currentData.moodAverage.toFixed(1)}
            icon={getMoodEmoji(currentData.moodAverage)}
            color={getMoodColor(currentData.moodAverage)}
            subtitle="out of 10"
          />
          <StatCard
            title="Streak"
            value={currentData.streak}
            icon="fire"
            color={currentData.streak > 0 ? '#FF7043' : '#9E9E9E'}
            subtitle="days"
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="Activities"
            value={currentData.totalActivities}
            icon="checkbox-marked-circle-outline"
            color="#5C6BC0"
            subtitle="completed"
          />
          <StatCard
            title="Completion"
            value={`${currentData.completionRate}%`}
            icon="chart-donut"
            color="#26A69A"
            subtitle="rate"
          />
        </View>

        {/* Mood Chart */}
        <View style={[styles.card, shadows.medium]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Mood Over Time</Text>
            <View style={styles.moodIndicator}>
              <MaterialCommunityIcons
                name={getMoodEmoji(currentData.moodAverage)}
                size={20}
                color={getMoodColor(currentData.moodAverage)}
              />
              <Text style={[styles.moodIndicatorText, { color: getMoodColor(currentData.moodAverage) }]}>
                {currentData.moodAverage >= 7
                  ? 'Great'
                  : currentData.moodAverage >= 5
                  ? 'Good'
                  : 'Needs Attention'}
              </Text>
            </View>
          </View>

          {currentData.entriesCount > 0 ? (
            <View style={styles.chartContainer}>
              <LineChart
                data={{
                  labels: labels,
                  datasets: [
                    {
                      data: currentData.moodData.map((v) => Math.max(v, 0.1)),
                      color: (opacity = 1) => `rgba(100, 181, 246, ${opacity})`,
                      strokeWidth: 3,
                    },
                    {
                      data: Array(labels.length).fill(5),
                      color: (opacity = 1) => `rgba(158, 158, 158, ${opacity * 0.5})`,
                      strokeWidth: 1,
                      withDots: false,
                    },
                  ],
                }}
                width={screenWidth - spacing.lg * 2 - spacing.lg * 2}
                height={180}
                yAxisSuffix=""
                yAxisInterval={1}
                fromZero
                segments={5}
                chartConfig={{
                  backgroundColor: Palette.card,
                  backgroundGradientFrom: Palette.card,
                  backgroundGradientTo: Palette.card,
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
                  style: {
                    borderRadius: borderRadius.md,
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: '#64B5F6',
                  },
                  propsForBackgroundLines: {
                    stroke: Palette.border,
                    strokeWidth: 1,
                  },
                }}
                bezier
                style={styles.chart}
              />
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#64B5F6' }]} />
                  <Text style={styles.legendText}>Your Mood</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#9E9E9E' }]} />
                  <Text style={styles.legendText}>Baseline (5)</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <MaterialCommunityIcons name="chart-line" size={48} color={Palette.textLight} />
              <Text style={styles.noDataText}>No mood data yet</Text>
              <Text style={styles.noDataSubtext}>
                Start logging your mood to see trends
              </Text>
            </View>
          )}
        </View>

        {/* Activity Breakdown */}
        <View style={[styles.card, shadows.medium]}>
          <Text style={styles.cardTitle}>Activity Breakdown</Text>
          <ActivityItem
            icon="notebook-edit-outline"
            label="Journal Entries"
            value={currentData.journalEntries}
            color="#5C6BC0"
            target={selectedPeriod === 'week' ? 7 : 20}
          />
          <ActivityItem
            icon="weather-windy"
            label="Breathing Sessions"
            value={currentData.breathingSessions}
            color="#26A69A"
            target={selectedPeriod === 'week' ? 7 : 20}
          />
          <ActivityItem
            icon="earth"
            label="Grounding Sessions"
            value={currentData.groundingSessions}
            color="#64B5F6"
            target={selectedPeriod === 'week' ? 5 : 15}
          />
          <ActivityItem
            icon="brain"
            label="CBT Exercises"
            value={currentData.cbtSessions}
            color="#AB47BC"
            target={selectedPeriod === 'week' ? 3 : 10}
          />
        </View>

        {/* Insights */}
        <View style={[styles.card, shadows.medium]}>
          <Text style={styles.cardTitle}>Your Insights</Text>
          {currentData.insights.map((insight, index) => (
            <InsightCard key={`insight-${index}`} {...insight} />
          ))}
        </View>

        {/* Encouragement Card */}
        <View style={[styles.encouragementCard, shadows.low]}>
          <MaterialCommunityIcons name="heart" size={24} color="#E57373" />
          <Text style={styles.encouragementText}>
            Remember: Progress isn't always linear. Every step forward, no matter how small,
            is a victory worth celebrating. 💙
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: Palette.textLight,
    fontSize: typography.body.fontSize,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: typography.h1.fontSize,
    fontWeight: typography.h1.fontWeight,
    color: Palette.textDark,
  },
  subtitle: {
    fontSize: typography.caption.fontSize,
    color: Palette.textLight,
    marginTop: spacing.xs,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  offlineText: {
    fontSize: typography.small.fontSize,
    color: '#F57C00',
    marginLeft: spacing.xs,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: Palette.card,
    borderRadius: borderRadius.full,
    padding: spacing.xs,
    marginBottom: spacing.lg,
    ...shadows.low,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  activePeriodButton: {
    backgroundColor: Palette.secondaryBlue,
  },
  periodText: {
    fontSize: typography.body.fontSize,
    color: Palette.textLight,
    fontWeight: '500',
  },
  activePeriodText: {
    color: Palette.white,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    ...shadows.low,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: Palette.textDark,
  },
  statTitle: {
    fontSize: typography.small.fontSize,
    color: Palette.textLight,
  },
  statSubtitle: {
    fontSize: 10,
    color: Palette.textLight,
  },
  card: {
    backgroundColor: Palette.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: Palette.textDark,
  },
  moodIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodIndicatorText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: borderRadius.md,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: typography.small.fontSize,
    color: Palette.textLight,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noDataText: {
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
    marginTop: spacing.md,
  },
  noDataSubtext: {
    fontSize: typography.caption.fontSize,
    color: Palette.textLight,
    marginTop: spacing.xs,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  activityTextContainer: {
    flex: 1,
  },
  activityLabel: {
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
  },
  activityTarget: {
    fontSize: typography.small.fontSize,
    color: Palette.textLight,
    marginTop: 2,
  },
  activityValue: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: Palette.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
  },
  insightIcon: {
    marginRight: spacing.sm,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  insightDescription: {
    fontSize: typography.caption.fontSize,
    color: Palette.textLight,
    lineHeight: 20,
  },
  encouragementCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FCE4EC',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  encouragementText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.caption.fontSize,
    color: '#C2185B',
    lineHeight: 20,
  },
});