'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  [key: string]: string | number;
}

interface AnalyticsAreaChartProps {
  data: DataPoint[];
  areas: {
    dataKey: string;
    name: string;
    color: string;
  }[];
  xAxisKey: string;
  title?: string;
  height?: number;
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number) => string;
  stacked?: boolean;
}

const AnalyticsAreaChart: React.FC<AnalyticsAreaChartProps> = ({
  data,
  areas,
  xAxisKey,
  title,
  height = 300,
  formatYAxis,
  formatTooltip,
  stacked = false,
}) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">
            {payload[0].payload[xAxisKey]}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatTooltip ? formatTooltip(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      {title && (
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
          <defs>
            {areas.map((area, index) => (
              <linearGradient key={`gradient-${index}`} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={area.color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={area.color} stopOpacity={0.1} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey={xAxisKey}
            stroke="#666"
            style={{ fontSize: '10px' }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            stroke="#666"
            style={{ fontSize: '10px' }}
            tickFormatter={formatYAxis}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#666', strokeWidth: 1, strokeDasharray: '3 3' }} />
          <Legend wrapperStyle={{ fontSize: '14px' }} />
          {areas.map((area, index) => (
            <Area
              key={area.dataKey}
              type="monotone"
              dataKey={area.dataKey}
              name={area.name}
              stroke={area.color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#color${index})`}
              stackId={stacked ? '1' : undefined}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsAreaChart;

