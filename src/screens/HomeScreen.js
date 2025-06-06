import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  Animated, 
  Easing, 
  Dimensions,
  TouchableOpacity,
  Platform,
  Alert,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import { 
  Title, 
  Text, 
  useTheme,
  Button,
  Avatar,
  Card
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getAuth, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Palette } from '../theme/colors';   

import Sidebar from '../navigation/Sidebar';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const auth = getAuth();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];
  const slideUpAnim = useState(new Animated.Value(30))[0];

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setIsAdmin(data.isAdmin || false);
            setUserData(data);
          }
        } catch (error) {
          console.error("Error reading user data:", error);
        }
      }
    };

    fetchUserData();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [auth]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  const FeatureItem = ({ icon, color, title, onPress }) => {
    return (
      <TouchableOpacity 
        style={[styles.featureItem, { backgroundColor: '#ffffff' }]}
        onPress={() => {
          Haptics.selectionAsync();
          onPress();
        }}
        activeOpacity={0.85}
      >
        <View style={[styles.featureIcon, { backgroundColor: '#d32f2f' }]}>
          <MaterialCommunityIcons name={icon} size={26} color="#fff" />
        </View>
        <Text style={[styles.featureItemTitle, { color: '#555' }]}>{title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screenContainer}>
      <Sidebar 
  isVisible={isSidebarVisible} 
  onClose={() => setIsSidebarVisible(false)}
  darkMode={darkMode}
  toggleDarkMode={() => setDarkMode(!darkMode)}
  isAdmin={isAdmin}
/>

      <View style={styles.circle1} />
      <View style={styles.circle2} />
      
      <Animated.View 
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim }, 
            { translateY: slideUpAnim }
          ],
        }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setIsSidebarVisible(true)}
          >
            <MaterialCommunityIcons name="menu" size={28} color="#d32f2f" />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <View style={styles.userInfo}>
              <Avatar.Text 
                size={64} 
                label={userData?.name?.split(' ').map(n => n[0]).join('') || 'U'} 
                style={[styles.avatar, { backgroundColor: '#d32f2f' }]}
              />
              <View style={styles.userText}>
                <Title style={styles.welcomeText}>Welcome back</Title>
                <Text style={styles.userName}>{userData?.name || 'User'}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.statsCard, { backgroundColor: '#ffffff' }]}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#d32f2f' }]}>
                  {userData?.activeCourses ?? 0}
                </Text>
                <Text style={[styles.statLabel, { color: '#666' }]}>Active Courses</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#d32f2f' }]}>
                  {userData?.completedTests ?? 0}
                </Text>
                <Text style={[styles.statLabel, { color: '#666' }]}>Completed Tests</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#d32f2f' }]}>
                  {userData?.avgScore ? `${userData.avgScore}%` : 'N/A'}
                </Text>
                <Text style={[styles.statLabel, { color: '#666' }]}>Avg. Score</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: '#333' }]}>Quick Actions</Text>
          <View style={styles.featuresGrid}>
            <FeatureItem 
              icon="book-open-outline" 
              title="Library"
              onPress={() => navigation.navigate('Textbooks')}
            />
            <FeatureItem 
              icon="clipboard-text-outline" 
              title="Tests"
              onPress={() => navigation.navigate('OnlineTestScreen')}
            />
            <FeatureItem 
              icon="notebook" 
              title="Notes"
              onPress={() => navigation.navigate('NotesScreen')}
            />
            <FeatureItem 
              icon="chart-line" 
              title="Progress"
              onPress={() => Alert.alert('Coming Soon', 'Progress tracking feature will be available soon!')}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: '#333' }]}>Recent Activity</Text>
          <View style={[styles.activityCard, { backgroundColor: '#ffffff' }]}>
            <View style={styles.activityItem}>
              <MaterialCommunityIcons name="bookmark" size={20} color="#d32f2f" />
              <Text style={[styles.activityText, { color: '#555' }]}>Completed Chapter 4 in Biology</Text>
            </View>
            <View style={styles.activityItem}>
              <MaterialCommunityIcons name="chart-box" size={20} color="#d32f2f" />
              <Text style={[styles.activityText, { color: '#555' }]}>Scored 92% on Chemistry test</Text>
            </View>
          </View>

          {isAdmin && (
            <>
              <Text style={[styles.sectionTitle, { color: '#333' }]}>Admin Tools</Text>
              <FeatureItem 
                icon="shield-account" 
                title="Dashboard"
                onPress={() => navigation.navigate('Admin', { screen: 'AdminPanel' })}
              />
            </>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  circle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Palette.primaryXLight,
    top: -100,
    left: -100,
  },
  circle2: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: Palette.primaryXXLight,
    bottom: -150,
    right: -100,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  menuButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 16,
    zIndex: 999,
  },
  headerContainer: { 
    marginTop: 40,
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  avatar: {
    marginRight: 16,
  },
  userText: {
    flex: 1,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 18,
    color: Palette.textMuted,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.onBackground,
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    backgroundColor: colors.surface,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    width: '33%',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
    color: colors.primary,
  },
  statLabel: {
    fontSize: 13,
    textAlign: 'center',
    color: Palette.textMuted,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: colors.onBackground,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  featureItem: {
    width: '48%',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
    backgroundColor: colors.surface,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: colors.primary,
  },
  featureItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.onSurface,
  },
  activityCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 55,
    backgroundColor: colors.surface,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Palette.divider,
  },
  activityText: {
    fontSize: 14,
    marginLeft: 10,
    color: colors.onSurface,
  },
  logoutButton: {
    marginTop: 16,
    alignSelf: 'center',
    borderRadius: 12,
    paddingHorizontal: 30,
    paddingVertical: 10,
    backgroundColor: colors.primary,
  },
});


export default HomeScreen;