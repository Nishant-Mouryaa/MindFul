import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Title, Text, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Subject colors matching the textbook screen
const subjectColors = {
  Mathematics: '#5D53F0', // Purple-ish
  Physics: '#FB5A9D',     // Pink-ish
  Chemistry: '#FF8C42',   // Orange
  Reasoning: '#FFD42D',   // Gold
  Biology: '#E17055',
  Science: '#00B894',
  English: '#FD79A8',
  History: '#FDCB6E',
};

const TestCard = ({ test, onStartTest }) => {
  // Get the appropriate color based on subject or use default
  const bgColor = subjectColors[test.subject] || '#5D53F0';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: bgColor }]}
      onPress={onStartTest}
      activeOpacity={0.9}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardIcon}>
          <Icon name="clock-outline" size={28} color="#fff" />
        </View>
        
        <View style={styles.cardText}>
          <Title style={styles.title}>{test.title}</Title>
          
          <View style={styles.subjectBadge}>
            <Text style={styles.subjectText}>{test.subject}</Text>
          </View>
          
          <Text style={styles.description} numberOfLines={2}>
            {test.description}
          </Text>
          
          <View style={styles.details}>
            <View style={styles.detailItem}>
              <Icon name="format-list-numbered" size={16} color="#fff" />
              <Text style={styles.detailText}>{test.questionCount} questions</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Icon name="timer-outline" size={16} color="#fff" />
              <Text style={styles.detailText}>{test.duration} mins</Text>
            </View>
          </View>
        </View>
        
        <Button 
          mode="contained" 
          onPress={onStartTest}
          style={styles.button}
          labelStyle={styles.buttonLabel}
          color="#fff"
          textColor={bgColor}
        >
          Start
        </Button>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subjectBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 6,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 6,
    marginLeft: 12,
    elevation: 2,
    minWidth: 80,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TestCard;