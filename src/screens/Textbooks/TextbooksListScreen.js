import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { List, Button } from 'react-native-paper';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

const TextbooksListScreen = ({ navigation, route }) => {
  const { board, standard, subject } = route.params;
  const [textbooks, setTextbooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTextbooks = async () => {
      try {
        const q = query(
          collection(db, 'textbooks'),
          where('board', '==', board),
          where('standard', '==', standard),
          where('subject', '==', subject)
        );
        
        const snapshot = await getDocs(q);
        setTextbooks(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
      } catch (error) {
        console.error("Error fetching textbooks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTextbooks();
  }, [board, standard, subject]);

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={textbooks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <List.Item
            title={item.title}
            description={item.description}
            onPress={() => navigation.navigate('PdfViewer', {
              pdfUrl: item.pdfUrl,
              title: item.title
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

export default TextbooksListScreen;