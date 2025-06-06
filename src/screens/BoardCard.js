import React from 'react';
import { TouchableOpacity, StyleSheet, Image, View } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';

/**
 * BoardCard Component
 * A reusable card component to display a textbook board option.
 *
 * Props:
 * - board: Object with properties { name, description, icon }.
 * - onPress: Function to call when the card is pressed.
 */
const BoardCard = ({ board, onPress }) => {
  const { name, description, icon } = board;
  return (
    <TouchableOpacity style={styles.wrapper} onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          {/* Display icon if provided */}
          {icon ? (
            <Image source={{ uri: icon }} style={styles.icon} resizeMode="cover" />
          ) : null}
          <View style={styles.textContainer}>
            <Title style={styles.title}>{name}</Title>
            <Paragraph style={styles.paragraph}>{description}</Paragraph>
          </View>
        </Card.Content>
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
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  paragraph: {
    fontSize: 14,
    color: '#666',
  },
});

export default BoardCard;
 
