'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface DataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

interface AnalyticsPieChartProps {
  data: DataPoint[];
  colors?: string[];
  title?: string;
  height?: number;
  formatTooltip?: (value: number) => string;
  innerRadius?: number; // For donut chart
  showPercentage?: boolean;
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

const AnalyticsPieChart: React.FC<AnalyticsPieChartProps> = ({
  data,
  colors = DEFAULT_COLORS,
  title,
  height = 300,
  formatTooltip,
  innerRadius = 0,
  showPercentage = true,
}) => {
  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      const percentage = ((entry.value / total) * 100).toFixed(1);
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-1">{entry.name}</p>
          <p className="text-sm text-gray-700">
            {formatTooltip ? formatTooltip(entry.value) : entry.value}
            {showPercentage && ` (${percentage}%)`}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLabel = (entry: any) => {
    const percentage = ((entry.value / total) * 100).toFixed(1);
    return showPercentage ? `${percentage}%` : '';
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      {title && (
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={Math.min(height / 3, 120)}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: '11px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsPieChart;

