import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Gyroscope } from 'expo-sensors';
import Chart from "./Chart";
import * as Location from 'expo-location';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';



ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);


const App = () => {
  
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  const [locationData, setLocationData] = useState({ latitude: 0, longitude: 0 });

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

  const labels = [];
  const gyroDataValues = [];
  const locationDataValues = [];

  useEffect(() => {
    let gyroSubscription;

    const updateGyroData = (data) => {
      setGyroData(() => ({
        x: parseFloat(data.x.toFixed(3)),
        y: parseFloat(data.y.toFixed(3)),
        z: parseFloat(data.z.toFixed(3)) * 0.01 > 0.001 ? parseFloat(data.z.toFixed(3)) : 0
      }));
    };

    const updateGyroSubscription = () => {
      gyroSubscription = Gyroscope.addListener(updateGyroData);
    };

    updateGyroSubscription(); // Initial subscription

    const interval = setInterval(() => {
      gyroSubscription.remove(); // Remove the current subscription
      updateGyroSubscription(); // Create a new subscription
      console.log("im work");
    }, 5000);

    return () => {
      gyroSubscription.remove(); // Clean up the subscription
      clearInterval(interval);
    };
  }, []);

  labels.push(new Date().toLocaleTimeString());

console.log(gyroData);

  const datasets = [
    {
      data: gyroDataValues.filter((value) => {
        let num = value * 0.01;
        let x = num.toFixed(3);
        if (x != 0.000) {
          return true;
        } else {
          return false;
        }
      }),
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
   const options = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  const i =0;

   const data = {
    datasets: [
      {
        label: 'A dataset',
        data: Array.from({ length: 100 }, () => ({
          x: Math.random() * 200 - 100, // Random number between -100 and 100
          y: Math.random() * 200 - 100, // Random number between -100 and 100
        })),
        backgroundColor: 'rgba(255, 99, 132, 1)',
      },
    ],
  };

  return (
    <View style={{ flex: 1 }}>
       <Scatter options={options} data={data} />
      <Text>Permission to access the gyroscope and location sensors is required.</Text>
    </View>
  );
};

export default App;
