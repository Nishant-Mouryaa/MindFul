import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet,
  Dimensions,
  Platform,
  TouchableOpacity,
  Animated
} from 'react-native';
import { 
  Title, 
  ActivityIndicator,
  Text
} from 'react-native-paper';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase'; 
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Palette } from '../../theme/colors';
import { useTheme } from 'react-native-paper'; 
const { width } = Dimensions.get('window');

const BoardSelectionScreen = ({ navigation }) => {
  const { colors } = useTheme();
const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const scaleValue = new Animated.Value(1);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'boards'));
        const boardsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          icon: 'school-outline',
          color: '#FFFFFF'
        }));
        setBoards(boardsData);
      } catch (error) {
        console.error("Error fetching boards:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleSelectBoard = (board) => {
    setSelectedId(board.id);
    setTimeout(() => {
      navigation.navigate('StandardSelection', { boardId: board.id });
    }, 300);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading boards...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      {/* Decorative background elements */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <View style={styles.headerContainer}>
        <Icon 
          name="school" 
          size={36} 
          color="#FFFFFF" 
          style={styles.headerIcon} 
        />
        <Title style={styles.header}>Select Your Board</Title>
        <Text style={styles.subHeader}>
          Choose your education board to continue
        </Text>
      </View>

      <View style={styles.contentContainer}>
        {boards.map((board) => (
          <Animated.View
            key={board.id}
            style={[
              styles.selectionCard,
              selectedId === board.id && styles.selectedCard,
              { transform: [{ scale: selectedId === board.id ? scaleValue : 1 }] }
            ]}
          >
            <TouchableOpacity
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={() => handleSelectBoard(board)}
              activeOpacity={0.8}
              style={styles.touchableContent}
            >
              <View style={styles.cardIconContainer}>
                <Icon 
                  name={board.icon} 
                  size={24} 
                  color={selectedId === board.id ? '#5D53F0' : '#FFFFFF'} 
                />
              </View>
              <Text style={[
                styles.cardText,
                selectedId === board.id && styles.selectedCardText
              ]}>
                {board.name}
              </Text>
              <Icon 
                name="chevron-right" 
                size={20} 
                color={selectedId === board.id ? '#5D53F0' : 'rgba(255,255,255,0.7)'} 
              />
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  circle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Palette.primaryLight,
    top: -100,
    left: -100,
  },
  circle2: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: Palette.primaryXLight,
    bottom: -150,
    right: -100,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 15,
  },
  header: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.onBackground,
    marginBottom: 8,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 16,
    color: Palette.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  selectionCard: {
    backgroundColor: Palette.surfaceLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Palette.borderLight,
  },
  selectedCard: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  touchableContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
  },
  selectedCardText: {
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.onBackground,
    fontWeight: '500',
  },
});


export default BoardSelectionScreen;