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

const defaultColors = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'];

export default function ChartWidget({
  type,
  title,
  data,
  dataKey,
  nameKey = 'name',
  colors = defaultColors,
  description = ''
}: ChartWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={nameKey} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={dataKey} fill={colors[0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={nameKey} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey={dataKey} stroke={colors[0]} />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                dataKey={dataKey}
                nameKey={nameKey}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <>
      <div
        className="bg-white p-4 rounded-lg shadow cursor-pointer transition-transform hover:scale-[1.02] relative group"
        onClick={() => setIsExpanded(true)}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded-full"
            title="Expand"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0 0l-5-5m-7 11h4m-4 0v4m0 0l5-5m5 5v-4m0 4h-4m0 0l5-5"></path>
            </svg>
          </button>
        </div>
        {renderChart()}
      </div>

      {isExpanded && (
        <ExpandedChartView
          type={type}
          title={title}
          data={data}
          dataKey={dataKey}
          description={description}
          onClose={() => setIsExpanded(false)}
        />
      )}
    </>
  );
} 