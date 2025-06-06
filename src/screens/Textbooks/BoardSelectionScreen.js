import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { List, Title, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

const BoardSelectionScreen = ({ navigation }) => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Optional: define some descriptive text/icons for each board
  const boardInfo = {
    CBSE: {
      icon: 'book-education',
      tagline: 'Empowering Future Leaders',
    },
    ICSE: {
      icon: 'school-outline',
      tagline: 'Comprehensive Skill-Building',
    },
    'State Board': {
      icon: 'map-marker-school',
      tagline: 'Local Curriculum, Modern Approach',
    },
    IB: {
      icon: 'earth',
      tagline: 'Internationally Recognized Pathway',
    },
  };

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const boardsRef = collection(db, 'textbook');
        const snapshot = await getDocs(boardsRef);

        // Gather all boards from the "board" field (removing duplicates).
        const uniqueBoards = [
          ...new Set(snapshot.docs.map((doc) => doc.data().board)),
        ];
        setBoards(uniqueBoards);
      } catch (error) {
        console.error('Error fetching boards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading available boards...</Text>
      </View>
    );
  }

  const renderBoardItem = ({ item }) => {
    // Fallback icon/tagline if not found in boardInfo
    const boardIcon = boardInfo[item]?.icon || 'school';
    const boardTagline = boardInfo[item]?.tagline || 'Explore Our Resources';

    return (
      <TouchableOpacity
        style={styles.boardTouchable}
        onPress={() => navigation.navigate('StandardSelection', { board: item })}
        activeOpacity={0.9}
      >
        <List.Item
          title={item}
          description={boardTagline}
          titleStyle={styles.boardTitle}
          descriptionStyle={styles.boardDescription}
          left={() => (
            <View style={styles.iconContainer}>
              <Icon name={boardIcon} size={28} color="#fff" />
            </View>
          )}
          right={() => (
            <Icon name="chevron-right" size={24} color="#fff" style={{ alignSelf: 'center' }} />
          )}
          style={styles.boardItem}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screenContainer}>
      {/* 
        Your decorative background is handled via external CSS or 
        the two circles you already have. We'll just assume they are 
        visible behind this container. 
      */}

      {/* Heading / Intro text */}
      <View style={styles.headerContainer}>
        <Title style={styles.headerTitle}>Choose Your Board</Title>
        <Text style={styles.headerSubtitle}>
          We found {boards.length} board(s). Tap any board to explore textbooks and kickstart your learning journey!
        </Text>
      </View>

      {/* Boards list */}
      <FlatList
        data={boards}
        keyExtractor={(item) => item}
        renderItem={renderBoardItem}
        contentContainerStyle={styles.listContentContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    // The background color or decoration is presumably
    // handled by your existing styling (two circles, etc.)
    // If needed, set a fallback color:
    backgroundColor: '#3B2454',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#3B2454',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },

  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 50, // Adjust for top margin or safe area
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },

  listContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  boardTouchable: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  boardItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    marginVertical: 1,
    paddingLeft: 8,
  },
  boardTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  boardDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  iconContainer: {
    height: 50,
    width: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    alignSelf: 'center',
  },
});

export default BoardSelectionScreen;
