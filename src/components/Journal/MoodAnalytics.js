// components/Journal/MoodAnalytics.js
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Palette, spacing, typography, borderRadius, shadows } from '../../theme/colors';

const MOOD_CONFIG = {
  great: { label: 'Great', icon: 'emoticon-excited-outline', color: '#58D68D', score: 5 },
  good: { label: 'Good', icon: 'emoticon-happy-outline', color: '#4CAF50', score: 4 },
  neutral: { label: 'Neutral', icon: 'emoticon-neutral-outline', color: '#9E9E9E', score: 3 },
  down: { label: 'Down', icon: 'emoticon-sad-outline', color: '#5DADE2', score: 2 },
  sad: { label: 'Sad', icon: 'emoticon-frown-outline', color: '#3498DB', score: 1 },
  anxious: { label: 'Anxious', icon: 'emoticon-confused-outline', color: '#F39C12', score: 2 },
  angry: { label: 'Angry', icon: 'emoticon-angry-outline', color: '#E74C3C', score: 1 },
  tired: { label: 'Tired', icon: 'emoticon-dead-outline', color: '#9B59B6', score: 2 },
};

export default function MoodAnalytics({ entries }) {
  const analytics = useMemo(() => {
    if (!entries || entries.length === 0) {
      return null;
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Filter entries for last 30 days
    const last30Days = entries.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate >= thirtyDaysAgo;
    });

    const last7Days = entries.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate >= sevenDaysAgo;
    });

    // Mood distribution
    const moodCounts = {};
    last30Days.forEach(e => {
      if (e.mood) {
        moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
      }
    });

    // Sort by count
    const sortedMoods = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([mood, count]) => ({
        mood,
        count,
        percentage: last30Days.length > 0 ? Math.round((count / last30Days.length) * 100) : 0,
        config: MOOD_CONFIG[mood] || { label: mood, icon: 'emoticon-outline', color: '#9E9E9E', score: 3 }
      }));

    // Calculate average mood score
    const avgScore = last30Days.length > 0
      ? last30Days.reduce((sum, e) => {
          const config = MOOD_CONFIG[e.mood];
          return sum + (config ? config.score : 3);
        }, 0) / last30Days.length
      : 0;

    // Calculate weekly trend
    const lastWeekAvg = last7Days.length > 0
      ? last7Days.reduce((sum, e) => {
          const config = MOOD_CONFIG[e.mood];
          return sum + (config ? config.score : 3);
        }, 0) / last7Days.length
      : 0;

    const previousWeekStart = new Date(sevenDaysAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previousWeek = entries.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate >= previousWeekStart && entryDate < sevenDaysAgo;
    });

    const previousWeekAvg = previousWeek.length > 0
      ? previousWeek.reduce((sum, e) => {
          const config = MOOD_CONFIG[e.mood];
          return sum + (config ? config.score : 3);
        }, 0) / previousWeek.length
      : 0;

    let trendDirection = 'stable';
    if (lastWeekAvg > previousWeekAvg + 0.2) {
      trendDirection = 'up';
    } else if (lastWeekAvg < previousWeekAvg - 0.2) {
      trendDirection = 'down';
    }

    // Streak calculation
    let currentStreak = 0;
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < Math.min(sortedEntries.length, 365); i++) {
      const entryDate = new Date(sortedEntries[i].date);
      entryDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);
      
      if (entryDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
      } else if (entryDate.getTime() < expectedDate.getTime()) {
        break;
      }
    }

    return {
      totalEntries: last30Days.length,
      moodDistribution: sortedMoods,
      averageScore: avgScore,
      trend: trendDirection,
      trendChange: Math.abs(lastWeekAvg - previousWeekAvg).toFixed(1),
      streak: currentStreak,
      mostCommonMood: sortedMoods.length > 0 ? sortedMoods[0] : null,
      entriesThisWeek: last7Days.length,
    };
  }, [entries]);

  // Empty state
  if (!analytics || analytics.totalEntries === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons 
          name="chart-line" 
          size={48} 
          color={Palette.textLight} 
        />
        <Text style={styles.emptyText}>
          Start journaling to see your mood insights
        </Text>
        <Text style={styles.emptySubtext}>
          Your mood patterns and trends will appear here
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, styles.summaryCardSmall]}>
          <MaterialCommunityIcons 
            name="fire" 
            size={24} 
            color={analytics.streak > 0 ? '#F39C12' : Palette.textLight} 
          />
          <Text style={styles.summaryNumber}>{analytics.streak}</Text>
          <Text style={styles.summaryLabel}>Day Streak</Text>
        </View>

        <View style={[styles.summaryCard, styles.summaryCardSmall]}>
          <MaterialCommunityIcons 
            name="notebook-outline" 
            size={24} 
            color="#4CAF50" 
          />
          <Text style={styles.summaryNumber}>{analytics.totalEntries}</Text>
          <Text style={styles.summaryLabel}>This Month</Text>
        </View>

        <View style={[styles.summaryCard, styles.summaryCardSmall]}>
          <MaterialCommunityIcons 
            name={
              analytics.trend === 'up' ? 'trending-up' : 
              analytics.trend === 'down' ? 'trending-down' : 'minus'
            }
            size={24} 
            color={
              analytics.trend === 'up' ? '#58D68D' : 
              analytics.trend === 'down' ? '#E74C3C' : Palette.textLight
            } 
          />
          <Text style={styles.summaryNumber}>
            {analytics.trend === 'up' ? '+' : analytics.trend === 'down' ? '-' : ''}
            {analytics.trendChange}
          </Text>
          <Text style={styles.summaryLabel}>Weekly Trend</Text>
        </View>
      </View>

      {/* Most Common Mood */}
      {analytics.mostCommonMood && analytics.mostCommonMood.config && (
        <View style={styles.highlightCard}>
          <View style={styles.highlightHeader}>
            <Text style={styles.highlightTitle}>Most Common Mood</Text>
          </View>
          <View style={styles.highlightContent}>
            <View style={[
              styles.moodBadgeLarge,
              { backgroundColor: (analytics.mostCommonMood.config.color || '#9E9E9E') + '20' }
            ]}>
              <MaterialCommunityIcons
                name={analytics.mostCommonMood.config.icon || 'emoticon-outline'}
                size={48}
                color={analytics.mostCommonMood.config.color || '#9E9E9E'}
              />
            </View>
            <Text style={[
              styles.highlightMoodLabel,
              { color: analytics.mostCommonMood.config.color || '#9E9E9E' }
            ]}>
              {analytics.mostCommonMood.config.label || 'Unknown'}
            </Text>
            <Text style={styles.highlightSubtext}>
              {analytics.mostCommonMood.percentage}% of entries this month
            </Text>
          </View>
        </View>
      )}

      {/* Mood Distribution */}
      {analytics.moodDistribution && analytics.moodDistribution.length > 0 && (
        <View style={styles.distributionCard}>
          <Text style={styles.sectionTitle}>Mood Distribution</Text>
          {analytics.moodDistribution.map((item, index) => (
            <View key={`mood-${item.mood}-${index}`} style={styles.distributionRow}>
              <View style={styles.distributionLabel}>
                <MaterialCommunityIcons
                  name={item.config?.icon || 'emoticon-outline'}
                  size={20}
                  color={item.config?.color || Palette.textLight}
                />
                <Text style={styles.distributionMoodText}>
                  {item.config?.label || item.mood}
                </Text>
              </View>
              <View style={styles.distributionBarContainer}>
                <View 
                  style={[
                    styles.distributionBar,
                    { 
                      width: `${Math.max(item.percentage, 2)}%`,
                      backgroundColor: item.config?.color || Palette.textLight
                    }
                  ]} 
                />
              </View>
              <Text style={styles.distributionCount}>{item.count}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Insights */}
      <View style={styles.insightsCard}>
        <Text style={styles.sectionTitle}>Insights</Text>
        
        {analytics.streak >= 7 && (
          <View style={styles.insightItem}>
            <MaterialCommunityIcons 
              name="star" 
              size={20} 
              color="#F39C12" 
            />
            <Text style={styles.insightText}>
              Amazing! You've journaled for {analytics.streak} days in a row!
            </Text>
          </View>
        )}

        {analytics.streak > 0 && analytics.streak < 7 && (
          <View style={styles.insightItem}>
            <MaterialCommunityIcons 
              name="fire" 
              size={20} 
              color="#F39C12" 
            />
            <Text style={styles.insightText}>
              You're on a {analytics.streak} day streak! Keep it going!
            </Text>
          </View>
        )}

        {analytics.trend === 'up' && (
          <View style={styles.insightItem}>
            <MaterialCommunityIcons 
              name="arrow-up-circle" 
              size={20} 
              color="#58D68D" 
            />
            <Text style={styles.insightText}>
              Your mood has been improving this week. Keep it up!
            </Text>
          </View>
        )}

        {analytics.trend === 'down' && (
          <View style={styles.insightItem}>
            <MaterialCommunityIcons 
              name="heart" 
              size={20} 
              color="#E74C3C" 
            />
            <Text style={styles.insightText}>
              It's been a challenging week. Remember, it's okay to not be okay. Consider reaching out to someone you trust.
            </Text>
          </View>
        )}

        {analytics.trend === 'stable' && (
          <View style={styles.insightItem}>
            <MaterialCommunityIcons 
              name="check-circle" 
              size={20} 
              color="#4CAF50" 
            />
            <Text style={styles.insightText}>
              Your mood has been stable this week. Consistency is key!
            </Text>
          </View>
        )}

        {analytics.entriesThisWeek < 3 && (
          <View style={styles.insightItem}>
            <MaterialCommunityIcons 
              name="lightbulb-outline" 
              size={20} 
              color="#F39C12" 
            />
            <Text style={styles.insightText}>
              Try to journal more regularly. Even a few sentences can help process your thoughts.
            </Text>
          </View>
        )}

        {analytics.entriesThisWeek >= 5 && (
          <View style={styles.insightItem}>
            <MaterialCommunityIcons 
              name="thumb-up" 
              size={20} 
              color="#4CAF50" 
            />
            <Text style={styles.insightText}>
              Great job journaling regularly this week! You're building a healthy habit.
            </Text>
          </View>
        )}

        {analytics.averageScore >= 4 && (
          <View style={styles.insightItem}>
            <MaterialCommunityIcons 
              name="emoticon-happy-outline" 
              size={20} 
              color="#58D68D" 
            />
            <Text style={styles.insightText}>
              You've been feeling positive overall! What's been going well for you?
            </Text>
          </View>
        )}

        {analytics.averageScore < 2.5 && (
          <View style={styles.insightItem}>
            <MaterialCommunityIcons 
              name="hand-heart" 
              size={20} 
              color="#9B59B6" 
            />
            <Text style={styles.insightText}>
              Remember to be gentle with yourself. Consider talking to someone if you need support.
            </Text>
          </View>
        )}

        {/* Default insight if no specific conditions met */}
        {analytics.streak === 0 && 
         analytics.trend === 'stable' && 
         analytics.entriesThisWeek >= 3 && 
         analytics.averageScore >= 2.5 && 
         analytics.averageScore < 4 && (
          <View style={styles.insightItem}>
            <MaterialCommunityIcons 
              name="information-outline" 
              size={20} 
              color="#5DADE2" 
            />
            <Text style={styles.insightText}>
              Keep journaling to track your emotional patterns over time.
            </Text>
          </View>
        )}
      </View>

      {/* Tips Card */}
      <View style={styles.tipsCard}>
        <MaterialCommunityIcons 
          name="lightbulb-on-outline" 
          size={24} 
          color="#F39C12" 
        />
        <View style={styles.tipsContent}>
          <Text style={styles.tipsTitle}>Journaling Tips</Text>
          <Text style={styles.tipsText}>
            {'\u2022'} Write at the same time each day to build a habit{'\n'}
            {'\u2022'} Don't worry about perfect grammar{'\n'}
            {'\u2022'} Focus on how you feel, not just what happened{'\n'}
            {'\u2022'} Even 5 minutes of writing can make a difference
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    minHeight: 300,
  },
  emptyText: {
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
    textAlign: 'center',
    marginTop: spacing.md,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: typography.caption.fontSize,
    color: Palette.textLight,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryCard: {
    backgroundColor: Palette.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.low,
  },
  summaryCardSmall: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  summaryNumber: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: Palette.textDark,
    marginTop: spacing.xs,
  },
  summaryLabel: {
    fontSize: typography.small.fontSize,
    color: Palette.textLight,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  highlightCard: {
    backgroundColor: Palette.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.low,
  },
  highlightHeader: {
    marginBottom: spacing.md,
  },
  highlightTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: Palette.textDark,
  },
  highlightContent: {
    alignItems: 'center',
  },
  moodBadgeLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  highlightMoodLabel: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    marginBottom: spacing.xs,
  },
  highlightSubtext: {
    fontSize: typography.caption.fontSize,
    color: Palette.textLight,
  },
  distributionCard: {
    backgroundColor: Palette.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.low,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: Palette.textDark,
    marginBottom: spacing.md,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  distributionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 90,
  },
  distributionMoodText: {
    fontSize: typography.caption.fontSize,
    color: Palette.textDark,
    marginLeft: spacing.xs,
  },
  distributionBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Palette.border,
    borderRadius: 4,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  distributionBar: {
    height: '100%',
    borderRadius: 4,
  },
  distributionCount: {
    fontSize: typography.caption.fontSize,
    color: Palette.textLight,
    width: 24,
    textAlign: 'right',
  },
  insightsCard: {
    backgroundColor: Palette.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.low,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  insightText: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
    marginLeft: spacing.sm,
    lineHeight: 22,
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF9E7',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  tipsContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  tipsTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: Palette.textDark,
    marginBottom: spacing.sm,
  },
  tipsText: {
    fontSize: typography.caption.fontSize,
    color: Palette.textDark,
    lineHeight: 20,
  },
});