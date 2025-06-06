import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Appbar, ActivityIndicator } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

const PdfViewerScreen = ({ navigation, route }) => {
  const { pdfUrl, title, disableDownload = true } = route.params;
  const [loading, setLoading] = useState(true);
  const [viewerUrl, setViewerUrl] = useState(null);

  useEffect(() => {
    const preparePdf = async () => {
      try {
        let finalUrl = pdfUrl;
        
        // Convert gs:// to https:// if needed
        if (pdfUrl.startsWith('gs://')) {
          const storageRef = ref(storage, pdfUrl);
          finalUrl = await getDownloadURL(storageRef);
        }

        // Use Google Docs viewer for secure rendering
        const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(finalUrl)}`;
        setViewerUrl(viewerUrl);
      } catch (error) {
        console.error("Error preparing PDF:", error);
        Alert.alert("Error", "Could not load PDF");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    preparePdf();
  }, [pdfUrl]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={title || 'PDF Viewer'} />
      </Appbar.Header>
      
      <WebView
        source={{ uri: viewerUrl }}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={false}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
          </View>
        )}
        onError={(error) => {
          console.error("WebView Error:", error);
          Alert.alert("Error", "Failed to load PDF");
          navigation.goBack();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PdfViewerScreen;