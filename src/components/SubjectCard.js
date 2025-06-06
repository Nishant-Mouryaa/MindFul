import React from 'react';
import { TouchableOpacity, StyleSheet, Image, View } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';

/**
 * SubjectCard Component
 * Renders a card for a single subject.
 *
 * Props:
 * - subject: Object with subject details (id, name, thumbnail, etc.)
 * - board: Object with board details (used for display)
 * - onPress: Function to be called when the card is pressed.
 */
const SubjectCard = ({ subject, board, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.wrapper} 
      onPress={onPress} 
      activeOpacity={0.8}
      accessibilityLabel={`Subject: ${subject.name}`}
      accessibilityHint={`Tap to view chapters for ${subject.name}`}
    >
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          {/* Optional thumbnail or fallback */}
          <Image 
            source={{ uri: subject.thumbnail || 'https://via.placeholder.com/50?text=No+Image' }} 
            style={styles.thumbnail} 
            resizeMode="cover" 
          />
          <View style={styles.textContainer}>
            <Title style={styles.title}>{subject.name}</Title>
            <Paragraph style={styles.paragraph}>{`Board: ${board.name}`}</Paragraph>
          </View>
        </Card.Content>
        <Card.Actions>
          <Button 
            mode="contained" 
            onPress={onPress}
            accessibilityLabel={`View Chapters for ${subject.name}`}
          >
            View Chapters
          </Button>
        </Card.Actions>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 10,
  },
  card: {
    borderRadius: 10,
    elevation: 4,
    backgroundColor: '#fff',
    // Optional: add gradient background in the card content if needed (requires extra packages)
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  paragraph: {
    fontSize: 14,
    color: '#666',
  },
});

export default SubjectCard;
