// components/HierarchicalSelection.js
import React from 'react';
import { FlatList, TouchableOpacity, View, Text } from 'react-native';
import { useTheme } from 'react-native-paper';

const HierarchicalSelection = ({ data, onSelect, titleKey = 'name' }) => {
  const { colors } = useTheme();

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => onSelect(item)}
      style={{
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
      }}
    >
      <Text style={{ fontSize: 18 }}>{item[titleKey]}</Text>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
};

export default HierarchicalSelection;