import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import AdminPanel from '../screens/AdminPanel';


const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.7;

const Sidebar = ({ isVisible, onClose, darkMode, toggleDarkMode, isAdmin }) => {
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const auth = getAuth();

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  const MenuItem = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <MaterialCommunityIcons
        name={icon}
        size={24}
        color={darkMode ? '#fff' : '#333'}
      />
      <Text style={[styles.menuItemText, darkMode && styles.textLight]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
            display: isVisible ? 'flex' : 'none',
          },
        ]}
        onTouchStart={onClose}
      />
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: slideAnim }],
            backgroundColor: darkMode ? '#1a1a1a' : '#fff',
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.headerText, darkMode && styles.textLight]}>
            Menu
          </Text>
        </View>

        <MenuItem
          icon="account"
          label="Profile"
          onPress={() => {
            navigation.navigate('Profile');
            onClose();
          }}
        />
        <MenuItem
          icon="information"
          label="About Us"
          onPress={() => {
            navigation.navigate('AboutUs');
            onClose();
          }}
        />
        <MenuItem
          icon="cog"
          label="Settings"
          onPress={() => {
            navigation.navigate('Settings');
            onClose();
          }}
        />

        {isAdmin && (
          <MenuItem
            icon="shield-account"
            label="Admin Panel"
            onPress={() => {
              navigation.navigate('Admin');
              onClose();
            }}
          />
        )}

        <View style={styles.menuItem}>
          <MaterialCommunityIcons
            name={darkMode ? 'weather-night' : 'weather-sunny'}
            size={24}
            color={darkMode ? '#fff' : '#333'}
          />
          <Text style={[styles.menuItemText, darkMode && styles.textLight]}>
            Dark Mode
          </Text>
          <Switch
            value={darkMode}
            onValueChange={toggleDarkMode}
            style={styles.switch}
          />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={24} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 100,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: '#fff',
    zIndex: 101,
    paddingTop: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  switch: {
    marginLeft: 'auto',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4444',
    padding: 15,
    margin: 20,
    borderRadius: 10,
  },
  logoutText: {
    color: '#fff',
    marginLeft: 15,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  textLight: {
    color: '#fff',
  },
});

export default Sidebar;