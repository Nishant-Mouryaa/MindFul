import React from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  Dimensions,
  Platform,
  Animated,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Title, Text } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');
const classes = ['5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

const TestClassSelectionScreen = () => {
  const navigation = useNavigation();
  const { board } = useRoute().params;
  const [selectedClass, setSelectedClass] = React.useState(null);
  const scaleValue = new Animated.Value(1);

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

  const handleClassSelect = (classLevel) => {
    setSelectedClass(classLevel);
    setTimeout(() => {
      navigation.navigate('TestSubjectsScreen', { 
        board, 
        classLevel 
      });
    }, 300);
  };

  const renderItem = ({ item }) => (
    <Animated.View
      style={[
        styles.classCard,
        selectedClass === item && styles.selectedCard,
        { transform: [{ scale: selectedClass === item ? scaleValue : 1 }] }
      ]}
    >
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => handleClassSelect(item)}
        activeOpacity={0.8}
        style={styles.touchableContent}
      >
        <View style={styles.iconContainer}>
          <Icon 
            name="account-school" 
            size={24} 
            color={selectedClass === item ? '#5D53F0' : '#FFFFFF'} 
          />
        </View>
        <Text style={[
          styles.classText,
          selectedClass === item && styles.selectedText
        ]}>
          Class {item}
        </Text>
        <Icon 
          name="chevron-right" 
          size={20} 
          color={selectedClass === item ? '#5D53F0' : 'rgba(255,255,255,0.7)'} 
        />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Decorative background elements */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Icon 
            name="account-school-outline" 
            size={36} 
            color="#FFFFFF" 
            style={styles.headerIcon} 
          />
          <Title style={styles.header}>Select Your Class</Title>
          <Text style={styles.subHeader}>
            Choose your class level to find relevant tests
          </Text>
        </View>

        <FlatList
          data={classes}
          keyExtractor={(item) => item}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#3B2454',
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
  },
  circle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(89, 52, 120, 0.3)',
    top: -100,
    left: -100,
  },
  circle2: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(89, 52, 120, 0.2)',
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
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  classCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectedCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#5D53F0',
    shadowColor: '#5D53F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  touchableContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  classText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedText: {
    color: '#5D53F0',
  },
});

export default TestClassSelectionScreen;