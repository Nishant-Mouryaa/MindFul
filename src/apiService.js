import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from './config/config';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(async (config) => {
  console.log('Request to:', config.url); // Debugging
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  response => {
    console.log('Response from:', response.config.url); // Debugging
    return response;
  },
  async error => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      // Consider adding navigation logic here
    }
    return Promise.reject(error);
  }
);

// API Methods
const fetchTextbooks = async () => {
  try {
    const response = await api.get('/textbooks');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Textbooks fetch error:', error);
    return [];
  }
};

const fetchPdfFile = async (filePath) => {
  try {
    const response = await api.get(`/protected/${filePath}`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('PDF fetch error:', error);
    throw error;
  }
};

const fetchTests = async () => {
  try {
    const response = await api.get('/tests');
    if (!response.data) throw new Error('No data returned');
    
    return Array.isArray(response.data) 
      ? response.data.map(test => ({
          ...test,
          id: test._id || test.id,
          questionsCount: test.questions?.length || 0
        }))
      : [];
  } catch (error) {
    console.error('Tests fetch error:', error);
    throw error;
  }
};

const submitTestResults = async (results) => {
  try {
    const response = await api.post('/test-results', results);
    return response.data;
  } catch (error) {
    console.error('Test submission error:', error);
    throw error;
  }
};

export default {
  fetchTextbooks,
  fetchPdfFile,
  fetchTests,
  submitTestResults
};