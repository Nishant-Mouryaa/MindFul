import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
  LayoutAnimation,
  UIManager,
  Animated,
  Easing,
} from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db, storage } from '../../config/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Palette } from '../../theme/colors';   
import { useNavigation } from '@react-navigation/native';
import { Title } from 'react-native-paper';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Color mapping for specific subjects (used in textbook cards)
const subjectColors = {
  Mathematics: '#5D53F0',
  Physics: '#FB5A9D',
  Chemistry: '#FF8C42',
  Reasoning: '#FFD42D',
  Biology: '#E17055',
  Science: '#00B894',
  English: '#FD79A8',
  History: '#FDCB6E',
};

// Available boards and standards
const availableBoards = ['CBSE', 'ICSE', 'State Board', 'IB'];
const availableStandards = [6, 7, 8, 9, 10, 11, 12];

// Optional: additional descriptive text/icons for each board
const boardInfo = {
  CBSE: {
    icon: 'book-education',
    tagline: 'Empowering Future Leaders',
  },
  ICSE: {
    icon: 'school-outline',
    tagline: 'Comprehensive Skill-Building',
  },
  'State Board': {
    icon: 'map-marker-school',
    tagline: 'Local Curriculum, Modern Approach',
  },
  IB: {
    icon: 'earth',
    tagline: 'Global Resources, Global Mindset',
  },
};

// Similarly, define standard/class info
const standardInfo = {
  6: {
    icon: 'numeric-6-box-outline',
    tagline: 'Building Strong Foundations',
  },
  7: {
    icon: 'numeric-7-box-outline',
    tagline: 'Stepping Up Your Skills',
  },
  8: {
    icon: 'numeric-8-box-outline',
    tagline: 'Exploring Bigger Ideas',
  },
  9: {
    icon: 'numeric-9-box-outline',
    tagline: 'Broadening Perspectives',
  },
  10: {
    icon: 'numeric-10-box-outline',
    tagline: 'Focusing on Key Goals',
  },
  11: {
    icon: 'numeric-11-box-outline',
    tagline: 'Refining Your Expertise',
  },
  12: {
    icon: 'numeric-12-box-outline',
    tagline: 'Preparing for the Future',
  },
};

// Constants for card sizing
const CARD_HEIGHT = 100;
const CARD_SPACING = 18;

const TextbooksScreen = ({ navigation }) => {
  const { colors } = useTheme();
const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const [textbooks, setTextbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [selectedStandard, setSelectedStandard] = useState(null);
  const [selectionStep, setSelectionStep] = useState('board'); // 'board', 'standard', 'textbooks'

  // Animated opacity for fade-in effects
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Once user has chosen board + standard, load textbooks
  useEffect(() => {
    if (selectedBoard && selectedStandard) {
      loadTextbooks();
    }
  }, [selectedBoard, selectedStandard]);

  // Fade in on mount or when the step changes
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, [selectionStep, fadeAnim]);

  // Fetch textbooks for selected board/standard
  const loadTextbooks = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLoading(true);
    setError(null);
    setSelectionStep('textbooks');

    try {
      const q = query(
        collection(db, 'textbook'),
        where('board', '==', selectedBoard),
        where('standard', '==', selectedStandard),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setTextbooks([]);
        setLoading(false);
        return;
      }

      const textbookData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          let pdfUrl = data.pdfUrl;

          // Convert gs:// to HTTPS (Firebase Storage)
          if (pdfUrl && pdfUrl.startsWith('gs://')) {
            try {
              const storageRef = ref(storage, pdfUrl);
              pdfUrl = await getDownloadURL(storageRef);
            } catch (err) {
              console.error('Error converting URL:', err);
            }
          }

          return {
            id: doc.id,
            ...data,
            pdfUrl,
            Description: data.description || '',
          };
        })
      );

      setTextbooks(textbookData);
    } catch (err) {
      console.error('Error loading textbooks:', err);
      setError('Failed to load textbooks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const onBoardSelect = (board) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedBoard(board);
    setSelectionStep('standard');
  };

  const onStandardSelect = (standard) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedStandard(standard);
  };

  // 1) Board selection screen
  const renderBoardSelection = () => (
    <Animated.View style={[styles.selectionContainer, { opacity: fadeAnim }]}>
      <Title style={styles.selectionTitle}>Select Your Board</Title>
      <Text style={styles.selectionSubtitle}>
        We’ve curated boards to match your curriculum. Pick one to proceed!
      </Text>

      <ScrollView
        contentContainerStyle={styles.boardListContainer}
        showsVerticalScrollIndicator={false}
      >
        {availableBoards.map((board) => {
          const info = boardInfo[board] || {
            icon: 'school',
            tagline: 'Explore Our Resources',
          };

          return (
            <TouchableOpacity
              key={board}
              style={styles.boardCard}
              activeOpacity={0.85}
              onPress={() => onBoardSelect(board)}
            >
              <View style={styles.boardCardContent}>
                <View style={styles.boardIconContainer}>
                  <Icon name={info.icon} size={28} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.boardTitle}>{board}</Text>
                  <Text style={styles.boardTagline}>{info.tagline}</Text>
                </View>
                <Icon name="chevron-right" size={24} color="#fff" />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Animated.View>
  );

  // 2) Class (standard) selection screen (updated to match board styling)
  const renderStandardSelection = () => (
    <Animated.View style={[styles.selectionContainer, { opacity: fadeAnim }]}>
      <Title style={styles.selectionTitle}>Select Your Class</Title>
      <Text style={styles.selectionSubtitle}>
        Each class is designed to build on your progress. Pick your level!
      </Text>

      <View style={styles.backButtonContainer}>
        <Button
          icon="arrow-left"
          mode="text"
          onPress={() => setSelectionStep('board')}
          textColor="#fff"
        >
          Back
        </Button>
      </View>

      <ScrollView
        contentContainerStyle={styles.boardListContainer}
        showsVerticalScrollIndicator={false}
      >
        {availableStandards.map((std) => {
          const info = standardInfo[std] || {
            icon: 'school',
            tagline: 'Explore Our Resources',
          };

          const isSelected = selectedStandard === std;
          return (
            <TouchableOpacity
              key={std}
              style={[
                styles.boardCard,
                isSelected && { backgroundColor: 'rgba(255,255,255,0.25)' },
              ]}
              activeOpacity={0.85}
              onPress={() => onStandardSelect(std)}
            >
              <View style={styles.boardCardContent}>
                <View style={styles.boardIconContainer}>
                  <Icon name={info.icon} size={28} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.boardTitle}>Class {std}</Text>
                  <Text style={styles.boardTagline}>{info.tagline}</Text>
                </View>
                <Icon
                  name={isSelected ? 'check-circle-outline' : 'chevron-right'}
                  size={24}
                  color="#fff"
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Animated.View>
  );

  // 3) Render a single textbook card in the final list
  const renderCard = ({ item, index }) => {
    const bgColor = subjectColors[item.subject] || '#6C5CE7';
    return (
      <TouchableOpacity
        style={[
          styles.textbookCard,
          {
            backgroundColor: bgColor,
            marginTop: index === 0 ? 0 : -CARD_SPACING,
            zIndex: textbooks.length - index,
          },
        ]}
        onPress={() =>
          navigation.navigate('PdfViewer', {
            pdfUrl: item.pdfUrl,
            title: item.title,
            disableDownload: true,
          })
        }
        activeOpacity={0.9}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardIcon}>
            <Icon name="book-open-page-variant" size={28} color="#fff" />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.subjectBadge}>
              <Text style={styles.subjectText}>{item.subject}</Text>
            </View>
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.Description}
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color="#fff" />
        </View>
      </TouchableOpacity>
    );
  };

  // Step-based rendering:

  // A) Board selection
  if (selectionStep === 'board') {
    return (
      <View style={styles.screenContainer}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        {renderBoardSelection()}
      </View>
    );
  }

  // B) Class (standard) selection
  if (selectionStep === 'standard') {
    return (
      <View style={styles.screenContainer}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        {renderStandardSelection()}
      </View>
    );
  }

  // C) Loading
  if (loading) {
    return (
      <View style={styles.screenContainer}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading textbooks...</Text>
        </View>
      </View>
    );
  }

  // D) Error screen
  if (error) {
    return (
      <View style={styles.screenContainer}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={50} color="#ff5252" />
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadTextbooks}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <Button
            mode="contained"
            style={styles.backToSelectionButton}
            onPress={() => setSelectionStep('board')}
          >
            Change Board/Class
          </Button>
        </View>
      </View>
    );
  }

  // E) Empty list
  if (textbooks.length === 0 && !loading) {
    return (
      <View style={styles.screenContainer}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.emptyContainer}>
          <Icon name="book-remove-outline" size={50} color="#a5a5a5" />
          <Text style={styles.emptyTitle}>No Textbooks Available</Text>
          <Text style={styles.emptyText}>
            There are currently no textbooks for {selectedBoard} Class {selectedStandard}.
          </Text>
          <Button
            mode="contained"
            style={styles.backToSelectionButton}
            onPress={() => setSelectionStep('board')}
          >
            Change Board/Class
          </Button>
        </View>
      </View>
    );
  }

  // F) Final textbooks list
  return (
    <View style={styles.screenContainer}>
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButtonHeader}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setSelectionStep('standard');
            }}
          >
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Textbooks</Text>
          <Text style={styles.headerSubtitle}>
            {selectedBoard} / Class {selectedStandard}
          </Text>
        </View>

        <View style={styles.cardListWrapper}>
          <FlatList
            data={textbooks}
            renderItem={renderCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cardListContainer}
          />
        </View>
      </Animated.View>
    </View>
  );
};

// Styles
const makeStyles = (colors) => StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Palette.primaryDark,
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
  selectionContainer: {
    flex: 1,
    paddingHorizontal: 24,

  },
  selectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.onBackground,
    marginTop: 30,
    marginBottom: 8,
    textAlign: 'center',
  },
  selectionSubtitle: {
    fontSize: 14,
    color: Palette.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  boardListContainer: {
    paddingHorizontal: 4,
    paddingBottom: 30,
  },
  boardCard: {
    backgroundColor: Palette.bg,
    borderRadius: 12,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  boardCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  boardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.onBackground,
  },
  boardTagline: {
    marginTop: 2,
    fontSize: 13,
    color: Palette.textMuted,
  },
  backButtonContainer: {
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'flex-start',
    marginTop: 10,
    justifyContent: 'center',
  },
  backButtonHeader: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 10,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.onBackground,
    marginLeft: 48,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Palette.textMuted,
    marginLeft: 48,
    marginTop: 6,
    fontWeight: '500',
  },
  cardListWrapper: {
    flex: 1,
    marginTop: 10,
    paddingHorizontal: 16,
  },
  cardListContainer: {
    paddingBottom: 40,
  },
  textbookCard: {
    height: CARD_HEIGHT,
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
    position: 'relative',
    elevation: 6,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Palette.primaryXLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onBackground,
    marginBottom: 4,
    textShadowColor: Palette.shadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  subjectBadge: {
    backgroundColor: Palette.primaryXLight,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  subjectText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onBackground,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardDescription: {
    fontSize: 13,
    color: Palette.textMuted,
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.onBackground,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    color: colors.onBackground,
    marginVertical: 16,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 16,
    color: Palette.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  retryButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  backToSelectionButton: {
    marginTop: 20,
    backgroundColor: colors.surface,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 24,
    color: colors.onBackground,
    marginVertical: 16,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 15,
    color: Palette.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '80%',
  },
});


export default TextbooksScreen;
