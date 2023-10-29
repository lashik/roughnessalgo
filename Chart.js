import React from "react";
import { Svg, Line, Circle } from "react-native-svg";
import {StyleSheet } from 'react-native';
const Chart = ({ labels, datasets }) => {
  const styles = StyleSheet.create({
    svg: {
      width: "100%",
      height: "100%",
    },
    line: {
      strokeWidth: 2,
      stroke: "#FF0000",
    },
    circle: {
      r: 5,
      fill: "#0000FF",
    },
  });

  const gyroDataLine = (
    <Line
      x1={0}
      y1={0}
      x2={labels.length() - 1}
      y2={datasets[0].data[labels.length() - 1]}
      stroke={styles.line.stroke}
      strokeWidth={styles.line.strokeWidth}
    />
  );

  const locationDataLine = (
    <Line
      x1={0}
      y1={0}
      x2={labels.length - 1}
      y2={datasets[1].data[labels.length - 1]}
      stroke={styles.circle.fill}
      strokeWidth={styles.line.strokeWidth}
    />
  );

  const gyroDataPoints = datasets[0].data.map((value, index) => (
    <Circle
      key={index}
      cx={index}
      cy={value}
      r={styles.circle.r}
      fill={styles.circle.fill}
    />
  ));

  const locationDataPoints = datasets[1].data.map((value, index) => (
    <Circle
      key={index}
      cx={index}
      cy={value}
      r={styles.circle.r}
      fill={styles.circle.fill}
    />
  ));

  return (
    <Svg style={styles.svg}>
      {gyroDataLine}
      {locationDataLine}
      {gyroDataPoints}
      {locationDataPoints}
    </Svg>
  );
};

export default Chart;
