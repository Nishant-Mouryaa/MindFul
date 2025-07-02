
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Import your theme constants
import {
  Palette,
  spacing,
  typography,
  shadows,
  borderRadius,
} from '../../theme/colors'; // Adjust path as needed

export default function EmergencyResourcesScreen() {
  const emergencyContacts = [
    {
      name: 'National Suicide Prevention Lifeline',
      number: '988',
      type: 'phone',
      description: '24/7 free, confidential support for people in distress.',
      icon: 'phone-hangup',
      color: Palette.secondaryRed, // or keep "#E57373" if you prefer
    },
    {
      name: 'Crisis Text Line',
      number: '741741',
      text: 'HOME',
      type: 'text',
      description: 'Text with a trained crisis counselor for free, 24/7.',
      icon: 'message-text',
      color: Palette.secondaryPurple, // or keep "#7986CB" if you prefer
    },
    {
      name: 'The Trevor Project (for LGBTQ Youth)',
      number: '1-866-488-7386',
      type: 'phone',
      description: 'Crisis intervention and suicide prevention for LGBTQ youth.',
      icon: 'account-heart',
      color: Palette.secondaryPink, // or keep "#BA68C8" if you prefer
    },
    {
      name: 'Emergency Services',
      number: '911',
      type: 'phone',
      description: 'For immediate, life-threatening emergencies.',
      icon: 'ambulance',
      color: '#D32F2F', // A custom color or update to your palette
    },
  ];

  const copingStrategies = [
    {
      title: 'Breathe',
      description: 'Take 5 slow, deep breaths.',
      icon: 'weather-windy',
      color: Palette.primary, // or keep "#4DB6AC"
    },
    {
      title: 'Ground Yourself',
      description: 'Use the 5-4-3-2-1 method.',
      icon: 'earth',
      color: Palette.secondaryBlue, // or keep "#64B5F6"
    },
    {
      title: 'Mindful Walk',
      description: 'Walk and notice your surroundings.',
      icon: 'walk',
      color: Palette.secondaryOrange, // or keep "#FFB74D"
    },
    {
      title: 'Reach Out',
      description: 'Call or text a trusted friend.',
      icon: 'account-multiple',
      color: '#81C784', // or swap with Palette if you have a matching color
    },
  ];

  const handlePress = (contact) => {
    let action = 'Call';
    let url = `tel:${contact.number}`;

    if (contact.type === 'text') {
      action = 'Text';
      url = `sms:${contact.number}${
        Platform.OS === 'ios' ? '&' : '?'
      }body=${encodeURIComponent(contact.text)}`;
    }

    Alert.alert(
      `${action} ${contact.name}?`,
      `You will be connected to ${contact.number}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          onPress: () =>
            Linking.openURL(url).catch((err) =>
              Alert.alert('Failed to open.', err.toString())
            ),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="lifebuoy"
            size={40}
            color={Palette.secondaryRed}
            // or keep "#E57373" if you prefer
          />
          <Text style={styles.title}>Emergency Support</Text>
          <Text style={styles.subtitle}>
            If you're in crisis, you're not alone. Immediate help is available.
          </Text>
        </View>

        <View style={[styles.card, shadows.low]}>
          <Text style={styles.cardTitle}>Crisis Hotlines</Text>
          {emergencyContacts.map((contact, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.contactItem,
                index === emergencyContacts.length - 1 && { borderBottomWidth: 0 },
              ]}
              onPress={() => handlePress(contact)}
            >
              <View
                style={[
                  styles.contactIconContainer,
                  { backgroundColor: contact.color + '20' },
                ]}
              >
                <MaterialCommunityIcons
                  name={contact.icon}
                  size={28}
                  color={contact.color}
                />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactDescription}>
                  {contact.description}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={Palette.textLight}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.card, shadows.low]}>
          <Text style={styles.cardTitle}>Quick Coping Strategies</Text>
          <View style={styles.strategiesGrid}>
            {copingStrategies.map((strategy, index) => (
              <View key={index} style={styles.strategyCard}>
                <View
                  style={[
                    styles.strategyIconContainer,
                    { backgroundColor: strategy.color + '20' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={strategy.icon}
                    size={30}
                    color={strategy.color}
                  />
                </View>
                <Text style={styles.strategyTitle}>{strategy.title}</Text>
                <Text style={styles.strategyDescription}>
                  {strategy.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.noticeContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={24}
            color="#D32F2F" // or a palette color if you prefer
          />
          <Text style={styles.noticeText}>
            If you are in immediate danger or having thoughts of harming yourself
            or others, please call 911 or go to the nearest emergency room.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Updated styles with theme references
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: Palette.textDark,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: Palette.textLight,
    textAlign: 'center',
    lineHeight: typography.body.lineHeight, // or keep "22" if you prefer
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: Palette.card,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    // Example of using shadows from theme:
    // ...shadows.low, // or shadows.medium, etc.
    borderWidth: 0, // remove if you prefer no border
  },
  cardTitle: {
    ...typography.h2,
    color: Palette.textDark,
    marginBottom: spacing.sm,
    paddingTop: spacing.sm,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  contactIconContainer: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    ...typography.body,
    fontWeight: 'bold',
    color: Palette.textDark,
    marginBottom: spacing.xs,
  },
  contactDescription: {
    ...typography.small,
    color: Palette.textMedium,
    lineHeight: 18,
  },
  strategiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  strategyCard: {
    width: '48%',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  strategyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  strategyTitle: {
    ...typography.body,
    fontWeight: 'bold',
    color: Palette.textDark,
    marginBottom: spacing.xs,
  },
  strategyDescription: {
    ...typography.small,
    color: Palette.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFEBEE', // or a theme-based color if desired
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  noticeText: {
    ...typography.caption,
    color: '#C62828', // or Palette.secondaryRed if it matches your design
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
});
 