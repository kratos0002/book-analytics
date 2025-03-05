import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import ExpandedChartView from '../ExpandedChartView';
import { ChartData } from '../../utils/bookAnalytics';

interface ChartWidgetProps {
  type: 'bar' | 'line' | 'pie';
  title: string;
  data: ChartData[];
  dataKey: string;
  nameKey?: string;
  colors?: string[];
  description?: string;
}

const defaultColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981'];

export default function ChartWidget({
  type,
  title,
  data,
  dataKey,
  nameKey = 'name',
  colors = defaultColors,
  description = ''
}: ChartWidgetProps) {
  const [expanded, setExpanded] = useState(false);

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 5, left: 5, bottom: 5 }
    };

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={170}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis
                dataKey={nameKey}
                angle={-45}
                textAnchor="end"
                height={60}
                stroke="#64748b"
                fontSize={10}
                tickMargin={8}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                tickMargin={8}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.375rem',
                  padding: '8px',
                  fontSize: '0.75rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              />
              <Bar
                dataKey={dataKey}
                fill={colors[0]}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={170}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis
                dataKey={nameKey}
                angle={-45}
                textAnchor="end"
                height={60}
                stroke="#64748b"
                fontSize={10}
                tickMargin={8}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                tickMargin={8}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.375rem',
                  padding: '8px',
                  fontSize: '0.75rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}
                cursor={{ stroke: 'rgba(0,0,0,0.2)' }}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={colors[0]}
                strokeWidth={2}
                dot={{ r: 3, fill: colors[0] }}
                activeDot={{ r: 5, fill: colors[0] }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie
                data={data}
                dataKey={dataKey}
                nameKey={nameKey}
                cx="50%"
                cy="50%"
                outerRadius={60}
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.375rem',
                  padding: '8px',
                  fontSize: '0.75rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="chart-widget">
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
        <button 
          onClick={() => setExpanded(true)} 
          className="expand-button"
          aria-label="Expand chart"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        </button>
      </div>

      <div className="chart-body">
        {renderChart()}
      </div>

      {description && (
        <div className="chart-description">
          <p>{description}</p>
        </div>
      )}

      {expanded && (
        <ExpandedChartView
          type={type}
          title={title}
          data={data}
          dataKey={dataKey}
          description={description}
          onClose={() => setExpanded(false)}
        />
      )}
    </div>
  );
} 