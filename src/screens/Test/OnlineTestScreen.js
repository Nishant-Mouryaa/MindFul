import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';
import { 
  Title, 
  Text, 
  useTheme
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { Palette } from '../../theme/colors';

const { width } = Dimensions.get('window');

const OnlineTestScreen = () => {
  const { colors } = useTheme();
const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(false);

  const navigateToTestFlow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('BoardSelection');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading test options...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      {/* Decorative background elements */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <View style={styles.headerContainer}>
        <Title style={styles.header}>Online Test Portal</Title>
        <Text style={styles.subHeader}>
          Challenge yourself with personalized tests
        </Text>
      </View>

      <View style={styles.mainContent}>
        {/* Start Test Button */}
        <TouchableOpacity 
          style={styles.startTestButton}
          onPress={navigateToTestFlow}
          activeOpacity={0.9}
        >
          <View style={styles.startTestContent}>
            <View style={styles.startTestIcon}>
              <Icon name="rocket-launch" size={36} color="#fff" />
            </View>
            <View style={styles.startTestText}>
              <Text style={styles.startTestTitle}>Start New Test</Text>
              <Text style={styles.startTestSubtitle}>Begin your learning journey</Text>
            </View>
            <Icon name="chevron-right" size={28} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Quick Links */}
        <View style={styles.quickLinksContainer}>
          <TouchableOpacity 
            style={[
              styles.quickLinkCard,
              
            ]}
            onPress={() => navigation.navigate('RecentTests')}
            activeOpacity={0.8}
          >
            <View style={styles.quickLinkIcon}>
              <Icon name="history" size={28} color="#fff" />
            </View>
            <Text style={styles.quickLinkText}>Test History</Text>
            <Icon name="chevron-right" size={20} color="#fff" style={styles.chevron} />
          </TouchableOpacity>

          {/* <TouchableOpacity 
            style={[
              styles.quickLinkCard,
              
            ]}
            onPress={() => navigation.navigate('RecommendedTests')}
            activeOpacity={0.8}
          >
            <View style={styles.quickLinkIcon}>
              <Icon name="star" size={28} color="#fff" />
            </View>
            <Text style={styles.quickLinkText}>Recommended</Text>
            <Icon name="chevron-right" size={20} color="#fff" style={styles.chevron} />
          </TouchableOpacity> */}
        </View>

       

          
       
      </View>
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
    backgroundColor: Palette.primaryXLight,
    bottom: -150,
    right: -100,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    zIndex: 10,
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.onBackground,
    marginTop: 50,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 16,
    color: Palette.textMuted,
    marginTop: 6,
    fontWeight: '500',
    lineHeight: 24,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  startTestButton: {
    backgroundColor: Palette.bg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    elevation: 6,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  startTestContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  startTestIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  startTestText: {
    flex: 1,
  },
  startTestTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.text,
    marginBottom: 4,
  },
  startTestSubtitle: {
    fontSize: 14,
    color: Palette.textMuted,
  },
  quickLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickLinkCard: {
    height: 80,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    backgroundColor: Palette.primaryLight,
  },
  quickLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.primaryXLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickLinkText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onPrimary,
  },
  chevron: {
    marginLeft: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  optionCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    elevation: 2,
  },
  optionText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
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


export default OnlineTestScreen;