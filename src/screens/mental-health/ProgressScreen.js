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
// Note: You would need to install react-native-svg and react-native-chart-kit
// import { LineChart } from 'react-native-chart-kit';

const { width: screenWidth } = Dimensions.get('window');

export default function ProgressScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Mock data - in a real app, this would come from your data store
  const progressData = {
    week: {
      moodAverage: 7.2,
      moodData: [6, 7, 7.5, 8, 7, 6.5, 7.2],
      journalEntries: 5,
      breathingSessions: 8,
      groundingSessions: 3,
      cbtSessions: 2,
      streak: 7,
      insights: [
        { title: "Great Consistency!", description: "You've used a tool every day for the past 7 days. Keep it up!", icon: 'trophy-award', color: '#FFC107' },
        { title: "Mood is Trending Up", description: "Your average mood is 0.5 points higher than last week.", icon: 'trending-up', color: '#4CAF50' },
      ]
    },
    month: {
      moodAverage: 6.8,
      moodData: [7, 6, 6.5, 7, 8, 7.5, 6, 6.5, 7.2, 7, 6, 6.8],
      journalEntries: 18,
      breathingSessions: 32,
      groundingSessions: 12,
      cbtSessions: 8,
      streak: 25,
      insights: [
        { title: "Journaling Power", description: "You've written 18 journal entries this month, a great way to process thoughts.", icon: 'notebook-edit', color: '#2196F3' },
        { title: "Breathing is Key", description: "You've completed over 30 breathing sessions. This is a powerful stress reducer.", icon: 'weather-windy', color: '#4DB6AC' },
      ]
    },
  };

  const currentData = progressData[selectedPeriod];

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [selectedPeriod]);

  const StatCard = ({ title, value, subtitle, icon, color }) => (
    <View style={styles.statCard}>
        <View style={[styles.statIconContainer, {backgroundColor: color + '20'}]}>
            <MaterialCommunityIcons name={icon} size={28} color={color} />
        </View>
        <View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
        </View>
    </View>
  );

  const ActivityItem = ({ icon, label, value, color }) => (
      <View style={styles.activityItem}>
          <View style={[styles.activityIconContainer, {backgroundColor: color + '20'}]}>
            <MaterialCommunityIcons name={icon} size={24} color={color}/>
          </View>
          <Text style={styles.activityLabel}>{label}</Text>
          <Text style={styles.activityValue}>{value}</Text>
      </View>
  )

  const InsightCard = ({ title, description, icon, color }) => (
    <View style={styles.insightCard}>
      <MaterialCommunityIcons name={icon} size={24} color={color} style={styles.insightIcon}/>
      <View style={styles.insightContent}>
        <Text style={[styles.insightTitle, {color: color}]}>{title}</Text>
        <Text style={styles.insightDescription}>{description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Progress</Text>
          <Text style={styles.subtitle}>
            Review your activity and gain insights into your mental wellness journey.
          </Text>
        </View>

        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'week' && styles.activePeriodButton]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'week' && styles.activePeriodText]}>This Week</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'month' && styles.activePeriodButton]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'month' && styles.activePeriodText]}>This Month</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={{opacity: fadeAnim}}>
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
                <View style={styles.chartPlaceholder}>
                    <MaterialCommunityIcons name="chart-line" size={50} color="#CED4DA" />
                    <Text style={styles.chartPlaceholderText}>Mood chart will be shown here</Text>
                    {/* 
                    <LineChart
                        data={{
                            labels: selectedPeriod === 'week' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : [],
                            datasets: [{ data: currentData.moodData }]
                        }}
                        width={screenWidth - 80}
                        height={220}
                        chartConfig={chartConfig}
                        bezier
                        style={{ borderRadius: 16 }}
                    /> 
                    */}
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Activity Breakdown</Text>
                <ActivityItem icon="notebook-edit-outline" label="Journal Entries" value={currentData.journalEntries} color="#7986CB"/>
                <ActivityItem icon="weather-windy" label="Breathing Sessions" value={currentData.breathingSessions} color="#4DB6AC"/>
                <ActivityItem icon="earth" label="Grounding Sessions" value={currentData.groundingSessions} color="#64B5F6"/>
                <ActivityItem icon="brain" label="CBT Exercises" value={currentData.cbtSessions} color="#BA68C8"/>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Your Insights</Text>
                {currentData.insights.map((insight, index) => 
                    <InsightCard key={index} {...insight} />
                )}
            </View>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `rgba(100, 181, 246, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: { r: "6", strokeWidth: "2", stroke: "#64B5F6" },
    propsForLabels: { fontSize: 12, fill: "#666" }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
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
    padding: 20,
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
      borderBottomColor: '#F0F0F0'
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
  chartPlaceholder: {
      height: 220,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F8F9FA',
      borderRadius: 16,
  },
  chartPlaceholderText: {
      marginTop: 10,
      fontSize: 14,
      color: '#ADB5BD'
  }
}); 