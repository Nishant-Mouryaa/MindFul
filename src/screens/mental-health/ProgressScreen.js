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
  RefreshControl
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { LineChart } from 'react-native-chart-kit';

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
        fetchCbtRecordsData()
      ]);

      setProgressData({
        week: weekData,
        month: monthData
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
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().timestamp?.toDate() || new Date()
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

      // Make sure to destructure five variables
      const [
        moodSnapshot,
        activitiesSnapshot,
        journalSnapshot,
        groundingSnapshot,
        cbtSnapshot
      ] = await Promise.all([
        getDocs(moodQuery),
        getDocs(activitiesQuery),
        getDocs(journalQuery),
        getDocs(groundingQuery),
        getDocs(cbtQuery)
      ]);

      // Mood data
      const moodEntries = moodSnapshot.docs.map(doc => ({
        ...doc.data(),
        date: doc.data().date.toDate()
      }));

      // Activities summary
      const activities = {
        journalEntries: journalSnapshot.size,
        breathingSessions: 0,
        groundingSessions: groundingSnapshot.size, // Now we rely on the separate "groundingSessions" collection
        cbtSessions: cbtSnapshot.size
      };

      // We only count "breathing" from "activities"
      activitiesSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.type === 'breathing') activities.breathingSessions++;
        // Removed the "if (data.type === 'grounding')" line
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
        insights
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

      entries.forEach(entry => {
        const day = entry.date.getDay(); // 0-6 (Sun-Sat)
        dailyAverages[day] += entry.rating;
        dayCounts[day]++;
      });

      return dailyAverages.map((sum, i) =>
        dayCounts[i] > 0 ? (sum / dayCounts[i]) : 0
      );
    } else {
      // Monthly data => group by week
      return Array(4).fill(0).map((_, i) => {
        const weekEntries = entries.filter(entry => {
          const entryDate = entry.date;
          const weekStart = new Date();
          // Example grouping by 4 weeks incrementally
          weekStart.setDate(weekStart.getDate() - (7 * (4 - i)));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 7);
          return entryDate >= weekStart && entryDate < weekEnd;
        });

        return weekEntries.length > 0
          ? weekEntries.reduce((sum, entry) => sum + entry.rating, 0) / weekEntries.length
          : 0;
      });
    }
  };

  const calculateStreak = async () => {
    // Example "streak" logic: checking the "activities" collection for any daily record
    try {
      const auth = getAuth();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let streak = 0;
      let currentDate = new Date(today);

      while (streak < 365) { // Max 1-year check
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

    // Example thresholds:
    if (moodAverage > 6) {
      insights.push({
        title: "Positive Mood",
        description: `Your average mood was ${moodAverage.toFixed(1)}/10 this ${periodText}.`,
        icon: 'emoticon-happy-outline',
        color: '#4CAF50'
      });
    }

    // Journaling insight
    if (activities.journalEntries > (period === 'week' ? 3 : 12)) {
      insights.push({
        title: "Reflective Practice",
        description: `You completed ${activities.journalEntries} journal entries.`,
        icon: 'notebook-edit',
        color: '#2196F3'
      });
    }

    // Breathing insight
    if (activities.breathingSessions > (period === 'week' ? 5 : 20)) {
      insights.push({
        title: "Mindful Breathing",
        description: `You did ${activities.breathingSessions} breathing exercises.`,
        icon: 'weather-windy',
        color: '#4DB6AC'
      });
    }

    // If no insights were generated
    if (insights.length === 0) {
      insights.push({
        title: "Keep Going!",
        description: "Regular practice leads to better mental health outcomes.",
        icon: 'heart',
        color: '#E57373'
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
    insights: [{
      title: "No Data Yet",
      description: `Complete some activities to see your ${period}ly progress.`,
      icon: 'chart-line',
      color: '#9E9E9E'
    }]
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
  const getMoodColor = (value) => {
    if (value <= 3) return '#F44336'; // Red for low mood
    if (value <= 6) return '#FFC107'; // Yellow for medium mood
    return '#4CAF50'; // Green for high mood
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
          <ActivityIndicator size="large" color="#64B5F6" />
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentData = progressData[selectedPeriod] || getDefaultData(selectedPeriod);

  // Build a labels array for the chart based on period
  const labels = selectedPeriod === 'week'
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
            colors={['#64B5F6']}
            tintColor="#64B5F6"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Your Progress</Text>
            <TouchableOpacity onPress={handleManualRefresh} style={styles.refreshButton}>
              <MaterialCommunityIcons name="refresh" size={24} color="#64B5F6" />
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
            <Text style={[styles.periodText, selectedPeriod === 'week' && styles.activePeriodText]}>
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'month' && styles.activePeriodButton]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'month' && styles.activePeriodText]}>
              This Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Key Stats */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Key Stats</Text>
          <View style={styles.statsContainer}>
            <StatCard
              title="Avg. Mood"
              value={currentData.moodAverage.toFixed(1)}
              icon="emoticon-happy-outline"
              color="#FFB74D"
            />
            <StatCard
              title="Current Streak"
              value={`${currentData.streak} days`}
              icon="fire"
              color="#E57373"
            />
          </View>
        </View>


<View style={styles.card}>
  <Text style={styles.cardTitle}>Mood Over Time</Text>
  
  {/* Enhanced Line Chart */}
  <View style={styles.chartContainer}>
  <LineChart
    data={{
      labels: labels,
      datasets: [
        {
          data: currentData.moodData,
          color: (opacity = 1) => `rgba(100, 181, 246, ${opacity})`,
          strokeWidth: 3,
        },
        {
          data: [5, 5, 5, 5, 5, 5, 5], // Baseline for comparison
          color: (opacity = 1) => `rgba(158, 158, 158, ${opacity})`,
          strokeWidth: 1,
          withDots: false,
        },
      ],
    }}
    width={screenWidth - 60}
    height={220}
    yAxisLabel=""
    yAxisSuffix=""
    yAxisInterval={1}
    fromZero={false}
    segments={5}
    chartConfig={{
      backgroundColor: '#fff',
      backgroundGradientFrom: '#fff',
      backgroundGradientTo: '#fff',
      decimalPlaces: 1,
      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: '5',
        strokeWidth: '2',
        stroke: '#fff',
      },
      propsForBackgroundLines: {
        strokeDasharray: '', // solid lines
        stroke: '#E0E0E0',
        strokeWidth: 1,
      },
      propsForLabels: {
        fontSize: 12,
      },
    }}
    bezier
    style={{
      marginVertical: 8,
      borderRadius: 16,
    }}
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
              opacity: num <= currentData.moodAverage ? 1 : 0.2
            }
          ]}
        />
      ))}
    </View>
    <Text style={styles.moodRangeText}>High</Text>
  </View>
</View>

        {/* Activity Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Activity Breakdown</Text>
          <ActivityItem
            icon="notebook-edit-outline"
            label="Journal Entries"
            value={currentData.journalEntries}
            color="#7986CB"
          />
          <ActivityItem
            icon="weather-windy"
            label="Breathing Sessions"
            value={currentData.breathingSessions}
            color="#4DB6AC"
          />
          <ActivityItem
            icon="earth"
            label="Grounding Sessions"
            value={currentData.groundingSessions}
            color="#64B5F6"
          />
          <ActivityItem
            icon="brain"
            label="CBT Exercises"
            value={currentData.cbtSessions}
            color="#BA68C8"
          />
        </View>

        {/* Insights */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Insights</Text>
          {currentData.insights.map((insight, index) => (
            <InsightCard key={index} {...insight} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

////////////////////////////////////////////////////////////////////////////////

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  header: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#E9ECEF',
    borderRadius: 30,
    padding: 4,
    marginBottom: 25,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 25,
  },
  activePeriodButton: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  periodText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  activePeriodText: {
    color: '#64B5F6',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20, // Keep some padding inside the card
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    },
    cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    },
    chartContainer: {
    alignItems: 'center', // Center the chart horizontally
    },
    chartStyle: {
    borderRadius: 16,
    marginVertical: 8,
    },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityLabel: {
    flex: 1,
    fontSize: 16,
    color: '#555',
  },
  activityValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  insightIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  moodRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingHorizontal: 10,
  },
  moodRangeBar: {
    flex: 1,
    height: 10,
    flexDirection: 'row',
    marginHorizontal: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  moodRangeSegment: {
    flex: 1,
    height: '100%',
  },
  moodRangeText: {
    fontSize: 12,
    color: '#666',
  },
});
