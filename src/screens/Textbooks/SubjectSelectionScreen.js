import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { List, Button } from 'react-native-paper';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

const SubjectSelectionScreen = ({ navigation, route }) => {
  const { board, standard } = route.params;
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const q = query(
          collection(db, 'textbooks'),
          where('board', '==', board),
          where('standard', '==', standard)
        );
        
        const snapshot = await getDocs(q);
        const uniqueSubjects = [...new Set(
          snapshot.docs.map(doc => doc.data().subject)
        )];
        
        setSubjects(uniqueSubjects);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [board, standard]);

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={subjects}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <List.Item
            title={item}
            onPress={() => navigation.navigate('TextbooksList', { 
              board,
              standard,
              subject: item 
            })}
            style={styles.listItem}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default SubjectSelectionScreen;