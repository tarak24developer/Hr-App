import React from 'react';
import { TrendingUp, X, LucideIcon } from 'lucide-react';
import { cn } from '../utils/cn';

interface DashboardCardProps {
  name: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative';
  icon: LucideIcon;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'indigo' | 'pink' | 'gray';
  className?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  name,
  value,
  change,
  changeType,
  icon: Icon,
  color,
  className
}) => {
  return (
    <div className={cn(
      "bg-white p-4 rounded-lg shadow-sm border border-gray-200",
      className
    )}>
      <div className="flex items-center">
        <div className={cn(
          "p-2 rounded-lg",
          {
            "bg-blue-100": color === 'blue',
            "bg-green-100": color === 'green',
            "bg-yellow-100": color === 'yellow',
            "bg-purple-100": color === 'purple',
            "bg-red-100": color === 'red',
            "bg-indigo-100": color === 'indigo',
            "bg-pink-100": color === 'pink',
            "bg-gray-100": color === 'gray',
          }
        )}>
          <Icon className={cn(
            "w-5 h-5",
            {
              "text-blue-600": color === 'blue',
              "text-green-600": color === 'green',
              "text-yellow-600": color === 'yellow',
              "text-purple-600": color === 'purple',
              "text-red-600": color === 'red',
              "text-indigo-600": color === 'indigo',
              "text-pink-600": color === 'pink',
              "text-gray-600": color === 'gray',
            }
          )} />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-600">{name}</p>
          <p className={cn(
            "text-2xl font-bold",
            {
              "text-blue-600": color === 'blue',
              "text-green-600": color === 'green',
              "text-yellow-600": color === 'yellow',
              "text-purple-600": color === 'purple',
              "text-red-600": color === 'red',
              "text-indigo-600": color === 'indigo',
              "text-pink-600": color === 'pink',
              "text-gray-600": color === 'gray',
            }
          )}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
      </div>
      {change && changeType && (
        <div className="mt-2 flex items-center">
          {changeType === 'positive' ? (
            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
          ) : (
            <X className="w-4 h-4 text-red-600 mr-1" />
          )}
          <span className={cn(
            "text-sm font-medium",
            changeType === 'positive' ? 'text-green-600' : 'text-red-600'
          )}>
            {change}
          </span>
        </div>
      )}
    </div>
  );
};

export default DashboardCard;
