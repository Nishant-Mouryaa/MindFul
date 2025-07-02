import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { getAuth, signOut } from 'firebase/auth';
import { db } from '../../config/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  doc,
  getDoc,
  addDoc
} from 'firebase/firestore';
import { Palette, spacing, typography, shadows, borderRadius } from '../../theme/colors';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const auth = getAuth();  
  const navigation = useNavigation();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // State variables
  const [userName, setUserName] = useState('');
  const [currentMood, setCurrentMood] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [moodHistoryData, setMoodHistoryData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ data: [0, 0, 0, 0, 0, 0, 0], color: () => '#4DB6AC' }]
  });
  const [stats, setStats] = useState({
    streak: 0,
    monthlyCompletion: '0%',
    avgMood: 0
  });
  const [dailyTip, setDailyTip] = useState('');
  const [loading, setLoading] = useState(true);

  // Mood options with icons
  const moodOptions = [
    { name: 'Happy',   icon: 'emoticon-happy-outline', color: Palette.secondaryPink, value: 10 },
    { name: 'Calm',    icon: 'yin-yang',               color: Palette.secondaryPurple, value: 7 },
    { name: 'Relax',   icon: 'meditation',             color: Palette.secondaryOrange, value: 5 },
    { name: 'Focused', icon: 'brain',                  color: Palette.primaryLight, value: 8 },
    { name: 'Tired',   icon: 'sleep',                  color: Palette.border, value: 2 },
  ];

  // On mount
  useEffect(() => {
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
    fetchUserData();
  }, []);

  // Main data fetch
  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      setLoading(true);

      // 1) Fetch user profile data
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserName(userDoc.data().displayName || user.email?.split('@')[0] || '');
      }

      // 2) Fetch today's mood if exists
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const moodQuery = query(
        collection(db, 'moodEntries'),
        where('userId', '==', user.uid),
        where('date', '>=', today),
        limit(1)
      );
      const moodSnapshot = await getDocs(moodQuery);
      if (!moodSnapshot.empty) {
        setCurrentMood(moodSnapshot.docs[0].data().rating);
      }

      // 3) Fetch recent activities (limit 3, ordered desc by timestamp)
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(3)
      );
      const activitiesSnapshot = await getDocs(activitiesQuery);
      const activities = activitiesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          icon: getActivityIcon(data.type),
          label: getActivityLabel(data.type),
          value: formatActivityDate(data.timestamp?.toDate()),
          color: getActivityColor(data.type)
        };
      });
      setRecentActivities(activities);

      // 4) Fetch mood history for the last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weeklyMoodQuery = query(
        collection(db, 'moodEntries'),
        where('userId', '==', user.uid),
        where('date', '>=', weekAgo),
        orderBy('date', 'asc')
      );
      const weeklyMoodSnapshot = await getDocs(weeklyMoodQuery);
      const weeklyMoodData = Array(7).fill(0);
      const dayCounts = Array(7).fill(0);

      weeklyMoodSnapshot.docs.forEach(doc => {
        const moodData = doc.data();
        const day = moodData.date.toDate().getDay(); // 0-6 (Sun-Sat)
        weeklyMoodData[day] += moodData.rating;
        dayCounts[day]++;
      });

      const averagedData = weeklyMoodData.map((sum, i) =>
        dayCounts[i] > 0 ? Math.round(sum / dayCounts[i]) : 0
      );
      setMoodHistoryData({
        labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        datasets: [{ data: averagedData, color: () => Palette.primary }]
      });

      // 5) Calculate user streak 
      const streak = await calculateStreak(user.uid);

      // 6) Calculate monthly completion & average mood
      const monthlyCompletion = await calculateMonthlyCompletion();
      const avgMood = await calculateAverageMood();

      setStats({
        streak: streak,
        monthlyCompletion: `${monthlyCompletion}%`,
        avgMood: avgMood.toFixed(1)
      });

      // 7) Fetch daily tip from wellnessTips (random)
      const tipsRef = collection(db, 'wellnessTips');
      const tipsSnapshot = await getDocs(tipsRef);
      if (!tipsSnapshot.empty) {
        const randomIndex = Math.floor(Math.random() * tipsSnapshot.size);
        setDailyTip(tipsSnapshot.docs[randomIndex].data().tip);
      }

    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------- Streak Logic -------------------------------
  // This function is the same logic you used in your ProgressScreen
  const calculateStreak = async (uid) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let streak = 0;
      let currentDate = new Date(today);

      // Check up to 365 days, or until a day with no activity is found
      while (streak < 365) {
        const dateQuery = query(
          collection(db, 'activities'),
          where('userId', '==', uid),
          where('timestamp', '>=', currentDate),
          where('timestamp', '<', new Date(currentDate.getTime() + 86400000))
        );
        const snapshot = await getDocs(dateQuery);
        if (snapshot.empty) {
          // If we find no activity on this day, break the streak
          break;
        }
        streak++;
        // Move currentDate one day earlier
        currentDate.setDate(currentDate.getDate() - 1);
      }
      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  };

  // ------------------------------ Helpers/Handlers ------------------------------
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login'); // Replace with your login screen name
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getActivityIcon = (type) => {
    switch(type) {
      case 'journal': return 'notebook-edit-outline';
      case 'breathing': return 'weather-windy';
      case 'cbt': return 'brain';
      case 'grounding': return 'earth';
      default: return 'checkbox-marked-circle-outline';
    }
  };
  const getActivityLabel = (type) => {
    switch(type) {
      case 'journal': return 'Journal Entry';
      case 'breathing': return 'Breathing Session';
      case 'cbt': return 'CBT Exercise';
      case 'grounding': return 'Grounding Session';
      default: return 'Activity';
    }
  };
  const getActivityColor = (type) => {
    switch(type) {
      case 'journal': return '#7986CB';
      case 'breathing': return '#4DB6AC';
      case 'cbt': return '#BA68C8';
      case 'grounding': return '#64B5F6';
      default: return '#9E9E9E';
    }
  };

  const formatActivityDate = (date) => {
    if (!date) return 'Recently';
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const calculateMonthlyCompletion = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return 0;
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('userId', '==', user.uid),
        where('timestamp', '>=', firstDay)
      );
      const snapshot = await getDocs(activitiesQuery);
      const uniqueDays = new Set();
      snapshot.docs.forEach(doc => {
        const date = doc.data().timestamp?.toDate();
        if (date) {
          uniqueDays.add(date.toDateString());
        }
      });
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const completion = Math.round((uniqueDays.size / daysInMonth) * 100);
      return Math.min(completion, 100);
    } catch (error) {
      console.error("Error calculating monthly completion:", error);
      return 0;
    }
  };

  const calculateAverageMood = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return 0;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const moodQuery = query(
        collection(db, 'moodEntries'),
        where('userId', '==', user.uid),
        where('date', '>=', weekAgo)
      );
      const snapshot = await getDocs(moodQuery);
      if (snapshot.empty) return 0;
      const sum = snapshot.docs.reduce((total, doc) => total + doc.data().rating, 0);
      return sum / snapshot.size;
    } catch (error) {
      console.error("Error calculating average mood:", error);
      return 0;
    }
  };

  const handleMoodSelection = async (moodValue) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      setCurrentMood(moodValue);

      // Save mood entry
      await addDoc(collection(db, 'moodEntries'), {
        userId: user.uid,
        rating: moodValue,
        date: new Date(),
        timestamp: new Date()
      });

      // Log the activity
      await addDoc(collection(db, 'activities'), {
        userId: user.uid,
        type: 'mood',
        moodValue: moodValue,
        timestamp: new Date()
      });

      // Re-fetch data to update UI
      fetchUserData();
    } catch (error) {
      console.error("Error saving mood:", error);
    }
  };

  // Greeting helper
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // ------------------------------ UI Components ------------------------------
  // QuickStat component
  const QuickStat = ({ icon, value, label }) => (
    <View style={styles.quickStat}>
      <MaterialCommunityIcons name={icon} size={24} color="#009688" />
      <Text style={styles.quickStatValue}>{value}</Text>
      <Text style={styles.quickStatLabel}>{label}</Text>
    </View>
  );

  // MoodCard component
  const MoodCard = ({ item, selected, onSelect }) => (
    <TouchableOpacity
      style={[
        styles.moodCard,
        { backgroundColor: item.color },
        selected && styles.selectedMood,
      ]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons 
        name={item.icon} 
        size={30} 
        color="#fff" 
      />
      <Text style={styles.moodName}>{item.name}</Text>
    </TouchableOpacity>
  );

  // Simple bar chart for mood data
  const MiniLineChart = ({ data }) => (
    <View style={styles.chartContainer}>
      {data.datasets[0].data.map((value, index) => {
        const barHeight = typeof value === 'number' ? value * 10 : 0;
        return (
          <View 
            key={index} 
            style={[
              styles.chartBar, 
              { 
                height: barHeight,
                backgroundColor: data.datasets[0].color(),
              }
            ]}
          >
            <Text style={styles.chartLabel}>
              {data.labels[index]}
            </Text>
          </View>
        );
      })}
    </View>
  );

  // QuickAction component
  const QuickAction = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={styles.quickActionIcon}>
        <MaterialCommunityIcons name={icon} size={24} color="#fff"/>
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );

  // ActivityItem component
  const ActivityItem = ({ icon, label, value, color }) => (
    <View style={styles.activityItem}>
      <View style={[styles.activityIconContainer, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.activityLabel}>{label}</Text>
      <Text style={styles.activityValue}>{value}</Text>
    </View>
  );

  // ------------------------------ Render ------------------------------
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Palette.primary} />
        <Text style={styles.loadingText}>Loading your data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={fetchUserData}
          colors={[Palette.primary]}
          tintColor={Palette.primary}
        />
      }
    >
      <Animated.View 
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        {/* Header with personalized greeting */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {getTimeBasedGreeting()}, {userName || 'there'}!
            </Text>
            <Text style={styles.headerTitle}>MINDFUL</Text>
          </View>

          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons name="logout" size={24} color={Palette.textLight} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <MaterialCommunityIcons name="account-circle" size={36} color={Palette.textLight} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <QuickAction 
            icon="meditation" 
            label="Breathing" 
            onPress={() => navigation.navigate('Breathing')} 
          />
          <QuickAction 
            icon="notebook-edit" 
            label="Journal" 
            onPress={() => navigation.navigate('Journal')} 
          />
          <QuickAction 
            icon="brain" 
            label="CBT" 
            onPress={() => navigation.navigate('CBT')} 
          />
        </View>

        {/* Daily Check-In Reminder (only if no mood selected) */}
        {!currentMood && (
          <View style={styles.checkinReminder}>
            <Text style={styles.checkinTitle}>Daily Check-In</Text>
            <Text style={styles.checkinText}>
              Share how you're feeling today to track your progress
            </Text>
          </View>
        )}

        {/* Mood Tracking Section */}
        <LinearGradient
          colors={[Palette.background, Palette.primaryLight]}
          style={styles.moodSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.sectionTitle}>Track Your Mood</Text>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodScrollContainer}
          >
            {moodOptions.map((moodItem) => (
              <MoodCard
                key={moodItem.value}
                item={moodItem}
                selected={currentMood === moodItem.value}
                onSelect={() => handleMoodSelection(moodItem.value)}
              />
            ))}
          </ScrollView>

          {/* If mood is selected, show a button to journal */}
          {currentMood && (
            <TouchableOpacity 
              style={styles.journalButton}
              onPress={() => navigation.navigate('Journal', { mood: currentMood })}
            >
              <LinearGradient 
                colors={[Palette.primaryLight, Palette.primary]} 
                style={styles.journalGradient}
              >
                <Text style={styles.journalButtonText}>
                  {currentMood <= 3 ? "Journal About Today" : "Capture This Moment"}
                </Text>
                <MaterialCommunityIcons name="book-edit" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* Quick Stats (including the streak) */}
        {/* <View style={styles.quickStatsContainer}>
          <QuickStat icon="fire" value={stats.streak} label="Day Streak" />
          <QuickStat icon="calendar-check" value={stats.monthlyCompletion} label="This Month" />
          <QuickStat icon="emoticon-happy-outline" value={stats.avgMood} label="Avg Mood" />
        </View> */}

        {/* Progress Preview */}
        {/* <TouchableOpacity 
          style={styles.progressPreview}
          onPress={() => navigation.navigate('Progress')}
        >
          <Text style={styles.sectionTitleAlt}>Your Mood Trends</Text>
          <MiniLineChart data={moodHistoryData} />
          <Text style={styles.seeMoreText}>See full analysis →</Text>
        </TouchableOpacity> */}

        {/* Recent Activity Preview */}
        {/* <View style={styles.recentActivity}>
          <Text style={styles.sectionTitleAlt}>Recent Activity</Text>
          {recentActivities.length > 0 ? (
            recentActivities.map(activity => (
              <ActivityItem key={activity.id} {...activity} />
            ))
          ) : (
            <Text style={styles.emptyText}>No recent activities yet</Text>
          )}
          <TouchableOpacity 
            style={styles.seeMoreButton}
            onPress={() => navigation.navigate('Progress')}
          >
            <Text style={styles.seeMoreText}>View All Activity →</Text>
          </TouchableOpacity>
        </View> */}

        {/* Daily Mental Health Tip */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <MaterialCommunityIcons name="lightbulb-on" size={24} color={Palette.primaryDark} />
            <Text style={styles.tipTitle}>Today's Wellness Tip</Text>
          </View>
          <Text style={styles.tipContent}>
            {dailyTip || "“Practice the 5-4-3-2-1 grounding technique when feeling anxious…”"}
          </Text>
        </View>

        {/* Emergency Resources */}
        <TouchableOpacity
          style={styles.emergencyCard}
          onPress={() => navigation.navigate('EmergencyResources')}
        >
          <MaterialCommunityIcons name="lifebuoy" size={24} color={Palette.white} />
          <Text style={styles.emergencyText}>Need Immediate Help?</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={Palette.white} />
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

////////////////////////////////////////////////////////////////////////////////
// STYLES
////////////////////////////////////////////////////////////////////////////////

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  greeting: {
    fontSize: typography.body.fontSize,
    color: Palette.textLight,
    fontWeight: typography.body.fontWeight,
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: Palette.primaryDark,
    letterSpacing: 1,
  },
  logoutButton: {
    padding: spacing.sm,
  },
  profileButton: {
    padding: spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  quickAction: {
    alignItems: 'center',
    width: '30%',
  },
  quickActionIcon: {
    backgroundColor: Palette.primary,
    width: 50,
    height: 50,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActionLabel: {
    fontSize: typography.small.fontSize,
    color: Palette.textLight,
    textAlign: 'center',
  },
  checkinReminder: {
    backgroundColor: Palette.secondaryBlue,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  checkinTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: Palette.textDark,
    marginBottom: spacing.xs,
  },
  checkinText: {
    fontSize: typography.caption.fontSize,
    color: Palette.textDark,
  },
  moodSection: {
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: Palette.textDark,
    marginBottom: spacing.md,
  },
  moodScrollContainer: {
    paddingRight: spacing.md,
  },
  moodCard: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
  selectedMood: {
    transform: [{ scale: 1.1 }],
    ...shadows.high,
  },
  moodName: {
    color: Palette.white,
    fontWeight: typography.h3.fontWeight,
    fontSize: typography.small.fontSize,
    marginTop: spacing.xs,
  },
  journalButton: {
    marginTop: spacing.md,
  },
  journalGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  journalButtonText: {
    color: Palette.white,
    fontWeight: typography.h3.fontWeight,
    marginRight: spacing.sm,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  quickStat: {
    alignItems: 'center',
    backgroundColor: Palette.card,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    width: '30%',
    ...shadows.low,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.primary,
    marginTop: spacing.xs,
  },
  quickStatLabel: {
    fontSize: typography.small.fontSize,
    color: Palette.textLight,
  },
  progressPreview: {
    backgroundColor: Palette.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.low,
  },
  sectionTitleAlt: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: Palette.primaryDark,
    marginBottom: spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginVertical: 10,
  },
  chartBar: {
    width: 30,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartLabel: {
    fontSize: 10,
    color: '#fff',
    marginBottom: 4,
  },
  seeMoreText: {
    color: Palette.primaryDark,
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
    fontWeight: typography.h3.fontWeight,
  },
  recentActivity: {
    backgroundColor: Palette.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  emptyText: {
    color: Palette.textLight,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  seeMoreButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-end',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  activityLabel: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: Palette.textMedium,
  },
  activityValue: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: Palette.textDark,
  },
  tipCard: {
    backgroundColor: Palette.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.low,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tipTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: Palette.primaryDark,
    marginLeft: spacing.sm,
  },
  tipContent: {
    fontSize: typography.caption.fontSize,
    color: Palette.textLight,
    lineHeight: typography.caption.lineHeight,
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.secondaryRed,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.lg,
    ...shadows.low,
  },
  emergencyText: {
    color: Palette.white,
    fontWeight: typography.h3.fontWeight,
    fontSize: typography.body.fontSize,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Palette.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: Palette.textLight,
  },
});

