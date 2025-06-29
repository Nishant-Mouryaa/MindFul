import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function EmergencyResourcesScreen() {
  const emergencyContacts = [
    {
      name: 'National Suicide Prevention Lifeline',
      number: '988',
      description: '24/7 free and confidential support for people in distress',
      icon: 'phone',
      color: '#f72585',
    },
    {
      name: 'Crisis Text Line',
      number: 'Text HOME to 741741',
      description: 'Text with a trained crisis counselor',
      icon: 'message-text',
      color: '#7209b7',
    },
    {
      name: 'Emergency Services',
      number: '911',
      description: 'For immediate life-threatening emergencies',
      icon: 'ambulance',
      color: '#e63946',
    },
    {
      name: 'SAMHSA National Helpline',
      number: '1-800-662-HELP (4357)',
      description: 'Treatment referral and information service',
      icon: 'medical-bag',
      color: '#4895ef',
    },
  ];

  const copingStrategies = [
    {
      title: 'Deep Breathing',
      description: 'Take slow, deep breaths to calm your nervous system',
      icon: 'weather-windy',
      color: '#4cc9f0',
    },
    {
      title: 'Grounding Exercise',
      description: 'Use your 5 senses to stay present in the moment',
      icon: 'earth',
      color: '#4895ef',
    },
    {
      title: 'Call a Friend',
      description: 'Reach out to someone you trust for support',
      icon: 'account-multiple',
      color: '#4361ee',
    },
    {
      title: 'Go for a Walk',
      description: 'Physical activity can help reduce stress and anxiety',
      icon: 'walk',
      color: '#3f37c9',
    },
  ];

  const handleCall = (contact) => {
    let phoneNumber = contact.number;
    if (contact.number === '988') {
      phoneNumber = '988';
    } else if (contact.number === '911') {
      phoneNumber = '911';
    } else if (contact.number.includes('1-800')) {
      phoneNumber = contact.number.replace(/[^0-9]/g, '');
    }

    Alert.alert(
      'Call Emergency Contact',
      `Are you sure you want to call ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            // In a real app, you would use Linking.openURL(`tel:${phoneNumber}`)
            console.log(`Calling ${phoneNumber}`);
          },
        },
      ]
    );
  };

  const handleText = (contact) => {
    if (contact.number.includes('Text')) {
      Alert.alert(
        'Text Crisis Line',
        'Text HOME to 741741 to connect with a crisis counselor',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Learn More',
            onPress: () => {
              console.log('Learn more about Crisis Text Line');
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialCommunityIcons name="alert-circle" size={40} color="#fff" />
            <Text style={styles.title}>Emergency Resources</Text>
            <Text style={styles.subtitle}>
              You're not alone. Help is available 24/7.
            </Text>
          </View>

          {/* Emergency Contacts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Crisis Hotlines</Text>
            <Text style={styles.sectionDescription}>
              These services are free, confidential, and available 24/7
            </Text>
            
            {emergencyContacts.map((contact, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.contactCard, { borderLeftColor: contact.color }]}
                onPress={() => {
                  if (contact.number.includes('Text')) {
                    handleText(contact);
                  } else {
                    handleCall(contact);
                  }
                }}
              >
                <View style={styles.contactIcon}>
                  <MaterialCommunityIcons 
                    name={contact.icon} 
                    size={24} 
                    color={contact.color} 
                  />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactNumber}>{contact.number}</Text>
                  <Text style={styles.contactDescription}>
                    {contact.description}
                  </Text>
                </View>
                <MaterialCommunityIcons 
                  name="chevron-right" 
                  size={24} 
                  color="rgba(255,255,255,0.6)" 
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Coping Strategies */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Coping Strategies</Text>
            <Text style={styles.sectionDescription}>
              Try these techniques to help you feel better right now
            </Text>
            
            <View style={styles.strategiesGrid}>
              {copingStrategies.map((strategy, index) => (
                <View key={index} style={styles.strategyCard}>
                  <View style={[styles.strategyIcon, { backgroundColor: strategy.color }]}>
                    <MaterialCommunityIcons 
                      name={strategy.icon} 
                      size={24} 
                      color="#fff" 
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

          {/* Safety Plan */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Safety Plan</Text>
            <View style={styles.safetyCard}>
              <MaterialCommunityIcons name="shield-check" size={32} color="#fff" />
              <Text style={styles.safetyTitle}>Create a Safety Plan</Text>
              <Text style={styles.safetyDescription}>
                A safety plan helps you identify warning signs and coping strategies 
                when you're feeling overwhelmed or in crisis.
              </Text>
              <TouchableOpacity style={styles.safetyButton}>
                <Text style={styles.safetyButtonText}>Create Safety Plan</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Important Notice */}
          <View style={styles.noticeContainer}>
            <MaterialCommunityIcons name="information" size={24} color="#fff" />
            <Text style={styles.noticeText}>
              If you're having thoughts of harming yourself or others, 
              please call 911 or go to the nearest emergency room immediately.
            </Text>
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
    marginTop: 16,
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
    lineHeight: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  contactNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 16,
  },
  strategiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  strategyCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  strategyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  strategyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  strategyDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 16,
  },
  safetyCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  safetyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  safetyDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  safetyButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  safetyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  noticeContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  noticeText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
}); 