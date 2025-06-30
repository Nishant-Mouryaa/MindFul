import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator,
  Animated,
  Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient'; // for the gradient header

export default function SavedRecordsScreen({ navigation }) {
  const [savedRecords, setSavedRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // fadeAnim controls the opacity for the entire list
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadRecords();
  }, []);

  // Animate list items once records are loaded
  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  const loadRecords = async () => {
    try {
      setRefreshing(true);
      const auth = getAuth();
      let records = [];
      
      if (auth.currentUser) {
        const q = query(
          collection(db, 'cbtRecords'),
          where('userId', '==', auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        records = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().timestamp?.toDate() || new Date()
        }));
      } else {
        const localRecords = await AsyncStorage.getItem('cbtRecords');
        records = localRecords ? JSON.parse(localRecords) : [];
      }
      
      // Sort records by date descending
      setSavedRecords(records.sort((a, b) => b.date - a.date));

      // Cache them locally
      await AsyncStorage.setItem('cbtRecords', JSON.stringify(records));
    } catch (error) {
      console.error("Error loading records:", error);

      // Fallback to local storage if Firestore fails
      const localRecords = await AsyncStorage.getItem('cbtRecords');
      if (localRecords) {
        setSavedRecords(JSON.parse(localRecords));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderItem = ({ item, index }) => {
    const recordDate = item.date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return (
      <Animated.View 
        style={[
          styles.recordItem,
          { 
            opacity: fadeAnim,
            // Stagger each item’s vertical slide-in based on index
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20 * (index + 1), 0]
              })
            }]
          }
        ]}
      >
        <TouchableOpacity 
          onPress={() => navigation.navigate('RecordDetailScreen', { record: item })}
          style={styles.recordContent}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
            <MaterialCommunityIcons 
              name="text-box-outline" 
              size={24} 
              color="#1E88E5" 
            />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.recordTitle} numberOfLines={1}>
              {item.situation || 'Untitled Record'}
            </Text>
            <Text style={styles.recordSubtitle}>
              {/* If “emotion” is present, split before “(” to just show the name */}
              {item.emotion ? `${item.emotion.split('(')[0].trim()} • ` : ''}{recordDate}
            </Text>
          </View>
          
          <MaterialCommunityIcons 
            name="chevron-right" 
            size={24} 
            color="#BDBDBD" 
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Optional FAB to create a new record (or navigate to the CBT screen)
  const handleNewRecord = () => {
    // Example navigation to CBTScreen
    // navigation.navigate('CBTScreen');
    console.log('Navigate to new record form!');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#64B5F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Gradient Header */}
      <LinearGradient 
        colors={['#1E88E5', '#42A5F5']}
        style={styles.gradientHeader}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>My Thought Records</Text>
          <Text style={styles.subtitle}>
            {savedRecords.length} saved record{savedRecords.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </LinearGradient>

      {/* Main List Content */}
      <FlatList
        data={savedRecords}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons 
              name="text-box-remove-outline" 
              size={48} 
              color="#E0E0E0" 
            />
            <Text style={styles.emptyText}>No records found</Text>
            <Text style={styles.emptySubtext}>Your thought records will appear here</Text>
          </View>
        }
        refreshing={refreshing}
        onRefresh={loadRecords}
      />

      {/* Optional Floating “New” Button */}
      <TouchableOpacity style={styles.fab} onPress={handleNewRecord}>
        <MaterialCommunityIcons name="plus" size={22} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'android' ? 40 : 10, // some padding on Android
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  headerContent: {
    marginTop: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#EEE',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80, // some space so FAB doesn't cover last item
  },
  recordItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    // Android elevation
    elevation: 2,
  },
  recordContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 4,
  },
  recordSubtitle: {
    fontSize: 13,
    color: '#757575',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#9E9E9E',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BDBDBD',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    // Android elevation
    elevation: 4,
  },
});

