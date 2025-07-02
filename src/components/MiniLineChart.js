import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, borderRadius } from '../theme/colors';

export const MiniLineChart = ({ data }) => {
  if (!data || !data.datasets || !data.datasets[0]) {
    return null;
  }
  return (
    <View style={styles.chartContainer}>
      {data.datasets[0].data.map((value, index) => {
        const barHeight = typeof value === 'number' ? value * 10 : 0;
        return (
          <View
            key={index}
            style={[
              styles.chartBar,
              {
                height: barHeight,
                backgroundColor: data.datasets[0].color(),
              },
            ]}
          >
            <Text style={styles.chartLabel}>{data.labels[index]}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginVertical: 10,
  },
  chartBar: {
    width: 30,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartLabel: {
    fontSize: 10,
    color: '#fff',
    marginBottom: 4,
  },
});




