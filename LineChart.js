import React from 'react';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import Random from "random-js";
const random = new Random();

x1=[41, 5,95,2,7,89,92,53,80,20,74,18,40,48,85,31,85,58,54,32,45,80,17,51
,41,94,69,79,44,90,84,36,81,87,23,97,90,88,97,74,21,68,26,55,64,15,72,50
,37,23,32,23,30,18,89,82,,5,,3,39,48,51,78,60,45,1,2,,5,34,10,77,63,92
,81,39,91,38,12,,0,27,44,11,25,36,,9,36,63,95,5,62,75,84,96,41,21,32,91
,57,93,83,15]
y1=[41, 5,95,2,7,89,92,53,80,20,74,18,40,48,85,31,85,58,54,32,45,80,17,51
  ,41,94,69,79,44,90,84,36,81,87,23,97,90,88,97,74,21,68,26,55,64,15,72,50
  ,37,23,32,23,30,18,89,82,,5,,3,39,48,51,78,60,45,1,2,,5,34,10,77,63,92
  ,81,39,91,38,12,,0,27,44,11,25,36,,9,36,63,95,5,62,75,84,96,41,21,32,91
  ,57,93,83,15]

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

export const options = {
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};
const i =0;
export const data = {
  datasets: [
    {
      label: 'A dataset',
      data: Array.from({ length: 100 }, () => ({
        x: x1[1],
        y: y1[1],
        
      })),
      backgroundColor: 'rgba(255, 99, 132, 1)',
    },
  ],
};

export function App() {
  return <Scatter options={options} data={data} />;
}