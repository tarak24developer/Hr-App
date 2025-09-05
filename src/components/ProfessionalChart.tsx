import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS: string[] = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#8b5cf6'];

// Common data point interface for charts
export interface ChartPoint {
  name: string;
  value: number;
  // Allow additional series keys if needed by callers
  [key: string]: string | number | undefined;
}

interface ChartProps {
  data: ChartPoint[];
  title: string;
  height?: number;
}

export const ProfessionalLineChart: React.FC<ChartProps> = ({ data, title, height = 400 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card sx={{ 
        height: '100%',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      }}>
        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 600, 
            mb: 3, 
            color: theme.palette.text.primary,
            fontSize: isMobile ? '1.1rem' : '1.25rem'
          }}>
            {title}
          </Typography>
          <Box sx={{ flex: 1, minHeight: height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Loading chart...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ 
      height: '100%',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: 3,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    }}>
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 600, 
          mb: 3, 
          color: theme.palette.text.primary,
          fontSize: isMobile ? '1.1rem' : '1.25rem'
        }}>
          {title}
        </Typography>
        <Box sx={{ flex: 1, minHeight: height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis 
                dataKey="name" 
                stroke={theme.palette.text.secondary}
                fontSize={isMobile ? 10 : 12}
                tick={{ fill: theme.palette.text.secondary }}
              />
              <YAxis 
                stroke={theme.palette.text.secondary}
                fontSize={isMobile ? 10 : 12}
                tick={{ fill: theme.palette.text.secondary }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                }}
                labelStyle={{ color: theme.palette.text.primary, fontWeight: 600 }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={theme.palette.primary.main} 
                strokeWidth={3}
                dot={{ fill: theme.palette.primary.main, strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: theme.palette.primary.main, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export const ProfessionalAreaChart: React.FC<ChartProps> = ({ data, title, height = 400 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card sx={{ 
        height: '100%',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      }}>
        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 600, 
            mb: 3, 
            color: theme.palette.text.primary,
            fontSize: isMobile ? '1.1rem' : '1.25rem'
          }}>
            {title}
          </Typography>
          <Box sx={{ flex: 1, minHeight: height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Loading chart...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ 
      height: '100%',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: 3,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    }}>
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 600, 
          mb: 3, 
          color: theme.palette.text.primary,
          fontSize: isMobile ? '1.1rem' : '1.25rem'
        }}>
          {title}
        </Typography>
        <Box sx={{ flex: 1, minHeight: height }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis 
                dataKey="name" 
                stroke={theme.palette.text.secondary}
                fontSize={isMobile ? 10 : 12}
                tick={{ fill: theme.palette.text.secondary }}
              />
              <YAxis 
                stroke={theme.palette.text.secondary}
                fontSize={isMobile ? 10 : 12}
                tick={{ fill: theme.palette.text.secondary }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                }}
                labelStyle={{ color: theme.palette.text.primary, fontWeight: 600 }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={theme.palette.primary.main} 
                fill={theme.palette.primary.light}
                strokeWidth={2}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export const ProfessionalBarChart: React.FC<ChartProps> = ({ data, title, height = 400 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card sx={{ 
        height: '100%',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      }}>
        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 600, 
            mb: 3, 
            color: theme.palette.text.primary,
            fontSize: isMobile ? '1.1rem' : '1.25rem'
          }}>
            {title}
          </Typography>
          <Box sx={{ flex: 1, minHeight: height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Loading chart...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ 
      height: '100%',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: 3,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    }}>
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 600, 
          mb: 3, 
          color: theme.palette.text.primary,
          fontSize: isMobile ? '1.1rem' : '1.25rem'
        }}>
          {title}
        </Typography>
        <Box sx={{ flex: 1, minHeight: height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis 
                dataKey="name" 
                stroke={theme.palette.text.secondary}
                fontSize={isMobile ? 10 : 12}
                tick={{ fill: theme.palette.text.secondary }}
              />
              <YAxis 
                stroke={theme.palette.text.secondary}
                fontSize={isMobile ? 10 : 12}
                tick={{ fill: theme.palette.text.secondary }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                }}
                labelStyle={{ color: theme.palette.text.primary, fontWeight: 600 }}
              />
              <Bar 
                dataKey="value" 
                fill={theme.palette.primary.main}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export const ProfessionalPieChart: React.FC<ChartProps> = ({ data, title, height = 400 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card sx={{ 
        height: '100%',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      }}>
        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 600, 
            mb: 3, 
            color: theme.palette.text.primary,
            fontSize: isMobile ? '1.1rem' : '1.25rem'
          }}>
            {title}
          </Typography>
          <Box sx={{ flex: 1, minHeight: height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Loading chart...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ 
      height: '100%',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: 3,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    }}>
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 600, 
          mb: 3, 
          color: theme.palette.text.primary,
          fontSize: isMobile ? '1.1rem' : '1.25rem'
        }}>
          {title}
        </Typography>
        <Box sx={{ flex: 1, minHeight: height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name: string; percent?: number }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={isMobile ? 80 : 120}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((_entry: ChartPoint, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                }}
                labelStyle={{ color: theme.palette.text.primary, fontWeight: 600 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}; 