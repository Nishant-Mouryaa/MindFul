// AppContext.js
import React, { createContext, useState, useEffect } from 'react';
import { fetchTests } from './apiService'; // Your API service for tests

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadTests = async () => {
    setLoading(true);
    try {
      console.log('Starting tests fetch...');
      const testsData = await apiService.fetchTests();
      console.log('Received tests data:', testsData);
      setTests(testsData);
    } catch (error) {
      console.error('Fetch error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContext.Provider value={{ tests, setTests, loading, error, loadTests }}>
      {children}
    </AppContext.Provider>
  );
};
