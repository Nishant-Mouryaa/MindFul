import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';

const ClassSelectionScreen = () => {
  const route = useRoute();
  const { textbook } = route.params || {};

  // Safe access to textbook properties
  if (!textbook) {
    return (
      <View style={styles.container}>
        <Text>No textbook data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{textbook.title || 'Untitled Textbook'}</Text>
      <Text style={styles.subtitle}>{textbook.subject || 'No subject specified'}</Text>
      
      {textbook.filePath && (
        <Text style={styles.fileInfo}>
          File: {textbook.filePath.split('/').pop()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16
  },
  fileInfo: {
    fontSize: 14,
    color: '#888'
  }
});

export default ClassSelectionScreen;