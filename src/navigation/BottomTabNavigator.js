// BottomTabNavigator.tsx
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Platform,
  View,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import HomeScreen from '../screens/home/HomeScreen';

import { Palette } from '../theme/colors';          // <-- already present

const { width } = Dimensions.get('window');
const Tab = createBottomTabNavigator();

/* ------------------------------------------------------------------ */
/* Icons                                                              */
/* ------------------------------------------------------------------ */
const TabBarIcon = ({ route, focused, color, size }) => {
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: focused ? 1.15 : 1,
      friction: 3,
      tension: 20,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  const iconSize = focused ? size + 2 : size;

  const iconName = {
    Home:       focused ? 'home'            : 'home-outline',
    Textbooks:  focused ? 'book-open'       : 'book-open-outline',
    Tests:      focused ? 'clipboard-text'  : 'clipboard-text-outline',
  }[route.name];

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <MaterialCommunityIcons name={iconName} size={iconSize} color={color} />
    </Animated.View>
  );
};

/* ------------------------------------------------------------------ */
/* Floating “About” FAB                                               */
/* ------------------------------------------------------------------ */
const QuickAboutFAB = () => {
  const navigation = useNavigation();
  return (
    <TouchableWithoutFeedback onPress={() => navigation.navigate('AboutUs')}>
      <View
        style={[
          styles.fabContainer,
          {
            bottom: 100,
            backgroundColor: Palette.bg,            // <-- use Palette
          },
        ]}
      >
        <MaterialCommunityIcons
          name="information"
          size={28}
          color={Palette.primary}                   // <-- use Palette
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

/* ------------------------------------------------------------------ */
/* Floating “Quick Test” FAB                                          */
/* ------------------------------------------------------------------ */
const QuickTestFAB = () => {
  const navigation = useNavigation();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true }),
      Animated.spring(rotateAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
      Animated.spring(rotateAnim, { toValue: 0, friction: 3, useNativeDriver: true }),
    ]).start();
  };

  const rotation = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '10deg'] });

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        navigation.navigate('Tests');
      }}
    >
      <Animated.View
        style={[
          styles.fabContainer,
          { transform: [{ scale: scaleAnim }, { rotate: rotation }] },
        ]}
      >
        <LinearGradient
          colors={[Palette.primary, Palette.primaryLight]}     // <-- use Palette
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons name="lightning-bolt" color={Palette.iconlight} size={28} />
        </LinearGradient>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

/* ------------------------------------------------------------------ */
/* Bottom Tab Navigator                                               */
/* ------------------------------------------------------------------ */
const BottomTabNavigator = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    const checkAdminStatus = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        setIsAdmin(docSnap.exists() && docSnap.data().isAdmin);
      }
    };
    checkAdminStatus();
  }, []);

  return (
    <>
      {/* Optional extra FABs */}
      
      

      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, size }) => (
            <TabBarIcon
              route={route}
              focused={focused}
              size={size}
              color={focused ? Palette.primary : Palette.textMuted} // <-- use Palette
            />
          ),
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: 'Poppins-Medium',
            marginBottom: 5,
          },
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 6,
            right: 6,
            backgroundColor: Palette.bg,              // <-- use Palette
            borderTopWidth: 0,
            height: 70,
            borderRadius: 20,
            shadowColor: Palette.shadow,              // <-- use Palette
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 5,
            paddingBottom: 5,
            paddingTop: 5,
            marginBottom: 10,
          },
          tabBarActiveTintColor: Palette.primary,     // <-- use Palette
          tabBarInactiveTintColor: Palette.textMuted, // <-- use Palette
          tabBarShowLabel: true,
          tabBarHideOnKeyboard: true,
        })}
      >
        <Tab.Screen name="Home"      component={HomeScreen}      options={{ tabBarLabel: 'Home' }} />
        {/* <Tab.Screen name="Textbooks" component={TextbooksScreen} options={{ tabBarLabel: 'Textbooks' }} />
        <Tab.Screen name="Tests"     component={OnlineTestScreen} options={{ tabBarLabel: 'Tests' }} /> */}
        {/* If you want an Admin tab, add it conditionally but still coloured with Palette */}
        {/* {isAdmin && <Tab.Screen name="Admin" component={AdminPanel} />} */}
      </Tab.Navigator>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Styles (only structural stuff lives here)                          */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 85,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Palette.shadow,         // <-- use Palette
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 10,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BottomTabNavigator;