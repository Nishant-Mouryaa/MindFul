import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Animated
} from 'react-native';
import {
  Title,
  Text,
  Button,
  useTheme,
  TouchableRipple,
  Badge
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Palette } from '../../theme/colors';

const { width } = Dimensions.get('window');

const ChapterSelectionScreen = ({ route }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const { boardId, standardId, subjectId, subjectName } = route.params;
  
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const scaleValue = new Animated.Value(1);

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        setLoading(true);
        const chaptersRef = collection(db, 
          `boards/${boardId}/standards/${standardId}/subjects/${subjectId}/chapters`);
        
        const querySnapshot = await getDocs(chaptersRef);
        const chaptersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || `Chapter ${doc.id}`,
          testCount: doc.data().testCount || 0,
          progress: Math.min(Math.floor(Math.random() * 100), 100) // Example progress value
        }));

        setChapters(chaptersData);
      } catch (err) {
        console.error("Error fetching chapters:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, [boardId, standardId, subjectId]);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleSelectChapter = (chapter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedId(chapter.id);
    setTimeout(() => {
      navigation.navigate('TestList', {
        boardId,
        standardId,
        subjectId,
        chapterId: chapter.id,
        chapterName: chapter.name
      });
    }, 200);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5D53F0" />
        <Text style={styles.loadingText}>Loading chapters...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={48}
          color="#FF5252"
        />
        <Text style={styles.errorText}>Couldn't load chapters</Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.retryButton}
          labelStyle={styles.buttonLabel}
        >
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      {/* Decorative background elements */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <View style={styles.headerContainer}>
        <MaterialCommunityIcons
          name="book-open-page-variant"
          size={36}
          color="#FFFFFF"
          style={styles.headerIcon}
        />
        <Title style={styles.header}>{subjectName}</Title>
        <Text style={styles.subHeader}>Select a chapter to begin</Text>
      </View>

      <FlatList
        data={chapters}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <Animated.View
            style={[
              styles.chapterCard,
              { transform: [{ scale: selectedId === item.id ? scaleValue : 1 }] }
            ]}
          >
            <TouchableRipple
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={() => handleSelectChapter(item)}
              rippleColor="rgba(255,255,255,0.2)"
              style={styles.touchable}
            >
              <View style={styles.cardContent}>
                <View style={styles.chapterIcon}>
                  <MaterialCommunityIcons
                    name="book"
                    size={24}
                    color="#5D53F0"
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.chapterName}>{item.name}</Text>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill,
                          { width: `${item.progress}%` }
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>{item.progress}%</Text>
                  </View>
                </View>
                <View style={styles.rightContent}>
                  {item.testCount > 0 && (
                    <Badge style={styles.badge}>
                      {item.testCount} {item.testCount === 1 ? 'test' : 'tests'}
                    </Badge>
                  )}
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color="#5D53F0"
                  />
                </View>
              </View>
            </TouchableRipple>
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="book-remove-outline"
              size={48}
              color="rgba(255,255,255,0.7)"
            />
            <Text style={styles.emptyText}>No chapters available</Text>
            <Text style={styles.emptySubtext}>
              Check back later or contact your instructor
            </Text>
          </View>
        }
      />
    </View>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
    paddingTop: 60,
  },
  circle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Palette.primaryLight,
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
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 15,
  },
  header: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.onBackground,
    marginBottom: 8,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 16,
    color: Palette.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  chapterCard: {
    backgroundColor: Palette.surfaceLight,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    overflow: 'hidden',
    elevation: 2,
  },
  touchable: {
    padding: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chapterIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.primaryXLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  chapterName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Palette.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: Palette.textMuted,
    minWidth: 40,
    textAlign: 'right',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: colors.primary,
    marginRight: 12,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: colors.onBackground,
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: Palette.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    marginVertical: 16,
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: colors.surface,
  },
  buttonLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
});


export default ChapterSelectionScreen;