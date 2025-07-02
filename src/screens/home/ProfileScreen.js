import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { getAuth, signOut } from 'firebase/auth';
import { db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Palette, spacing, typography, shadows, borderRadius } from '../../theme/colors';

const { width: screenWidth } = Dimensions.get('window');

const getInitials = (name) => {
  if (!name) return 'U';
  const names = name.split(' ');
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const auth = getAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData({
          ...userDoc.data(),
          email: user.email,
        });
      } else {
        setUserData({
          displayName: user.email?.split('@')[0] || '',
          email: user.email,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Palette.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <LinearGradient
        colors={[Palette.primary, Palette.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitials(userData?.displayName)}</Text>
          </View>
        </View>
        <Text style={styles.displayName}>{userData?.displayName || 'User'}</Text>
        <Text style={styles.email}>{userData?.email}</Text>
      </LinearGradient>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="account" size={24} color={Palette.primary} />
          <Text style={styles.infoLabel}>Name</Text>
          <Text style={styles.infoValue}>{userData?.displayName || '-'}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="email" size={24} color={Palette.primary} />
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{userData?.email || '-'}</Text>
        </View>
        {userData?.bio && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="information" size={24} color={Palette.primary} />
            <Text style={styles.infoLabel}>Bio</Text>
            <Text style={styles.infoValue}>{userData.bio}</Text>
          </View>
        )}
        {/* Add more fields as needed */}
      </View>

      {/* Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color={Palette.white} />
          <Text style={styles.actionButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Palette.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: Palette.textLight,
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...shadows.medium,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Palette.secondaryPurple,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.low,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: Palette.white,
  },
  displayName: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: Palette.white,
    marginTop: spacing.sm,
  },
  email: {
    fontSize: typography.caption.fontSize,
    color: Palette.white,
    opacity: 0.9,
    marginBottom: spacing.md,
  },
  infoSection: {
    backgroundColor: Palette.white,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginTop: -spacing.lg,
    padding: spacing.lg,
    ...shadows.medium,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoLabel: {
    fontSize: typography.body.fontSize,
    color: Palette.textMedium,
    marginLeft: spacing.md,
    flex: 1,
  },
  infoValue: {
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
    fontWeight: '500',
    flex: 2,
  },
  actionsSection: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    ...shadows.low,
  },
  actionButtonText: {
    color: Palette.white,
    fontWeight: '600',
    fontSize: typography.body.fontSize,
    marginLeft: spacing.sm,
  },
}); 