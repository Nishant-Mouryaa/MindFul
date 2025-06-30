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

const { width: screenWidth } = Dimensions.get('window');

export default function ToolsScreen() {
  const navigation = useNavigation();
  const [activeTool, setActiveTool] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const tools = [
    {
      id: 'Breathing',
      name: 'Breathing Exercises',
      description: 'Calm your mind with guided breathing techniques',
      icon: 'weather-windy',
      color: '#4DB6AC',
      features: ['4-7-8 Technique', 'Visual guidance', 'Session timer'],
    },
    {
      id: 'Grounding',
      name: 'Grounding Techniques',
      description: 'Stay present with sensory grounding exercises',
      icon: 'earth',
      color: '#64B5F6',
      features: ['5-4-3-2-1 Method', 'Interactive prompts', 'Progress tracking'],
    },
    {
      id: 'CBT',
      name: 'CBT Tools',
      description: 'Challenge negative thoughts with cognitive techniques',
      icon: 'brain',
      color: '#7986CB',
      features: ['Thought records', 'Evidence analysis', 'Balanced thinking'],
    },
    {
        id: 'Journal',
        name: 'Journaling',
        description: 'Reflect on your thoughts and feelings',
        icon: 'book-open-page-variant',
        color: '#FFB74D',
        features: ['Daily prompts', 'Mood tracking', 'Secure entries'],
    },
    {
        id: 'Progress',
        name: 'Track Your Progress',
        description: 'See your mental wellness journey over time',
        icon: 'chart-line',
        color: '#BA68C8',
        features: ['Mood charts', 'Tool usage stats', 'Goal tracking'],
    },
    {
        id: 'EmergencyResources',
        name: 'Emergency Resources',
        description: 'Immediate help and support contacts',
        icon: 'lifebuoy',
        color: '#E57373',
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
      style={styles.toolCard}
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
      style={styles.quickCard}
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
              color="#4DB6AC"
              onPress={() => handleToolPress('Breathing')}
            />
            <QuickAccessCard
              title="Ground Yourself"
              description="5-4-3-2-1 technique"
              icon="earth"
              color="#64B5F6"
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
          <View style={styles.tipCard}>
            <MaterialCommunityIcons 
              name="lightbulb-on" 
              size={24} 
              color="#7986CB" 
            />
            <Text style={styles.tipText}>
              Start with breathing exercises when feeling overwhelmed, 
              then move to grounding or CBT tools as needed.
            </Text>
          </View>
          <View style={styles.tipCard}>
            <MaterialCommunityIcons 
              name="clock-outline" 
              size={24} 
              color="#7986CB" 
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  quickAccessContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickContent: {
    flex: 1,
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  quickDescription: {
    fontSize: 12,
    color: '#666',
  },
  toolsContainer: {
    marginBottom: 30,
  },
  toolCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toolName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  toolDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
    lineHeight: 20,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#555',
    marginLeft: 8,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  tipsSection: {
    marginBottom: 20,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tipText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});