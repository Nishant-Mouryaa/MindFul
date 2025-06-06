import React from 'react';
import { TouchableOpacity, StyleSheet, Image, View, Animated } from 'react-native';
import { Card, Title, Button } from 'react-native-paper';

/**
 * ChapterCard Component
 * Renders a single chapter as a styled card.
 *
 * Props:
 * - chapter: Object containing chapter details (id, name, thumbnail)
 * - board: Object containing board details (used for display)
 * - subject: Object containing subject details
 * - onPress: Callback function when the card is pressed.
 */
const ChapterCard = ({ chapter, board, subject, onPress }) => {
  // Create an animated scale value for touch feedback
  const scaleValue = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        style={styles.wrapper}
        onPress={onPress}
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={`Chapter: ${chapter.name}`}
        accessibilityHint="Tap to start the test for this chapter"
      >
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            {/* Render thumbnail if available, else fallback */}
            <Image
              source={{
                uri: chapter.thumbnail || 'https://via.placeholder.com/50?text=No+Image',
              }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            <View style={styles.textContainer}>
              <Title style={styles.title}>{chapter.name}</Title>
            </View>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="contained"
              onPress={onPress}
              accessibilityLabel={`Start Test for ${chapter.name}`}
            >
              Start Test
            </Button>
          </Card.Actions>
        </Card>
      </TouchableOpacity>
    </Animated.View>
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
});

export default ChapterCard;
 
