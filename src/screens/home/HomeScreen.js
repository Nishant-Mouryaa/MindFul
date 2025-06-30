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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Palette } from '../../theme/colors';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [currentMood, setCurrentMood] = useState(null);
  const [streakCount] = useState(5); // Example streak

  // Mood options with icons
  const moodOptions = [
    { name: 'Happy', icon: 'emoticon-happy-outline', color: '#F8BBD0', value: 10 },
    { name: 'Calm', icon: 'yin-yang', color: '#D1C4E9', value: 7 },
    { name: 'Relax', icon: 'meditation', color: '#FFE0B2', value: 5 },
    { name: 'Focused', icon: 'brain', color: '#B2DFDB', value: 8 },
    { name: 'Tired', icon: 'sleep', color: '#CFD8DC', value: 2 },
  ];

  // Sample mood history data for the preview chart
  const moodHistoryData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      data: [5, 7, 4, 8, 6, 9, 7],
      color: () => '#4DB6AC',
    }]
  };

  React.useEffect(() => {
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
  }, []);

  const QuickStat = ({ icon, value, label }) => (
    <View style={styles.quickStat}>
      <MaterialCommunityIcons name={icon} size={24} color="#009688" />
      <Text style={styles.quickStatValue}>{value}</Text>
      <Text style={styles.quickStatLabel}>{label}</Text>
    </View>
  );

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

  // Simplified MiniLineChart component
  const MiniLineChart = ({ data }) => (
    <View style={styles.chartContainer}>
      {data.datasets[0].data.map((value, index) => (
        <View key={index} style={[
          styles.chartBar, 
          { 
            height: value * 8,
            backgroundColor: data.datasets[0].color(),
          }
        ]}>
          <Text style={styles.chartLabel}>{data.labels[index]}</Text>
        </View>
      ))}
    </View>
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
            <Text style={styles.greeting}>How are you feeling today?</Text>
            <Text style={styles.headerTitle}>MINDFUL</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <MaterialCommunityIcons name="account-circle" size={36} color="#616161" />
          </TouchableOpacity>
        </View>

        {/* Mood Tracking Section */}
        <LinearGradient
          colors={['#F1F9F6', '#D0ECEA']}
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
                onSelect={() => setCurrentMood(moodItem.value)}
              />
            ))}
          </ScrollView>

          {currentMood && (
            <TouchableOpacity 
              style={styles.journalButton}
              onPress={() => navigation.navigate('Journal', { mood: currentMood })}
            >
              <LinearGradient 
                colors={['#80CBC4', '#4DB6AC']} 
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

        {/* Quick Stats */}
        <View style={styles.quickStatsContainer}>
          <QuickStat icon="fire" value={streakCount} label="Day Streak" />
          <QuickStat icon="calendar-check" value="85%" label="This Month" />
          <QuickStat icon="emoticon-happy-outline" value="6.5" label="Avg Mood" />
        </View>

        {/* Progress Preview */}
        <TouchableOpacity 
          style={styles.progressPreview}
          onPress={() => navigation.navigate('Progress')}
        >
          <Text style={styles.sectionTitleAlt}>Your Mood Trends</Text>
          <MiniLineChart data={moodHistoryData} />
          <Text style={styles.seeMoreText}>See full analysis →</Text>
        </TouchableOpacity>

        {/* Daily Mental Health Tip */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <MaterialCommunityIcons name="lightbulb-on" size={24} color="#00897B" />
            <Text style={styles.tipTitle}>Today's Wellness Tip</Text>
          </View>
          <Text style={styles.tipContent}>
            "Practice the 5-4-3-2-1 grounding technique when feeling anxious: 
            Name 5 things you see, 4 things you feel, 3 things you hear, 
            2 things you smell, and 1 thing you taste."
          </Text>
        </View>

        {/* Emergency Resources */}
        <TouchableOpacity
          style={styles.emergencyCard}
          onPress={() => navigation.navigate('EmergencyResources')}
        >
          <MaterialCommunityIcons name="lifebuoy" size={24} color="#fff" />
          <Text style={styles.emergencyText}>Need Immediate Help?</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfdfd',
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
    fontSize: 16,
    color: '#616161',
    fontWeight: '400',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#00897B',
    letterSpacing: 1,
  },
  moodSection: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#424242',
    marginBottom: 16,
  },
  moodScrollContainer: {
    paddingRight: 16,
  },
  moodCard: {
    width: 70,
    height: 70,
    borderRadius: 16,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  selectedMood: {
    transform: [{ scale: 1.1 }],
    shadowColor: '#424242',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  moodName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
    marginTop: 4,
  },
  journalButton: {
    marginTop: 16,
  },
  journalGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  journalButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginRight: 10,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 24,
  },
  quickStat: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    width: '30%',
    elevation: 2,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#009688',
    marginTop: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#616161',
  },
  progressPreview: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
  },
  sectionTitleAlt: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00897B',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
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
    color: '#00897B',
    alignSelf: 'flex-end',
    marginTop: 8,
    fontWeight: '600',
  },
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00897B',
    marginLeft: 8,
  },
  tipContent: {
    fontSize: 14,
    color: '#616161',
    lineHeight: 22,
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F45957',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    elevation: 2,
  },
  emergencyText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});