
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Share,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';

// Import your theme constants
import {
  Palette,
  spacing,
  typography,
  shadows,
  borderRadius,
} from '../../theme/colors'; // Adjust path to match your project

export default function RecordDetailScreen({ route, navigation }) {
  const { record } = route.params;

  if (!record) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.errorText}>No record data available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formattedDate = record.date
    ? moment(record.date).format('MMMM D, YYYY [•] h:mm A')
    : 'Unknown Date';

  const handleShare = async () => {
    try {
      const message =
        `CBT Thought Record\n\n` +
        `📅 ${formattedDate}\n\n` +
        `💭 Situation: ${record.situation || 'N/A'}\n` +
        `😔 Emotion: ${record.emotion || 'N/A'}\n` +
        `🧠 Automatic Thought: ${record.automaticThought || 'N/A'}\n` +
        `✅ Evidence For: ${record.evidenceFor || 'N/A'}\n` +
        `❌ Evidence Against: ${record.evidenceAgainst || 'N/A'}\n` +
        `⚖️ Balanced Thought: ${record.balancedThought || 'N/A'}\n` +
        `😊 New Emotion: ${record.newEmotion || 'N/A'}`;

      await Share.share({
        message,
        title: 'My CBT Thought Record',
      });
    } catch (error) {
      console.error('Error sharing:', error.message);
    }
  };

  const handleEdit = () => {
    // Example navigation for editing:
    // navigation.navigate('EditRecordScreen', { record });
    console.log('Edit record tapped!');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with gradient background */}
      <LinearGradient
        colors={[Palette.secondaryBlue, Palette.primary]} // Adjust or keep a gradient you like
        style={styles.gradientHeader}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Palette.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Thought Record</Text>

          <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
            <MaterialCommunityIcons name="share-variant" size={20} color={Palette.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main content area */}
      <ScrollView contentContainerStyle={styles.contentContainer} style={{ flex: 1 }}>
        {/* Date display */}
        <View style={styles.dateContainer}>
          <MaterialCommunityIcons name="calendar" size={16} color={Palette.textMedium} />
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>

        {/* Card: The Situation */}
        <View style={[styles.card, shadows.low]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="map-marker-outline" size={20} color={Palette.primary} />
            <Text style={styles.sectionTitle}>The Situation</Text>
          </View>
          <Text style={styles.sectionContent}>{record.situation || 'No situation described'}</Text>
        </View>

        {/* Card: Your Emotion(s) */}
        <View style={[styles.card, shadows.low]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="emoticon-sad-outline" size={20} color={Palette.secondaryOrange} />
            <Text style={styles.sectionTitle}>Your Emotion(s)</Text>
          </View>
          <Text style={styles.sectionContent}>{record.emotion || 'No emotions recorded'}</Text>
        </View>

        {/* Card: Automatic Thought(s) */}
        <View style={[styles.card, shadows.low]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="brain" size={20} color={Palette.secondaryPurple} />
            <Text style={styles.sectionTitle}>Automatic Thought(s)</Text>
          </View>
          <Text style={styles.sectionContent}>
            {record.automaticThought || 'No automatic thoughts recorded'}
          </Text>
        </View>

        {/* Card: Evidence For */}
        <View style={[styles.card, shadows.low]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="check-circle-outline" size={20} color={Palette.secondaryBlue} />
            <Text style={styles.sectionTitle}>Evidence For</Text>
          </View>
          <Text style={styles.sectionContent}>
            {record.evidenceFor || 'No supporting evidence recorded'}
          </Text>
        </View>

        {/* Card: Evidence Against */}
        <View style={[styles.card, shadows.low]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="close-circle-outline" size={20} color={Palette.secondaryRed} />
            <Text style={styles.sectionTitle}>Evidence Against</Text>
          </View>
          <Text style={styles.sectionContent}>
            {record.evidenceAgainst || 'No contradictory evidence recorded'}
          </Text>
        </View>

        {/* Card: Balanced Thought */}
        <View style={[styles.card, shadows.low]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="scale-balance" size={20} color={Palette.secondaryPink} />
            <Text style={styles.sectionTitle}>Balanced Thought</Text>
          </View>
          <Text style={[styles.sectionContent, styles.balancedThought]}>
            {record.balancedThought || 'No balanced thought recorded'}
          </Text>
        </View>

        {/* Card: New Emotion */}
        <View style={[styles.card, shadows.low]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="emoticon-happy-outline" size={20} color="#81C784" />
            <Text style={styles.sectionTitle}>New Emotion</Text>
          </View>
          <Text style={styles.sectionContent}>{record.newEmotion || 'No new emotions recorded'}</Text>
        </View>
      </ScrollView>

      {/* Optional floating Edit button */}
      <TouchableOpacity style={[styles.fab, shadows.high]} onPress={handleEdit}>
        <MaterialCommunityIcons name="pencil" size={22} color={Palette.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'android' ? spacing.xl : spacing.lg, // extra top padding for Android
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    color: Palette.white,
    fontWeight: '700',
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dateText: {
    ...typography.small,
    color: Palette.textLight,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: Palette.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
    color: Palette.textDark,
    marginLeft: spacing.xs,
  },
  sectionContent: {
    ...typography.body,
    color: Palette.textMedium,
    lineHeight: 22,
    marginTop: spacing.xs / 2,
  },
  balancedThought: {
    fontStyle: 'italic',
    color: Palette.secondaryBlue, // or your preferred color
  },
  errorText: {
    ...typography.body,
    fontSize: 16,
    color: Palette.secondaryRed,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xxl,
    right: spacing.xxl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.secondaryBlue, // or your preferred color
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

