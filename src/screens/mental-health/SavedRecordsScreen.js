
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
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';
import { db } from '../../config/firebase'; // Adjust import path as needed
import { collection, query, where, getDocs } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

// Import your theme constants
import {
  Palette,
  spacing,
  typography,
  shadows,
  borderRadius,
} from '../../theme/colors'; // Adjust path as needed

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
        records = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().timestamp?.toDate() || new Date(),
        }));
      } else {
        const localRecords = await AsyncStorage.getItem('cbtRecords');
        records = localRecords ? JSON.parse(localRecords) : [];
      }

      // Sort records by date descending
      records.sort((a, b) => b.date - a.date);
      setSavedRecords(records);

      // Cache them locally
      await AsyncStorage.setItem('cbtRecords', JSON.stringify(records));
    } catch (error) {
      console.error('Error loading records:', error);

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
      year: 'numeric',
    });

    return (
      <Animated.View
        style={[
          styles.recordItem,
          shadows.low,
          {
            opacity: fadeAnim,
            // Stagger each item’s vertical slide-in based on index
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20 * (index + 1), 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('RecordDetailScreen', { record: item })}
          style={styles.recordContent}
        >
          <View style={[styles.iconContainer, { backgroundColor: Palette.primaryLight + '20' }]}>
            <MaterialCommunityIcons name="text-box-outline" size={24} color={Palette.primary} />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.recordTitle} numberOfLines={1}>
              {item.situation || 'Untitled Record'}
            </Text>
            <Text style={styles.recordSubtitle}>
              {item.emotion ? `${item.emotion.split('(')[0].trim()} • ` : ''}
              {recordDate}
            </Text>
          </View>

          <MaterialCommunityIcons name="chevron-right" size={24} color={Palette.border} />
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
          <ActivityIndicator size="large" color={Palette.secondaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[Palette.secondaryBlue, Palette.primary]}
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
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="text-box-remove-outline" size={48} color={Palette.border} />
            <Text style={styles.emptyText}>No records found</Text>
            <Text style={styles.emptySubtext}>Your thought records will appear here</Text>
          </View>
        }
        refreshing={refreshing}
        onRefresh={loadRecords}
      />

      {/* Optional Floating “New” Button */}
      <TouchableOpacity style={[styles.fab, shadows.medium]} onPress={handleNewRecord}>
        <MaterialCommunityIcons name="plus" size={22} color={Palette.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'android' ? spacing.xl : spacing.lg,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    overflow: 'hidden',
  },
  headerContent: {
    marginTop: spacing.xs,
  },
  title: {
    ...typography.h2,
    color: Palette.white,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: Palette.white,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 80, // some space so FAB doesn't cover last item
  },
  recordItem: {
    backgroundColor: Palette.card,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  recordContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  recordTitle: {
    ...typography.body,
    fontWeight: '500',
    color: Palette.textDark,
    marginBottom: spacing.xs / 2,
  },
  recordSubtitle: {
    ...typography.small,
    color: Palette.textMedium,
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
    paddingTop: spacing.xl,
  },
  emptyText: {
    ...typography.h3,
    color: Palette.textLight,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    ...typography.caption,
    color: Palette.textLight,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xxl,
    right: spacing.xxl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.primary, // or any accent color
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIndicator: {
    marginTop: spacing.md,
  },
});

