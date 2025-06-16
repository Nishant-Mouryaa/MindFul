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
 * AcademyScreen Component
 * 
 * This screen provides educational content for beginners, including:
 * - Course modules
 * - Video tutorials
 * - Written guides
 * - Progress tracking
 * - Interactive quizzes
 * 
 * Implementation Notes:
 * 1. Structured learning path for beginners
 * 2. Interactive course content
 * 3. Progress tracking for completed lessons
 * 4. Maintains consistent design with other screens
 */

export default function AcademyScreen() {
  const [completedLessons, setCompletedLessons] = useState(new Set());

  // Mock data - Replace with API call in production
  const academyData = {
    modules: [
      {
        id: 1,
        title: "Powerlifting Fundamentals",
        description: "Learn the basics of powerlifting and proper form",
        icon: "school",
        lessons: [
          {
            id: 1,
            title: "Introduction to Powerlifting",
            duration: "10 min",
            type: "video",
            completed: false,
          },
          {
            id: 2,
            title: "Basic Equipment Guide",
            duration: "15 min",
            type: "article",
            completed: false,
          },
          {
            id: 3,
            title: "Safety First",
            duration: "20 min",
            type: "video",
            completed: false,
          },
        ],
      },
      {
        id: 2,
        title: "The Big Three",
        description: "Master the three main powerlifting movements",
        icon: "weight-lifter",
        lessons: [
          {
            id: 4,
            title: "Squat Basics",
            duration: "25 min",
            type: "video",
            completed: false,
          },
          {
            id: 5,
            title: "Bench Press Fundamentals",
            duration: "20 min",
            type: "video",
            completed: false,
          },
          {
            id: 6,
            title: "Deadlift Technique",
            duration: "30 min",
            type: "video",
            completed: false,
          },
        ],
      },
      {
        id: 3,
        title: "Programming Basics",
        description: "Learn how to structure your training",
        icon: "calendar",
        lessons: [
          {
            id: 7,
            title: "Training Frequency",
            duration: "15 min",
            type: "article",
            completed: false,
          },
          {
            id: 8,
            title: "Progressive Overload",
            duration: "20 min",
            type: "article",
            completed: false,
          },
          {
            id: 9,
            title: "Rest and Recovery",
            duration: "15 min",
            type: "article",
            completed: false,
          },
        ],
      },
    ],
  };

  const toggleLessonComplete = (lessonId) => {
    setCompletedLessons((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      return newSet;
    });
  };

  const renderLesson = (lesson) => (
    <TouchableOpacity
      key={lesson.id}
      style={[
        styles.lessonCard,
        completedLessons.has(lesson.id) && styles.completedLesson,
      ]}
      onPress={() => toggleLessonComplete(lesson.id)}
    >
      <View style={styles.lessonHeader}>
        <MaterialCommunityIcons
          name={lesson.type === 'video' ? 'play-circle' : 'book-open-page-variant'}
          size={24}
          color="#e63946"
        />
        <View style={styles.lessonInfo}>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <Text style={styles.lessonDuration}>{lesson.duration}</Text>
        </View>
        <MaterialCommunityIcons
          name={completedLessons.has(lesson.id) ? 'check-circle' : 'circle-outline'}
          size={24}
          color={completedLessons.has(lesson.id) ? '#4CAF50' : '#ccc'}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Beginner Academy</Text>
        <Text style={styles.subtitle}>Start your powerlifting journey</Text>
      </View>

      {academyData.modules.map((module) => (
        <View key={module.id} style={styles.moduleSection}>
          <View style={styles.moduleHeader}>
            <MaterialCommunityIcons
              name={module.icon}
              size={32}
              color="#e63946"
            />
            <View style={styles.moduleInfo}>
              <Text style={styles.moduleTitle}>{module.title}</Text>
              <Text style={styles.moduleDescription}>
                {module.description}
              </Text>
            </View>
          </View>

          <View style={styles.lessonsContainer}>
            {module.lessons.map(renderLesson)}
          </View>
        </View>
      ))}

      <View style={styles.progressSection}>
        <Text style={styles.progressTitle}>Your Progress</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(completedLessons.size / 9) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {completedLessons.size} of 9 lessons completed
        </Text>
      </View>
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
  moduleSection: {
    padding: 16,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  moduleDescription: {
    fontSize: 14,
    color: '#ccc',
  },
  lessonsContainer: {
    gap: 12,
  },
  lessonCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  completedLesson: {
    opacity: 0.7,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    marginBottom: 4,
  },
  lessonDuration: {
    fontSize: 14,
    color: '#ccc',
  },
  progressSection: {
    padding: 16,
    marginTop: 16,
  },
  progressTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#252525',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e63946',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
}); 