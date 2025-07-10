import React from 'react';
import { Modal, View, Text, TouchableOpacity, SafeAreaView, 
  ScrollView, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { Palette, spacing, typography, borderRadius } from '../../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getAuth } from 'firebase/auth';

export default function ViewEntryModal({
  entry,
  isLoading,
  onClose,
  onLoadingChange,
  journalEntries,
  setJournalEntries
}) {
  if (!entry) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
  };

  const shareAsText = async (entry) => {
    const shareContent = `
${entry.title}
${formatDate(entry.date)}

${entry.content}

Shared from Mindful Journal App
    `;
    await Sharing.shareAsync(shareContent, {
      dialogTitle: 'Share Journal Entry',
    });
  };

  const shareEntry = async (entry) => {
    try {
      onLoadingChange(true);
      const filename = `${entry.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              .date { color: #666; font-size: 14px; margin-bottom: 20px; }
              .content { line-height: 1.6; }
            </style>
          </head>
          <body>
            <h1>${entry.title}</h1>
            <div class="date">${formatDate(entry.date)}</div>
            <div class="content">${entry.content.replace(/\n/g, '<br>')}</div>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await FileSystem.copyAsync({ from: uri, to: fileUri });

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Journal Entry',
        UTI: 'com.adobe.pdf'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share entry. Please try again.');
    } finally {
      onLoadingChange(false);
    }
  };

  const deleteEntry = async (entryId) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to permanently delete this journal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedEntries = journalEntries.filter(e => e.id !== entryId);
              setJournalEntries(updatedEntries);
              await AsyncStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
              
              if (getAuth().currentUser) {
                await deleteDoc(doc(db, "journals", entryId));
              }
              
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete the entry. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getMoodBadge = () => {
    const moodMap = {
      'great': { label: 'Great', icon: 'emoticon-excited-outline', color: '#58D68D' },
      'good': { label: 'Good', icon: 'emoticon-happy-outline', color: Palette.primary },
      'neutral': { label: 'Neutral', icon: 'emoticon-neutral-outline', color: Palette.textLight },
      'down': { label: 'Down', icon: 'emoticon-sad-outline', color: Palette.secondaryBlue },
      'sad': { label: 'Sad', icon: 'emoticon-frown-outline', color: Palette.secondaryBlue },
      'anxious': { label: 'Anxious', icon: 'emoticon-confused-outline', color: Palette.secondaryOrange },
      'angry': { label: 'Angry', icon: 'emoticon-angry-outline', color: Palette.secondaryRed },
      'tired': { label: 'Tired', icon: 'emoticon-dead-outline', color: Palette.secondaryPurple },
    };
    return moodMap[entry.mood];
  };

  const moodData = getMoodBadge();

  return (
    <Modal
      visible={!!entry}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle} numberOfLines={1}>
            {entry.title}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={28} color={Palette.textLight} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Metadata */}
          <View style={styles.viewHeader}>
            <Text style={styles.viewDate}>
              {formatDate(entry.date)}
            </Text>
            {moodData && (
              <View style={[styles.viewMoodBadge, { backgroundColor: moodData.color + '20' }]}>
                <MaterialCommunityIcons 
                  name={moodData.icon} 
                  size={18} 
                  color={moodData.color}
                />
                <Text style={[styles.viewMoodText, { color: moodData.color }]}>
                  {moodData.label}
                </Text>
              </View>
            )}
          </View>

          {/* Content */}
          <Text style={styles.viewContent}>
            {entry.content}
          </Text>
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.modalFooter}>
          <TouchableOpacity 
            style={[styles.shareButton, { marginRight: 5 }]}
            onPress={() => shareAsText(entry)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Palette.white} />
            ) : (
              <>
                <MaterialCommunityIcons name="share-variant" size={20} color={Palette.white} />
                <Text style={styles.shareButtonText}>Share as Text</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.shareButton, { marginLeft: 5 }]}
            onPress={() => shareEntry(entry)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Palette.white} />
            ) : (
              <>
                <MaterialCommunityIcons name="file-pdf-box" size={20} color={Palette.white} />
                <Text style={styles.shareButtonText}>Export as PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.modalFooter, { borderTopWidth: 0 }]}>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => deleteEntry(entry.id)}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={22} color={Palette.secondaryRed} />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  modalTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: Palette.textDark,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  modalContent: {
    padding: spacing.lg,
  },
  viewHeader: {
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewDate: {
    fontSize: typography.caption.fontSize,
    color: Palette.textLight,
    flex: 1,
  },
  viewMoodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  viewMoodText: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.h2.fontWeight,
    marginLeft: spacing.xs,
  },
  viewContent: {
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
    lineHeight: typography.body.lineHeight,
  },
  modalFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shareButton: {
    backgroundColor: Palette.secondaryPurple,
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    flex: 1,
  },
  shareButtonText: {
    color: Palette.white,
    fontSize: typography.body.fontSize,
    fontWeight: typography.h2.fontWeight,
    marginLeft: spacing.sm,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.secondaryRed + '20',
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  deleteButtonText: {
    color: Palette.secondaryRed,
    fontSize: typography.body.fontSize,
    fontWeight: typography.h2.fontWeight,
    marginLeft: spacing.sm,
  },
});
