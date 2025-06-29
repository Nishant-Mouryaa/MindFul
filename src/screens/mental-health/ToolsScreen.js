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
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

export default function ToolsScreen() {
  const [activeTool, setActiveTool] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const tools = [
    {
      id: 'breathing',
      name: 'Breathing Exercises',
      description: 'Calm your mind with guided breathing techniques',
      icon: 'weather-windy',
      color: '#4cc9f0',
      gradient: ['#4cc9f0', '#4895ef'],
      features: ['4-7-8 Technique', 'Visual guidance', 'Session timer'],
    },
    {
      id: 'grounding',
      name: 'Grounding Techniques',
      description: 'Stay present with sensory grounding exercises',
      icon: 'earth',
      color: '#4895ef',
      gradient: ['#4895ef', '#4361ee'],
      features: ['5-4-3-2-1 Method', 'Interactive prompts', 'Progress tracking'],
    },
    {
      id: 'cbt',
      name: 'CBT Tools',
      description: 'Challenge negative thoughts with cognitive techniques',
      icon: 'brain',
      color: '#4361ee',
      gradient: ['#4361ee', '#3f37c9'],
      features: ['Thought records', 'Evidence analysis', 'Balanced thinking'],
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
    // Navigate to specific tool screen
    // navigation.navigate(toolId.charAt(0).toUpperCase() + toolId.slice(1));
  };

  const ToolCard = ({ tool }) => (
    <TouchableOpacity
      style={styles.toolCard}
      onPress={() => handleToolPress(tool.id)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={tool.gradient}
        style={styles.toolGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.toolHeader}>
          <MaterialCommunityIcons name={tool.icon} size={32} color="#fff" />
          <Text style={styles.toolName}>{tool.name}</Text>
        </View>
        <Text style={styles.toolDescription}>{tool.description}</Text>
        <View style={styles.featuresContainer}>
          {tool.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#fff" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
        <View style={styles.startButton}>
          <Text style={styles.startButtonText}>Start</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const QuickAccessCard = ({ title, description, icon, color, onPress }) => (
    <TouchableOpacity style={styles.quickCard} onPress={onPress}>
      <View style={[styles.quickIcon, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={24} color="#fff" />
      </View>
      <View style={styles.quickContent}>
        <Text style={styles.quickTitle}>{title}</Text>
        <Text style={styles.quickDescription}>{description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
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
                description="2-minute breathing exercise"
                icon="weather-windy"
                color="#4cc9f0"
                onPress={() => handleToolPress('breathing')}
              />
              <QuickAccessCard
                title="Ground Yourself"
                description="5-4-3-2-1 technique"
                icon="earth"
                color="#4895ef"
                onPress={() => handleToolPress('grounding')}
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
              <MaterialCommunityIcons name="lightbulb" size={24} color="#fff" />
              <Text style={styles.tipText}>
                Start with breathing exercises when feeling overwhelmed, 
                then move to grounding or CBT tools as needed.
              </Text>
            </View>
            <View style={styles.tipCard}>
              <MaterialCommunityIcons name="clock" size={24} color="#fff" />
              <Text style={styles.tipText}>
                Practice these tools regularly, even when you're feeling good, 
                to build resilience for difficult times.
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
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
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  quickAccessContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
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
    color: '#fff',
    marginBottom: 4,
  },
  quickDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  toolsContainer: {
    marginBottom: 30,
  },
  toolCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  toolGradient: {
    padding: 20,
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  toolName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  toolDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
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
    color: '#fff',
    marginLeft: 8,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  tipsSection: {
    marginBottom: 20,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  tipText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
}); 