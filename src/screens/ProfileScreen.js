import React, { useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { 
  Avatar, 
  Button, 
  Card, 
  Title, 
  Paragraph, 
  List, 
  ProgressBar, 
  Switch, 
  Divider 
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

// Mock user data
const mockUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  profilePicture: 'https://randomuser.me/api/portraits/men/41.jpg',
  standard: '10th',
  board: 'CBSE',
  testsCompleted: 5,
  progress: 0.7, // 70% progress
};

const ProfileScreen = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleLogout = () => {
    // Replace with your logout logic
    console.log('User logged out');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header with Gradient Background */}
      <LinearGradient
        colors={['#6200ee', '#3700b3']}
        style={styles.headerBackground}
      >
        <Avatar.Image
          source={{ uri: mockUser.profilePicture }}
          size={100}
          style={styles.avatar}
        />
        <Title style={styles.name}>{mockUser.name}</Title>
        <Paragraph style={styles.email}>{mockUser.email}</Paragraph>
        <Paragraph style={styles.details}>
          {`Standard: ${mockUser.standard}  |  Board: ${mockUser.board}`}
        </Paragraph>
      </LinearGradient>

      {/* Test Performance Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Test Performance</Title>
          <Paragraph>{`Tests Completed: ${mockUser.testsCompleted}`}</Paragraph>
          <ProgressBar 
            progress={mockUser.progress} 
            color="#6200ee" 
            style={styles.progressBar} 
          />
        </Card.Content>
      </Card>

      {/* Profile Actions & Settings */}
      <List.Section>
        <List.Item
          title="Edit Profile"
          left={(props) => <List.Icon {...props} icon="account-edit" />}
          onPress={() => console.log('Edit Profile pressed')}
        />
        <Divider />
        <List.Item
          title="Dark Mode"
          left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => (
            <Switch 
              value={isDarkMode} 
              onValueChange={toggleDarkMode} 
            />
          )}
        />
        <Divider />
        <List.Item
          title="Logout"
          left={(props) => <List.Icon {...props} icon="logout" />}
          onPress={handleLogout}
        />
      </List.Section>

      {/* Optional Edit Profile Button */}
      <Button
        mode="contained"
        onPress={() => console.log('Edit Profile pressed')}
        style={styles.editButton}
      >
        Edit Profile
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f0f4f7',
  },
  headerBackground: {
    alignItems: 'center',
    paddingVertical: 30,
    borderRadius: 10,
    marginBottom: 20,
  },
  avatar: {
    marginBottom: 10,
  },
  name: {
    color: '#fff',
    fontSize: 22,
  },
  email: {
    color: '#fff',
    marginBottom: 5,
  },
  details: {
    color: '#fff',
  },
  card: {
    marginBottom: 20,
    borderRadius: 10,
  },
  progressBar: {
    marginTop: 10,
    height: 8,
    borderRadius: 4,
  },
  editButton: {
    marginTop: 10,
    marginHorizontal: 16,
  },
});

export default ProfileScreen;
