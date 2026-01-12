// components/ErrorBoundary.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Palette, spacing, typography, borderRadius } from '../theme/colors';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Log error to your error reporting service
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
    
    // You can add error reporting service here
    // Example: Sentry.captureException(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <MaterialCommunityIcons 
              name="alert-circle-outline" 
              size={64} 
              color={Palette.secondaryRed} 
            />
            
            <Text style={styles.title}>Oops! Something went wrong</Text>
            
            <Text style={styles.message}>
              We're sorry, but something unexpected happened. 
              Your journal entries are safe.
            </Text>

            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={this.handleRetry}
            >
              <MaterialCommunityIcons 
                name="refresh" 
                size={20} 
                color={Palette.white} 
              />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details (Dev Only):</Text>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: Palette.textDark,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.body.fontSize,
    color: Palette.textLight,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.secondaryBlue,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  retryButtonText: {
    color: Palette.white,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  errorDetails: {
    marginTop: spacing.xl,
    maxHeight: 200,
    width: '100%',
    backgroundColor: '#f5f5f5',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  errorTitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: Palette.secondaryRed,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
  },
});

export default ErrorBoundary;