import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';

export async function uploadPDF(fileUri, storagePath) {
  try {
    console.log(`[Upload] Starting upload of ${fileUri} to ${storagePath}`);
    
    // 1. File Validation
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error(`File not found at URI: ${fileUri}`);
    }
    console.log(`[Upload] File size: ${(fileInfo.size / 1024).toFixed(2)} KB`);

    // 2. Blob Creation with multiple methods
    let blob;
    try {
      // Method 1: XHR (most reliable)
      blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => {
          if (xhr.response) {
            resolve(xhr.response);
          } else {
            reject(new Error('Empty response from XHR'));
          }
        };
        xhr.onerror = () => reject(new Error('XHR request failed'));
        xhr.responseType = 'blob';
        xhr.open('GET', fileUri, true);
        xhr.send(null);
      });
    } catch (xhrError) {
      console.log('[Upload] XHR failed, trying fetch...', xhrError);
      
      // Method 2: Fetch with timeout
      try {
        const response = await Promise.race([
          fetch(fileUri),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Network timeout after 15s')), 15000))
        ]);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        blob = await response.blob();
      } catch (fetchError) {
        console.log('[Upload] Fetch failed, trying base64...', fetchError);
        
        // Method 3: Base64 fallback
        const base64 = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const response = await fetch(
          `data:application/pdf;base64,${base64}`
        );
        blob = await response.blob();
      }
    }

    if (!blob || blob.size === 0) {
      throw new Error('Created blob is invalid (0 bytes)');
    }

    // 3. Prepare Storage Upload
    const storageRef = ref(storage, storagePath);
    const metadata = {
      contentType: 'application/pdf',
      customMetadata: {
        originalUri: fileUri,
        uploadedAt: new Date().toISOString()
      }
    };

    // 4. Upload with progress tracking
    console.log('[Upload] Starting Firebase upload...');
    const uploadTask = uploadBytes(storageRef, blob, metadata);
    
    await Promise.race([
      uploadTask,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout after 60s')), 60000))
    ]);

    // 5. Get Download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log('[Upload] Upload successful:', downloadURL);
    
    return downloadURL;

  } catch (error) {
    console.error('[Upload] Failed:', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      fileUri,
      storagePath
    });
    
    let errorMessage = 'Upload failed';
    if (error.code === 'storage/unknown') {
      errorMessage = 'Network error - check your connection';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Operation timed out - try again';
    }
    
    throw new Error(`${errorMessage} (${error.message})`);
  }
}