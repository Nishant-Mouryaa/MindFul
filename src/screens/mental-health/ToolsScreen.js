
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
import { useNavigation } from '@react-navigation/native';

import {
  Palette,
  spacing,
  typography,
  shadows,
  borderRadius,
} from '../../theme/colors';

const { width: screenWidth } = Dimensions.get('window');

export default function ToolsScreen() {
  const navigation = useNavigation();
  const [activeTool, setActiveTool] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Updated to reference colors from the theme
  const tools = [
    {
      id: 'Breathing',
      name: 'Breathing Exercises',
      description: 'Calm your mind with guided breathing techniques',
      icon: 'weather-windy',
      color: Palette.primary,
      features: ['4-7-8 Technique', 'Visual guidance', 'Session timer'],
    },
    {
      id: 'Grounding',
      name: 'Grounding Techniques',
      description: 'Stay present with sensory grounding exercises',
      icon: 'earth',
      color: Palette.secondaryBlue,
      features: ['5-4-3-2-1 Method', 'Interactive prompts', 'Progress tracking'],
    },
    {
      id: 'CBT',
      name: 'CBT Tools',
      description: 'Challenge negative thoughts with cognitive techniques',
      icon: 'brain',
      color: Palette.secondaryPurple,
      features: ['Thought records', 'Evidence analysis', 'Balanced thinking'],
    },
    {
      id: 'Journal',
      name: 'Journaling',
      description: 'Reflect on your thoughts and feelings',
      icon: 'book-open-page-variant',
      color: Palette.secondaryOrange,
      features: ['Daily prompts', 'Mood tracking', 'Secure entries'],
    },
    {
      id: 'Progress',
      name: 'Track Your Progress',
      description: 'See your mental wellness journey over time',
      icon: 'chart-line',
      color: Palette.secondaryPink,
      features: ['Mood charts', 'Tool usage stats', 'Goal tracking'],
    },
    {
      id: 'EmergencyResources',
      name: 'Emergency Resources',
      description: 'Immediate help and support contacts',
      icon: 'lifebuoy',
      color: Palette.secondaryRed,
      features: ['Crisis hotlines', 'Local support centers', 'Safety plans'],
    },
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleToolPress = (toolId) => {
    setActiveTool(toolId);
    navigation.navigate(toolId);
  };

  const ToolCard = ({ tool }) => (
    <TouchableOpacity
      style={[styles.toolCard, shadows.medium]}
      onPress={() => handleToolPress(tool.id)}
      activeOpacity={0.8}
    >
      <View style={styles.toolHeader}>
        <View style={[styles.toolIcon, { backgroundColor: tool.color + '20' }]}>
          <MaterialCommunityIcons
            name={tool.icon}
            size={28}
            color={tool.color}
          />
        </View>
        <Text style={styles.toolName}>{tool.name}</Text>
      </View>
      <Text style={styles.toolDescription}>{tool.description}</Text>
      <View style={styles.featuresContainer}>
        {tool.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <MaterialCommunityIcons
              name="check-circle"
              size={16}
              color={tool.color}
            />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.startButton, { borderColor: tool.color }]}>
        <Text style={[styles.startButtonText, { color: tool.color }]}>Start</Text>
        <MaterialCommunityIcons
          name="arrow-right"
          size={20}
          color={tool.color}
        />
      </View>
    </TouchableOpacity>
  );

  const QuickAccessCard = ({ title, description, icon, color, onPress }) => (
    <TouchableOpacity
      style={[styles.quickCard, shadows.low]}
      onPress={onPress}
    >
      <View style={[styles.quickIcon, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <View style={styles.quickContent}>
        <Text style={styles.quickTitle}>{title}</Text>
        <Text style={styles.quickDescription}>{description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mental Health Tools</Text>
          <Text style={styles.subtitle}>
            Choose a tool to help you feel better right now
          </Text>
        </View>

        {/* Quick Access Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickAccessContainer}>
            <QuickAccessCard
              title="Deep Breathing"
              description="2-minute exercise"
              icon="weather-windy"
              color={Palette.primary}
              onPress={() => handleToolPress('Breathing')}
            />
            <QuickAccessCard
              title="Ground Yourself"
              description="5-4-3-2-1 technique"
              icon="earth"
              color={Palette.secondaryBlue}
              onPress={() => handleToolPress('Grounding')}
            />
          </View>
        </View>

        {/* Main Tools */}
        <Animated.View style={[styles.toolsContainer, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>All Tools</Text>
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </Animated.View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Tips for Using Tools</Text>
          <View style={[styles.tipCard, shadows.low]}>
            <MaterialCommunityIcons
              name="lightbulb-on"
              size={24}
              color={Palette.secondaryPurple}
            />
            <Text style={styles.tipText}>
              Start with breathing exercises when feeling overwhelmed,
              then move to grounding or CBT tools as needed.
            </Text>
          </View>
          <View style={[styles.tipCard, shadows.low]}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={24}
              color={Palette.secondaryPurple}
            />
            <Text style={styles.tipText}>
              Practice these tools regularly, even when you're feeling good,
              to build resilience for difficult times.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Updated styles using theme constants
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: Palette.textDark,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: Palette.textLight,
    textAlign: 'center',
    lineHeight: typography.body.lineHeight, // or keep as 22 if preferred
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h2,
    color: Palette.textDark,
    marginBottom: spacing.md,
  },
  quickAccessContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickCard: {
    flexDirection: 'row',
    backgroundColor: Palette.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    width: '48%',
    alignItems: 'center',
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  quickContent: {
    flex: 1,
  },
  quickTitle: {
    ...typography.caption,
    fontWeight: '600',
    color: Palette.textDark,
    marginBottom: spacing.xs,
  },
  quickDescription: {
    ...typography.small,
    color: Palette.textLight,
  },
  toolsContainer: {
    marginBottom: spacing.xl,
  },
  toolCard: {
    backgroundColor: Palette.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  toolName: {
    ...typography.h3,
    fontWeight: 'bold',
    color: Palette.textDark,
  },
  toolDescription: {
    ...typography.caption,
    color: Palette.textMedium,
    marginBottom: spacing.md,
  },
  featuresContainer: {
    marginBottom: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  featureText: {
    ...typography.small,
    color: Palette.textMedium,
    marginLeft: spacing.xs,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  startButtonText: {
    ...typography.body,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  tipsSection: {
    marginBottom: spacing.lg,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: Palette.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  tipText: {
    ...typography.caption,
    color: Palette.textMedium,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: typography.caption.lineHeight, // or keep as 20 if you prefer
  },
});
