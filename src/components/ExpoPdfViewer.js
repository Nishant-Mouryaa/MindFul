import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { ActivityIndicator, Text, Button } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

const ExpoPdfViewer = ({ route, navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfUri, setPdfUri] = useState(null);

  // Validate parameters first
  if (!route?.params?.pdfUrl) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No PDF URL provided</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Go Back
        </Button>
      </View>
    );
  }

  const { pdfUrl, title = 'Document' } = route.params;

  useEffect(() => {
    let isMounted = true;

    const loadPdf = async () => {
      try {
        let finalUrl = pdfUrl;

        // Convert gs:// URL to downloadable URL
        if (pdfUrl.startsWith('gs://')) {
          const storageRef = ref(storage, pdfUrl);
          finalUrl = await getDownloadURL(storageRef);
        }

        if (isMounted) {
          setPdfUri(finalUrl);
          setError(null);
        }
      } catch (err) {
        console.error('PDF loading error:', err);
        if (isMounted) {
          setError('Failed to load PDF. Please try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [pdfUrl]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading document...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          mode="contained" 
          onPress={() => {
            setError(null);
            setIsLoading(true);
            loadPdf();
          }}
          style={styles.button}
        >
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.pdfContainer}>
      <WebView
        source={{ uri: pdfUri }}
        style={styles.webView}
        javaScriptEnabled={false}
        domStorageEnabled={false}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pdfContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    marginTop: 10,
  },
});

export default ExpoPdfViewer;