
import React, { useState, useEffect } from 'react';
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
import { db } from '../../config/firebase';  // Adjust as needed
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { LineChart } from 'react-native-chart-kit';

// Import theme constants
import {
  Palette,
  spacing,
  typography,
  shadows,
  borderRadius,
} from '../../theme/colors'; // Adjust path as needed

const { width: screenWidth } = Dimensions.get('window');

export default function ProgressScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [progressData, setProgressData] = useState({ week: null, month: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cbtRecordsData, setCbtRecordsData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const auth = getAuth();
      if (!auth.currentUser) return;

      setLoading(true);

      const [weekData, monthData, cbtData] = await Promise.all([
        fetchPeriodData('week'),
        fetchPeriodData('month'),
        fetchCbtRecordsData(),
      ]);

      setProgressData({
        week: weekData,
        month: monthData,
      });
      setCbtRecordsData(cbtData);
    } catch (error) {
      console.error("Error fetching progress data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCbtRecordsData = async () => {
    const auth = getAuth();
    if (!auth.currentUser) return [];
    try {
      const q = query(
        collection(db, 'cbtRecords'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().timestamp?.toDate() || new Date(),
      }));
    } catch (error) {
      console.error("Error fetching CBT records:", error);
      return [];
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const fetchPeriodData = async (period) => {
    const auth = getAuth();
    const now = new Date();
    let startDate = new Date();

    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    try {
      // Build queries for each collection
      const moodQuery = query(
        collection(db, 'moodEntries'),
        where('userId', '==', auth.currentUser.uid),
        where('date', '>=', startDate),
        orderBy('date', 'asc')
      );

      const activitiesQuery = query(
        collection(db, 'activities'),
        where('userId', '==', auth.currentUser.uid),
        where('date', '>=', startDate)
      );

      const journalQuery = query(
        collection(db, 'journals'),
        where('userId', '==', auth.currentUser.uid),
        where('date', '>=', startDate)
      );

      const groundingQuery = query(
        collection(db, 'groundingSessions'),
        where('userId', '==', auth.currentUser.uid),
        where('timestamp', '>=', startDate)
      );

      const cbtQuery = query(
        collection(db, 'cbtRecords'),
        where('userId', '==', auth.currentUser.uid),
        where('timestamp', '>=', startDate)
      );

      const [
        moodSnapshot,
        activitiesSnapshot,
        journalSnapshot,
        groundingSnapshot,
        cbtSnapshot,
      ] = await Promise.all([
        getDocs(moodQuery),
        getDocs(activitiesQuery),
        getDocs(journalQuery),
        getDocs(groundingQuery),
        getDocs(cbtQuery),
      ]);

      // Mood data
      const moodEntries = moodSnapshot.docs.map((doc) => ({
        ...doc.data(),
        date: doc.data().date.toDate(),
      }));

      // Activities summary
      const activities = {
        journalEntries: journalSnapshot.size,
        breathingSessions: 0,
        groundingSessions: groundingSnapshot.size,
        cbtSessions: cbtSnapshot.size,
      };

      // Count "breathing" from "activities"
      activitiesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.type === 'breathing') activities.breathingSessions++;
      });

      // Calculate stats
      const moodAverage = calculateMoodAverage(moodEntries);
      const moodData = generateMoodData(moodEntries, period);
      const streak = await calculateStreak();
      const insights = generateInsights(activities, moodAverage, period);

      return {
        moodAverage,
        moodData,
        ...activities,
        streak,
        insights,
      };
    } catch (error) {
      console.error(`Error fetching ${period} data:`, error);
      return getDefaultData(period);
    }
  };

  const calculateMoodAverage = (entries) => {
    if (entries.length === 0) return 0;
    const sum = entries.reduce((total, entry) => total + entry.rating, 0);
    return sum / entries.length;
  };

  const generateMoodData = (entries, period) => {
    if (period === 'week') {
      // Weekly data
      const dailyAverages = Array(7).fill(0);
      const dayCounts = Array(7).fill(0);

      entries.forEach((entry) => {
        const day = entry.date.getDay(); // 0-6, Sunday-Saturday
        dailyAverages[day] += entry.rating;
        dayCounts[day]++;
      });

      return dailyAverages.map((sum, i) =>
        dayCounts[i] > 0 ? sum / dayCounts[i] : 0
      );
    } else {
      // Monthly data => group by 4 weeks
      return Array(4)
        .fill(0)
        .map((_, i) => {
          // A quick and rough approach: not fully accurate for all months
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - 7 * (4 - i));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 7);

          const weekEntries = entries.filter(
            (entry) => entry.date >= weekStart && entry.date < weekEnd
          );

          return weekEntries.length > 0
            ? weekEntries.reduce((sum, entry) => sum + entry.rating, 0) /
                weekEntries.length
            : 0;
        });
    }
  };

  const calculateStreak = async () => {
    // Example "streak" logic: checks the "activities" collection for daily records
    try {
      const auth = getAuth();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let streak = 0;
      let currentDate = new Date(today);

      while (streak < 365) {
        const dateQuery = query(
          collection(db, 'activities'),
          where('userId', '==', auth.currentUser.uid),
          where('date', '>=', currentDate),
          where('date', '<', new Date(currentDate.getTime() + 86400000)) // +1 day
        );

        const snapshot = await getDocs(dateQuery);
        if (snapshot.empty) break;

        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }
      return streak;
    } catch (error) {
      console.error("Error calculating streak:", error);
      return 0;
    }
  };

  const generateInsights = (activities, moodAverage, period) => {
    const insights = [];
    const periodText = period === 'week' ? 'week' : 'month';

    // Example thresholds / logic
    if (moodAverage > 6) {
      insights.push({
        title: "Positive Mood",
        description: `Your average mood was ${moodAverage.toFixed(1)}/10 this ${periodText}.`,
        icon: 'emoticon-happy-outline',
        color: Palette.primary, // or "#4CAF50" if you prefer
      });
    }

    if (activities.journalEntries > (period === 'week' ? 3 : 12)) {
      insights.push({
        title: "Reflective Practice",
        description: `You completed ${activities.journalEntries} journal entries.`,
        icon: 'notebook-edit',
        color: Palette.secondaryBlue, // or "#2196F3" if you prefer
      });
    }

    if (activities.breathingSessions > (period === 'week' ? 5 : 20)) {
      insights.push({
        title: "Mindful Breathing",
        description: `You did ${activities.breathingSessions} breathing exercises.`,
        icon: 'weather-windy',
        color: Palette.primary, // "#4DB6AC"
      });
    }

    if (insights.length === 0) {
      insights.push({
        title: "Keep Going!",
        description: "Regular practice leads to better mental health outcomes.",
        icon: 'heart',
        color: Palette.secondaryRed, // or "#E57373"
      });
    }

    return insights;
  };

  const getDefaultData = (period) => ({
    moodAverage: 0,
    moodData: Array(period === 'week' ? 7 : 4).fill(0),
    journalEntries: 0,
    breathingSessions: 0,
    groundingSessions: 0,
    cbtSessions: 0,
    streak: 0,
    insights: [
      {
        title: "No Data Yet",
        description: `Complete some activities to see your ${period}ly progress.`,
        icon: 'chart-line',
        color: Palette.textLight,
      },
    ],
  });

  /////////////////////////////////////////////////////////////////////////////
  // UI Components
  /////////////////////////////////////////////////////////////////////////////
  const StatCard = ({ title, value, icon, color }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={28} color={color} />
      </View>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  // Mood color logic
  const getMoodColor = (value) => {
    if (value <= 3) return Palette.secondaryRed;  // red for low mood
    if (value <= 6) return '#FFC107';            // or a mid-range color in your palette
    return '#4CAF50';                            // or a bright green in your palette
  };

  const ActivityItem = ({ icon, label, value, color }) => (
    <View style={styles.activityItem}>
      <View style={[styles.activityIconContainer, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.activityLabel}>{label}</Text>
      <Text style={styles.activityValue}>{value}</Text>
    </View>
  );

  const InsightCard = ({ title, description, icon, color }) => (
    <View style={styles.insightCard}>
      <MaterialCommunityIcons name={icon} size={24} color={color} style={styles.insightIcon} />
      <View style={styles.insightContent}>
        <Text style={[styles.insightTitle, { color }]}>{title}</Text>
        <Text style={styles.insightDescription}>{description}</Text>
      </View>
    </View>
  );

  /////////////////////////////////////////////////////////////////////////////
  // Render
  /////////////////////////////////////////////////////////////////////////////
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

  // Build a labels array for the chart based on period
  const labels =
    selectedPeriod === 'week'
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : ['Week1', 'Week2', 'Week3', 'Week4'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
            <Text style={styles.title}>Your Progress</Text>
            <TouchableOpacity onPress={handleManualRefresh} style={styles.refreshButton}>
              <MaterialCommunityIcons name="refresh" size={24} color={Palette.secondaryBlue} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            Review your activity and gain insights into your mental wellness journey.
          </Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'week' && styles.activePeriodButton]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text
              style={[
                styles.periodText,
                selectedPeriod === 'week' && styles.activePeriodText,
              ]}
            >
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'month' && styles.activePeriodButton]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text
              style={[
                styles.periodText,
                selectedPeriod === 'month' && styles.activePeriodText,
              ]}
            >
              This Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Key Stats */}
        <View style={[styles.card, shadows.medium]}>
          <Text style={styles.cardTitle}>Key Stats</Text>
          <View style={styles.statsContainer}>
            <StatCard
              title="Avg. Mood"
              value={currentData.moodAverage.toFixed(1)}
              icon="emoticon-happy-outline"
              color={Palette.secondaryOrange} // e.g. "#FFB74D"
            />
            <StatCard
              title="Current Streak"
              value={`${currentData.streak} days`}
              icon="fire"
              color={Palette.secondaryRed} // e.g. "#E57373"
            />
          </View>
        </View>

        {/* Mood Over Time */}
        <View style={[styles.card, shadows.medium]}>
          <Text style={styles.cardTitle}>Mood Over Time</Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={{
                labels: labels,
                datasets: [
                  {
                    data: currentData.moodData,
                    color: (opacity = 1) => `rgba(100, 181, 246, ${opacity})`, // or use Palette
                    strokeWidth: 3,
                  },
                  {
                    data: [5, 5, 5, 5, 5, 5, 5], // Baseline
                    color: (opacity = 1) => `rgba(158, 158, 158, ${opacity})`,
                    strokeWidth: 1,
                    withDots: false,
                  },
                ],
              }}
              width={screenWidth - spacing.xl - spacing.xl} // dynamic width
              height={220}
              segments={5}
              fromZero={false}
              chartConfig={{
                backgroundColor: Palette.card,
                backgroundGradientFrom: Palette.card,
                backgroundGradientTo: Palette.card,
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                style: {
                  borderRadius: borderRadius.lg,
                },
                propsForDots: {
                  r: '5',
                  strokeWidth: '2',
                  stroke: '#fff',
                },
                propsForBackgroundLines: {
                  stroke: Palette.border,
                  strokeWidth: 1,
                },
                propsForLabels: {
                  fontSize: 12,
                },
              }}
              bezier
              style={{ marginVertical: spacing.xs, borderRadius: borderRadius.lg }}
              decorator={() => (
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#64B5F6' }]} />
                    <Text style={styles.legendText}>Your Mood</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#9E9E9E' }]} />
                    <Text style={styles.legendText}>Baseline</Text>
                  </View>
                </View>
              )}
            />
          </View>

          {/* Mood Range Indicator */}
          <View style={styles.moodRangeContainer}>
            <Text style={styles.moodRangeText}>Low</Text>
            <View style={styles.moodRangeBar}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <View
                  key={num}
                  style={[
                    styles.moodRangeSegment,
                    {
                      backgroundColor: getMoodColor(num),
                      opacity: num <= currentData.moodAverage ? 1 : 0.2,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.moodRangeText}>High</Text>
          </View>
        </View>

        {/* Activity Breakdown */}
        <View style={[styles.card, shadows.medium]}>
          <Text style={styles.cardTitle}>Activity Breakdown</Text>
          <ActivityItem
            icon="notebook-edit-outline"
            label="Journal Entries"
            value={currentData.journalEntries}
            color={Palette.secondaryPurple} // e.g. "#7986CB"
          />
          <ActivityItem
            icon="weather-windy"
            label="Breathing Sessions"
            value={currentData.breathingSessions}
            color={Palette.primary} // e.g. "#4DB6AC"
          />
          <ActivityItem
            icon="earth"
            label="Grounding Sessions"
            value={currentData.groundingSessions}
            color={Palette.secondaryBlue} // e.g. "#64B5F6"
          />
          <ActivityItem
            icon="brain"
            label="CBT Exercises"
            value={currentData.cbtSessions}
            color={Palette.secondaryPink} // e.g. "#BA68C8"
          />
        </View>

        {/* Insights */}
        <View style={[styles.card, shadows.medium]}>
          <Text style={styles.cardTitle}>Your Insights</Text>
          {currentData.insights.map((insight, index) => (
            <InsightCard key={index} {...insight} />
          ))}
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: Palette.textLight,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshButton: {
    padding: spacing.xs,
  },
  title: {
    ...typography.h1,
    color: Palette.textDark,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: Palette.textLight,
    textAlign: 'center',
    lineHeight: typography.body.lineHeight,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: Palette.border,
    borderRadius: borderRadius.full,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  activePeriodButton: {
    backgroundColor: Palette.white,
    // Example of shallow shadow for contrast:
    ...shadows.low,
  },
  periodText: {
    ...typography.body,
    color: Palette.textLight,
    textAlign: 'center',
    fontWeight: '600',
  },
  activePeriodText: {
    color: Palette.secondaryBlue,
  },
  card: {
    backgroundColor: Palette.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 0, // or add a borderColor: Palette.border
  },
  cardTitle: {
    ...typography.h2,
    color: Palette.textDark,
    marginBottom: spacing.md,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.xs,
  },
  legendText: {
    ...typography.small,
    color: Palette.textLight,
  },
  moodRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  moodRangeText: {
    ...typography.small,
    color: Palette.textLight,
  },
  moodRangeBar: {
    flex: 1,
    height: 10,
    flexDirection: 'row',
    marginHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  moodRangeSegment: {
    flex: 1,
    height: '100%',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: spacing.sm,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  statValue: {
    ...typography.h2,
    color: Palette.textDark,
  },
  statTitle: {
    ...typography.small,
    color: Palette.textLight,
    marginTop: spacing.xs / 2,
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
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  activityLabel: {
    flex: 1,
    ...typography.body,
    color: Palette.textMedium,
  },
  activityValue: {
    ...typography.body,
    fontWeight: 'bold',
    color: Palette.textDark,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Palette.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  insightIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    ...typography.body,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  insightDescription: {
    ...typography.small,
    color: Palette.textMedium,
    lineHeight: 20,
  },
  loadingSpinner: {
    marginTop: spacing.md,
  },
});

