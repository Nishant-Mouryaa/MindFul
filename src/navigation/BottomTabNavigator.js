import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Platform,
  View,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  focused
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
import JournalScreen from '../screens/mental-health/JournalScreen';
import ToolsScreen from '../screens/mental-health/ToolsScreen';
import ProgressScreen from '../screens/mental-health/ProgressScreen';
import AdminPanel from '../screens/AdminPanel';

import { Palette } from '../theme/colors';

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
    Journal:    focused ? 'book-open'       : 'book-open-outline',
    Tools:      focused ? 'tools'           : 'tools',
    Progress:   focused ? 'chart-line'      : 'chart-line',
  }[route.name];

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <MaterialCommunityIcons name={iconName} size={iconSize} color={color} />
    </Animated.View>
  );
};

/* ------------------------------------------------------------------ */
/* Enhanced Emergency FAB                                              */
/* ------------------------------------------------------------------ */
const EmergencyFAB = () => {
  const navigation = useNavigation();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const pulseOuter = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    // Continuous pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Outer pulse animation
    const outerPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOuter, {
          toValue: 1.3,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseOuter, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    outerPulse.start();

    return () => {
      pulse.stop();
      outerPulse.stop();
    };
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        navigation.navigate('EmergencyResources');
      }}
    >
      <View style={styles.fabContainer}>
        {/* Outer pulse ring */}
        <Animated.View
          style={[
            styles.pulseRing,
            { transform: [{ scale: pulseOuter }] },
          ]}
        />
        {/* Inner pulse ring */}
        <Animated.View
          style={[
            styles.pulseRing,
            { transform: [{ scale: pulseAnim }] },
          ]}
        />
        {/* Main button */}
        <Animated.View
          style={[
            styles.emergencyFab,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <MaterialCommunityIcons name="lifebuoy" color="#fff" size={28} />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

/* ------------------------------------------------------------------ */
/* Floating "Emergency" FAB                                           */
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
/* Floating "Quick Test" FAB                                          */
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
  }, [auth.currentUser]);

  const commonScreenOptions = ({ route }) => ({
    headerShown: false,
    tabBarIcon: (props) => <TabBarIcon route={route} {...props} />,
  });

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: (props) => <TabBarIcon route={route} {...props} />,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: Palette.primary,
          tabBarInactiveTintColor: Palette.textMuted,
          tabBarShowLabel: false,
        })}
      >
        <Tab.Screen name="Home"      component={HomeScreen} />
        <Tab.Screen name="Journal"   component={JournalScreen} />
        <Tab.Screen name="Tools"     component={ToolsScreen} />
        <Tab.Screen name="Progress"  component={ProgressScreen} />
        {isAdmin && (
          <Tab.Screen name="Admin" component={AdminPanel} />
        )}
      </Tab.Navigator>
      <EmergencyFAB />
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Styles                                                             */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    elevation: 3,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    height: 60,
    borderTopWidth: 0,
    shadowColor: Palette.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
  },
  fabContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 85,
    right: 24,
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 10,
  },
  pulseRing: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(229, 115, 115, 0.4)',
  },
  emergencyFab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E57373',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BottomTabNavigator;

