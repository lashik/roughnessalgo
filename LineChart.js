import React from 'react';
import { Chart } from 'react-native-charts-wrapper';

const LineChart = ({ gyroData, locationData }) => {
  const labels = [];
  const gyroDataValues = [];
  const locationDataValues = [];

  for (let i = 0; i < gyroData.length; i++) {
    labels.push(i.toString());
    gyroDataValues.push(gyroData[i].x);
    locationDataValues.push(locationData[i].latitude);
  }

  const datasets = [
    {
      data: gyroDataValues,
      label: 'Gyroscopic change in values',
      config: {
        lineWidth: 2,
        color: '#FF0000',
      },
    },
    {
      data: locationDataValues,
      label: 'Current location',
      config: {
        lineWidth: 2,
        color: '#0000FF',
      },
    },
  ];

  return (
    <Chart
      type="line"
      data={{
        labels,
        datasets,
      }}
      options={{
        legend: {
          display: true,
          position: 'top',
        },
      }}
    />
  );
};

export default LineChart;
