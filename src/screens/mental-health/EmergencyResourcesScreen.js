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

export default function EmergencyResourcesScreen() {
  const emergencyContacts = [
    {
      name: 'National Suicide Prevention Lifeline',
      number: '988',
      type: 'phone',
      description: '24/7 free, confidential support for people in distress.',
      icon: 'phone-hangup',
      color: '#E57373',
    },
    {
      name: 'Crisis Text Line',
      number: '741741',
      text: 'HOME',
      type: 'text',
      description: 'Text with a trained crisis counselor for free, 24/7.',
      icon: 'message-text',
      color: '#7986CB',
    },
    {
      name: 'The Trevor Project (for LGBTQ Youth)',
      number: '1-866-488-7386',
      type: 'phone',
      description: 'Crisis intervention and suicide prevention for LGBTQ youth.',
      icon: 'account-heart',
      color: '#BA68C8',
    },
    {
        name: 'Emergency Services',
        number: '911',
        type: 'phone',
        description: 'For immediate, life-threatening emergencies.',
        icon: 'ambulance',
        color: '#D32F2F',
    },
  ];

  const copingStrategies = [
    { title: 'Breathe', description: 'Take 5 slow, deep breaths.', icon: 'weather-windy', color: '#4DB6AC' },
    { title: 'Ground Yourself', description: 'Use the 5-4-3-2-1 method.', icon: 'earth', color: '#64B5F6' },
    { title: 'Mindful Walk', description: 'Walk and notice your surroundings.', icon: 'walk', color: '#FFB74D' },
    { title: 'Reach Out', description: 'Call or text a trusted friend.', icon: 'account-multiple', color: '#81C784' },
  ];

  const handlePress = (contact) => {
    let action = 'Call';
    let url = `tel:${contact.number}`;
    
    if (contact.type === 'text') {
        action = 'Text';
        url = `sms:${contact.number}${Platform.OS === "ios" ? "&" : "?"}body=${encodeURIComponent(contact.text)}`;
    }

    Alert.alert(
      `${action} ${contact.name}?`,
      `You will be connected to ${contact.number}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          onPress: () => Linking.openURL(url).catch(err => Alert.alert("Failed to open.", err.toString())),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="lifebuoy" size={40} color="#E57373" />
          <Text style={styles.title}>Emergency Support</Text>
          <Text style={styles.subtitle}>
            If you're in crisis, you're not alone. Immediate help is available.
          </Text>
        </View>
        
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Crisis Hotlines</Text>
            {emergencyContacts.map((contact, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.contactItem, index === emergencyContacts.length-1 && {borderBottomWidth: 0}]}
                onPress={() => handlePress(contact)}
              >
                <View style={[styles.contactIconContainer, {backgroundColor: contact.color + '20'}]}>
                  <MaterialCommunityIcons name={contact.icon} size={28} color={contact.color} />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactDescription}>{contact.description}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
              </TouchableOpacity>
            ))}
        </View>

        <View style={styles.card}>
            <Text style={styles.cardTitle}>Quick Coping Strategies</Text>
            <View style={styles.strategiesGrid}>
              {copingStrategies.map((strategy, index) => (
                <View key={index} style={styles.strategyCard}>
                  <View style={[styles.strategyIconContainer, {backgroundColor: strategy.color + '20'}]}>
                    <MaterialCommunityIcons name={strategy.icon} size={30} color={strategy.color} />
                  </View>
                  <Text style={styles.strategyTitle}>{strategy.title}</Text>
                  <Text style={styles.strategyDescription}>{strategy.description}</Text>
                </View>
              ))}
            </View>
        </View>

        <View style={styles.noticeContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#D32F2F" />
          <Text style={styles.noticeText}>
            If you are in immediate danger or having thoughts of harming yourself or others, 
            please call 911 or go to the nearest emergency room.
          </Text>
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
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    paddingTop: 10,
  },
  contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
  },
  contactIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  strategiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  strategyCard: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
  },
  strategyIconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
  },
  strategyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  strategyDescription: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 15,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    color: '#C62828',
    marginLeft: 12,
    lineHeight: 20,
  },
}); 