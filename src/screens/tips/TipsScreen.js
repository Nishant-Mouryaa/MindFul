import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * TipsScreen Component
 * 
 * This screen provides daily tips and advice for powerlifting, including:
 * - Daily tip of the day
 * - Exercise technique tips
 * - Nutrition advice
 * - Recovery tips
 * - Common mistakes to avoid
 * 
 * Implementation Notes:
 * 1. Categorized tips for different aspects of training
 * 2. Interactive tip cards with detailed information
 * 3. Bookmark functionality for saving favorite tips
 * 4. Maintains consistent design with other screens
 */

export default function TipsScreen() {
  const [bookmarkedTips, setBookmarkedTips] = useState(new Set());

  // Mock data - Replace with API call in production
  const tipsData = {
    dailyTip: {
      title: "Perfect Your Deadlift Form",
      content: "Keep your back straight, chest up, and push through your heels. The bar should move in a straight line close to your body.",
      category: "Technique",
      image: "https://example.com/deadlift.jpg", // Replace with actual image
    },
    categories: [
      {
        id: 1,
        name: "Technique",
        icon: "weight-lifter",
        tips: [
          {
            id: 1,
            title: "Bench Press Grip Width",
            content: "Your grip width should be slightly wider than shoulder-width for optimal power and stability.",
          },
          {
            id: 2,
            title: "Squat Depth",
            content: "Aim to break parallel with your thighs to ensure proper muscle engagement and joint safety.",
          },
        ],
      },
      {
        id: 2,
        name: "Nutrition",
        icon: "food-apple",
        tips: [
          {
            id: 3,
            title: "Pre-Workout Nutrition",
            content: "Consume a mix of protein and carbs 1-2 hours before training for optimal performance.",
          },
          {
            id: 4,
            title: "Post-Workout Recovery",
            content: "Eat within 30 minutes after training to maximize muscle recovery and growth.",
          },
        ],
      },
      {
        id: 3,
        name: "Recovery",
        icon: "bed",
        tips: [
          {
            id: 5,
            title: "Sleep Quality",
            content: "Aim for 7-9 hours of quality sleep to optimize recovery and performance.",
          },
          {
            id: 6,
            title: "Active Recovery",
            content: "Light cardio and stretching on rest days can improve recovery and reduce soreness.",
          },
        ],
      },
    ],
  };

  const toggleBookmark = (tipId) => {
    setBookmarkedTips((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tipId)) {
        newSet.delete(tipId);
      } else {
        newSet.add(tipId);
      }
      return newSet;
    });
  };

  const renderTipCard = (tip, category) => (
    <View key={tip.id} style={styles.tipCard}>
      <View style={styles.tipHeader}>
        <View style={styles.tipCategory}>
          <MaterialCommunityIcons
            name={category.icon}
            size={20}
            color="#e63946"
          />
          <Text style={styles.tipCategoryText}>{category.name}</Text>
        </View>
        <TouchableOpacity
          onPress={() => toggleBookmark(tip.id)}
          style={styles.bookmarkButton}
        >
          <MaterialCommunityIcons
            name={bookmarkedTips.has(tip.id) ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={bookmarkedTips.has(tip.id) ? '#e63946' : '#ccc'}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.tipTitle}>{tip.title}</Text>
      <Text style={styles.tipContent}>{tip.content}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Tips</Text>
        <Text style={styles.subtitle}>Expert advice for your training</Text>
      </View>

      <View style={styles.dailyTipContainer}>
        <Text style={styles.dailyTipLabel}>Tip of the Day</Text>
        <View style={styles.dailyTipCard}>
          <View style={styles.dailyTipHeader}>
            <View style={styles.tipCategory}>
              <MaterialCommunityIcons
                name="star"
                size={24}
                color="#e63946"
              />
              <Text style={styles.tipCategoryText}>{tipsData.dailyTip.category}</Text>
            </View>
            <TouchableOpacity
              onPress={() => toggleBookmark('daily')}
              style={styles.bookmarkButton}
            >
              <MaterialCommunityIcons
                name={bookmarkedTips.has('daily') ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={bookmarkedTips.has('daily') ? '#e63946' : '#ccc'}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.dailyTipTitle}>{tipsData.dailyTip.title}</Text>
          <Text style={styles.dailyTipContent}>{tipsData.dailyTip.content}</Text>
        </View>
      </View>

      {tipsData.categories.map((category) => (
        <View key={category.id} style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <MaterialCommunityIcons
              name={category.icon}
              size={24}
              color="#e63946"
            />
            <Text style={styles.categoryTitle}>{category.name}</Text>
          </View>
          {category.tips.map((tip) => renderTipCard(tip, category))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101010',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
  },
  dailyTipContainer: {
    padding: 16,
  },
  dailyTipLabel: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 12,
  },
  dailyTipCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  dailyTipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dailyTipTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  dailyTipContent: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
  },
  categorySection: {
    padding: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  categoryTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  tipCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipCategoryText: {
    color: '#e63946',
    fontSize: 14,
    fontWeight: '500',
  },
  bookmarkButton: {
    padding: 4,
  },
  tipTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  tipContent: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
  },
}); 