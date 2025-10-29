'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface DataPoint {
  [key: string]: string | number;
}

interface AnalyticsBarChartProps {
  data: DataPoint[];
  bars: {
    dataKey: string;
    name: string;
    color: string;
  }[];
  xAxisKey: string;
  title?: string;
  height?: number;
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number) => string;
  horizontal?: boolean;
  useGradient?: boolean;
}

const AnalyticsBarChart: React.FC<AnalyticsBarChartProps> = ({
  data,
  bars,
  xAxisKey,
  title,
  height = 300,
  formatYAxis,
  formatTooltip,
  horizontal = false,
  useGradient = false,
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

  const ChartComponent = horizontal ? BarChart : BarChart;
  const layout = horizontal ? 'horizontal' : 'vertical';

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      {title && (
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent
          data={data}
          layout={layout}
          margin={{ top: 5, right: 10, left: horizontal ? 80 : 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          {horizontal ? (
            <>
              <XAxis type="number" stroke="#666" style={{ fontSize: '10px' }} tickFormatter={formatYAxis} />
              <YAxis dataKey={xAxisKey} type="category" stroke="#666" style={{ fontSize: '10px' }} width={70} />
            </>
          ) : (
            <>
              <XAxis dataKey={xAxisKey} stroke="#666" style={{ fontSize: '10px' }} angle={-45} textAnchor="end" height={60} />
              <YAxis stroke="#666" style={{ fontSize: '10px' }} tickFormatter={formatYAxis} />
            </>
          )}
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '14px' }} />
          {bars.map((bar) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name}
              fill={bar.color}
              radius={[8, 8, 0, 0]}
            >
              {useGradient && data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={bar.color} opacity={0.8 + (index / data.length) * 0.2} />
              ))}
            </Bar>
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsBarChart;

