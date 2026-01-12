// components/Journal/CrisisSupport.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Linking,
  Alert,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Palette, spacing, typography, borderRadius, shadows } from '../../theme/colors';

const CRISIS_RESOURCES = [
  {
    name: 'National Suicide Prevention Lifeline',
    description: 'Free, confidential support',
    phone: '988',
    available: '24/7',
    type: 'call'
  },
  {
    name: 'Crisis Text Line',
    description: 'Text-based crisis support',
    phone: '741741',
    message: 'Text HOME to',
    available: '24/7',
    type: 'text'
  },
  {
    name: 'SAMHSA National Helpline',
    description: 'Treatment referral service',
    phone: '1-800-662-4357',
    available: '24/7',
    type: 'call'
  },
  {
    name: 'NAMI Helpline',
    description: 'Mental health information',
    phone: '1-800-950-6264',
    available: 'Mon-Fri, 10am-10pm ET',
    type: 'call'
  }
];

export default function CrisisSupport({ visible, onClose }) {
  const handleCallPress = (resource) => {
    const phoneNumber = resource.phone.replace(/-/g, '');
    
    Alert.alert(
      `Contact ${resource.name}`,
      resource.type === 'call' 
        ? `You're about to call ${resource.phone}`
        : `You're about to open Messages to text ${resource.phone}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: resource.type === 'call' ? 'Call Now' : 'Text Now',
          onPress: () => {
            if (resource.type === 'call') {
              Linking.openURL(`tel:${phoneNumber}`);
            } else {
              Linking.openURL(`sms:${phoneNumber}`);
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons 
              name="heart-pulse" 
              size={32} 
              color={Palette.secondaryRed} 
            />
          </View>
          <Text style={styles.title}>You're Not Alone</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialCommunityIcons 
              name="close" 
              size={24} 
              color={Palette.textLight} 
            />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.messageCard}>
            <MaterialCommunityIcons 
              name="hand-heart" 
              size={24} 
              color={Palette.primary} 
            />
            <Text style={styles.messageText}>
              If you're going through a difficult time or having thoughts of 
              self-harm, please know that help is available. You matter, and 
              there are people who want to support you.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Crisis Resources</Text>

          {CRISIS_RESOURCES.map((resource, index) => (
            <TouchableOpacity
              key={index}
              style={styles.resourceCard}
              onPress={() => handleCallPress(resource)}
              activeOpacity={0.7}
            >
              <View style={styles.resourceInfo}>
                <Text style={styles.resourceName}>{resource.name}</Text>
                <Text style={styles.resourceDescription}>
                  {resource.description}
                </Text>
                <View style={styles.resourceMeta}>
                  <MaterialCommunityIcons 
                    name="clock-outline" 
                    size={14} 
                    color={Palette.textLight} 
                  />
                  <Text style={styles.resourceAvailable}>
                    {resource.available}
                  </Text>
                </View>
              </View>
              
              <View style={styles.resourceAction}>
                <View style={styles.phoneContainer}>
                  {resource.message && (
                    <Text style={styles.phoneMessage}>{resource.message}</Text>
                  )}
                  <Text style={styles.phoneNumber}>{resource.phone}</Text>
                </View>
                <MaterialCommunityIcons
                  name={resource.type === 'call' ? 'phone' : 'message-text'}
                  size={24}
                  color={Palette.primary}
                />
              </View>
            </TouchableOpacity>
          ))}

          <View style={styles.additionalHelp}>
            <Text style={styles.additionalHelpTitle}>
              Additional Ways to Get Help
            </Text>
            <Text style={styles.additionalHelpText}>
              • Talk to a trusted friend, family member, or mentor{'\n'}
              • Contact your doctor or mental health professional{'\n'}
              • Visit your nearest emergency room{'\n'}
              • Use a mental health app for immediate coping strategies
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.okayButton} 
            onPress={onClose}
          >
            <Text style={styles.okayButtonText}>
              I'm okay, close this
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  headerIcon: {
    marginRight: spacing.md,
  },
  title: {
    flex: 1,
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: Palette.textDark,
  },
  closeButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  messageCard: {
    flexDirection: 'row',
    backgroundColor: Palette.primary + '15',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  messageText: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: Palette.textDark,
    marginBottom: spacing.md,
  },
  resourceCard: {
    flexDirection: 'row',
    backgroundColor: Palette.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.low,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceName: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: Palette.textDark,
    marginBottom: spacing.xs,
  },
  resourceDescription: {
    fontSize: typography.caption.fontSize,
    color: Palette.textLight,
    marginBottom: spacing.xs,
  },
  resourceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceAvailable: {
    fontSize: typography.small.fontSize,
    color: Palette.textLight,
    marginLeft: spacing.xs,
  },
  resourceAction: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  phoneContainer: {
    alignItems: 'flex-end',
    marginBottom: spacing.xs,
  },
  phoneMessage: {
    fontSize: typography.small.fontSize,
    color: Palette.textLight,
  },
  phoneNumber: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: Palette.primary,
  },
  additionalHelp: {
    backgroundColor: Palette.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  additionalHelpTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: Palette.textDark,
    marginBottom: spacing.sm,
  },
  additionalHelpText: {
    fontSize: typography.caption.fontSize,
    color: Palette.textLight,
    lineHeight: 22,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  okayButton: {
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  okayButtonText: {
    fontSize: typography.body.fontSize,
    color: Palette.textLight,
  },
});