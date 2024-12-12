import React, { useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer
} from 'recharts';
import { CategoricalChartState } from 'recharts/types/chart/types';
import './index.css'
//import { Card } from '@/components/ui/card';

interface Category {
  name: string;
  color: string;
}

interface CategoryValues {
  [key: string]: number;
}

interface ChartDataPoint {
  category: string;
  value: number;
  hoverValue: number;
  fullMark: number;
}

const CATEGORIES: Category[] = [
  { name: 'Helse', color: '#4267b6' },
  { name: 'Jobb', color: '#7ED321' },
  { name: 'Kjærlighet', color: '#c93939' },
  { name: 'Personlig utvikling', color: '#e48820' },
  { name: 'Venner og familie', color: '#e6e34a' },
  { name: 'Økonomi', color: '#3c801c' },
  { name: 'Moro og avkobling', color: '#a346a7' },
  { name: 'Hjem og omgivelser', color: '#3dbead' },
];

const LifeWheel = () => {
  const [values, setValues] = useState<CategoryValues>(
    CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.name]: 0 }), {})
  );
  const [hoveredValues, setHoveredValues] = useState<CategoryValues>(
    CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.name]: 0 }), {})
  );
  
  const data: ChartDataPoint[] = CATEGORIES.map(cat => ({
    category: cat.name,
    value: values[cat.name],
    hoverValue: hoveredValues[cat.name],
    fullMark: 10,
  }));

  const handleMouseMove = (nextState: CategoricalChartState) => {
    if (nextState?.activePayload?.[0]) {
      const category = nextState.activePayload[0].payload.category;
      const chartRadius = nextState.activeCoordinate?.outerRadius ?? 1000;
      const mouseRadius = nextState.activeCoordinate?.radius ?? 0;
      
      const value = Math.min(
        Math.max(
          Math.round(10*(mouseRadius / chartRadius)),
          0
        ),
        10
      );
      console.log(category, value);
      setHoveredValues(prev => ({
        ...prev,
        [category]: value
      }));
    }
  };

  const handleClick = () => {
    setValues(hoveredValues);
  };

  return (
      <div className="chartContainer">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            data={data}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
          >
            <PolarGrid />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: '#666', fontSize: 14 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 10]}
              tick={{ fill: '#666' }}
            />
            <Radar
              name="Value"
              dataKey="value"
              stroke="none"
              fill="#8884d8"
              fillOpacity={0.8}
            />
            <Radar
              name="Hover"
              dataKey="hoverValue"
              stroke="none"
              fill="#82ca9d"
              fillOpacity={0.5}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
  );
};

export default LifeWheel;