import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, Avatar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';

// Mapping test categories to icons
const categoryIconMapping = {
  Math: 'calculator',
  Science: 'atom',
  English: 'book-open-page-variant',
  History: 'history',
};

const TestDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { test } = route.params; // Retrieve test details from navigation params

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card} elevation={3}>
        <Card.Title
          title={test.title}
          subtitle={test.description}
          left={(props) => (
            <Avatar.Icon
              {...props}
              icon={categoryIconMapping[test.category] || 'book'}
              style={styles.avatar}
            />
          )}
        />
        <Card.Content>
          <Title>About the Test</Title>
          <Paragraph>
            This test consists of a series of questions covering {test.title}. Prepare well and good luck!
          </Paragraph>
          <Paragraph>Category: {test.category}</Paragraph>
          {/* You can add more details or instructions here */}
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('TestScreen', { test })}
          >
            Begin Test
          </Button>
        </Card.Actions>
      </Card>
      <Button mode="text" onPress={() => navigation.goBack()} style={styles.backButton}>
        Back
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f4f7',
  },
  card: {
    marginBottom: 20,
    borderRadius: 10,
  },
  avatar: {
    backgroundColor: '#6200ee',
  },
  cardActions: {
    justifyContent: 'flex-end',
    padding: 10,
  },
  backButton: {
    alignSelf: 'center',
  },
});

export default TestDetailScreen;
 
