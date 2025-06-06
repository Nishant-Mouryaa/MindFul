import React from 'react';
import { View, StyleSheet, Animated, StatusBar } from 'react-native';
import { 
  Title, 
  TextInput, 
  Button, 
  HelperText, 
  Appbar,
  IconButton,
  Avatar,
  Text,
} from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const TestManagementHeader = React.memo(
  ({
    formVisible,
    formAnim,
    newTestTitle,
    setNewTestTitle,
    newTestDescription,
    setNewTestDescription,
    newTestTimeLimit,
    setNewTestTimeLimit,
    newTestTotalMarks,
    setNewTestTotalMarks,
    error,
    editingTest,
    toggleForm,
    handleSubmitTest,
    navigation,
  }) => {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#3B2454', '#5D3A8E']}
          style={styles.headerContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Appbar.Header style={styles.header}>
            <Appbar.BackAction onPress={() => navigation.goBack()} color="#fff" />
            <Appbar.Content 
              title="Test Management" 
              titleStyle={styles.headerTitle} 
            />
          </Appbar.Header>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.headerContent}>
            <Avatar.Icon 
              size={48} 
              icon="file-document-edit-outline" 
              style={styles.headerIcon}
              color="#7c4dff"
            />
            <Title style={styles.sectionTitle}>Manage Your Tests</Title>
            <Text style={styles.sectionSubtitle}>
              {editingTest ? 'Edit existing test' : 'Create new assessments'}
            </Text>
          </View>

          <Button 
            mode="contained" 
            onPress={toggleForm}
            style={styles.toggleButton}
            labelStyle={styles.toggleButtonLabel}
            icon={formVisible ? "close" : editingTest ? "pencil" : "plus"}
          >
            {formVisible ? 'Cancel' : editingTest ? 'Edit Test' : 'Add New Test'}
          </Button>

          {formVisible && (
            <Animated.View
              style={[
                styles.form,
                {
                  opacity: formAnim,
                  transform: [
                    {
                      translateY: formAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TextInput
                label="Test Title"
                mode="outlined"
                value={newTestTitle}
                onChangeText={setNewTestTitle}
                style={styles.input}
                left={<TextInput.Icon icon="format-title" />}
                theme={{ colors: { primary: '#7c4dff' } }}
              />
              <TextInput
                label="Description"
                mode="outlined"
                value={newTestDescription}
                onChangeText={setNewTestDescription}
                style={styles.input}
                multiline
                numberOfLines={3}
                left={<TextInput.Icon icon="text" />}
                theme={{ colors: { primary: '#7c4dff' } }}
              />
              <View style={styles.formRow}>
                <TextInput
                  label="Time Limit (mins)"
                  mode="outlined"
                  value={newTestTimeLimit}
                  onChangeText={setNewTestTimeLimit}
                  keyboardType="numeric"
                  style={[styles.input, styles.halfInput]}
                  left={<TextInput.Icon icon="clock-outline" />}
                  theme={{ colors: { primary: '#7c4dff' } }}
                />
                <TextInput
                  label="Total Marks"
                  mode="outlined"
                  value={newTestTotalMarks}
                  onChangeText={setNewTestTotalMarks}
                  keyboardType="numeric"
                  style={[styles.input, styles.halfInput]}
                  left={<TextInput.Icon icon="scoreboard-outline" />}
                  theme={{ colors: { primary: '#7c4dff' } }}
                />
              </View>
              
              {error && (
                <HelperText type="error" style={styles.errorText}>
                  <Icon name="alert-circle-outline" size={16} /> {error}
                </HelperText>
              )}
              
              <Button 
                mode="contained" 
                onPress={handleSubmitTest} 
                style={styles.submitButton}
                labelStyle={styles.submitButtonLabel}
                icon={editingTest ? "content-save" : "plus"}
              >
                {editingTest ? 'Update Test' : 'Create Test'}
              </Button>
            </Animated.View>
          )}
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f7',
  },
  headerContainer: {
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
    padding: 16,
    backgroundColor: '#f5f5f7',
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    backgroundColor: '#f3e5ff',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 4,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#636e72',
    textAlign: 'center',
  },
  toggleButton: {
    borderRadius: 12,
    backgroundColor: '#7c4dff',
    marginBottom: 16,
  },
  toggleButtonLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  errorText: {
    marginBottom: 16,
    fontSize: 14,
    color: '#ff5252',
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButton: {
    borderRadius: 12,
    backgroundColor: '#7c4dff',
    marginTop: 8,
  },
  submitButtonLabel: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default TestManagementHeader;