import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const initialProgressData = {
  week: {
    totalWorkouts: 0,
    totalVolume: 0,
    personalBests: [],
    prHistory: {
      'Bench Press': [0],
      'Squat': [0],
      'Deadlift': [0],
    },
    volumeHistory: [0],
    sessionNotes: [],
  },
  month: {
    totalWorkouts: 0,
    totalVolume: 0,
    personalBests: [],
    prHistory: {
      'Bench Press': [0],
      'Squat': [0],
      'Deadlift': [0],
    },
    volumeHistory: [0],
    sessionNotes: [],
  },
};

export default function ProgressScreen() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [selectedExercise, setSelectedExercise] = useState('Bench Press');
  const [sessionNote, setSessionNote] = useState('');
  const [progressData, setProgressData] = useState(initialProgressData);
  const [isLoading, setIsLoading] = useState(true);
  const [animatedValues] = useState([...Array(10)].map(() => new Animated.Value(0)));

  const mockProgressData = {
    week: {
      totalWorkouts: 4,
      totalVolume: 12500,
      personalBests: [
        { exercise: 'Bench Press', weight: 100, date: '2024-03-15' },
        { exercise: 'Squat', weight: 150, date: '2024-03-14' },
        { exercise: 'Deadlift', weight: 180, date: '2024-03-13' },
      ],
      prHistory: {
        'Bench Press': [90, 95, 98, 100],
        'Squat': [140, 145, 148, 150],
        'Deadlift': [170, 175, 178, 180],
      },
      volumeHistory: [2800, 3000, 3200, 3500],
      sessionNotes: [
        {
          date: '2024-03-15',
          note: 'Felt strong today, hit new PR on bench press',
        },
        {
          date: '2024-03-14',
          note: 'Squat form improving, need to work on depth',
        },
      ],
    },
    month: {
      totalWorkouts: 16,
      totalVolume: 48000,
      personalBests: [
        { exercise: 'Bench Press', weight: 105, date: '2024-03-15' },
        { exercise: 'Squat', weight: 155, date: '2024-03-14' },
        { exercise: 'Deadlift', weight: 185, date: '2024-03-13' },
      ],
      prHistory: {
        'Bench Press': [85, 90, 95, 100, 105],
        'Squat': [130, 135, 140, 145, 155],
        'Deadlift': [160, 165, 170, 175, 185],
      },
      volumeHistory: [10000, 12000, 14000, 16000, 18000],
      sessionNotes: [
        {
          date: '2024-03-15',
          note: 'Great progress this month, all lifts increasing steadily',
        },
        {
          date: '2024-03-01',
          note: 'Started new program, feeling good about the changes',
        },
      ],
    },
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProgressData(mockProgressData);
        
        // Animate charts on load
        Animated.stagger(100, 
          animatedValues.map(anim => 
            Animated.spring(anim, {
              toValue: 1,
              friction: 4,
              useNativeDriver: true,
            })
          )
        ).start();
      } catch (error) {
        console.error('Error fetching progress data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getExerciseIcon = (exercise) => {
    switch(exercise) {
      case 'Bench Press':
        return 'arm-flex';
      case 'Squat':
        return 'weight-lifter';
      case 'Deadlift':
        return 'weight';
      default:
        return 'dumbbell';
    }
  };

  const renderPRProgress = () => {
    const data = progressData[selectedTimeframe]?.prHistory?.[selectedExercise] || [0];
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const latestValue = data[data.length - 1];
    const previousValue = data[data.length - 2] || latestValue;
    const percentageChange = previousValue ? ((latestValue - previousValue) / previousValue * 100).toFixed(1) : 0;

    return (
      <LinearGradient
        colors={['rgba(230, 57, 70, 0.1)', 'rgba(230, 57, 70, 0.05)']}
        style={styles.chartContainer}
      >
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.chartTitle}>PR Progress</Text>
            <Text style={styles.chartSubtitle}>{selectedExercise}</Text>
          </View>
          <View style={styles.percentageContainer}>
            <MaterialCommunityIcons 
              name={percentageChange >= 0 ? "trending-up" : "trending-down"} 
              size={20} 
              color={percentageChange >= 0 ? "#2a9d8f" : "#e63946"} 
            />
            <Text style={[styles.percentageText, { color: percentageChange >= 0 ? "#2a9d8f" : "#e63946" }]}>
              {percentageChange}%
            </Text>
          </View>
        </View>
        
        <View style={styles.chartContent}>
          {data.map((value, index) => {
            const barHeight = maxValue > minValue 
              ? ((value - minValue) / (maxValue - minValue)) * 100 
              : 50;
            
            return (
              <Animated.View 
                key={index} 
                style={[
                  styles.chartBarContainer,
                  {
                    transform: [{
                      scaleY: animatedValues[index] || 1
                    }]
                  }
                ]}
              >
                <Text style={styles.chartBarValue}>{value}</Text>
                <View style={styles.chartBar}>
                  <LinearGradient
                    colors={['#e63946', '#d62828']}
                    style={[
                      styles.chartBarFill,
                      { height: `${barHeight}%` }
                    ]}
                  />
                </View>
                <Text style={styles.chartLabel}>W{index + 1}</Text>
              </Animated.View>
            );
          })}
        </View>
      </LinearGradient>
    );
  };

  const renderVolumeProgress = () => {
    const data = progressData[selectedTimeframe]?.volumeHistory || [0];
    const maxValue = Math.max(...data);
    const totalVolume = data.reduce((acc, val) => acc + val, 0);

    return (
      <View style={styles.volumeContainer}>
        <View style={styles.volumeHeader}>
          <Text style={styles.chartTitle}>Volume Trend</Text>
          <Text style={styles.volumeTotal}>{totalVolume.toLocaleString()} kg total</Text>
        </View>
        
        <View style={styles.volumeChart}>
          {data.map((value, index) => {
            const barWidth = (value / maxValue) * 100;
            
            return (
              <Animated.View 
                key={index} 
                style={[
                  styles.volumeBarContainer,
                  {
                    opacity: animatedValues[index + 5] || 1,
                    transform: [{
                      translateX: animatedValues[index + 5] ? 
                        animatedValues[index + 5].interpolate({
                          inputRange: [0, 1],
                          outputRange: [-50, 0]
                        }) : 0
                    }]
                  }
                ]}
              >
                <Text style={styles.volumeLabel}>Session {index + 1}</Text>
                <View style={styles.volumeBarBg}>
                  <LinearGradient
                    colors={['#2a9d8f', '#264653']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.volumeBarFill, { width: `${barWidth}%` }]}
                  />
                </View>
                <Text style={styles.volumeValue}>{value.toLocaleString()}</Text>
              </Animated.View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderSessionNotes = () => {
    const notes = progressData[selectedTimeframe]?.sessionNotes || [];

    return (
      <View style={styles.notesSection}>
        <View style={styles.notesSectionHeader}>
          <Text style={styles.sectionTitle}>Training Journal</Text>
          <TouchableOpacity>
            <MaterialCommunityIcons name="notebook-edit" size={24} color="#e63946" />
          </TouchableOpacity>
        </View>
        
        {notes.map((note, index) => (
          <Animated.View 
            key={index} 
            style={[
              styles.noteCard,
              {
                opacity: animatedValues[index + 8] || 1,
                transform: [{
                  scale: animatedValues[index + 8] || 1
                }]
              }
            ]}
          >
            <View style={styles.noteHeader}>
              <MaterialCommunityIcons name="calendar" size={16} color="#e63946" />
              <Text style={styles.noteDate}>{note.date}</Text>
            </View>
            <Text style={styles.noteText}>{note.note}</Text>
          </Animated.View>
        ))}
        
        <View style={styles.addNoteContainer}>
          <TextInput
            style={styles.noteInput}
            placeholder="Record today's thoughts..."
            placeholderTextColor="#666"
            value={sessionNote}
            onChangeText={setSessionNote}
            multiline
          />
          <TouchableOpacity
            style={styles.addNoteButton}
            onPress={() => setSessionNote('')}
          >
            <LinearGradient
              colors={['#e63946', '#d62828']}
              style={styles.addNoteGradient}
            >
              <MaterialCommunityIcons name="send" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e63946" />
        <Text style={styles.loadingText}>Analyzing your progress...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['rgba(230, 57, 70, 0.1)', 'transparent']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Progress Tracker</Text>
          <Text style={styles.subtitle}>Monitor your strength journey</Text>
        </View>
      </LinearGradient>

      <View style={styles.timeframeSelector}>
        {['week', 'month'].map((timeframe) => (
          <TouchableOpacity
            key={timeframe}
            style={[
              styles.timeframeButton,
              selectedTimeframe === timeframe && styles.selectedTimeframe,
            ]}
            onPress={() => setSelectedTimeframe(timeframe)}
          >
            <MaterialCommunityIcons 
              name={timeframe === 'week' ? 'calendar-week' : 'calendar-month'} 
              size={20} 
              color={selectedTimeframe === timeframe ? '#e63946' : '#666'} 
            />
            <Text
              style={[
                styles.timeframeText,
                selectedTimeframe === timeframe && styles.selectedTimeframeText,
              ]}
            >
              {timeframe === 'week' ? 'Weekly' : 'Monthly'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.exerciseSelector}
        contentContainerStyle={styles.exerciseSelectorContent}
      >
        {['Bench Press', 'Squat', 'Deadlift'].map((exercise) => (
          <TouchableOpacity
            key={exercise}
            style={[
              styles.exerciseButton,
              selectedExercise === exercise && styles.selectedExercise,
            ]}
            onPress={() => setSelectedExercise(exercise)}
          >
            <MaterialCommunityIcons 
              name={getExerciseIcon(exercise)} 
              size={24} 
              color={selectedExercise === exercise ? '#e63946' : '#666'} 
            />
            <Text
              style={[
                styles.exerciseButtonText,
                selectedExercise === exercise && styles.selectedExerciseText,
              ]}
            >
              {exercise}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {renderPRProgress()}

      <View style={styles.statsContainer}>
        <LinearGradient
          colors={['#e63946', '#d62828']}
          style={styles.statCard}
        >
          <MaterialCommunityIcons name="fire" size={32} color="#fff" />
          <Text style={styles.statValue}>
            {progressData[selectedTimeframe]?.totalWorkouts || 0}
          </Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </LinearGradient>

        <LinearGradient
          colors={['#2a9d8f', '#264653']}
          style={styles.statCard}
        >
          <MaterialCommunityIcons name="weight-kilogram" size={32} color="#fff" />
          <Text style={styles.statValue}>
            {(progressData[selectedTimeframe]?.totalVolume || 0).toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Total Volume (kg)</Text>
        </LinearGradient>

        <LinearGradient
          colors={['#f77f00', '#d62828']}
          style={styles.statCard}
        >
          <MaterialCommunityIcons name="trophy" size={32} color="#fff" />
          <Text style={styles.statValue}>
            {progressData[selectedTimeframe]?.personalBests?.length || 0}
          </Text>
          <Text style={styles.statLabel}>New PRs</Text>
        </LinearGradient>
      </View>

      {renderVolumeProgress()}

      {/* Personal Records Section */}
      <View style={styles.prSection}>
        <Text style={styles.sectionTitle}>Personal Records</Text>
        <View style={styles.prGrid}>
          {progressData[selectedTimeframe]?.personalBests?.map((pr, index) => (
            <Animated.View 
              key={index}
              style={[
                styles.prCard,
                {
                  opacity: animatedValues[index] || 1,
                  transform: [{
                    scale: animatedValues[index] || 1
                  }]
                }
              ]}
            >
              <LinearGradient
                colors={['rgba(230, 57, 70, 0.2)', 'rgba(230, 57, 70, 0.05)']}
                style={styles.prCardGradient}
              >
                <MaterialCommunityIcons 
                  name={getExerciseIcon(pr.exercise)} 
                  size={28} 
                  color="#e63946" 
                />
                <Text style={styles.prExercise}>{pr.exercise}</Text>
                <Text style={styles.prWeight}>{pr.weight} kg</Text>
                <View style={styles.prDateContainer}>
                  <MaterialCommunityIcons name="calendar-check" size={14} color="#666" />
                  <Text style={styles.prDate}>{pr.date}</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          ))}
        </View>
      </View>

      {renderSessionNotes()}

      {/* Motivational Quote */}
      <LinearGradient
        colors={['rgba(42, 157, 143, 0.1)', 'rgba(42, 157, 143, 0.05)']}
        style={styles.quoteContainer}
      >
        <MaterialCommunityIcons name="format-quote-open" size={24} color="#2a9d8f" />
        <Text style={styles.quoteText}>
          "Strength doesn't come from what you can do. It comes from overcoming the things you once thought you couldn't."
        </Text>
        <Text style={styles.quoteAuthor}>- Rikki Rogers</Text>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '300',
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    fontWeight: '300',
  },
  timeframeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  timeframeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedTimeframe: {
    backgroundColor: 'rgba(230, 57, 70, 0.1)',
    borderColor: '#e63946',
  },
  timeframeText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '500',
  },
  selectedTimeframeText: {
    color: '#e63946',
    fontWeight: '600',
  },
  exerciseSelector: {
    paddingBottom: 20,
  },
  exerciseSelectorContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  exerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedExercise: {
    backgroundColor: 'rgba(230, 57, 70, 0.1)',
    borderColor: '#e63946',
  },
  exerciseButtonText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '500',
  },
  selectedExerciseText: {
    color: '#e63946',
    fontWeight: '600',
  },
  chartContainer: {
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.2)',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBarValue: {
    color: '#e63946',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  chartBar: {
    width: 40,
    height: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 20,
  },
  chartLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
  volumeContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#252525',
  },
  volumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  volumeTotal: {
    fontSize: 14,
    color: '#2a9d8f',
    fontWeight: '600',
  },
  volumeChart: {
    gap: 12,
  },
  volumeBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  volumeLabel: {
    color: '#666',
    fontSize: 12,
    width: 60,
  },
  volumeBarBg: {
    flex: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  volumeBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  volumeValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    width: 50,
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  prSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  prGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  prCard: {
    flex: 1,
    minWidth: (width - 60) / 2,
  },
  prCardGradient: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.2)',
  },
  prExercise: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  prWeight: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
    marginTop: 4,
  },
  prDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  prDate: {
    fontSize: 12,
    color: '#666',
  },
  notesSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  notesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '700',
  },
  noteCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#252525',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  noteText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 22,
    fontWeight: '300',
  },
  addNoteContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  noteInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    color: '#fff',
    height: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#252525',
    fontSize: 15,
  },
  addNoteButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  addNoteGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(42, 157, 143, 0.2)',
  },
  quoteText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
    fontStyle: 'italic',
    marginTop: 12,
    fontWeight: '300',
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#2a9d8f',
    marginTop: 12,
    textAlign: 'right',
    fontWeight: '500',
  },
});