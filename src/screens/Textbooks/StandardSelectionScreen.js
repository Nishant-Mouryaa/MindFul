import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { List } from 'react-native-paper';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

const StandardSelectionScreen = ({ navigation, route }) => {
  const { board } = route.params;
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStandards = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Query with explicit type matching
        const q = query(
          collection(db, 'textbook'),
          where('board', '==', board),
          where('standard', '>=', 1) // Ensures we only get numeric standards
        );
        
        const snapshot = await getDocs(q);
        console.log(`Found ${snapshot.size} documents for board ${board}`);

        // Process standards with strict number validation
        const standardsData = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          const standard = data.standard;
          
          // Validate standard is a number and within expected range
          if (typeof standard === 'number' && standard >= 1 && standard <= 12) {
            standardsData.push(standard);
          } else {
            console.warn(`Invalid standard value in document ${doc.id}:`, standard);
          }
        });

        // Remove duplicates and sort
        const uniqueStandards = [...new Set(standardsData)].sort((a, b) => a - b);
        
        console.log('Final standards list:', uniqueStandards);
        setStandards(uniqueStandards);

      } catch (error) {
        console.error("Error fetching standards:", error);
        setError("Failed to load standards. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStandards();
  }, [board]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading available grades...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          mode="contained" 
          onPress={() => {
            setError(null);
            setLoading(true);
            fetchStandards();
          }}
        >
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select Grade for {board}</Text>
      
      {standards.length > 0 ? (
        <FlatList
          data={standards}
          keyExtractor={(item) => item.toString()}
          renderItem={({ item }) => (
            <List.Item
              title={`Grade ${item}`}
              left={props => <List.Icon {...props} icon="numeric-${item}-box" />}
              onPress={() => navigation.navigate('TextbookSubjectSelection', { 
                board,
                standard: item 
              })}
              style={styles.listItem}
            />
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text>No grades available for {board} board</Text>
          <Text>Please check back later or contact support</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  listItem: {
    backgroundColor: '#f8f8f8',
    marginVertical: 4,
    borderRadius: 8,
    elevation: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default StandardSelectionScreen;