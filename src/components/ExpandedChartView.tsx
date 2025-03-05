import React from 'react';
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
  Legend,
  ResponsiveContainer,
  Label
} from 'recharts';
import { ChartData } from '../utils/bookAnalytics';

interface ExpandedChartViewProps {
  type: 'pie' | 'bar' | 'line';
  title: string;
  data: ChartData[];
  dataKey: string;
  description: string;
  onClose: () => void;
}

const defaultColors = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'];

export default function ExpandedChartView({
  type,
  title,
  data,
  dataKey,
  description,
  onClose
}: ExpandedChartViewProps) {
  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              >
                <Label value="Title" position="bottom" offset={50} />
              </XAxis>
              <YAxis>
                <Label value={dataKey} angle={-90} position="left" offset={10} />
              </YAxis>
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px' }}
                cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
              />
              <Legend />
              <Bar
                dataKey={dataKey}
                fill={defaultColors[0]}
                animationDuration={1000}
                onMouseOver={(data) => console.log('Bar hover:', data)}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              >
                <Label value="Year" position="bottom" offset={50} />
              </XAxis>
              <YAxis>
                <Label value="Number of Books" angle={-90} position="left" offset={10} />
              </YAxis>
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px' }}
                cursor={{ stroke: 'rgba(0, 0, 0, 0.3)' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={defaultColors[0]}
                strokeWidth={2}
                dot={{ r: 6 }}
                activeDot={{ r: 8 }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <PieChart>
              <Pie
                data={data}
                dataKey={dataKey}
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={200}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                labelLine={{ stroke: '#666', strokeWidth: 1 }}
                animationDuration={1000}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={defaultColors[index % defaultColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px' }}
              />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
              />
            </PieChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg shadow-xl w-11/12 h-5/6 max-w-7xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div className="p-6">
          {renderChart()}
        </div>
      </div>
    </div>
  );
} 