'use client';

import React, { useMemo } from 'react';
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
  LabelList,
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
  showPercentages?: boolean;
  showValueLabels?: boolean;
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
  showPercentages = false,
  showValueLabels = true,
}) => {
  // Calculate total for percentage calculations
  const total = useMemo(() => {
    if (!showPercentages || data.length === 0) return 0;
    return data.reduce((sum, entry) => {
      const primaryBar = bars[0];
      const value = entry[primaryBar.dataKey] as number;
      return sum + (value || 0);
    }, 0);
  }, [data, bars, showPercentages]);

  const CustomLabel = (props: any) => {
    const { x, y, width, height: barHeight, value } = props;
    const formattedValue = formatTooltip ? formatTooltip(value) : value.toLocaleString();
    
    if (horizontal) {
      // Horizontal bars - show label at the end of the bar
      return (
        <text
          x={x + width + 5}
          y={y + barHeight / 2}
          fill="#666"
          fontSize="11px"
          fontWeight="500"
          dominantBaseline="middle"
        >
          {formattedValue}
          {showPercentages && total > 0 && ` (${((value / total) * 100).toFixed(1)}%)`}
        </text>
      );
    } else {
      // Vertical bars - show label at the top of the bar
      return (
        <text
          x={x + width / 2}
          y={y - 5}
          fill="#666"
          fontSize="11px"
          fontWeight="500"
          textAnchor="middle"
        >
          {formattedValue}
          {showPercentages && total > 0 && ` (${((value / total) * 100).toFixed(1)}%)`}
        </text>
      );
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const pageName = label || dataPoint[xAxisKey] || 'Unknown';
      const primaryValue = payload[0].value;
      const percentage = showPercentages && total > 0 
        ? ((primaryValue / total) * 100).toFixed(2)
        : null;

      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-gray-300 z-50 min-w-[180px]">
          <p className="font-bold text-gray-900 mb-3 text-base border-b border-gray-200 pb-2">
            {pageName}
          </p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">{entry.name}:</span>
                </div>
                <span 
                  className="text-sm font-semibold"
                  style={{ color: entry.color }}
                >
                  {formatTooltip ? formatTooltip(entry.value) : entry.value.toLocaleString()}
                </span>
              </div>
            ))}
            {percentage && (
              <div className="pt-2 mt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Percentage:</span>
                  <span className="text-xs font-semibold text-gray-700">{percentage}%</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">Total:</span>
                  <span className="text-xs font-semibold text-gray-700">
                    {formatTooltip ? formatTooltip(total) : total.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-200">
      {title && (
        <div className="mb-4 pb-2 border-b border-gray-200">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">{title}</h3>
          {showPercentages && total > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Total: {formatTooltip ? formatTooltip(total) : total.toLocaleString()} views
            </p>
          )}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          {...(horizontal ? { layout: 'horizontal' } : {})}
          margin={{ 
            top: showValueLabels ? 30 : 10, 
            right: 10, 
            left: 10, 
            bottom: horizontal ? 5 : 80 
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" opacity={0.5} />
          {horizontal ? (
            <>
              <XAxis 
                type="number" 
                stroke="#666" 
                style={{ fontSize: '11px' }} 
                tickFormatter={formatYAxis}
              />
              <YAxis 
                dataKey={xAxisKey} 
                type="category" 
                stroke="#666" 
                style={{ fontSize: '11px' }} 
                width={90}
              />
            </>
          ) : (
            <>
              <XAxis 
                dataKey={xAxisKey} 
                stroke="#666" 
                style={{ fontSize: '11px' }} 
                angle={-45} 
                textAnchor="end" 
                height={60} 
              />
              <YAxis 
                stroke="#666" 
                style={{ fontSize: '11px' }} 
                tickFormatter={formatYAxis} 
              />
            </>
          )}
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ 
              fill: 'rgba(139, 92, 246, 0.1)', 
              stroke: 'rgba(139, 92, 246, 0.3)',
              strokeWidth: 1,
              strokeDasharray: '3 3'
            }} 
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} 
          />
          {bars.map((bar) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name}
              fill={bar.color}
              radius={horizontal ? [0, 0, 0, 0] : [6, 6, 0, 0]}
              isAnimationActive={true}
              animationDuration={800}
            >
              {useGradient && data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={bar.color} opacity={0.8 + (index / data.length) * 0.2} />
              ))}
              {showValueLabels && <LabelList content={<CustomLabel />} />}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsBarChart;

