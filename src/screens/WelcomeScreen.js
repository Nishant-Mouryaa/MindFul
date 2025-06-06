import React, { useRef, useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  ActivityIndicator 
} from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  useTheme, 
  Avatar 
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const WelcomeScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [user, setUser] = useState(null);    // State to store user data
  const [loading, setLoading] = useState(true);

  // For button press scaling
  const scaleValues = {
    textbooks: useRef(new Animated.Value(1)).current,
    tests: useRef(new Animated.Value(1)).current,
  };

  // -----------------------------
  // FETCH USER DATA EXAMPLE
  // -----------------------------
  useEffect(() => {
    (async () => {
      try {
        // Simulate a network/API call
        // In a real app, replace with your service call, e.g.:
        // const response = await fetch('https://api.example.com/user');
        // const data = await response.json();
        // setUser(data);

        // For demonstration, mock the response:
        const mockUser = {
          name: 'John Doe',
          avatar: 'https://placekitten.com/200/200', // Example avatar
        };
        setUser(mockUser);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePressIn = (card) => {
    Animated.spring(scaleValues[card], {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = (card) => {
    Animated.spring(scaleValues[card], {
      toValue: 1,
      friction: 5,
      tension: 50,
      useNativeDriver: true,
    }).start();
  };

  const CardButton = ({ icon, text, onPress, color, cardType }) => (
    <TouchableOpacity
      onPressIn={() => handlePressIn(cardType)}
      onPressOut={() => handlePressOut(cardType)}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            transform: [{ scale: scaleValues[cardType] }],
            shadowColor: color,
          },
        ]}
      >
        <Card style={[styles.card, { borderLeftWidth: 6, borderLeftColor: color }]}>
          <LinearGradient
            colors={['#ffffff', '#f8f9fa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <Card.Content style={styles.cardContent}>
              <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                <MaterialCommunityIcons name={icon} size={36} color={color} />
              </View>
              <View style={styles.textContainer}>
                <Paragraph style={[styles.cardText, { color: colors.text }]}>
                  {text}
                </Paragraph>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={color}
                  style={styles.chevron}
                />
              </View>
            </Card.Content>
          </LinearGradient>
        </Card>
      </Animated.View>
    </TouchableOpacity>
  );

  // -----------------------------
  // RENDER FUNCTION
  // -----------------------------
  return (
    <LinearGradient
      colors={['#f5f7fa', '#e4e8f0']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          {/* Show a loading indicator while fetching user data */}
          {loading ? (
            <ActivityIndicator size="large" color="#5e35b1" />
          ) : (
            <>
              {/* Display user’s avatar + greeting */}
              <View style={styles.userInfo}>
                {user?.avatar ? (
                  <Avatar.Image size={60} source={{ uri: user.avatar }} />
                ) : (
                  <Avatar.Icon size={60} icon="account" />
                )}
                <View style={styles.headerTextContainer}>
                  <Title style={styles.header}>
                    {user ? `Welcome, ${user.name}` : 'Welcome to StudyHub'}
                  </Title>
                  <Paragraph style={styles.subHeader}>
                    Your personalized learning companion
                  </Paragraph>
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.optionsContainer}>
          <CardButton
            icon="book-open-outline"
            text="Explore Textbooks"
            color="#5e35b1"
            cardType="textbooks"
            onPress={() => navigation.navigate('TextbooksScreen')}
          />
          <CardButton
            icon="clipboard-text-outline"
            text="Take Online Tests"
            color="#d81b60"
            cardType="tests"
            onPress={() => navigation.navigate('OnlineTestScreen')}
          />
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  headerContainer: {
    marginBottom: 32,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a237e',
    fontFamily: 'Roboto_700Bold',
    lineHeight: 36,
  },
  subHeader: {
    fontSize: 16,
    color: '#5c6bc0',
    fontFamily: 'Roboto_400Regular',
    opacity: 0.9,
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  cardWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  gradient: {
    borderRadius: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'left',
    flex: 1,
  },
  chevron: {
    marginLeft: 10,
    opacity: 0.7,
  },
});

export default WelcomeScreen;
