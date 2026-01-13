// components/Journal/SearchBar.js - Compact Mobile-Optimized Version
import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { debounce } from 'lodash';
import { Palette, spacing, typography, borderRadius, shadows } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_SMALL_DEVICE = SCREEN_WIDTH < 375;

export default function SearchBar({ 
  onSearch, 
  placeholder = "Search entries...",
  autoFocus = false,
  compact = false,
}) {
  const [searchText, setSearchText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

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
      compact && styles.containerCompact,
      isFocused && styles.containerFocused
    ]}>
      <MaterialCommunityIcons 
        name="magnify" 
        size={compact ? 18 : 20} 
        color={isFocused ? Palette.primary : Palette.textLight} 
      />
      
      <TextInput
        style={[styles.input, compact && styles.inputCompact]}
        placeholder={IS_SMALL_DEVICE ? "Search..." : placeholder}
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
        <TouchableOpacity 
          onPress={clearSearch} 
          style={styles.clearButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons 
            name="close-circle" 
            size={16} 
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
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  containerCompact: {
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
  },
  containerFocused: {
    borderColor: Palette.primary,
    backgroundColor: Palette.white,
  },
  input: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.body.fontSize,
    color: Palette.textDark,
    paddingVertical: 2,
  },
  inputCompact: {
    fontSize: typography.caption.fontSize,
    marginLeft: spacing.xs,
  },
  clearButton: {
    padding: 4,
  },
});