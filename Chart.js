import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const Chart = ({ datasets, labels }) => {
  const [chartData, setChartData] = useState({
    datasets: datasets,
    labels: labels,
  });
  const screenWidth = Dimensions.get('window').width; // get device screen width
  const screenHeight = Dimensions.get('window').height; // get device screen height

  const handleChartDataUpdate = (newDatasets) => {
    setChartData({
      datasets: newDatasets,
      labels: labels,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>My Chart</Text>
      <LineChart
        data={chartData}
        width={screenWidth - 5}
        height={screenHeight * 0.5} // set chart height to half of the screen height
        yAxisLabel="$"
        chartConfig={{
          backgroundColor: 'transparent',
          strokeWidth: 2,
          barPercentage: 0.5,
          decimalPlaces: 2,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default Chart;
