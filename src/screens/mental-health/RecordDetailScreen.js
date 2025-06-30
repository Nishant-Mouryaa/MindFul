import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView,
  Share,
  Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';

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
        title: 'My CBT Thought Record'
      });
    } catch (error) {
      console.error('Error sharing:', error.message);
    }
  };

  // (Optional) handleEdit placeholder
  const handleEdit = () => {
    // Example: navigation.navigate('EditRecordScreen', { record });
    console.log('Edit record tapped!');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with gradient background */}
      <LinearGradient
        colors={['#1E88E5', '#42A5F5']}
        style={styles.gradientHeader}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Thought Record</Text>

          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleShare}
          >
            <MaterialCommunityIcons 
              name="share-variant" 
              size={20} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main content area */}
      <ScrollView contentContainerStyle={styles.contentContainer} style={{ flex: 1 }}>
        {/* Date display */}
        <View style={styles.dateContainer}>
          <MaterialCommunityIcons name="calendar" size={16} color="#757575" />
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>

        {/* Card: The Situation */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="map-marker-outline" size={20} color="#4DB6AC" />
            <Text style={styles.sectionTitle}>The Situation</Text>
          </View>
          <Text style={styles.sectionContent}>
            {record.situation || 'No situation described'}
          </Text>
        </View>

        {/* Card: Your Emotion(s) */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="emoticon-sad-outline" size={20} color="#FFB74D" />
            <Text style={styles.sectionTitle}>Your Emotion(s)</Text>
          </View>
          <Text style={styles.sectionContent}>
            {record.emotion || 'No emotions recorded'}
          </Text>
        </View>

        {/* Card: Automatic Thought(s) */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="brain" size={20} color="#7986CB" />
            <Text style={styles.sectionTitle}>Automatic Thought(s)</Text>
          </View>
          <Text style={styles.sectionContent}>
            {record.automaticThought || 'No automatic thoughts recorded'}
          </Text>
        </View>

        {/* Card: Evidence For */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="check-circle-outline" size={20} color="#64B5F6" />
            <Text style={styles.sectionTitle}>Evidence For</Text>
          </View>
          <Text style={styles.sectionContent}>
            {record.evidenceFor || 'No supporting evidence recorded'}
          </Text>
        </View>

        {/* Card: Evidence Against */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="close-circle-outline" size={20} color="#E57373" />
            <Text style={styles.sectionTitle}>Evidence Against</Text>
          </View>
          <Text style={styles.sectionContent}>
            {record.evidenceAgainst || 'No contradictory evidence recorded'}
          </Text>
        </View>

        {/* Card: Balanced Thought */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="scale-balance" size={20} color="#BA68C8" />
            <Text style={styles.sectionTitle}>Balanced Thought</Text>
          </View>
          <Text style={[styles.sectionContent, styles.balancedThought]}>
            {record.balancedThought || 'No balanced thought recorded'}
          </Text>
        </View>

        {/* Card: New Emotion */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="emoticon-happy-outline" size={20} color="#81C784" />
            <Text style={styles.sectionTitle}>New Emotion</Text>
          </View>
          <Text style={styles.sectionContent}>
            {record.newEmotion || 'No new emotions recorded'}
          </Text>
        </View>
      </ScrollView>

      {/* Optional floating Edit button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleEdit}
      >
        <MaterialCommunityIcons name="pencil" size={22} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'android' ? 40 : 0, // extra top padding for Android
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dateText: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    // Elevation for Android
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  sectionContent: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginTop: 2,
  },
  balancedThought: {
    fontStyle: 'italic',
    color: '#1E88E5',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    // Elevation for Android
    elevation: 4,
  },
});
