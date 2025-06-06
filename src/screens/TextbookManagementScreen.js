import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, Dimensions, ScrollView, StatusBar } from 'react-native';
import { 
  Appbar, 
  Searchbar, 
  Button, 
  Modal, 
  Portal, 
  TextInput, 
  HelperText, 
  Text, 
  ActivityIndicator,
  Card,
  IconButton,
  Badge,
  Chip,
  Avatar,
  Title,
} from 'react-native-paper';
import { collection, query, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import { Picker } from '@react-native-picker/picker';
import { getApp, getApps } from 'firebase/app';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

if (!getApps().length) {
  throw new Error('Firebase not initialized');
}

const app = getApp();

const TextbookManagementScreen = ({ navigation }) => {
  const [textbooks, setTextbooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTextbook, setCurrentTextbook] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pdfUrl, setPdfUrl] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    board: 'CBSE',
    standard: '',
    subject: '',
    description: '',
  });
  const [errors, setErrors] = useState({});

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Science', 'English', 'History'];
  const boards = ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE'];
  const standards = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

  useEffect(() => {
    loadTextbooks();
  }, []);

  const loadTextbooks = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'textbook'));
      const snapshot = await getDocs(q);
      
      const textbookData = [];
      snapshot.forEach(doc => {
        textbookData.push({ id: doc.id, ...doc.data() });
      });
      
      setTextbooks(textbookData);
    } catch (err) {
      console.error("Error loading textbooks:", err);
      Alert.alert("Error", "Failed to load textbooks");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const filteredTextbooks = textbooks.filter(textbook => {
    const title = textbook.title || '';
    const subject = textbook.subject || '';
    const query = searchQuery.toLowerCase();
    
    return title.toLowerCase().includes(query) || 
           subject.toLowerCase().includes(query);
  });

  const handleAddTextbook = () => {
    setIsEditing(false);
    setCurrentTextbook(null);
    setFormData({
      title: '',
      board: 'CBSE',
      standard: '',
      subject: '',
      description: '',
    });
    setPdfUrl('');
    setVisible(true);
  };

  const handleEditTextbook = (textbook) => {
    setIsEditing(true);
    setCurrentTextbook(textbook);
    setFormData({
      title: textbook.title,
      board: textbook.board,
      standard: textbook.standard.toString(),
      subject: textbook.subject,
      description: textbook.description,
    });
    setPdfUrl(textbook.pdfUrl);
    setVisible(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.board) newErrors.board = 'Board is required';
    if (!formData.standard) newErrors.standard = 'Standard is required';
    if (!formData.subject) newErrors.subject = 'Subject is required';
    if (!pdfUrl) newErrors.pdfUrl = 'PDF file is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      if (!pdfUrl) {
        Alert.alert("Error", "Please upload a PDF file before submitting");
      }
      return;
    }
  
    try {
      setUploading(true);
      
      const textbookData = {
        title: formData.title,
        board: formData.board,
        standard: Number(formData.standard),
        subject: formData.subject,
        description: formData.description,
        pdfUrl: pdfUrl,
        createdAt: new Date(),
      };
  
      if (isEditing && currentTextbook) {
        await updateDoc(doc(db, 'textbook', currentTextbook.id), textbookData);
        Alert.alert("Success", "Textbook updated successfully");
      } else {
        await addDoc(collection(db, 'textbook'), textbookData);
        Alert.alert("Success", "Textbook added successfully");
      }
  
      loadTextbooks();
      setVisible(false);
    } catch (err) {
      console.error("Error saving textbook:", err);
      Alert.alert("Error", "Failed to save textbook: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this textbook?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'textbook', id));
              loadTextbooks();
              Alert.alert("Success", "Textbook deleted successfully");
            } catch (err) {
              console.error("Error deleting textbook:", err);
              Alert.alert("Error", "Failed to delete textbook");
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#3B2454" barStyle="light-content" />
      
      <LinearGradient
        colors={['#3B2454', '#5D3A8E']}
        style={styles.headerContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => navigation.goBack()} color="#fff" />
          <Appbar.Content 
            title="Textbook Manager" 
            titleStyle={styles.headerTitle} 
          />
          <Appbar.Action 
            icon="plus" 
            onPress={handleAddTextbook} 
            color="#fff"
          />
        </Appbar.Header>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search textbooks..."
            onChangeText={handleSearch}
            value={searchQuery}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
            iconColor="#7c4dff"
            placeholderTextColor="#9e9e9e"
            elevation={1}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7c4dff" />
            <Text style={styles.loadingText}>Loading textbooks...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTextbooks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Card 
                style={styles.card}
                onPress={() => navigation.navigate('PdfViewer', { 
                  pdfUrl: item.pdfUrl, 
                  title: item.title 
                })}
              >
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleContainer}>
                      <Icon name="book-open-variant" size={20} color="#7c4dff" style={styles.cardIcon} />
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                    </View>
                    <View style={styles.cardActions}>
                      <IconButton 
                        icon="pencil-outline" 
                        size={20}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleEditTextbook(item);
                        }}
                        iconColor="#7c4dff"
                        style={styles.actionButton}
                      />
                      <IconButton 
                        icon="delete-outline" 
                        size={20}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        iconColor="#ff5252"
                        style={styles.actionButton}
                      />
                    </View>
                  </View>
                  <View style={styles.cardDetails}>
                    <Chip 
                      mode="outlined" 
                      style={styles.boardChip}
                      textStyle={styles.boardChipText}
                    >
                      {item.board}
                    </Chip>
                    <Chip 
                      mode="outlined" 
                      style={styles.classChip}
                      textStyle={styles.classChipText}
                    >
                      Class {item.standard}
                    </Chip>
                    <Chip 
                      mode="outlined" 
                      style={styles.subjectChip}
                      textStyle={styles.subjectChipText}
                    >
                      {item.subject}
                    </Chip>
                  </View>
                  {item.description && (
                    <Text style={styles.cardDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                  <View style={styles.cardFooter}>
                    <Button 
                      mode="contained-tonal" 
                      icon="file-pdf-box" 
                      onPress={(e) => {
                        e.stopPropagation();
                        navigation.navigate('PdfViewer', { 
                          pdfUrl: item.pdfUrl, 
                          title: item.title 
                        });
                      }}
                      style={styles.viewButton}
                      labelStyle={styles.viewButtonLabel}
                      compact
                    >
                      View PDF
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="book-remove-outline" size={48} color="#9e9e9e" />
                <Title style={styles.emptyTitle}>No Textbooks Found</Title>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'Try a different search' : 'Add your first textbook'}
                </Text>
                <Button 
                  mode="contained" 
                  onPress={handleAddTextbook}
                  style={styles.addButton}
                  labelStyle={styles.addButtonLabel}
                  icon="plus"
                >
                  Add Textbook
                </Button>
              </View>
            }
          />
        )}
      </View>

      <Portal>
        <Modal 
          visible={visible} 
          onDismiss={() => setVisible(false)}
          style={styles.modal}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView 
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalHeader}>
              <Icon 
                name={isEditing ? "book-edit-outline" : "book-plus-outline"} 
                size={32} 
                color="#7c4dff" 
                style={styles.modalIcon}
              />
              <Title style={styles.modalTitle}>
                {isEditing ? 'Edit Textbook' : 'Add Textbook'}
              </Title>
            </View>
            
            <TextInput
              label="Textbook Title"
              value={formData.title}
              onChangeText={(text) => setFormData({...formData, title: text})}
              style={styles.input}
              mode="outlined"
              error={!!errors.title}
              theme={{ colors: { primary: '#7c4dff' } }}
              left={<TextInput.Icon icon="format-title" color="#9e9e9e" />}
            />
            {errors.title && <HelperText type="error">{errors.title}</HelperText>}
            
            <TextInput
              label="Description (Optional)"
              value={formData.description}
              onChangeText={(text) => setFormData({...formData, description: text})}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
              theme={{ colors: { primary: '#7c4dff' } }}
              left={<TextInput.Icon icon="text" color="#9e9e9e" />}
            />
            
            <View style={styles.formRow}>
              <View style={styles.dropdownContainer}>
                <Text style={styles.dropdownLabel}>Education Board</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.board}
                    onValueChange={(value) => setFormData({...formData, board: value})}
                    dropdownIconColor="#7c4dff"
                  >
                    {boards.map(board => (
                      <Picker.Item key={board} label={board} value={board} />
                    ))}
                  </Picker>
                </View>
              </View>
              
              <View style={styles.dropdownContainer}>
                <Text style={styles.dropdownLabel}>Class</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.standard}
                    onValueChange={(value) => setFormData({...formData, standard: value})}
                    dropdownIconColor="#7c4dff"
                  >
                    <Picker.Item label="Select Class" value="" />
                    {standards.map(std => (
                      <Picker.Item key={std} label={`Class ${std}`} value={std} />
                    ))}
                  </Picker>
                </View>
                {errors.standard && <HelperText type="error">{errors.standard}</HelperText>}
              </View>
            </View>
            
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownLabel}>Subject</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.subject}
                  onValueChange={(value) => setFormData({...formData, subject: value})}
                  dropdownIconColor="#7c4dff"
                >
                  <Picker.Item label="Select Subject" value="" />
                  {subjects.map(subject => (
                    <Picker.Item key={subject} label={subject} value={subject} />
                  ))}
                </Picker>
              </View>
              {errors.subject && <HelperText type="error">{errors.subject}</HelperText>}
            </View>
            
            <View style={styles.fileUploadContainer}>
              <Text style={styles.fileUploadLabel}>PDF URL *</Text>
              <TextInput
                label="Enter PDF URL"
                value={pdfUrl}
                onChangeText={setPdfUrl}
                style={styles.input}
                mode="outlined"
                error={!!errors.pdfUrl}
                placeholder="https://firebasestorage.googleapis.com/..."
                theme={{ colors: { primary: '#7c4dff' } }}
                left={<TextInput.Icon icon="file-pdf-box" color="#9e9e9e" />}
              />
              {errors.pdfUrl && (
                <HelperText type="error" visible={!!errors.pdfUrl}>
                  {errors.pdfUrl}
                </HelperText>
              )}
              {pdfUrl && (
                <Button 
                  mode="text" 
                  icon="file-eye-outline" 
                  onPress={() => navigation.navigate('PdfViewer', { pdfUrl })}
                  labelStyle={styles.viewFileLabel}
                  style={{ marginTop: 8 }}
                  compact
                >
                  Preview PDF
                </Button>
              )}
            </View>
            
            <View style={styles.modalButtons}>
              <Button 
                mode="outlined" 
                onPress={() => setVisible(false)}
                style={styles.cancelButton}
                labelStyle={styles.cancelButtonLabel}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={handleSubmit}
                style={styles.saveButton}
                loading={uploading}
                disabled={uploading}
                labelStyle={styles.saveButtonLabel}
              >
                {isEditing ? 'Save Changes' : 'Add Textbook'}
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  headerContainer: {
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 10,
  },
  header: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    marginTop: StatusBar.currentHeight,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchbar: {
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 1,
  },
  searchInput: {
    color: '#2d3436',
    minHeight: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#636e72',
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    backgroundColor: '#fff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3436',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
  },
  actionButton: {
    margin: 0,
    marginLeft: 4,
  },
  cardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  boardChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f3e5ff',
    borderColor: '#d1c4e9',
  },
  boardChipText: {
    color: '#7c4dff',
    fontSize: 12,
    fontWeight: '500',
  },
  classChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#e1f5fe',
    borderColor: '#b3e5fc',
  },
  classChipText: {
    color: '#0288d1',
    fontSize: 12,
    fontWeight: '500',
  },
  subjectChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#e8f5e9',
    borderColor: '#c8e6c9',
  },
  subjectChipText: {
    color: '#388e3c',
    fontSize: 12,
    fontWeight: '500',
  },
  cardDescription: {
    fontSize: 14,
    color: '#636e72',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  viewButton: {
    borderRadius: 8,
    backgroundColor: '#ede7f6',
  },
  viewButtonLabel: {
    color: '#7c4dff',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d3436',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#636e72',
    marginBottom: 24,
    textAlign: 'center',
  },
  addButton: {
    borderRadius: 12,
    backgroundColor: '#7c4dff',
    paddingHorizontal: 24,
  },
  addButtonLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalScroll: {
    width: '100%',
  },
  modalContent: {
    padding: 24,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIcon: {
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2d3436',
    textAlign: 'center',
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dropdownContainer: {
    flex: 1,
    marginBottom: 16,
  },
  dropdownLabel: {
    marginBottom: 8,
    fontSize: 14,
    color: '#636e72',
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  fileUploadContainer: {
    marginBottom: 16,
  },
  fileUploadLabel: {
    marginBottom: 8,
    fontSize: 14,
    color: '#636e72',
    fontWeight: '500',
  },
  viewFileLabel: {
    color: '#7c4dff',
    fontSize: 12,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 0.48,
    borderRadius: 12,
    borderColor: '#b2bec3',
  },
  cancelButtonLabel: {
    color: '#636e72',
    fontWeight: '500',
  },
  saveButton: {
    flex: 0.48,
    borderRadius: 12,
    backgroundColor: '#7c4dff',
  },
  saveButtonLabel: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default TextbookManagementScreen;