import React from 'react';
import { Line } from 'react-native-svg';

const gyroDataLine  = ({ labels, datasets }) =>{
  return datasets[0].data.map((value, index) => (
    <Line
      key={index}
      x1={0}
      y1={0}
      x2={labels.length - 1}
      y2={datasets[0].data[labels.length - 1]}
      stroke={styles.line.stroke}
      strokeWidth={styles.line.strokeWidth}
    />
  ));
};

const locationDataLine = ({ labels, datasets }) => {
  return datasets[1].data.map((value, index) => (
    <Line
      key={index}
      x1={0}
      y1={0}
      x2={labels.length - 1}
      y2={datasets[1].data[labels.length - 1]}
      stroke={styles.circle.fill}
      strokeWidth={styles.line.strokeWidth}
    />
  ));
};
