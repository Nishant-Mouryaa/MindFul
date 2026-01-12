// components/Journal/SearchBar.js
import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { debounce } from 'lodash';
import { Palette, spacing, typography, borderRadius, shadows } from '../../theme/colors';

export default function SearchBar({ 
  onSearch, 
  placeholder = "Search entries...",
  autoFocus = false 
}) {
  const [searchText, setSearchText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Debounce search to avoid too many updates
  const debouncedSearch = useCallback(
    debounce((text) => {
      onSearch(text);
    }, 300),
    [onSearch]
  );

  const handleTextChange = (text) => {
    setSearchText(text);
    debouncedSearch(text);
  };

  const clearSearch = () => {
    setSearchText('');
    onSearch('');
  };

  return (
    <View style={[
      styles.container,
      isFocused && styles.containerFocused
    ]}>
      <MaterialCommunityIcons 
        name="magnify" 
        size={20} 
        color={isFocused ? Palette.primary : Palette.textLight} 
      />
      
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Palette.textLight}
        value={searchText}
        onChangeText={handleTextChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoFocus={autoFocus}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {searchText.length > 0 && (
        <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
          <MaterialCommunityIcons 
            name="close-circle" 
            size={18} 
            color={Palette.textLight} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.card,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
    ...shadows.low,
  },
  containerFocused: {
    borderColor: Palette.primary,
  },
  input: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
    paddingVertical: spacing.xs,
  },
  clearButton: {
    padding: spacing.xs,
  },
});