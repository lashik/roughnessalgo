import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Gyroscope } from "expo";
import Chart from "./Chart";
import * as Location from 'expo-location';
const App = () => {
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  const [locationData, setLocationData] = useState({ latitude: 0, longitude: 0 });
  //const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    // Ask for permission to access the gyroscope and location sensors.
    (async () => {
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocationData(location);
    })();
  }, []);

  useEffect(() => {
    // Subscribe to the gyroscope and location sensors.
    const gyroSubscription = Gyroscope.addListener((data) => {
      setGyroData(data);
    });

    
    return () => {
      gyroSubscription.remove();
    };
  });

  // Plot the change in values and the current location in a graph.
  const labels = [];
  const gyroDataValues = [];
  const locationDataValues = [];

  for (let i = 0; i < gyroData.length; i++) {
    labels.push(i.toString());
    gyroDataValues.push(gyroData[i].x);
    locationDataValues.push(locationData.latitude);
  }

  const datasets = [
    {
      data: gyroDataValues,
      label: "Gyroscopic change in values",
      config: {
        lineWidth: 2,
        color: "#FF0000",
      },
    },
    {
      data: locationDataValues,
      label: "Current location",
      config: {
        lineWidth: 2,
        color: "#0000FF",
      },
    },
  ];

  return (
    <View style={{ flex: 1 }}>
        <Chart
          type="line"
          data={{
            labels,
            datasets,
          }}
          options={{
            legend: {
              display: true,
              position: "top",
            },
          }}
        />
        <Text>Permission to access the gyroscope and location sensors is required.</Text>
      
    </View>
  );
};

export default App;
